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
  }

  async ensureDirectories() {
    await fs.mkdir(this.basePath, { recursive: true });
  }

  async downloadVideo(videoUrl, filename) {
    let retries = 2;

    while (retries >= 0) {
      try {
        await this.ensureDirectories();
        const videoFilePath = path.join(this.basePath, `${filename}.mp4`);

        // Download video
        try {
          const result = await ytdl(videoUrl, {
            output: videoFilePath,
            ffmpegLocation: this.ffmpegPath,
            format:
              "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best",
            mergeOutputFormat: "mp4",
            noCheckCertificates: true,
            ignoreErrors: true,
            verbose: true,
            addHeader: ["referer:youtube.com", "user-agent:googlebot"],
          });

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
