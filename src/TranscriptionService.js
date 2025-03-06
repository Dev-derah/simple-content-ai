const HfInference = require("@huggingface/inference");
const fs = require("fs").promises;

class TranscriptionService {
  constructor(apiKey) {
    this.hf = new HfInference.HfInference(apiKey);
  }

  async transcribeAudio(audioPath) {
    try {
      const audioData = await fs.readFile(audioPath);
      const response = await this.hf.automaticSpeechRecognition({
        model: "openai/whisper-small",
        data: audioData,
      });
      return response.text;
    } catch (error) {
      console.error("❌ Transcription error:", error);
      throw error;
    }
  }
}

module.exports = TranscriptionService;
