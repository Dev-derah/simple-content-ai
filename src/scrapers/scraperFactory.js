const config = require("../../config/index"); 
const TikTokScraper = require("./tiktokScraper");


const scrapers = {
  tiktok: () => new TikTokScraper(),
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
