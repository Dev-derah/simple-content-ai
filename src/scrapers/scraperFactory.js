const config = require("../../config/index"); 
const TikTokScraper = require("./tiktokScraper");
const YouTubeScraper = require("./youTubeScraper")


const scrapers = {
  tiktok: () => new TikTokScraper(),
  youtube: () => new YouTubeScraper(),
  // Add other platform scrapers when implemented
};


module.exports = (platform) => {
  if (!config.PLATFORMS.includes(platform)) {
    console.warn(
      `Warning: Platform "${platform}" is not defined in config.PLATFORMS`
    );
    return null;
  }
  return scrapers[platform] ? scrapers[platform]() : null;
};
