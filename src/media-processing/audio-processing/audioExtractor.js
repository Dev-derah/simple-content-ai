const { exec } = require("child_process");
const { promisify } = require("util");
const path = require("path");
const ffmpeg = require("@ffmpeg-installer/ffmpeg");
const fs = require("fs").promises;

const execAsync = promisify(exec);

class AudioExtractor {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }

  async extract(videoPath, filename) {
    try {
      // Ensure output directory exists

       await fs.mkdir(this.outputDir, { recursive: true });

       const outputPath = path.join(this.outputDir, `${filename}.wav`);


      const command = [
        `"${ffmpeg.path}"`,
        "-hide_banner",
        "-loglevel error",
        "-y",
        `-i "${videoPath}"`,
        "-vn", // Disable video
        "-ac 1", // Convert to mono
        "-ar 16000", // Set sample rate to 16kHz (recommended for ASR models)
        "-c:a pcm_s16le", // Convert to WAV format
        `"${outputPath}"`,
      ].join(" ");

      // console.log(`Extracting audio: ${command}`);

      const { stderr } = await execAsync(command);

      if (stderr) {
        console.error("FFmpeg warnings:", stderr);
      }

      // Verify output file was created
      await fs.access(outputPath);

      return outputPath;
    } catch (error) {
      console.error("Audio extraction failed:", error);
      throw new Error(`Audio extraction failed: ${error.message}`);
    }
  }
}

module.exports = AudioExtractor;
