const getScrapper = require("./src/scrapers/scraperFactory");
const ContentRepurposer = require("./src/workflows/contentRepurposer");
const { getInput, getLimit } = require("./utils/inputUtils");

async function main() {
  try {
    // Get user input
    const input = await getInput();
    const { sanitized, platform } = input;

    // Get user-defined video limit
    const limit = await getLimit();
    const scraper = getScrapper(platform);
    if (!scraper) {
      console.error(`❌ No scraper available for platform: ${platform}`);
      return;
    }
    // Initialize services

    const repurposer = new ContentRepurposer();

    // Scrape content based on input
    const videos = await scraper.scrape(sanitized, limit);

    // Process videos
    for (const video of videos) {
      const result = await repurposer.processVideo({
        ...video,
        platform, // Pass platform info to processor
      });
      // console.log(`\n✅ Generated content for ${video.url}:`);
      // console.log(result.content);
    }
  } catch (error) {
    console.error("\n🚨 Main process error:", error.message);
  }
}

main();
