const getScraper = require("../../scrapers/scraperFactory");
const ContentRepurposer = require("../../workflows/contentRepurposer");
const { validateInput } = require("../../../utils/inputUtils");

const cleanFormatting = (content) => {
  if (typeof content === "string") {
    return content
      .replace(/\\n/g, "\n")
      .replace(/\\/g, "")
      .replace(/\n+/g, "\n")
      .replace(/\s+/g, " ")
      .trim();
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
    const { url, platform, contentType, options = {} } = req.body;
    console.log(req.body)
    const { platforms: targetPlatforms, customPrompt, limit } = options;

    // Initialize services
    const repurposer = new ContentRepurposer();

    let content;
    if (url) {
      // URL processing
      const validation = validateInput(url);
      if (!validation.valid) {
        return res.status(400).json({ error: "Invalid URL format" });
      }

      const scraper = getScraper(platform);
      if (!scraper) {
        return res.status(400).json({ error: "Source platform not supported" });
      }

      const input = {
        contentType: contentType || "video",
        sanitized: validation.sanitized,
        query: url,
      };

      const videos = await scraper.scrape(input, limit);
      content = await processVideos(
        videos,
        repurposer,
        targetPlatforms,
        options
      );
    } else if (req.body.text) {
      // Direct text processing
      content = await repurposer.processContent(
        {
          text: req.body.text,
          platform: platform || "generic",
          language: options.language || "en",
          url: req.body.url,
        },
        {
          platforms: targetPlatforms,
          customPrompt,
        }
      );
    } else {
      return res.status(400).json({
        error: "Must provide either URL or text content",
      });
    }

    const cleanedContent = cleanFormatting(content);

    res.json({
      success: true,
      data: cleanedContent,
      processedPlatforms: targetPlatforms || "all",
      customPromptUsed: !!customPrompt,
    });
  } catch (error) {
    console.error("Content processing error:", error);
    res.status(500).json({
      error: error.message,
      details: error.stack.split("\n")[1].trim(),
    });
  }
};

async function processVideos(videos, repurposer, targetPlatforms, options) {
  const results = [];

  for (const video of videos) {
    try {
      if (!video.transcript && !video.text && !video.caption) {
        console.warn(`Skipping video ${video.url} - No content`);
        continue;
      }

      const result = await repurposer.processContent(
        {
          text: video.transcript || video.caption,
          transcription: video.transcript,
          platform: video.platform,
          url: video.url,
          hashtags: video.hashtags,
          uploadDate: video.uploadDate,
        },
        {
          platforms: targetPlatforms, // Now using target platforms from options
          customPrompt: options.customPrompt,
          contentType: options.contentType,
        }
      );

      results.push({
        source: video.url,
        sourcePlatform: video.platform,
        repurposedContent: result,
      });
    } catch (error) {
      console.error(`Error processing ${video.url}:`, error.message);
      results.push({
        error: error.message,
        source: video.url,
        sourcePlatform: video.platform,
      });
    }
  }

  return results;
}

module.exports = {
  processContentRequest,
};