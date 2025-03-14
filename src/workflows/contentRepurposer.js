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
# STRICT JSON OUTPUT REQUIRED - NO MARKDOWN OR EXTRA TEXT
**Role:** Top social media strategist & viral content creator
**Objective:** Repurpose content into platform-specific JSON formats

## CRITICAL INSTRUCTIONS
1. Output MUST be pure JSON only - no commentary
2. Validate JSON syntax before responding
3. Maintain EXACT field structure shown in example
4. Use double quotes for all strings/keys
5. Never use markdown formatting
6. If unsure about data, leave field as empty string

## OUTPUT TEMPLATE EXAMPLE
{
  "platforms": {
    "LinkedIn": {
      "hook": "Bold statement here",
      "storytelling": "Case study narrative...",
      "value": "Actionable insights...",
      "engagement_question": "What would you do?",
      "hashtags": ["#Example", "#HashTag"]
    },
    "Twitter": {
      "tweets": ["Hook...", "Thread part 1...", "Part 2..."],
      "hashtags": ["#TwitterTip"]
    }
  }
}

## CONTEXT RULES
- LinkedIn: Professional tone with industry insights
- Twitter: Thread format with hot takes
- TikTok: High-energy scripts under 200 chars
- YouTube: Scene-by-scene directions

## CONTENT TO REPURPOSE
"${sourceContent}"

## VALIDATION CHECKLIST
✓ All platform sections present
✓ No markdown formatting
✓ Proper string escaping
✓ Array formatting for multi-item fields
✓ No trailing commas


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
- **Hook tweet should be a scroll-stopper** ("You're doing [X] wrong. Here's what the top 1% do instead.")  
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

YOUR OUTPUT (STRICT JSON ONLY):
### Generate the content now! 🚀
  `);
  }

  parseCombinedResponse(generatedText) {
    console.log("Raw generatedText:", generatedText);
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
      // Clean up the response to extract just the JSON
      let jsonStr = generatedText;

      // Remove markdown code block markers if present
      jsonStr = jsonStr.replace(/```json\n|\n```/g, "");

      // Remove any leading/trailing whitespace
      jsonStr = jsonStr.trim();

      // Parse the cleaned JSON
      const response = JSON.parse(jsonStr);

      // Validate root structure
      if (!response.platforms || typeof response.platforms !== "object") {
        throw new Error("Invalid JSON structure - missing platforms object");
      }

      // LinkedIn Processing
      if (response.platforms.LinkedIn) {
        const li = response.platforms.LinkedIn;
        contentMap.linkedin = [
          li.hook || "",
          li.storytelling || "",
          li.value || "",
          li.engagement_question || "",
          (li.hashtags || []).join(" "),
        ]
          .filter(Boolean)
          .join("\n\n");
      }

      // Twitter Processing
      if (response.platforms.Twitter) {
        const tw = response.platforms.Twitter;
        contentMap.twitter = Array.isArray(tw.tweets)
          ? tw.tweets.join("\n")
          : "";
      }

      // TikTok Processing
      if (response.platforms.TikTok) {
        const tt = response.platforms.TikTok;
        contentMap.tiktok = {
          caption: tt.caption || "",
          script: tt.script || "",
        };
      }

      // YouTube Processing
      if (response.platforms.YouTube) {
        contentMap.youtube = response.platforms.YouTube.script || "";
      }

      return contentMap;
    } catch (error) {
      console.error("JSON Parsing Error:", error);
      console.error("Attempted to parse:", jsonStr);
      return this.handlePartialSuccess(contentMap, generatedText);
    }
  }

  handlePartialSuccess(contentMap, rawText) {
    console.warn("Attempting partial error recovery...");
    try {
      // Extract content between platform markers if JSON parsing failed
      const platforms = {
        linkedin: /"LinkedIn":\s*{([^}]+)}/,
        twitter: /"Twitter":\s*{([^}]+)}/,
        tiktok: /"TikTok":\s*{([^}]+)}/,
        youtube: /"YouTube":\s*{([^}]+)}/,
      };

      for (const [platform, regex] of Object.entries(platforms)) {
        const match = rawText.match(regex);
        if (match) {
          if (platform === "tiktok") {
            contentMap[platform] = {
              caption: this.extractValue(match[1], "caption"),
              script: this.extractValue(match[1], "script"),
            };
          } else {
            contentMap[platform] = this.extractValue(match[1], "content");
          }
        }
      }

      return contentMap;
    } catch (fallbackError) {
      console.error("Fallback parsing failed:", fallbackError);
      return contentMap;
    }
  }

  extractValue(text, key) {
    const match = text.match(new RegExp(`"${key}":\\s*"([^"]+)"`));
    return match ? match[1] : "";
  }

  cleanPrompt(text) {
    return text
      .replace(/\s+/g, " ")
      .trim()
      .replace(/(\d+\. )/g, "\n$1");
  }
}

module.exports = ContentRepurposer;
