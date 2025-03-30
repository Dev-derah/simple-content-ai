const { exec } = require("child_process");
const { promisify } = require("util");
const path = require("path");
const fs = require("fs").promises;

const execAsync = promisify(exec);

// async function splitAudio(audioPath, outputDir) {
//   try {
//     // Ensure output directory exists
//     await fs.mkdir(outputDir, { recursive: true });

//     const outputPattern = path.join(outputDir, "chunk_%03d.wav");

//     // FFmpeg command to split audio into 30-second chunks
//     const command = [
//       `"${ffmpeg.path}"`,
//       "-i",
//       `"${audioPath}"`,
//       "-f",
//       "segment",
//       "-segment_time",
//       "25",
//       "-c",
//       "copy",
//       `"${outputPattern}"`,
//     ].join(" ");

//     await execAsync(command);

//     // Get the list of generated chunk files
//     const files = await fs.readdir(outputDir);
//     return files.map((file) => path.join(outputDir, file));
//   } catch (error) {
//     console.error("❌ Audio splitting failed:", error);
//     throw new Error(`Audio splitting failed: ${error.message}`);
//   }
// }

async function splitAudio(audioPath, outputDir) {
  const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg"; // Changed here
  const outputPattern = path.join(outputDir, "chunk_%03d.wav");

  await execAsync(
    `${ffmpegPath} -i "${audioPath}" -f segment -segment_time 25 -c copy "${outputPattern}"`
  );

  return (await fs.readdir(outputDir)).map((file) =>
    path.join(outputDir, file)
  );
}

module.exports = splitAudio;
