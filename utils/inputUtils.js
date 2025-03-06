const readline = require("readline");

const platformPatterns = {
  tiktok: {
    profile: /^https:\/\/www\.tiktok\.com\/@[^/]+\/?$/i,
    video: /^https:\/\/www\.tiktok\.com\/@.+\/video\/\d+/i,
    keyword: /^[^<>%\$]{3,50}$/i,
  },
  youtube: {
    channel: /^https:\/\/www\.youtube\.com\/@[^/]+/i,
    video: /^(https:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/i,
    keyword: /^[^<>%\$]{3,50}$/i,
  },
  instagram: {
    profile: /^https:\/\/www\.instagram\.com\/[^/]+\/?$/i,
    post: /^https:\/\/www\.instagram\.com\/p\/[\w-]+\/?/i,
    reel: /^https:\/\/www\.instagram\.com\/reels?\/[\w-]+\/?/i,
  },
  twitter: {
    profile: /^https:\/\/twitter\.com\/[^/]+\/?$/i,
    tweet: /^https:\/\/twitter\.com\/[^/]+\/status\/\d+/i,
  },
  generic: {
    keyword: /^[\w\s-]{3,50}$/i,
  },
};

const validateInput = (input) => {
  const sanitizedInput = input.trim();

  for (const [platform, patterns] of Object.entries(platformPatterns)) {
    for (const [contentType, regex] of Object.entries(patterns)) {
      if (regex.test(sanitizedInput)) {
        return {
          valid: true,
          platform,
          contentType,
          sanitized: sanitizedInput,
        };
      }
    }
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
