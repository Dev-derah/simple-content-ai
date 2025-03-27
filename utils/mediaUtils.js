const fs = require("fs").promises;
const path = require("path");
const VideoDownloader = require("../src/media-processing/video-processing/videoDownloader");
const processAudio = require("../src/media-processing/audio-processing/processAudio");


async function downloadAndProcessMedia(instanceFolder, videoUrl, videoId) {
  const MAX_RETRIES = 2;
  const isTikTok = videoUrl.includes("tiktok.com");
  let videoPath;

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const downloader = new VideoDownloader(
        path.join(instanceFolder, "videos"),
        videoId.toString()
      );

      console.log(`⬇️ Downloading video (attempt ${attempt}): ${videoUrl}`);
      videoPath = await downloader.downloadVideo(videoUrl, videoId);

      // Validate downloaded file
      const stats = await fs.stat(videoPath);
      if (stats.size < 102400) {
        // Minimum 100KB check
        throw new Error("Downloaded file too small, likely incomplete");
      }

      // Process audio with timeout
      const { audioPath, transcript } = await Promise.race([
        processAudio(videoPath, path.join(instanceFolder, "audio")),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Processing timeout")), 60000)
        ),
      ]);

      return { videoPath, audioPath, transcript };
    } catch (error) {
      console.error(`❌ Media processing error (attempt ${attempt}):`, error);

      // Cleanup failed files
      if (videoPath) await fs.unlink(videoPath).catch(() => {});

      if (attempt > MAX_RETRIES) {
        throw new Error(
          `Media processing failed after ${MAX_RETRIES} retries: ${error.message}`
        );
      }

      // Platform-specific backoff
      await new Promise((resolve) =>
        setTimeout(resolve, isTikTok ? 5000 * attempt : 3000 * attempt)
      );
    }
  }
}
module.exports = { downloadAndProcessMedia };
