const AIService = require("../services/AIService");
const { retryAsync } = require("../../utils/retryHandler");
const config = require("../../config");

class ContentRepurposer {
  constructor() {
    this.aiService = new AIService();
    this.platformConfig = {
      linkedin: {
        maxLength: 2000, // Optimal post length for maximum engagement
        hashtagCount: 3, // Recommended number of hashtags
        tone: "professional",
      },
      twitter: {
        maxLength: 280, // Maximum character limit per tweet
        threadCount: "dynamic", // Adjusts based on content depth and value
        hashtagCount: 1, // Optimal number of hashtags per tweet
      },
      tiktok: {
        maxLength: 150, // Ideal caption length
        hashtagCount: 5, // Suggested number of hashtags
        emojiFrequency: "high", // High usage of emojis to boost engagement
        scriptSections: ["hook", "body", "callToAction"], // Structured script components
      },
      youtube: {
        sections: ["intro", "content", "outro"],
        callToAction: true,
        videoLength: "30-60 seconds", // Ideal video duration for engagement
      },
    };
  }

  async processContent(contentData) {
    console.log("contentData", contentData);
    try {
      if (!contentData) {
        throw new Error("No content data provided");
      }

      const result = {
        metadata: {
          source: contentData.url
            ? {
                originalUrl: contentData.url,
                platform: contentData.platform || "unknown",
                scrapedAt: contentData.uploadDate || new Date().toISOString(),
              }
            : {
                type: "user-provided",
                receivedAt: new Date().toISOString(),
              },
          contentMetadata: {
            language: contentData.language || "en",
            contentType: contentData.contentType || "text",
            length: (contentData.text || contentData.transcription || "")
              .length,
            hashtags: contentData.hashtags || [],
          },
        },
        content: {},
      };

      const sourceContent =
        contentData.text || contentData.transcription || contentData.caption;

      if (!sourceContent) {
        throw new Error("No content provided for repurposing");
      }

      // Single API call for all platforms
      const combinedPrompt = this.createCombinedPrompt(sourceContent);
      const generated = await retryAsync(
        () => this.aiService.generateContent(combinedPrompt),
        3
      );

      // Parse the combined response
      result.content = this.parseCombinedResponse(generated.generated_text);

      return result;
    } catch (error) {
      throw new Error(`Processing failed: ${error.message}`);
    }
  }

  createCombinedPrompt(sourceContent) {
    return this.cleanPrompt(`
  Act as a **top-tier social media strategist, growth hacker, and viral content creator** who specializes in **highly engaging, shareable, and high-converting posts**. Your goal is to **repurpose content** into platform-specific, viral-worthy formats that **maximize engagement and follower growth**.   

## RULES FOR CREATING VIRAL CONTENT:
- **Hook-Driven:** Grab attention in 2 seconds with a shocking statement, stat, or controversy.  
- **Emotion-Packed:** Use storytelling, controversy, humor, FOMO, or relatability.  
- **Value-Driven:** Share practical insights, rare knowledge, or industry trends.  
- **Engagement-Optimized:** Every post should encourage likes, comments, and shares.  
- **Hashtag & Formatting Best Practices:** Follow each platform's unique engagement style.  

---

### **Repurposed Content for Each Platform**  
**Base Content:** "${sourceContent}"  

🔹 **LinkedIn Post (Max ${this.platformConfig.linkedin.maxLength} characters)**  
- **Hook:** Start with a bold statement, stat, or hot take.  
- **Storytelling:** Share an insightful, relatable story or case study.  
- **Value:** Provide unique insights, actionable steps, or thought leadership.  
- **Engagement Question:** End with a thought-provoking question.  
- **Hashtags:** Use ${this.platformConfig.linkedin.hashtagCount} trending industry hashtags.  

🔹 **Twitter/X**  
**Decide based on the content:**  
- If the content is short and punchy, generate **a single viral-worthy tweet** (Max ${this.platformConfig.twitter.maxLength} characters).  
- If the content requires depth, generate **a dynamic thread** (not fixed at 3 tweets).  
- Each tweet should be concise, engaging, and encourage replies or retweets.  
- **Hook tweet should be a scroll-stopper** ("You’re doing [X] wrong. Here’s what the top 1% do instead.")  
- **Hashtags:** Use a maximum of **${this.platformConfig.twitter.hashtagCount}** per tweet for best reach.  

🔹 **TikTok Caption (Max ${this.platformConfig.tiktok.maxLength} characters)**  
- **Trending, curiosity-driven, & punchy** ("Most people get this WRONG 🤯...")  
- **Use power words** that trigger FOMO or emotion.  
- **High emoji use** (🔥🚀🤔💡)  
- **Hashtags:** ${this.platformConfig.tiktok.hashtagCount} viral hashtags  

🔹 **TikTok Video Script (30-60 sec)**  
🎬 **[Hook]** (Shocking statement, humor, or curiosity-building question)  
🎥 **[Main Content]** (Fast-paced, engaging storytelling or tutorial with cuts & effects)  
📢 **[Call to Action]** ("Follow for more!", "Comment if you agree!")  
- **Engagement boosters:** Jump cuts, open loops, captions, trending sounds  

🔹 **YouTube Script (30-60 sec)**  
📌 **[Intro]** (Hook that grabs attention in 3 sec: controversial take, shocking stat, or humor)  
🎥 **[Main Content]** (Story-driven, simple structure with scene directions)  
📢 **[Outro]** ("Like & subscribe if you found this helpful!")  

---

💡 **Final Check:**  
- **Every post should be optimized for MAXIMUM engagement & shareability.**  
- **Make it feel personal, not robotic** (use humor, storytelling, & authenticity).  
- **Your goal is to help this content go VIRAL & attract new followers.**  

### Generate the content now! 🚀
  `);
  }

  parseCombinedResponse(generatedText) {
    console.log("generatedText", generatedText);
    const contentMap = {
      linkedin: "Content generation failed",
      twitter: "Content generation failed",
      tiktok: {
        caption: "Content generation failed",
        script: "Content generation failed",
      },
      youtube: "Content generation failed",
    };

    try {
      let platformSections = generatedText;

      // Extract based on explicit platform headers
      const linkedinMatch = platformSections.match(
        /🔹 \*\*LinkedIn Post.*?\*\*\n([\s\S]*?)(?=\n\n🔹 \*\*Twitter\/X|\n\n🔹 \*\*TikTok Caption|\Z)/i
      );
      if (linkedinMatch) contentMap.linkedin = linkedinMatch[1].trim();

      const twitterMatch = platformSections.match(
        /🔹 \*\*Twitter\/X.*?\*\*\n([\s\S]*?)(?=\n\n🔹 \*\*TikTok Caption|\Z)/i
      );
      if (twitterMatch) {
        const tweets = twitterMatch[1].trim().split("\n\n");
        contentMap.twitter = tweets.length === 1 ? tweets[0] : tweets;
      }

      const tiktokCaptionMatch = platformSections.match(
        /🔹 \*\*TikTok Caption.*?\*\*\n([\s\S]*?)(?=\n\n🔹 \*\*TikTok Video Script|\Z)/i
      );
      if (tiktokCaptionMatch)
        contentMap.tiktok.caption = tiktokCaptionMatch[1].trim();

      const tiktokScriptMatch = platformSections.match(
        /🔹 \*\*TikTok Video Script.*?\*\*\n([\s\S]*?)(?=\n\n🔹 \*\*YouTube Script|\Z)/i
      );
      if (tiktokScriptMatch)
        contentMap.tiktok.script = tiktokScriptMatch[1].trim();

      // NEW FIX: Properly capture **FULL YouTube Content** without truncation
      const youtubeMatch = platformSections.match(
        /🔹 \*\*YouTube Script.*?\*\*\n([\s\S]*)/i // Removes end truncation issue
      );
      if (youtubeMatch) contentMap.youtube = youtubeMatch[1].trim();
    } catch (error) {
      console.error("Failed to parse combined response:", error);
    }

    return contentMap;
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

    return processors[platform] ? processors[platform](content) : content;
  }

  cleanPrompt(text) {
    return text
      .replace(/\s+/g, " ")
      .trim()
      .replace(/(\d+\. )/g, "\n$1");
  }
}

module.exports = ContentRepurposer;
