// const { exec } = require("child_process");
// const ytdl = require("youtube-dl-exec");
// const path = require("path");
// const fs = require("fs").promises;
// const config = require("../../../config");

// class VideoDownloader {
//   constructor(downloadBasePath, id) {
//     // Base download directory
//     this.basePath = path.resolve(downloadBasePath, id);
//     this.ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";

//   }

//   async ensureDirectories() {
//     await fs.mkdir(this.basePath, { recursive: true });
//   }

//   async downloadVideo(videoUrl, filename) {
//     let retries = 2;

//     while (retries >= 0) {
//       try {
//         await this.ensureDirectories();
//         const videoFilePath = path.join(this.basePath, `${filename}.mp4`);

//         // Download video
//         try {
//           const result = await ytdl(videoUrl, {
//             output: videoFilePath,
//             ffmpegLocation: this.ffmpegPath,
//             format:
//               "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best",
//             mergeOutputFormat: "mp4",
//             noCheckCertificates: true,
//             ignoreErrors: true,
//             verbose: true,
//             addHeader: ["referer:youtube.com", "user-agent:googlebot"],
//           });

//           return videoFilePath;
//         } catch (error) {
//           console.error("Download Failed:", error);

//           throw error;
//         }
//       } catch (error) {
//         if (retries === 0) throw error;
//         retries--;
//         console.log(`Retrying download for ${filename}`);
//         await new Promise((resolve) => setTimeout(resolve, 3000));
//       }
//     }
//   }
// }

// module.exports = VideoDownloader;

// const { exec } = require("child_process");
// const ytdl = require("youtube-dl-exec");
// const path = require("path");
// const fs = require("fs").promises;
// const config = require("../../../config");

// class VideoDownloader {
//   constructor(downloadBasePath, id) {
//     // Base download directory
//     this.basePath = path.resolve(downloadBasePath, id);
//     this.ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";

//     // YouTube-specific configuration
//     this.youtubeCookiesPath =
//       "/etc/secrets/youtube_cookies.txt";
//     this.isYouTubeLink = (url) =>
//       url.includes("youtube.com") || url.includes("youtu.be");
//   }

//   async ensureDirectories() {
//     await fs.mkdir(this.basePath, { recursive: true });
//   }

//   async downloadVideo(videoUrl, filename) {
//     let retries = 2;
//     console.log("YOUTUBE COOKIES ==>",this.youtubeCookiesPath)
//     while (retries >= 0) {
//       try {
//         await this.ensureDirectories();
//         const videoFilePath = path.join(this.basePath, `${filename}.mp4`);

//         // Common download options
//         const downloadOptions = {
//           output: videoFilePath,
//           ffmpegLocation: this.ffmpegPath,
//           format:
//             "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best",
//           mergeOutputFormat: "mp4",
//           noCheckCertificates: true,
//           ignoreErrors: true,
//           verbose: true,
//           addHeader: ["referer:youtube.com", "user-agent:googlebot"],
//         };

//         // YouTube-specific options
//         if (this.isYouTubeLink(videoUrl) && this.youtubeCookiesPath) {
//           downloadOptions.cookies = this.youtubeCookiesPath;
//           downloadOptions.addHeader = [
//             "referer:youtube.com",
//             "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
//           ];
//         }

//         // Download video
//         try {
//           const result = await ytdl(videoUrl, downloadOptions);
//           return videoFilePath;
//         } catch (error) {
//           console.error("Download Failed:", error);
//           throw error;
//         }
//       } catch (error) {
//         if (retries === 0) throw error;
//         retries--;
//         console.log(`Retrying download for ${filename}`);
//         await new Promise((resolve) => setTimeout(resolve, 3000));
//       }
//     }
//   }
// }

// module.exports = VideoDownloader;

// const { exec } = require("child_process");
// const ytdl = require("youtube-dl-exec");
// const path = require("path");
// const fs = require("fs").promises;
// const config = require("../../../config");
// const { tmpdir } = require("os");

// class VideoDownloader {
//   constructor(downloadBasePath, id) {
//     this.basePath = path.resolve(downloadBasePath, id);
//     this.ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
//     this.tempCookiePath = path.join(tmpdir(), `yt_cookies_${Date.now()}.txt`);

//     this.isYouTubeLink = (url) =>
//       url.includes("youtube.com") || url.includes("youtu.be");
//   }

//   async _handleCookies() {
//     try {
//       const cookiePath = config.youtube_cookies;
//       if (!cookiePath) return null;

//       // 1. Validate cookies file exists
//       await fs.access(cookiePath, fs.constants.R_OK);

//       // 2. Log cookie metadata
//       const stats = await fs.stat(cookiePath);
//       console.log(`Cookie file info:
//         - Path: ${cookiePath}
//         - Size: ${stats.size} bytes
//         - Modified: ${stats.mtime.toISOString()}`);

//       // 3. Create writable temp copy
//       const content = await fs.readFile(cookiePath, "utf8");
//       await fs.writeFile(this.tempCookiePath, content);

//       // 4. Validate cookie content
//       const isValid = content.match(/LOGIN_INFO|SID|SSID/);
//       console.log(`Cookie content check: ${isValid ? "VALID" : "INVALID"}`);
//       console.log("First 200 characters:", content.substring(0, 200));

//       return this.tempCookiePath;
//     } catch (error) {
//       console.error("Cookie handling failed:", error);
//       throw new Error(`Cookie error: ${error.message}`);
//     }
//   }

//   async downloadVideo(videoUrl, filename) {
//     let retries = 2;

//     try {
//       let cookiePath;
//       if (this.isYouTubeLink(videoUrl)) {
//         cookiePath = await this._handleCookies();
//       }

//       while (retries >= 0) {
//         try {
//           await fs.mkdir(this.basePath, { recursive: true });
//           const videoFilePath = path.join(this.basePath, `${filename}.mp4`);

//           const downloadOptions = {
//             output: videoFilePath,
//             ffmpegLocation: this.ffmpegPath,
//             format: "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best",
//             verbose: true,
//             forceIpv4: true,
//             socketTimeout: 30000,
//             addHeader: [
//               "referer:youtube.com",
//               "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
//             ],
//             writeCookies: false,
//             markWatched: false,
//             cacheDir: false,
//           };

//           if (cookiePath) {
//             downloadOptions.cookies = cookiePath;
//             downloadOptions.markWatched = false;
//             downloadOptions.noCacheDir = true;
//           }

//           console.log(
//             "Final download options:",
//             JSON.stringify(downloadOptions, null, 2)
//           );

//           const result = await ytdl(videoUrl, downloadOptions);
//           return videoFilePath;
//         } catch (error) {
//           if (retries === 0) throw error;
//           retries--;
//           console.log(`Retrying... (${retries} left)`);
//           await new Promise((resolve) =>
//             setTimeout(resolve, 3000 * (3 - retries))
//           );
//         }
//       }
//     } finally {
//       // Cleanup temp cookies
//       try {
//         await fs.unlink(this.tempCookiePath);
//       } catch (e) {
//         console.warn("Temp cookie cleanup failed:", e.message);
//       }
//     }
//   }
// }

// module.exports = VideoDownloader;

const { exec } = require("child_process");
const ytdl = require("youtube-dl-exec");
const path = require("path");
const fs = require("fs").promises;
const config = require("../../../config");
const { tmpdir } = require("os");

class VideoDownloader {
  constructor(downloadBasePath, id) {
    this.basePath = path.resolve(downloadBasePath, id);
    this.ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
    this.tempCookiePath = path.join(tmpdir(), `yt_cookies_${Date.now()}.txt`);

    this.isYouTubeLink = (url) =>
      url.includes("youtube.com") || url.includes("youtu.be");
  }

  async _handleCookies() {
    try {
      const cookiePath = config.youtube_cookies;
      if (!cookiePath) return null;

      // Validate and copy cookies
      await fs.access(cookiePath, fs.constants.R_OK);
      const stats = await fs.stat(cookiePath);

      console.log(`Cookie file info:
        - Path: ${cookiePath}
        - Size: ${stats.size} bytes
        - Modified: ${stats.mtime.toISOString()}`);

      const content = await fs.readFile(cookiePath, "utf8");
      await fs.writeFile(this.tempCookiePath, content);


      const isValid = content.match(/LOGIN_INFO|SID|SSID/);
      console.log(`Cookie content check: ${isValid ? "VALID" : "INVALID"}`);
      console.log("First 200 chars:", content.substring(0, 500));

      return this.tempCookiePath;
    } catch (error) {
      console.error("Cookie handling failed:", error);
      throw new Error(`Cookie error: ${error.message}`);
    }
  }

  async downloadVideo(videoUrl, filename) {
    let retries = 2;

    try {
      let cookiePath;
      if (this.isYouTubeLink(videoUrl)) {
        cookiePath = await this._handleCookies();
      }

      while (retries >= 0) {
        try {
          await fs.mkdir(this.basePath, { recursive: true });
          const videoFilePath = path.join(this.basePath, `${filename}.mp4`);

          // CORRECTED DOWNLOAD OPTIONS
          const downloadOptions = {
            output: videoFilePath,
            ffmpegLocation: this.ffmpegPath,
            format: "(bestvideo[vcodec^=avc1][ext=mp4]+bestaudio)/best",
            verbose: true,
            noCheckCertificates: true,
            socketTimeout: 30000,
            ignoreErrors: true,
            mergeOutputFormat: "mp4",

            addHeader: [
              "referer:youtube.com",
              "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            ],
          };

          if (cookiePath) {
            downloadOptions.cookies = cookiePath;
          }

          console.log(
            "Final download options:",
            JSON.stringify(downloadOptions, null, 2)
          );

          const result = await ytdl(videoUrl, downloadOptions);
          return videoFilePath;
        } catch (error) {
          if (retries === 0) throw error;
          retries--;
          console.log(`Retrying... (${retries} left)`);
          await new Promise((resolve) =>
            setTimeout(resolve, 3000 * (3 - retries))
          );
        }
      }
    } finally {
      // Cleanup temp cookies
      try {
        await fs.unlink(this.tempCookiePath);
      } catch (e) {
        console.warn("Temp cookie cleanup failed:", e.message);
      }
    }
  }
}

module.exports = VideoDownloader;
