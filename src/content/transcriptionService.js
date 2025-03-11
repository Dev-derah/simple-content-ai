const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs").promises;

class TranscriptionService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.gemini = new GoogleGenerativeAI(apiKey);
  }

  async transcribeAudio(audioPath) {
    const model = this.gemini.getGenerativeModel({ model: "gemini-1.5-pro" });

    const audioData = await fs.readFile(audioPath);
    const base64Audio = audioData.toString("base64");

    const MAX_RETRIES = 2;
    let retries = 0;

    while (retries <= MAX_RETRIES) {
      try {
        console.log(`🎙️ Transcribing ${audioPath} using Gemini...`);

        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "Transcribe this audio and summarize for social media.",
                },
                {
                  inline_data: {
                    mime_type: "audio/wav",
                    data: base64Audio,
                  },
                },
              ],
            },
          ],
        });

        const responseText = result.response.text();
        console.log(`✅ Transcription success for ${audioPath}`);

        return responseText;
      } catch (error) {
        console.error(`❌ Error transcribing ${audioPath}:`, error);
        if (retries === MAX_RETRIES) throw error;
        retries++;
        await new Promise((resolve) => setTimeout(resolve, 3000 * retries));
      }
    }
  }
}

module.exports = TranscriptionService;
