const getScraper = require("./src/scrapers/scraperFactory");
const ContentRepurposer = require("./src/workflows/contentRepurposer");
const { getInput, getLimit } = require("./utils/inputUtils");
const config = require("./config/index");

async function main() {
  try {
    // Get user input
    const input = await getInput();
    const { platform, contentType } = input;

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
      console.log("video is ===>", video);
      try {
        // Ensure we have the required content for repurposing
        if (!video.transcript && !video.text && !video.caption) {
          console.warn(`⚠️ Skipping video ${video.url} - No content available`);
          continue;
        }

        const result = await repurposer.processContent(
          {
            text: video.transcript || video.caption,
            transcription: video.transcript,
            platform: platform,
            url: video.url,
            hashtags: video.hashtags,
            uploadDate: video.uploadDate,
          },
          {
            // Add options as second parameter
            platforms: getValidPlatforms(video.platform),
            customPrompt: "",
          }
        );

        function getValidPlatforms(sourcePlatform) {
          const isValid = Object.values(config.PLATFORMS).some(
            (p) => p.key === sourcePlatform
          );

          return isValid
            ? [sourcePlatform]
            : Object.values(config.PLATFORMS).map((p) => p.key);
        }

        console.log(`\n✅ Generated content for ${video.url}:`);
        console.log(result);
        return result;
      } catch (error) {
        console.error(`🚨 Error processing ${video.url}:`, error.message);
      }
    }
  } catch (error) {
    console.error("\n🚨 Main process error:", error.message);
  }
}

main();
