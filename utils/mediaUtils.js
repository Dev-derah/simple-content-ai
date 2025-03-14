const fs = require("fs").promises;
const path = require("path");
const VideoDownloader = require("../src/media-processing/video-processing/videoDownloader");
const processAudio = require("../src/media-processing/audio-processing/processAudio");

async function downloadAndProcessMedia(instanceFolder, videoUrl, videoId) {
  const MAX_RETRIES = 2;
  let retries = 0;
  let videoPath;

  while (retries <= MAX_RETRIES) {
    try {
      const downloader = new VideoDownloader(
        path.join(instanceFolder, "videos"),
        videoId.toString()
      );

      // Download video
      console.log(`⬇️ Downloading video: ${videoUrl}`);
      videoPath = await downloader.downloadVideo(videoUrl, videoId);
      await fs.access(videoPath);

      // Extract and process audio
      const { audioPath, transcript } = await processAudio(
        videoPath,
        path.join(instanceFolder, "audio")
      );

      return { videoPath, audioPath, transcript };
    } catch (error) {
      console.error(
        `❌ Media processing error (attempt ${retries + 1}):`,
        error
      );
      if (videoPath) await fs.unlink(videoPath).catch(() => {});
      if (retries === MAX_RETRIES) throw error;
      retries++;
      await new Promise((resolve) => setTimeout(resolve, 3000 * retries));
    }
  }
}

module.exports = { downloadAndProcessMedia };
