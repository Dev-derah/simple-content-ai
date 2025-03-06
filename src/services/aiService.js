const { HfInference } = require("@huggingface/inference");
const config = require("../../config");

class AIService {
  constructor() {
    this.hf = new HfInference(config.HF_API_KEY);
  }

  async transcribeAudio(audioData) {
    return this.hf.automaticSpeechRecognition({
      model: "openai/whisper-small",
      data: audioData,
    });
  }

  async generateContent(prompt) {
    return this.hf.textGeneration({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      inputs: prompt,
      parameters: { max_new_tokens: 500 },
    });
  }
}

module.exports = AIService;
