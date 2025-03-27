const config = require("../../config/index");
const TikTokScraper = require("./tiktokScraper");
const YouTubeScraper = require("./youTubeScraper");

// Map platform keys to scrapers
const SCRAPER_MAP = {
  [config.PLATFORMS.tiktok.key]: TikTokScraper,
  [config.PLATFORMS.youtube.key]: YouTubeScraper,
};

module.exports = (platformKey) => {
  // Validate platform exists in config
  const platformConfig = Object.values(config.PLATFORMS).find(
    (p) => p.key === platformKey
  );

  if (!platformConfig) {
    console.warn(`Platform "${platformKey}" not configured`);
    return null;
  }

  // Get appropriate scraper
  const ScraperClass = SCRAPER_MAP[platformKey];
  return ScraperClass ? new ScraperClass() : null;
};
