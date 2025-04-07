const { exec } = require("child_process");
const { promisify } = require("util");
const path = require("path");
const fs = require("fs").promises;

const execAsync = promisify(exec);

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
