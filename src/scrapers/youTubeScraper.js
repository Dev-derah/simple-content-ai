// const BaseScraper = require("./baseScraper");
// const ytdl = require("youtube-dl-exec");
// const { YoutubeTranscript } = require("youtube-transcript");
// const { downloadAndProcessMedia } = require("../../utils/mediaUtils");
// const fs = require("fs").promises;
// const path = require("path");

// class YouTubeScraper extends BaseScraper {
//   constructor() {
//     super("youtube");
//   }

//   async scrape(input) {
//     try {
//       if (!input || !input.sanitized) {
//         throw new Error("Invalid input: Missing sanitized URL.");
//       }

//       const videoUrl = input.sanitized;
//       const videoId = this.extractVideoId(videoUrl);
//       if (!videoId) {
//         throw new Error("Invalid YouTube URL");
//       }

//       await this.createFolderStructure();
//       console.log("📄 Fetching metadata...");

//       const metadata = await this.getMetadata(videoUrl);
//       if (!metadata) {
//         throw new Error("Failed to fetch metadata.");
//       }

//       // Save metadata
//       await fs.writeFile(
//         path.join(this.instanceFolder, "metadata", `${videoId}.json`),
//         JSON.stringify(metadata, null, 2)
//       );

//       console.log("🎙️ Fetching transcript...");
//       let transcript;
//       try {
//         const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
        
//         transcript = transcriptData.map((item) => item.text).join(" ");
//       } catch (error) {
//         console.log("No transcript available, will extract from audio.");
//       }

//       console.log("🎞️ Downloading and processing video...");
//       const media = await downloadAndProcessMedia(
//         this.instanceFolder,
//         videoUrl,
//         videoId
//       );


//       return [
//         {
//           ...metadata,
//           videoId,
//           transcript: transcript || media.transcript,
//           videoPath: media.videoPath,
//         },
//       ];
//     } catch (error) {
//       console.error("Error scraping YouTube video:", error);
//       return [
//         {
//           error: error.message,
//           url: input.sanitized,
//         },
//       ];
//     }
//   }

 

//   async getMetadata(videoUrl) {
//     try {
//       const options = {
//         dumpJson: true,
//         noWarnings: true,
//         noCallHome: true,
//         noCheckCertificate: true,
//         preferFreeFormats: true,
//         youtubeSkipDashManifest: true,
//       };

//       console.log(`Fetching metadata for: ${videoUrl}`); // Debugging

//       const info = await ytdl(videoUrl, options);


//       return {
//         title: info.title || "Untitled",
//         description: info.description || "",
//         keywords: info.tags || [],
//         channel: info.uploader || "Unknown",
//         uploadDate: info.upload_date || "",
//         views: info.view_count || 0,
//         duration: info.duration || 0,
//         videoId: info.id || this.extractVideoId(videoUrl),
//         url: videoUrl,
//       };
//     } catch (error) {
//       console.error("❌ Error fetching metadata:", error);
//       return null;
//     }
//   }

//   extractVideoId(url) {
//     const patterns = [
//       /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/,
//       /(?:youtube\.com\/shorts\/)([\w-]+)/,
//     ];
//     for (const pattern of patterns) {
//       const match = url.match(pattern);
//       if (match) return match[1];
//     }
//     return null;
//   }
// }

// module.exports = YouTubeScraper;


// const BaseScraper = require("./baseScraper");
// const { google } = require("googleapis");
// const { downloadAndProcessMedia } = require("../../utils/mediaUtils");
// const fs = require("fs").promises;
// const path = require("path");
// require("dotenv").config();

// class YouTubeScraper extends BaseScraper {
//   constructor() {
//     super("youtube");
//     this.apiKey = process.env.YOUTUBE_API_KEY;
//     this.youtube = google.youtube({ version: "v3", auth: this.apiKey });
//   }

//   async scrape(input) {
//     try {
//       if (!input || !input.sanitized) {
//         throw new Error("Invalid input: Missing sanitized URL.");
//       }

//       const videoUrl = input.sanitized;
//       const videoId = this.extractVideoId(videoUrl);
//       if (!videoId) {
//         throw new Error("Invalid YouTube URL");
//       }

//       await this.createFolderStructure();
//       console.log("📄 Fetching metadata...");

//       const metadata = await this.getMetadata(videoId);
//       if (!metadata) {
//         throw new Error("Failed to fetch metadata.");
//       }

//       // Save metadata
//       await fs.writeFile(
//         path.join(this.instanceFolder, "metadata", `${videoId}.json`),
//         JSON.stringify(metadata, null, 2)
//       );

//       console.log("🎞️ Downloading and processing video...");
//       const media = await downloadAndProcessMedia(
//         this.instanceFolder,
//         videoUrl,
//         videoId
//       );
//             console.warn("media", media)

//       return [
//         {
//           ...metadata,
//           videoId,
//           videoPath: media.videoPath,
//         },
//       ];
//     } catch (error) {
//       console.error("Error scraping YouTube video:", error);
//       return [
//         {
//           error: error.message,
//           url: input.sanitized,
//         },
//       ];
//     }
//   }

//   async getMetadata(videoId) {
//     try {
//       const response = await this.youtube.videos.list({
//         part: "snippet,contentDetails,statistics,status",
//         id: videoId,
//         key: this.apiKey,
//       });

//       if (!response.data.items.length) {
//         throw new Error("No video data found.");
//       }

//       const info = response.data.items[0];

//       return {
//         title: info.snippet.title,
//         description: info.snippet.description,
//         keywords: info.snippet.tags || [],
//         channel: info.snippet.channelTitle,
//         uploadDate: info.snippet.publishedAt,
//         views: parseInt(info.statistics.viewCount) || 0,
//         likes: parseInt(info.statistics.likeCount) || 0,
//         duration: this.parseDuration(info.contentDetails.duration),
//         category: await this.getCategory(info.snippet.categoryId),
//         isMadeForKids: info.status.madeForKids || false,
//         videoId: videoId,
//         url: `https://www.youtube.com/watch?v=${videoId}`,
//       };
//     } catch (error) {
//       console.error("❌ Error fetching metadata:", error);
//       return null;
//     }
//   }

//   async getCategory(categoryId) {
//     try {
//       const response = await this.youtube.videoCategories.list({
//         part: "snippet",
//         id: categoryId,
//         key: this.apiKey,
//       });

//       if (response.data.items.length) {
//         return response.data.items[0].snippet.title;
//       }
//       return "Unknown";
//     } catch (error) {
//       console.error("❌ Error fetching category:", error);
//       return "Unknown";
//     }
//   }

//   parseDuration(duration) {
//     const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
//     if (!match) return "Unknown";

//     const hours = match[1] ? `${match[1]}h ` : "";
//     const minutes = match[2] ? `${match[2]}m ` : "";
//     const seconds = match[3] ? `${match[3]}s` : "";

//     return `${hours}${minutes}${seconds}`.trim();
//   }

//   extractVideoId(url) {
//     const patterns = [
//       /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/,
//       /(?:youtube\.com\/shorts\/)([\w-]+)/,
//     ];
//     for (const pattern of patterns) {
//       const match = url.match(pattern);
//       if (match) return match[1];
//     }
//     return null;
//   }
// }

// module.exports = YouTubeScraper;


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

  // async scrape(input) {
  //   try {
  //     if (!input?.sanitized) {
  //       throw new Error("Invalid input: Missing sanitized URL.");
  //     }

  //     const videoUrl = input.sanitized;
  //     const videoId = this.extractVideoId(videoUrl);
  //     if (!videoId) throw new Error("Invalid YouTube URL");

  //     await this.createFolderStructure();

  //     const [metadata, media] = await Promise.all([
  //       this.getMetadata(videoId),
  //       downloadAndProcessMedia(this.instanceFolder, videoUrl, videoId).catch(
  //         (error) => {
  //           console.error("Download failed:", error);
  //           throw new Error(`Download failed: ${error.message}`);
  //         }
  //       ),
  //     ]);

  //     if (!metadata) throw new Error("Failed to fetch metadata");

  //     await fs.writeFile(
  //       path.join(this.instanceFolder, "metadata", `${videoId}.json`),
  //       JSON.stringify(metadata, null, 2)
  //     );

  //     return [
  //       {
  //         ...metadata,
  //         videoId,
  //         videoPath: media.videoPath,
  //         audioPath: media.audioPath,
  //         _debug: {
  //           cookiesUsed: !!config.youtube_cookies,
  //           cookiePath: config.youtube_cookies,
  //         },
  //       },
  //     ];
  //   } catch (error) {
  //     console.error("YouTube scraping failed:", error);
  //     return [
  //       {
  //         error: error.message,
  //         url: input?.sanitized,
  //         _debug: {
  //           cookieCheck: await this.checkCookies(),
  //           timestamp: new Date().toISOString(),
  //         },
  //       },
  //     ];
  //   }
  // }

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