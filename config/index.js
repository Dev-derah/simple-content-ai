const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

module.exports = {
  HF_API_KEY: process.env.HF_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  DOWNLOAD_PATH: path.join(process.cwd(), "downloads"),
  getScraperConfig: () => ({
    headless: process.env.HEADLESS === true || false,
    rateLimit: 1,
    // Platform-specific configs
  }),

  PLATFORMS: {
    linkedin: {
      key: "linkedin",
      displayName: "LinkedIn",
      maxLength: 2000,
      hashtagCount: 3,
      hashtagExamples: ["#Leadership", "#CareerTips"],
      tone: "professional",
      scriptSections: ["hook", "story", "cta"],
    },
    twitter: {
      key: "twitter",
      displayName: "Twitter/X",
      maxLength: 280,
      hashtagCount: 1,
      threadCount: "dynamic",
      hashtagExamples: ["#TechTwitter"],
      patterns: {
        profile: /^https:\/\/twitter\.com\/[^/]+\/?$/i,
        tweet: /^https:\/\/twitter\.com\/[^/]+\/status\/\d+/i,
      },
    },
    tiktok: {
      key: "tiktok",
      displayName: "TikTok",
      maxLength: 150,
      hashtagCount: 5,
      emojiFrequency: "high",
      emojiExamples: ["🔥", "🚀"],
      scriptSections: ["hook", "body", "callToAction"],
      patterns: {
        profile: /^https:\/\/www\.tiktok\.com\/@[^/]+\/?$/i,
        video: /^https:\/\/www\.tiktok\.com\/@[\w.-]+\/video\/\d+\/?$/i,
      },
    },
    youtube: {
      key: "youtube",
      displayName: "YouTube",
      sections: ["intro", "content", "outro"],
      videoLength: "30-60 seconds",
      callToAction: true,
      patterns: {
        channel: /^https:\/\/www\.youtube\.com\/@[^/]+/i,
        video: /^(https:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/i,
      },
    },
    instagram: {
      key: "instagram",
      displayName: "Instagram",
      patterns: {
        profile: /^https:\/\/www\.instagram\.com\/[^/]+\/?$/i,
        post: /^https:\/\/www\.instagram\.com\/p\/[\w-]+\/?/i,
        reel: /^https:\/\/www\.instagram\.com\/reels?\/[\w-]+\/?/i,
      },
    },
  },
};
