// const fs = require("fs").promises;
// const path = require("path");
// const VideoDownloader = require("../src/media-processing/video-processing/videoDownloader");
// const processAudio = require("../src/media-processing/audio-processing/processAudio");

// async function downloadAndProcessMedia(instanceFolder, videoUrl, videoId) {
//   const MAX_RETRIES = 2;
//   let retryCount = 0;
//   let videoPath;

//   while (retryCount <= MAX_RETRIES) {
//     try {
//       const downloader = new VideoDownloader(
//         path.join(instanceFolder, "videos"),
//         videoId
//       );

//       console.log(`Downloading ${videoUrl} (attempt ${retryCount + 1})`);
//       videoPath = await downloader.downloadVideo(videoUrl, videoId);

//       // Verify download
//       const stats = await fs.stat(videoPath);
//       if (stats.size < 102400) {
//         throw new Error("Downloaded file too small (likely incomplete)");
//       }


//       // Process audio
//       const { audioPath, transcript } = await processAudio(
//         videoPath,
//         path.join(instanceFolder, "audio")
//       );

//       return {
//         videoPath,
//         audioPath,
//         transcript,
//         success: true,
//       };
//     } catch (error) {
//       console.error(`Attempt ${retryCount + 1} failed:`, error.message);

//       // Cleanup failed download
//       if (videoPath) {
//         await fs.unlink(videoPath).catch(() => {});
//       }

//       if (retryCount === MAX_RETRIES) {
//         throw new Error(
//           `Failed after ${MAX_RETRIES} retries: ${error.message}`
//         );
//       }

//       retryCount++;
//       await new Promise((resolve) => setTimeout(resolve, 3000 * retryCount));
//     }
//   }
// }

// module.exports = { downloadAndProcessMedia };

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

      console.log("Download successful. Now processing audio...");

      const audioOutputDir = path.join(instanceFolder, "audio");

      // Run audio processing — works even if input is already .m4a
      const { audioPath, transcript } = await processAudio(
        videoPath,
        audioOutputDir
      );

      return {
        videoPath,
        audioPath,
        transcript,
        success: true,
      };
    } catch (error) {
      console.error(`Attempt ${retryCount + 1} failed:`, error.message);

      // Cleanup failed download if exists
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
