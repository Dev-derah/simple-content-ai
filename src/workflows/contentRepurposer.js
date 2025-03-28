const AIService = require("../services/aiService");
const { retryAsync } = require("../../utils/retryHandler");
const config = require("../../config");

class ContentRepurposer {
  constructor() {
    this.aiService = new AIService();
    this.platformConfig = this.initializePlatformConfig();
    this.platformMappings = this.createPlatformMappings();
  }

  initializePlatformConfig() {
    return {
      [config.PLATFORMS.linkedin.key]: config.PLATFORMS.linkedin,
      [config.PLATFORMS.twitter.key]: config.PLATFORMS.twitter,
      [config.PLATFORMS.tiktok.key]: config.PLATFORMS.tiktok,
      [config.PLATFORMS.youtube.key]: config.PLATFORMS.youtube,
    };
  }

  createPlatformMappings() {
    return {
      [config.PLATFORMS.linkedin.key]: config.PLATFORMS.linkedin.displayName,
      [config.PLATFORMS.twitter.key]: config.PLATFORMS.twitter.displayName,
      [config.PLATFORMS.tiktok.key]: config.PLATFORMS.tiktok.displayName,
      [config.PLATFORMS.youtube.key]: config.PLATFORMS.youtube.displayName,
    };
  }

  async processContent(contentData, options = {}) {
    try {
 
      const requestedPlatforms = this.validatePlatforms(options.platforms);
      const customPrompt = options.customPrompt || "";

      if (!contentData) throw new Error("No content data provided");

      const result = this.initializeResultStructure(contentData);

      const sourceContent = this.getSourceContent(contentData);

      const combinedPrompt = this.createCombinedPrompt(
        sourceContent,
        requestedPlatforms,
        customPrompt
      );

      const generated = await retryAsync(
        () => this.aiService.generateContent(combinedPrompt),
        3
      );

      result.content = this.parseCombinedResponse(
        generated.generated_text,
        requestedPlatforms
      );

      return result;
    } catch (error) {
      throw new Error(`Processing failed: ${error.message}`);
    }
  }

  validatePlatforms(platforms) {
    const validPlatforms = platforms
      ? platforms.filter((p) => this.platformConfig[p])
      : Object.keys(this.platformConfig);
    if (validPlatforms.length === 0) {
      throw new Error("No valid platforms specified");
    }
    return validPlatforms;
  }

  initializeResultStructure(contentData) {
    return {
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
          length: (contentData.text || contentData.transcription || "").length,
          hashtags: contentData.hashtags || [],
        },
      },
      content: {},
    };
  }

  getSourceContent(contentData) {
    const sourceContent =
      contentData.text || contentData.transcription || contentData.caption;
    if (!sourceContent) throw new Error("No content provided for repurposing");
    return sourceContent;
  }

  createCombinedPrompt(sourceContent, platforms, customPrompt) {
    const platformNames = platforms.map((p) => this.platformMappings[p]);
    const platformExamples = this.getPlatformExamples(platforms);
    const platformRules = this.getPlatformInstructions(platforms);

    return this.cleanPrompt(`
      # STRICT JSON OUTPUT REQUIRED - NO MARKDOWN OR EXTRA TEXT
      **Role:** Top social media strategist & viral content creator
      **Objective:** Repurpose content into platform-specific JSON formats

      ## CRITICAL INSTRUCTIONS
      1. Generate content ONLY for: ${platformNames.join(", ")}
      2. ${customPrompt ? "USER INSTRUCTIONS: " + customPrompt : ""}
      3. Output MUST be pure JSON only
      4. Validate JSON syntax before responding

      ## OUTPUT TEMPLATE EXAMPLE
      {
        "platforms": {
          ${platformExamples}
        }
      }

      ## PLATFORM-SPECIFIC RULES
      ${platformRules}

      ## CONTENT TO REPURPOSE
      "${sourceContent}"

      ## VALIDATION CHECKLIST
      ✓ All platform sections present
      ✓ No markdown formatting
      ✓ Proper string escaping
      ✓ Array formatting for multi-item fields
      ✓ No trailing commas

      ## RULES FOR VIRAL CONTENT:
      ${this.getViralContentRules()}

      ${this.getPlatformSpecificGuidelines(platforms)}

      YOUR OUTPUT (STRICT JSON ONLY):
    `);
  }

  getViralContentRules() {
    return `- **Hook-Driven:** Grab attention in 2 seconds
- **Emotion-Packed:** Use storytelling, humor, FOMO
- **Value-Driven:** Share practical insights
- **Engagement-Optimized:** Encourage interactions
- **Platform Best Practices:** Follow formatting rules`;
  }

  getPlatformSpecificGuidelines(platforms) {
    return platforms
      .map((platform) => {
        const config = this.platformConfig[platform];
        return (
          `🔹 **${this.platformMappings[platform]}**\n` +
          `- Max Length: ${config.maxLength}\n` +
          `- Hashtags: ${config.hashtagCount}\n` +
          `- Style: ${config.tone || config.emojiFrequency}\n` +
          `- Structure: ${
            config.scriptSections?.join(" → ") || config.sections?.join(", ")
          }`
        );
      })
      .join("\n\n");
  }

  getPlatformExamples(platforms) {
    return platforms
      .map((platform) => {
        const displayName = this.platformMappings[platform];
        const config = this.platformConfig[platform];

        switch (platform) {
          case "linkedin":
            return `"${displayName}": {
          "hook": "Bold statement here",
          "storytelling": "Case study...",
          "value": "Actionable insights...",
          "engagement_question": "What would you do?",
          "hashtags": ["${config?.hashtagExamples?.join('", "') || "#Example"}"]
        }`;
          case "twitter":
            return `"${displayName}": {
          "tweets": ["Hook...", "Thread part..."],
          "hashtags": ["${config?.hashtagExamples || "#Trending"}]
        }`;
          case "tiktok":
            return `"${displayName}": {
          "caption": "${config?.emojiExamples || "🚀"} Viral caption...",
          "script": "🎬 HOOK: ..."
        }`;
          case "youtube":
            return `"${displayName}": {
          "script": {
            "intro": "Hook...",
            "main_content": "...",
            "outro": "Like & subscribe!"
          }
        }`;
          default:
            return null;
        }
      })
      .filter(Boolean)
      .join(",\n");
  }

  getPlatformInstructions(platforms) {
    return platforms
      .map((platform) => {
        const config = this.platformConfig[platform];
        return (
          `- ${this.platformMappings[platform]}:\n` +
          `  • Max length: ${config.maxLength}\n` +
          `  • Hashtags: ${config.hashtagCount}\n` +
          `  • Tone: ${config.tone || "N/A"}\n` +
          `  • Structure: ${
            config.scriptSections?.join(", ") || config.sections?.join(", ")
          }`
        );
      })
      .join("\n");
  }

  parseCombinedResponse(generatedText, platforms) {
    const contentMap = this.initializeContentMap(platforms);
    let jsonStr = generatedText;

    try {
      jsonStr = jsonStr.replace(/```json\n|\n```/g, "").trim();
      const response = JSON.parse(jsonStr);

      if (!response.platforms || typeof response.platforms !== "object") {
        throw new Error("Invalid JSON structure - missing platforms object");
      }

      platforms.forEach((platform) => {
        const platformConfig = this.platformConfig[platform];
        if (!platformConfig) return;

        const platformDisplayName = this.platformMappings[platform];
        const platformData = response.platforms[platformDisplayName];
        if (!platformData) return;

        switch (platform) {
          case config.PLATFORMS.linkedin.key:
            contentMap[platform] = this.processLinkedInContent(platformData);
            break;

          case config.PLATFORMS.twitter.key:
            contentMap[platform] = this.processTwitterContent(platformData);
            break;

          case config.PLATFORMS.tiktok.key:
            contentMap[platform] = this.processTikTokContent(platformData);
            break;

          case config.PLATFORMS.youtube.key:
            contentMap[platform] = this.processYouTubeContent(platformData);
            break;
        }
      });

      return contentMap;
    } catch (error) {
      console.error("JSON Parsing Error:", error);
      return this.handlePartialSuccess(contentMap, generatedText, platforms);
    }
  }

  // Platform-specific processors
  processLinkedInContent(data) {
    return [
      data.hook || "",
      data.storytelling || "",
      data.value || "",
      data.engagement_question || "",
      (data.hashtags || []).join(" "),
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  processTwitterContent(data) {
    return Array.isArray(data.tweets) ? data.tweets.join("\n") : "";
  }

  processTikTokContent(data) {
    return {
      caption: data.caption || "",
      script: data.script || "",
    };
  }

  processYouTubeContent(data) {
    const script = data.script || {};
    return [script.intro || "", script.main_content || "", script.outro || ""]
      .filter(Boolean)
      .join("\n\n");
  }

  handlePartialSuccess(contentMap, rawText, platforms) {
    console.warn("Attempting partial error recovery...");
    try {
      const platformRegexes = platforms.reduce((acc, platform) => {
        const displayName = this.platformMappings[platform];
        acc[platform] = new RegExp(`"${displayName}":\\s*{([^}]+)}`);
        return acc;
      }, {});

      platforms.forEach((platform) => {
        const regex = platformRegexes[platform];
        const match = rawText.match(regex);
        if (!match) return;

        switch (platform) {
          case config.PLATFORMS.tiktok.key:
            contentMap[platform] = {
              caption: this.extractValue(match[1], "caption"),
              script: this.extractValue(match[1], "script"),
            };
            break;

          case config.PLATFORMS.youtube.key:
            contentMap[platform] = [
              this.extractValue(match[1], "intro"),
              this.extractValue(match[1], "main_content"),
              this.extractValue(match[1], "outro"),
            ]
              .filter(Boolean)
              .join("\n\n");
            break;

          default:
            contentMap[platform] = this.extractNestedContent(match[1]);
        }
      });

      return contentMap;
    } catch (fallbackError) {
      console.error("Fallback parsing failed:", fallbackError);
      return contentMap;
    }
  }

  // Updated helper to use config-based platform keys
  initializeContentMap(platforms) {
    const map = {};
    platforms.forEach((platform) => {
      if (!this.platformConfig[platform]) return;

      switch (platform) {
        case config.PLATFORMS.tiktok.key:
          map[platform] = {
            caption: "Content generation failed",
            script: "Content generation failed",
          };
          break;
        default:
          map[platform] = "Content generation failed";
      }
    });
    return map;
  }

    cleanPrompt(text) {
      return text
        .replace(/\s+/g, " ")
        .trim()
        .replace(/(\d+\. )/g, "\n$1");
    }

  // parseCombinedResponse and helper methods remain similar but use this.platformConfig
  // ... (previous parsing implementation with config-based platform checks)

  initializeContentMap(platforms) {
    const map = {};
    platforms.forEach((platform) => {
      if (!this.platformConfig[platform]) return;

      switch (platform) {
        case config.PLATFORMS.tiktok.key:
          map[platform] = {
            caption: "Content generation failed",
            script: "Content generation failed",
          };
          break;
        default:
          map[platform] = "Content generation failed";
      }
    });
    return map;
  }
}

module.exports = ContentRepurposer;
