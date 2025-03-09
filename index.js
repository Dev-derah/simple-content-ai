const getScraper = require("./src/scrapers/scraperFactory");
const ContentRepurposer = require("./src/workflows/contentRepurposer");
const { getInput, getLimit } = require("./utils/inputUtils");

async function main() {
  try {
    // Get user input
    const input = await getInput();
    const { sanitized, platform, contentType } = input;
    console.log(input)
    // Get user-defined video limit
    const scraper = getScraper(platform);
    if (!scraper) {
      console.error(`❌ No scraper available for platform: ${platform}`);
      return;
    }

    // Determine if we need a limit (only for profiles or keyword searches)
    let limit = null;
    if (contentType === "profile" || contentType === "keyword") {
      limit = await getLimit();
    }
    // Initialize services

    const repurposer = new ContentRepurposer();

    // Scrape content based on input
    const videos = await scraper.scrape(input, limit);

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
