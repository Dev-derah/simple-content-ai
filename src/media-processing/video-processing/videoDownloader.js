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

const { exec } = require("child_process");
const ytdl = require("youtube-dl-exec");
const path = require("path");
const fs = require("fs").promises;
const config = require("../../../config");

class VideoDownloader {
  constructor(downloadBasePath, id) {
    // Base download directory
    this.basePath = path.resolve(downloadBasePath, id);
    this.ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";

    // YouTube-specific configuration
    this.youtubeCookiesPath =
      "/etc/secrets/youtube_cookies.txt";
    this.isYouTubeLink = (url) =>
      url.includes("youtube.com") || url.includes("youtu.be");
  }

  async ensureDirectories() {
    await fs.mkdir(this.basePath, { recursive: true });
  }

  async downloadVideo(videoUrl, filename) {
    let retries = 2;
    console.log("YOUTUBE COOKIES ==>",this.youtubeCookiesPath)
    while (retries >= 0) {
      try {
        await this.ensureDirectories();
        const videoFilePath = path.join(this.basePath, `${filename}.mp4`);

        // Common download options
        const downloadOptions = {
          output: videoFilePath,
          ffmpegLocation: this.ffmpegPath,
          format:
            "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best",
          mergeOutputFormat: "mp4",
          noCheckCertificates: true,
          ignoreErrors: true,
          verbose: true,
          addHeader: ["referer:youtube.com", "user-agent:googlebot"],
        };

        // YouTube-specific options
        if (this.isYouTubeLink(videoUrl) && this.youtubeCookiesPath) {
          downloadOptions.cookies = this.youtubeCookiesPath;
          downloadOptions.addHeader = [
            "referer:youtube.com",
            "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          ];
        }

        // Download video
        try {
          const result = await ytdl(videoUrl, downloadOptions);
          return videoFilePath;
        } catch (error) {
          console.error("Download Failed:", error);
          throw error;
        }
      } catch (error) {
        if (retries === 0) throw error;
        retries--;
        console.log(`Retrying download for ${filename}`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }
}

module.exports = VideoDownloader;
