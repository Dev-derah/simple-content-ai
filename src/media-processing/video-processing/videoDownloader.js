const { exec } = require("child_process");
const ytdl = require("youtube-dl-exec");
const path = require("path");
const fs = require("fs").promises;
const config = require("../../../config");
const { tmpdir } = require("os");
const ProxyManager = require("../../../utils/proxyManager"); 


class VideoDownloader {
  constructor(downloadBasePath, id) {
    this.basePath = path.resolve(downloadBasePath, id);
    this.ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
    this.tempCookiePath = path.join(tmpdir(), `yt_cookies_${Date.now()}.txt`);
    this.proxyManager = new ProxyManager(
      path.resolve(__dirname, "../../../proxies.txt")
    ); 

    this.isYouTubeLink = (url) =>
      url.includes("youtube.com") || url.includes("youtu.be");
  }

  async _handleCookies() {
    try {
      const cookiePath = config.youtube_cookies;
      if (!cookiePath) return null;

      // Validate and copy cookies
      await fs.access(cookiePath, fs.constants.R_OK);

      const content = await fs.readFile(cookiePath, "utf8");
      await fs.writeFile(this.tempCookiePath, content);

      const isValid = content.match(/LOGIN_INFO|SID|SSID/);
      console.log(`Cookie content check: ${isValid ? "VALID" : "INVALID"}`);

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
      const isYouTube = this.isYouTubeLink(videoUrl);

      if (isYouTube) {
        cookiePath = await this._handleCookies();
      }

      while (retries >= 0) {
        try {
          await fs.mkdir(this.basePath, { recursive: true });
          const fileExt = isYouTube ? "m4a" : "mp4";
          const filePath = path.join(this.basePath, `${filename}.${fileExt}`);

          // Tailored download options
          const downloadOptions = {
            output: filePath,
            ffmpegLocation: this.ffmpegPath,
            verbose: true,
            noCheckCertificates: true,
            socketTimeout: 30000,
            ignoreErrors: true,

            addHeader: [
              "referer:youtube.com",
              "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            ],
          };

          // Apply YouTube-specific options
          if (isYouTube) {
            downloadOptions.format = "bestaudio[ext=m4a]/bestaudio/best";
            downloadOptions.proxy = this.proxyManager.getRandomProxy();
            if (cookiePath) {
              downloadOptions.cookies = cookiePath;
            }
          } else {
            downloadOptions.format = "best";
          }

          console.log(
            "Final download options:",
            JSON.stringify(downloadOptions, null, 2)
          );

          const result = await ytdl(videoUrl, downloadOptions);
          return filePath;
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
