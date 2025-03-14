const getScraper = require("../../scrapers/scraperFactory");
const ContentRepurposer = require("../../workflows/contentRepurposer");
const { validateInput } = require("../../../utils/inputUtils");

const cleanFormatting = (content) => {
  if (typeof content === "string") {
    return content
      .replace(/\\n/g, "\n") // Replace literal \n with actual line breaks
      .replace(/\\/g, "") // Remove remaining backslashes
      .replace(/\n+/g, "\n") // Replace multiple line breaks with single ones
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim(); // Remove leading/trailing whitespace
  }

  if (typeof content === "object" && content !== null) {
    if (Array.isArray(content)) {
      return content.map((item) => cleanFormatting(item));
    }

    const cleaned = {};
    for (const [key, value] of Object.entries(content)) {
      cleaned[key] = cleanFormatting(value);
    }
    return cleaned;
  }

  return content;
};

const processContentRequest = async (req, res) => {
  try {
    const { url, contentType, platform, options } = req.body;

    // Initialize services
    const repurposer = new ContentRepurposer();

    let content;
    if (url) {
      // Handle URL-based content
      const validation = validateInput(url);
      if (!validation.valid) {
        return res.status(400).json({
          error: "Invalid URL format",
        });
      }

      const input = {
        contentType: contentType || "video",
        sanitized: validation.sanitized,
        query: url,
      };

      const scraper = getScraper(platform);
      if (!scraper) {
        return res.status(400).json({
          error: `Platform ${platform} not supported`,
        });
      }

      const videos = await scraper.scrape(input);
      content = await processVideos(videos, repurposer);
    } else if (req.body.text) {
      // Handle direct text input
      content = await repurposer.processContent({
        text: req.body.text,
        platform: platform,
      });
    } else {
      return res.status(400).json({
        error: "Invalid request: Must provide either URL or text content",
      });
    }

    // Clean the content before sending response
    const cleanedContent = cleanFormatting(content);

    res.json({
      success: true,
      data: cleanedContent,
    });
  } catch (error) {
    console.error("Content processing error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

async function processVideos(videos, repurposer) {
  const results = [];

  for (const video of videos) {
    try {
      if (!video.transcript && !video.text && !video.caption) {
        console.warn(`⚠️ Skipping video ${video.url} - No content available`);
        continue;
      }

      const result = await repurposer.processContent({
        text: video.transcript || video.caption,
        transcription: video.transcript,
        platform: video.platform,
        url: video.url,
        hashtags: video.hashtags,
        uploadDate: video.uploadDate,
      });

      results.push(result);
    } catch (error) {
      console.error(`🚨 Error processing ${video.url}:`, error.message);
    }
  }

  return results;
}

module.exports = {
  processContentRequest,
};
