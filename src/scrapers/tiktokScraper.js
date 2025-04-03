// const BaseScraper = require("../scrapers/baseScraper");
// const { downloadAndProcessMedia } = require("../../utils/mediaUtils");

// class TikTokScraper extends BaseScraper {
//   constructor() {
//     super("tiktok");
//     this.selectors = {
//       VIDEO: '[data-e2e="video-desc"]',
//       CAPTION: '[data-e2e="video-desc"]',
//       LIKES: '[data-e2e="like-count"]',
//       COMMENTS: '[data-e2e="comment-count"]',
//       SHARES: '[data-e2e="share-count"]',
//       VIEWS: '[data-e2e="video-views"]',
//       UPLOADER: '[data-e2e="user-name"]',
//       HASHTAGS: 'a[href*="tag"]',
//     };
//   }

//   async scrape(input, limit) {
//     await this.initialize();
//     await this.createFolderStructure();
//      if (!this.page) {
//       throw new Error('Page failed to initialize');
//     }
//     await this.navigateToUrl(input.sanitized);

//     const videoUrls = await this.extractVideoUrls(input.contentType, limit);
//     if (!videoUrls.length) return [];

//     const videos = [];

//     for (const { url, videoId } of videoUrls) {
//       const videoData = await this.extractMetadata(this.page, this.selectors);
//       const media = await downloadAndProcessMedia(
//         this.instanceFolder,
//         url,
//         videoId
//       );
//       console.warn("media", media)

//       videos.push({ ...videoData, ...media });
//     }

//     return videos;
//   }

//   async extractVideoUrls(contentType, limit) {
//     // Wait for video content to load
//     await this.page.waitForSelector(this.selectors.LIKES);

//     if (contentType === "video") {
//       // For single video, return current page URL
//       const url = await this.page.url();
//       const videoId = url.split("/").pop();
//       return [{ url, videoId }];
//     }

//     // For profile/search results
//     const selector =
//       contentType === "profile"
//         ? '[data-e2e="user-post-item"] a'
//         : '[data-e2e="search-card-container"] a';

//     await this.page.waitForSelector(selector);

//     return await this.page.evaluate(
//       (sel, maxVideos) => {
//         const links = Array.from(document.querySelectorAll(sel));
//         return links.slice(0, maxVideos).map((link) => ({
//           url: link.href,
//           videoId: link.href.split("/").pop(),
//         }));
//       },
//       selector,
//       limit || 10
//     );
//   }
// }

// module.exports = TikTokScraper;


const BaseScraper = require("../scrapers/baseScraper");
const { downloadAndProcessMedia } = require("../../utils/mediaUtils");
const fs = require("fs").promises;
const path = require("path");

class TikTokScraper extends BaseScraper {
  constructor() {
    super("tiktok");
    this.selectors = {
      VIDEO: '[data-e2e="video-desc"]',
      CAPTION: '[data-e2e="video-desc"]',
      LIKES: '[data-e2e="like-count"]',
      COMMENTS: '[data-e2e="comment-count"]',
      SHARES: '[data-e2e="share-count"]',
      VIEWS: '[data-e2e="video-views"]',
      UPLOADER: '[data-e2e="user-name"]',
      HASHTAGS: 'a[href*="tag"]',
    };
  }

  async scrape(input, limit) {
    try {
      await this.initialize();
      await this.createFolderStructure();

      if (!this.page) {
        throw new Error("Page failed to initialize");
      }

      await this.navigateToUrl(input.sanitized);

      const videoUrls = await this.extractVideoUrls(input.contentType, limit);
      if (!videoUrls.length) return [];

      const videos = [];
      const downloadPromises = videoUrls.map(async ({ url, videoId }) => {
        try {
          const videoData = await this.extractMetadata(
            this.page,
            this.selectors
          );
          const media = await downloadAndProcessMedia(
            this.instanceFolder,
            url,
            videoId
          );

          return { ...videoData, ...media };
        } catch (error) {
          console.error(`Failed to process video ${videoId}:`, error);
          return {
            ...videoData,
            error: error.message,
            url,
            videoId,
          };
        }
      });

      return await Promise.all(downloadPromises);
    } catch (error) {
      console.error("TikTok scraping failed:", error);
      throw error;
    }
  }

  async extractVideoUrls(contentType, limit) {
    await this.page.waitForSelector(this.selectors.LIKES, { timeout: 150000 });

    if (contentType === "video") {
      const url = await this.page.url();
      const videoId = url.split("/").pop().split("?")[0];
      return [{ url, videoId }];
    }

    const selector =
      contentType === "profile"
        ? '[data-e2e="user-post-item"] a'
        : '[data-e2e="search-card-container"] a';

    await this.page.waitForSelector(selector, { timeout: 15000 });

    return await this.page.evaluate(
      (sel, maxVideos) => {
        const links = Array.from(document.querySelectorAll(sel));
        return links.slice(0, maxVideos).map((link) => ({
          url: link.href,
          videoId: link.href.split("/").pop().split("?")[0],
        }));
      },
      selector,
      limit || 10
    );
  }
}

module.exports = TikTokScraper;