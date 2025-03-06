const TikTokScraper = require("./tiktokScraper");

const scrapers = {
  tiktok: () => new TikTokScraper(),
  // Add more platforms as needed
};

module.exports = (platform) => {
  return scrapers[platform] ? scrapers[platform]() : null;
};
