const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

module.exports = {
  HF_API_KEY: process.env.HF_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  DOWNLOAD_PATH: path.join(process.cwd(), "downloads"),
  getScraperConfig: () => ({
    headless: process.env.HEADLESS === true || true,
    rateLimit: parseInt(process.env.RATE_LIMIT) || 100,
    // Platform-specific configs
  }),
  PLATFORMS: ["linkedin", "twitter", "tiktok", "youtube"],
};
