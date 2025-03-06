const AIService = require("../services/AIService");
const { retryAsync } = require("../../utils/retryHandler");
const config = require("../../config");

class ContentRepurposer {
  constructor() {
    this.aiService = new AIService();
    this.platformConfig = {
      linkedin: {
        maxLength: 3000,
        hashtagCount: 5,
        tone: "professional",
      },
      twitter: {
        maxLength: 280,
        threadCount: 3,
        hashtagCount: 3,
      },
      tiktok: {
        maxLength: 150,
        hashtagCount: 5,
        emojiFrequency: "high",
      },
      youtube: {
        sections: ["intro", "content", "outro"],
        callToAction: true,
      },
    };
  }

  async processVideo(videoData) {
    try {
      const result = {
        metadata: {
          originalUrl: videoData.url,
          sourcePlatform: videoData.platform || "unknown",
          processedAt: new Date().toISOString(),
        },
        content: {},
      };

      // Generate content for all target platforms
      await Promise.all(
        config.PLATFORMS.map(async (platform) => {
          try {
            const prompt = this.createPlatformPrompt(platform, videoData);
            const generated = await retryAsync(
              () => this.aiService.generateContent(prompt),
              3
            );

            result.content[platform] = this.postProcessContent(
              platform,
              generated.generated_text
            );
          } catch (error) {
            console.error(
              `Failed to generate ${platform} content:`,
              error.message
            );
            result.content[platform] = "Content generation failed";
          }
        })
      );

      return result;
    } catch (error) {
      throw new Error(`Processing failed: ${error.message}`);
    }
  }

  createPlatformPrompt(targetPlatform, videoData) {
    const platformPrompts = {
      linkedin: `
        Create a LinkedIn post using this content: "${videoData.transcription}"
        - Professional tone with industry insights
        - Include ${this.platformConfig.linkedin.hashtagCount} relevant hashtags
        - Add 1 question to encourage engagement
        - Max ${this.platformConfig.linkedin.maxLength} characters
      `,

      twitter: `
        Create a Twitter thread (${this.platformConfig.twitter.threadCount} tweets) from: "${videoData.transcription}"
        - Use concise language with emojis
        - Include ${this.platformConfig.twitter.hashtagCount} hashtags per tweet
        - Add thread numbering (1/X)
        - Each tweet max ${this.platformConfig.twitter.maxLength} chars
      `,

      tiktok: `
        Create a TikTok caption based on: "${videoData.transcription}"
        - Attention-grabbing first line
        - ${this.platformConfig.tiktok.hashtagCount} trending hashtags
        - Emoji every 5-10 words
        - Max ${this.platformConfig.tiktok.maxLength} characters
        - Add a call-to-action (like, follow, comment)
      `,

      youtube: `
        Create a YouTube script from: "${videoData.transcription}"
        - Include [Intro], [Content], [Outro] sections
        - Add scene directions in brackets
        - Natural, conversational tone
        - Call-to-action in outro
        - Length: 30-60 seconds
      `,
    };

    return this.cleanPrompt(platformPrompts[targetPlatform]);
  }

  postProcessContent(platform, content) {
    const processors = {
      linkedin: (text) => text.replace(/\n/g, "\n\n"),
      twitter: (text) => {
        const tweets = text.split("\n").filter((t) => t.trim());
        return tweets.map((t, i) => `${t} (${i + 1}/${tweets.length})`);
      },
      tiktok: (text) => text.replace(/#/g, "#").replace(/\n/g, " "),
      youtube: (text) => text.replace(/(\[.*?\])/g, "\n$1\n"),
    };

    return processors[platform](content);
  }

  cleanPrompt(text) {
    return text
      .replace(/\s+/g, " ")
      .trim()
      .replace(/(\d+\. )/g, "\n$1");
  }
}

module.exports = ContentRepurposer;
