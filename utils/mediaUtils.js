// const fs = require("fs").promises;
// const path = require("path");
// const VideoDownloader = require("../src/media-processing/video-processing/videoDownloader");
// const processAudio = require("../src/media-processing/audio-processing/processAudio");


// async function downloadAndProcessMedia(instanceFolder, videoUrl, videoId) {
//   const MAX_RETRIES = 2;
//   const isTikTok = videoUrl.includes("tiktok.com");
//   let videoPath;

//   for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
//     try {
//       const downloader = new VideoDownloader(
//         path.join(instanceFolder, "videos"),
//         videoId.toString()
//       );

//       console.log(`⬇️ Downloading video (attempt ${attempt}): ${videoUrl}`);
//       videoPath = await downloader.downloadVideo(videoUrl, videoId);

//       // Validate downloaded file
//       const stats = await fs.stat(videoPath);
//       if (stats.size < 102400) {
//         // Minimum 100KB check
//         throw new Error("Downloaded file too small, likely incomplete");
//       }

//       // Process audio with timeout
//       const { audioPath, transcript } = await Promise.race([
//         processAudio(videoPath, path.join(instanceFolder, "audio")),
//         new Promise((_, reject) =>
//           setTimeout(() => reject(new Error("Processing timeout")), 60000)
//         ),
//       ]);

//       return { videoPath, audioPath, transcript };
//     } catch (error) {
//       console.error(`❌ Media processing error (attempt ${attempt}):`, error);

//       // Cleanup failed files
//       if (videoPath) await fs.unlink(videoPath).catch(() => {});

//       if (attempt > MAX_RETRIES) {
//         throw new Error(
//           `Media processing failed after ${MAX_RETRIES} retries: ${error.message}`
//         );
//       }

//       // Platform-specific backoff
//       await new Promise((resolve) =>
//         setTimeout(resolve, isTikTok ? 5000 * attempt : 3000 * attempt)
//       );
//     }
//   }
// }
// module.exports = { downloadAndProcessMedia };


// const ytdl = require("youtube-dl-exec");
// const path = require("path");
// const fs = require("fs").promises;
// const config = require("../config/index");

// class VideoDownloader {
//   constructor(downloadBasePath, id) {
//     this.basePath = path.resolve(downloadBasePath, id);
//     this.ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
//     this.youtubeCookiesPath =
//       config.youtube_cookies || "/etc/secrets/youtube_cookies.txt";
//   }

//   async ensureDirectories() {
//     await fs.mkdir(this.basePath, { recursive: true });
//   }

//   async validateCookies() {
//     try {
//       await fs.access(this.youtubeCookiesPath);
//       const stats = await fs.stat(this.youtubeCookiesPath);
//       const content = await fs.readFile(this.youtubeCookiesPath, "utf8");
//       return (
//         stats.size > 100 &&
//         content.includes("youtube.com") &&
//         (content.includes("LOGIN_INFO") || content.includes("SID"))
//       );
//     } catch {
//       return false;
//     }
//   }

//   async getDownloadOptions(videoUrl) {
//     const isYouTube =
//       videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
//     const hasValidCookies = isYouTube ? await this.validateCookies() : false;

//     const baseOptions = {
//       ffmpegLocation: this.ffmpegPath,
//       format: "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best",
//       mergeOutputFormat: "mp4",
//       ignoreErrors: true,
//       verbose: true,
//       socketTimeout: 30000,
//       retries: 3,
//       fragmentRetries: 5,
//     };

//     if (isYouTube) {
//       return {
//         ...baseOptions,
//         ...(hasValidCookies && { cookies: this.youtubeCookiesPath }),
//         referer: "https://www.youtube.com/",
//         userAgent:
//           "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
//         extractorArgs: "youtube:player_client=web,android",
//         throttleRate: "1M",
//       };
//     }

//     // TikTok options
//     return {
//       ...baseOptions,
//       referer: "https://www.tiktok.com/",
//       userAgent:
//         "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
//       noCheckCertificates: true,
//     };
//   }

//   async downloadVideo(videoUrl, filename) {
//     let retries = 2;

//     while (retries >= 0) {
//       try {
//         await this.ensureDirectories();
//         const videoFilePath = path.join(this.basePath, `${filename}.mp4`);
//         const downloadOptions = await this.getDownloadOptions(videoUrl);

//         const result = await ytdl(videoUrl, {
//           ...downloadOptions,
//           output: videoFilePath,
//         });

//         // Verify download
//         const stats = await fs.stat(videoFilePath);
//         if (stats.size < 102400) {
//           throw new Error("Downloaded file too small - likely incomplete");
//         }

//         return videoFilePath;
//       } catch (error) {
//         console.error(`Download attempt ${3 - retries} failed:`, error.message);

//         if (retries === 0) {
//           if (
//             error.message.includes("bot") ||
//             error.message.includes("authentication")
//           ) {
//             throw new Error(
//               "YouTube requires authentication. Please provide valid cookies."
//             );
//           }
//           throw error;
//         }

//         retries--;
//         await new Promise((resolve) =>
//           setTimeout(resolve, 3000 * (2 - retries))
//         );
//       }
//     }
//   }
// }

// module.exports = VideoDownloader;


const fs = require("fs").promises;
const path = require("path");
const VideoDownloader = require("../src/media-processing/video-processing/videoDownloader");
const processAudio = require("../src/media-processing/audio-processing/processAudio");

async function downloadAndProcessMedia(instanceFolder, videoUrl, videoId) {
  const MAX_RETRIES = 2;
  let retryCount = 0;
  let videoPath;

  while (retryCount <= MAX_RETRIES) {
    try {
      const downloader = new VideoDownloader(
        path.join(instanceFolder, "videos"),
        videoId
      );

      console.log(`Downloading ${videoUrl} (attempt ${retryCount + 1})`);
      videoPath = await downloader.downloadVideo(videoUrl, videoId);

      // Verify download
      const stats = await fs.stat(videoPath);
      if (stats.size < 102400) {
        throw new Error("Downloaded file too small (likely incomplete)");
      }

      console.warn(" // Process audio===>>>>>>");
      // Process audio
      const { audioPath, transcript } = await processAudio(
        videoPath,
        path.join(instanceFolder, "audio")
      );

      return {
        videoPath,
        audioPath,
        transcript,
        success: true,
      };
    } catch (error) {
      console.error(`Attempt ${retryCount + 1} failed:`, error.message);

      // Cleanup failed download
      if (videoPath) {
        await fs.unlink(videoPath).catch(() => {});
      }

      if (retryCount === MAX_RETRIES) {
        throw new Error(
          `Failed after ${MAX_RETRIES} retries: ${error.message}`
        );
      }

      retryCount++;
      await new Promise((resolve) => setTimeout(resolve, 3000 * retryCount));
    }
  }
}

module.exports = { downloadAndProcessMedia };