const readline = require("readline");

const platformPatterns = {
  tiktok: {
    profile: [
      /^(https?:\/\/)?(www\.|m\.)?tiktok\.com\/@[a-zA-Z0-9_.-]+\/?(\?.*)?$/i,
      /^(https?:\/\/)?(www\.)?tiktok\.com\/tag\/[a-zA-Z0-9_.-]+(\?.*)?$/i,
    ],
    video: [
      /^(https?:\/\/)?(www\.|m\.)?tiktok\.com\/@[^/]+\/video\/\d+(\?.*)?$/i,
      /^(https?:\/\/)?(www\.)?tiktok\.com\/v\/\d+(\?.*)?$/i,
      /^(https?:\/\/)?vm\.tiktok\.com\/[a-zA-Z0-9]+(\?.*)?$/i,
      /^(https?:\/\/)?vt\.tiktok\.com\/[a-zA-Z0-9]+(\?.*)?$/i,
    ],
    keyword: /^[^<>%\$]{3,50}$/i,
  },
  youtube: {
    channel: [
      /^(https?:\/\/)?(www\.)?youtube\.com\/@[a-zA-Z0-9_.-]+\/?(\?.*)?$/i,
      /^(https?:\/\/)?(www\.)?youtube\.com\/(c|user)\/[a-zA-Z0-9_.-]+\/?(\?.*)?$/i,
    ],
    video: [
      /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]+(&.*)?$/i,
      /^(https?:\/\/)?youtu\.be\/[a-zA-Z0-9_-]+(\?.*)?$/i,
      /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[a-zA-Z0-9_-]+(\?.*)?$/i,
      /^(https?:\/\/)?(www\.)?youtube\.com\/live\/[a-zA-Z0-9_-]+(\?.*)?$/i,
      /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[a-zA-Z0-9_-]+(\?.*)?$/i,
    ],
    keyword: /^[^<>%\$]{3,50}$/i,
  },
  instagram: {
    profile:
      /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9_.-]+\/?(\?.*)?$/i,
    post: [
      /^(https?:\/\/)?(www\.)?instagram\.com\/p\/[a-zA-Z0-9_-]+\/?(\?.*)?$/i,
      /^(https?:\/\/)?(www\.)?instagram\.com\/reel\/[a-zA-Z0-9_-]+\/?(\?.*)?$/i,
      /^(https?:\/\/)?(www\.)?instagram\.com\/tv\/[a-zA-Z0-9_-]+\/?(\?.*)?$/i,
    ],
    reel: /^(https?:\/\/)?(www\.)?instagram\.com\/reels?\/[a-zA-Z0-9_-]+\/?(\?.*)?$/i,
  },
  twitter: {
    profile: [
      /^(https?:\/\/)?(www\.)?twitter\.com\/[a-zA-Z0-9_]{1,15}\/?(\?.*)?$/i,
      /^(https?:\/\/)?(www\.)?x\.com\/[a-zA-Z0-9_]{1,15}\/?(\?.*)?$/i,
    ],
    tweet: [
      /^(https?:\/\/)?(www\.)?twitter\.com\/[a-zA-Z0-9_]+\/status\/\d+(\?.*)?$/i,
      /^(https?:\/\/)?(www\.)?x\.com\/[a-zA-Z0-9_]+\/status\/\d+(\?.*)?$/i,
    ],
  },
  linkedin: {
    post: /^(https?:\/\/)?(www\.)?linkedin\.com\/posts\/[a-zA-Z0-9_-]+(\?.*)?$/i,
    profile:
      /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?(\?.*)?$/i,
  },
  generic: {
    keyword: /^[\w\s-]{3,50}$/i,
    url: /^(https?:\/\/)?(www\.)?[a-z0-9-]+(\.[a-z]{2,}){1,2}(\/[^\s]*)?$/i,
  },
};

const validateInput = (input) => {
  const sanitizedInput = input.trim().replace(/\/+$/, ""); // Remove trailing slashes

  // Check all platforms dynamically
  const platforms = {
    tiktok: ["profile", "video", "keyword"],
    youtube: ["channel", "video", "keyword"],
    instagram: ["profile", "post", "reel"],
    twitter: ["profile", "tweet"],
    linkedin: ["post", "profile"],
    generic: ["keyword", "url"],
  };

  for (const [platform, contentTypes] of Object.entries(platforms)) {
    for (const contentType of contentTypes) {
      const patterns = platformPatterns[platform][contentType];
      const patternArray = Array.isArray(patterns) ? patterns : [patterns];

      if (patternArray.some((regex) => regex.test(sanitizedInput))) {
        return {
          valid: true,
          platform,
          contentType,
          sanitized: sanitizedInput,
        };
      }
    }
  }

  // Fallback check for generic URL pattern
  if (platformPatterns.generic.url.test(sanitizedInput)) {
    return {
      valid: true,
      platform: "generic",
      contentType: "url",
      sanitized: sanitizedInput,
    };
  }

  return {
    valid: false,
    platform: "unknown",
    contentType: "invalid",
    sanitized: null,
  };
};

const askQuestion = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

const getInput = async () => {
  while (true) {
    const input = await askQuestion(
      "\n📥 Enter content source (URL or keyword):\n" +
        "Examples:\n" +
        "- TikTok Profile: https://www.tiktok.com/@username\n" +
        "- TikTok Video: https://www.tiktok.com/@user/video/123456\n" +
        "- YouTube Video: https://youtube.com/watch?v=ABC123\n" +
        "- Instagram Post: https://www.instagram.com/p/XYZ789/\n" +
        "- Keyword: trending tech news\n\n> "
    );

    const validation = validateInput(input);
    if (validation.valid) {
      return { raw: input, ...validation };
    }

    console.log("\n❌ Invalid input. Please provide a valid URL or keyword.");
  }
};

const getLimit = async () => {
  while (true) {
    const input = await askQuestion(
      "\n🔢 Enter the number of videos to scrape: "
    );
    const parsedLimit = parseInt(input, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      return parsedLimit;
    }

    console.log(
      "\n⚠️ Invalid input. Please enter a valid number greater than 0."
    );
  }
};

module.exports = {
  getInput,
  getLimit,
  validateInput,
};
