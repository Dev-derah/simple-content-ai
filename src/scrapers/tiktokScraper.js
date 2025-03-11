const BaseScraper = require("../scrapers/baseScraper");
const { humanScroll, randomMouseMove } = require("../../utils/browserUtils");
const { retryAsync } = require("../../utils/retryHandler");
const { saveJSON } = require("../../utils/fileUtils");
const config = require("../../config");
const path = require("path");
const fs = require("fs").promises;
const AudioExtractor = require("../media-processing/audio-processing/audioExtractor");
const VideoDownloader = require("../media-processing/video-processing/videoDownloader");
const processAudio = require("../media-processing/audio-processing/processAudio");

const SELECTORS = {
  SEARCH_RESULTS: 'div[data-e2e="user-post-item-list"]',
  VIDEO_LINKS: 'div[data-e2e="search_top-item"] a',
  PROFILE_VIDEOS: 'div[data-e2e="user-post-item"]',
  VIDEO_METADATA: {
    CAPTION: '[data-e2e="browse-video-desc"], [data-e2e="video-desc"]',
    LIKES: '[data-e2e="like-count"], [data-e2e="browse-like-count"]',
    COMMENTS: '[data-e2e="comment-count"], [data-e2e="browse-comment-count"]',
    SHARES: '[data-e2e="share-count"], [data-e2e="browse-share-count"]',
    VIEWS:
      'div div:nth-child(2) strong.video-count[data-e2e="video-views"],div div:nth-child(2) strong.video-count[data-e2e="video-views"]',
    UPLOADER: '[data-e2e="user-name"], [data-e2e="browse-username"]',
    HASHTAGS: '[data-e2e="browse-video-desc"] a[href*="/tag/"]',
  },
};

class TikTokScraper extends BaseScraper {
  constructor() {
    super("tiktok");
    this.selectors = SELECTORS;
    this.instanceFolder = null;
  }


  async scrape(input, limit) {
    try {
      await this.initialize();
      const contentType = input.contentType;
      console.log("Content Type:", contentType);

      this.instanceFolder = this.createInstanceFolder();
      await this.createFolderStructure();

      let videoUrls;

      if (contentType === "video") {
        const videoIdMatch = input.sanitized.match(/\/video\/(\d+)/);
        if (!videoIdMatch) {
          throw new Error("Invalid video URL: Video ID not found");
        }
        videoUrls = [
          {
            url: input.sanitized,
            videoId: videoIdMatch[1],
            views: null,
          },
        ];
      } else {
        // Handle profile or search
        await retryAsync(async () => {
          await this.navigateToContent(input, contentType);
          await humanScroll(this.page);
        }, 3);

        const isProfile = contentType === "profile";
        videoUrls = await this.extractVideoUrls(limit, isProfile);
        if (videoUrls.length === 0) {
          console.log("No videos found. Exiting gracefully.");
          return [];
        }
      }

      const videos = await this.scrapeVideoDetails(videoUrls);
      await this.saveScrapedData(videos);
      return videos;
    } finally {
      await this.close();
    }
  }

  createInstanceFolder() {
    return path.join(
      config.DOWNLOAD_PATH,
      `tiktok_${Date.now()}_${Math.random().toString(36).substring(7)}`
    );
  }

  async createFolderStructure() {
    await fs.mkdir(path.join(this.instanceFolder, "videos"), {
      recursive: true,
    });
    await fs.mkdir(path.join(this.instanceFolder, "audio"), {
      recursive: true,
    });
    await fs.mkdir(path.join(this.instanceFolder, "metadata"), {
      recursive: true,
    });
  }

  async navigateToContent(input, contentType) {
    let url;
    if (contentType === "profile") {
      url = input.sanitized;
    } else if (contentType === "video") {
      url = input.sanitized;
    } else {
      url = `https://www.tiktok.com/search?q=${encodeURIComponent(
        input.sanitized
      )}`;
    }
    await this.page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await this.page.waitForTimeout(300);
  }

  async extractVideoUrls(limit, isProfile) {
    return this.page.evaluate(
      ({ selectors, limit, isProfile }) => {
        const selector = isProfile
          ? selectors.PROFILE_VIDEOS
          : selectors.VIDEO_LINKS;

        const elements = Array.from(document.querySelectorAll(selector));

        if (elements.length === 0) {
          console.warn("No videos found on the page.");
          return []; // Return an empty array if no videos exist
        }

        return elements
          .slice(0, Math.min(limit, elements.length))
          .map((el) => {
            const anchor = el.querySelector("a");
            const url = anchor ? anchor.href : null;

            if (!url) return null;

            const match = url.match(/\/video\/(\d+)/);
            const videoId = match ? match[1] : null;
            const viewsElement = el.querySelector(
              selectors.VIDEO_METADATA.VIEWS
            );
            const views = viewsElement ? viewsElement.innerText : null;

            return videoId
              ? {
                  url,
                  videoId,
                  views,
                }
              : null;
          })
          .filter((item) => item !== null);
      },
      { selectors: this.selectors, limit, isProfile }
    );
  }

  async scrapeVideoDetails(videoDataList) {
    const videos = [];

    for (const { url, videoId, views } of videoDataList) {
      let retries = 2;
      let success = false;
      let videoData = null;

      const videoDownloader = new VideoDownloader(
        path.join(this.instanceFolder, "videos"),
        videoId.toString()
      );

      const videoPage = await this.context.newPage();
      try {
        await videoPage.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
        await randomMouseMove(videoPage);

        videoData = await this.extractVideoMetadata(videoPage);

        const media = await this.downloadAndProcessMedia(
          videoDownloader,
          url,
          videoId
        );

        videoData = {
          ...videoData,
          views,
          videoPath: media.videoPath,
          audioPath: media.audioPath,
          transcript: media.transcript,
          processingStatus: "complete",
        };

        videos.push(videoData);
        success = true;
      } catch (error) {
        console.warn(
          `Attempt ${3 - retries} failed for ${url}:`,
          error.message
        );
        retries--;
        if (retries === 0) {
          console.error(`Skipping video ${url} after 3 attempts`);
          videos.push({
            url,
            videoId,
            error: error.message,
            processingStatus: "failed",
          });
        }
      } finally {
        await videoPage.close();
      }
    }
    return videos;
  }

  async downloadAndProcessMedia(downloader, url, videoId) {
    const MAX_RETRIES = 2;
    let retries = 0;
    let videoPath;

    while (retries <= MAX_RETRIES) {
      try {
        // 1. Download video
        console.log(`⬇️ Downloading video: ${url}`);
        videoPath = await downloader.downloadVideo(url, videoId);
        await fs.access(videoPath);

        // 2. Process audio (extract + transcribe with Gemini)
        const audioExtractor = new AudioExtractor(
          path.join(this.instanceFolder, "audio")
        );

        const { audioPath, transcript } = await processAudio(
          videoPath,
          path.join(this.instanceFolder, "audio")
        );

        console.log(
          `✅ Completed: Video: ${videoPath}, Audio: ${audioPath}, Transcript: ${transcript}`
        );
        return { videoPath, audioPath, transcript };
      } catch (error) {
        console.error(
          `❌ Media processing error (attempt ${retries + 1}):`,
          error
        );

        // Cleanup failed downloads
        try {
          if (videoPath) await fs.unlink(videoPath);
        } catch (cleanupError) {
          console.warn("⚠️ Cleanup failed:", cleanupError);
        }

        if (retries === MAX_RETRIES) throw error;
        retries++;
        await new Promise((resolve) => setTimeout(resolve, 3000 * retries));
      }
    }
  }

  async retryMetadataExtraction(page) {
    const MAX_RETRIES = 2;
    let retries = 0;

    while (retries <= MAX_RETRIES) {
      try {
        await page.waitForSelector(this.selectors.VIDEO_METADATA.LIKES, {
          timeout: 10000 * (retries + 1),
        });
        return await this.extractVideoMetadata(page);
      } catch (error) {
        if (retries === MAX_RETRIES) throw error;
        retries++;
        await page.reload();
        await page.waitForTimeout(2000 * retries);
      }
    }
  }

  async extractVideoMetadata(page) {
    await page.waitForLoadState("domcontentloaded"); // Ensure initial load
    await page.waitForSelector(this.selectors.VIDEO_METADATA.LIKES, {
      timeout: 15000,
    }); // Wait for key element

    return page.evaluate((selectors) => {
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : "N/A";
      };

      const pathSegments = window.location.pathname.split("/");

      return {
        url: window.location.href,
        videoId: pathSegments[pathSegments.length - 1] || "N/A",
        caption: getText(selectors.VIDEO_METADATA.CAPTION),
        likes: getText(selectors.VIDEO_METADATA.LIKES),
        comments: getText(selectors.VIDEO_METADATA.COMMENTS),
        shares: getText(selectors.VIDEO_METADATA.SHARES),
        views: getText(selectors.VIDEO_METADATA.VIEWS),
        uploader:
          getText(selectors.VIDEO_METADATA.UPLOADER).split(" · ")[0] || "N/A",
        hashtags: Array.from(
          document.querySelectorAll(selectors.VIDEO_METADATA.HASHTAGS)
        ).map((a) => a.textContent.trim()),
        uploadDate: new Date().toISOString(),
      };
    }, this.selectors);
  }

  async saveScrapedData(videos) {
    const filename = `metadata_${Date.now()}.json`;
    const filePath = path.join(this.instanceFolder, "metadata", filename);
    await saveJSON(filePath, videos);
  }
}

module.exports = TikTokScraper;
