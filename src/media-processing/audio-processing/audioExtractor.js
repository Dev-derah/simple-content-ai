const { execFile } = require("child_process");
const { promisify } = require("util");
const path = require("path");
const ffmpeg = require("@ffmpeg-installer/ffmpeg");
const fs = require("fs").promises;

const execFileAsync = promisify(execFile);

class AudioExtractor {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }

  async extract(videoPath, filename) {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      const outputPath = path.join(this.outputDir, `${filename}.wav`);

      // Verify input file exists
      await fs.access(videoPath);

      const args = [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        videoPath,
        "-vn",
        "-map",
        "0:a:0", // Explicitly select first audio stream
        "-ac",
        "1",
        "-ar",
        "16000",
        "-c:a",
        "pcm_s16le",
        outputPath,
      ];

      console.log("Executing ffmpeg with args:", [ffmpeg.path, ...args]);

      const { stderr } = await execFileAsync(ffmpeg.path, args);

      // Verify output file was created
      const stats = await fs.stat(outputPath);
      if (stats.size === 0) {
        throw new Error("Empty output file created");
      }

      return outputPath;
    } catch (error) {
      console.error("Audio extraction failed:", error);
      throw new Error(`Audio extraction failed: ${error.message}`);
    }
  }
}

module.exports = AudioExtractor;
