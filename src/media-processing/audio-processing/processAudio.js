const path = require("path");
const fs = require("fs").promises;
const AudioExtractor = require("./audioExtractor");
const TranscriptionService = require("../../content/transcriptionService");
const config = require("../../../config/index");

async function processAudio(videoPath, outputDir) {
  // Extract audio from video
  console.log("🎞️ Extracting audio from video...");
  const audioExtractor = new AudioExtractor(outputDir);
  const audioPath = await audioExtractor.extract(
    videoPath,
    path.basename(videoPath, path.extname(videoPath))
  );

  // Initialize transcription service
  const transcriptionService = new TranscriptionService(config.GEMINI_API_KEY);

  console.log("🎤 Sending to Gemini for transcription...");
  const transcript = await transcriptionService.transcribeAudio(audioPath);

  // Save transcript
  // const transcriptPath = path.join(outputDir, "transcription.txt");
  // await fs.writeFile(transcriptPath, transcript, "utf-8");

  // console.log("✅ Transcription saved:", transcriptPath);

  return { audioPath, transcript };
}

module.exports = processAudio;
