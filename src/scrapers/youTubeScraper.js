const BaseScraper = require("./baseScraper");
const { google } = require("googleapis");
const { downloadAndProcessMedia } = require("../../utils/mediaUtils");
const fs = require("fs").promises;
const path = require("path");
const config = require("../../config/index");

class YouTubeScraper extends BaseScraper {
  constructor() {
    super("youtube");
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.youtube = google.youtube({ version: "v3", auth: this.apiKey });
  }


  async scrape(input) {
    try {
      if (!input?.sanitized) {
        throw new Error("Invalid input: Missing sanitized URL.");
      }

      const videoUrl = input.sanitized;
      const videoId = this.extractVideoId(videoUrl);
      if (!videoId) throw new Error("Invalid YouTube URL");

      await this.createFolderStructure();

      const [metadata, media] = await Promise.all([
        this.getMetadata(videoId),
        downloadAndProcessMedia(this.instanceFolder, videoUrl, videoId).catch(
          (error) => {
            console.error("Download failed:", error);
            throw new Error(`Download failed: ${error.message}`);
          }
        ),
      ]);

      if (!metadata) throw new Error("Failed to fetch metadata");

      // 👇 Merge media details into metadata BEFORE saving
      const enrichedMetadata = {
        ...metadata,
        videoId,
        videoPath: media.videoPath,
        audioPath: media.audioPath,
        transcript: media.transcript,
      };

      await fs.writeFile(
        path.join(this.instanceFolder, "metadata", `${videoId}.json`),
        JSON.stringify(enrichedMetadata, null, 2)
      );

      return [
        {
          ...enrichedMetadata,
          _debug: {
            cookiesUsed: !!config.youtube_cookies,
            cookiePath: config.youtube_cookies,
          },
        },
      ];
    } catch (error) {
      console.error("YouTube scraping failed:", error);
      return [
        {
          error: error.message,
          url: input?.sanitized,
          _debug: {
            cookieCheck: await this.checkCookies(),
            timestamp: new Date().toISOString(),
          },
        },
      ];
    }
  }

  async getMetadata(videoId) {
    try {
      const response = await this.youtube.videos.list({
        part: "snippet,contentDetails,statistics,status",
        id: videoId,
        maxResults: 1,
      });

      if (!response.data.items?.length) return null;

      const item = response.data.items[0];
      return {
        title: item.snippet.title,
        description: item.snippet.description,
        channel: item.snippet.channelTitle,
        uploadDate: item.snippet.publishedAt,
        views: parseInt(item.statistics?.viewCount) || 0,
        likes: parseInt(item.statistics?.likeCount) || 0,
        duration: this.parseDuration(item.contentDetails.duration),
        thumbnail: item.snippet.thumbnails?.high?.url,
        videoId,
        url: `https://youtu.be/${videoId}`,
      };
    } catch (error) {
      console.error("Metadata fetch error:", error);
      return null;
    }
  }

  async checkCookies() {
    try {
      const cookiePath = config.youtube_cookies;
      if (!cookiePath)
        return { available: false, reason: "No cookie path configured" };

      const content = await fs.readFile(cookiePath, "utf8");
      return {
        available: true,
        valid: content.includes("LOGIN_INFO") || content.includes("SID"),
        size: content.length,
        path: cookiePath,
      };
    } catch (error) {
      return {
        available: false,
        error: error.message,
      };
    }
  }

  parseDuration(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    return match
      ? [
          match[1] && `${match[1]}h`,
          match[2] && `${match[2]}m`,
          match[3] && `${match[3]}s`,
        ]
          .filter(Boolean)
          .join(" ") || "0s"
      : "Unknown";
  }

  extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/,
      /(?:youtube\.com\/shorts\/)([\w-]+)/,
      /(?:youtube\.com\/embed\/)([\w-]+)/,
      /(?:youtube\.com\/v\/)([\w-]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }
}

module.exports = YouTubeScraper;