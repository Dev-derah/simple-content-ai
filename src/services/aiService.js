const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require('../../config')

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  }

  async generateContent(prompt) {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return {
        generated_text: response.text(),
        usage: {
          promptTokens: response.usageMetadata.promptTokenCount,
          generatedTokens: response.usageMetadata.candidatesTokenCount,
        },
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("Failed to generate content");
    }
  }
}

module.exports = AIService;
