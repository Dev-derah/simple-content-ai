const BaseScraper = require("./baseScraper");
const ytdl = require("youtube-dl-exec");
const { YoutubeTranscript } = require("youtube-transcript");
const { downloadAndProcessMedia } = require("../../utils/mediaUtils");
const fs = require("fs").promises;
const path = require("path");

class YouTubeScraper extends BaseScraper {
  constructor() {
    super("youtube");
  }

  async scrape(input) {
    try {
      if (!input || !input.sanitized) {
        throw new Error("Invalid input: Missing sanitized URL.");
      }

      const videoUrl = input.sanitized;
      const videoId = this.extractVideoId(videoUrl);
      if (!videoId) {
        throw new Error("Invalid YouTube URL");
      }

      await this.createFolderStructure();
      console.log("📄 Fetching metadata...");

      const metadata = await this.getMetadata(videoUrl);
      if (!metadata) {
        throw new Error("Failed to fetch metadata.");
      }

      // Save metadata
      await fs.writeFile(
        path.join(this.instanceFolder, "metadata", `${videoId}.json`),
        JSON.stringify(metadata, null, 2)
      );

      console.log("🎙️ Fetching transcript...");
      let transcript;
      try {
        const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
        transcript = transcriptData.map((item) => item.text).join(" ");
      } catch (error) {
        console.log("No transcript available, will extract from audio.");
      }

      console.log("🎞️ Downloading and processing video...");
      const media = await downloadAndProcessMedia(
        this.instanceFolder,
        videoUrl,
        videoId
      );

      return [
        {
          ...metadata,
          videoId,
          transcript: transcript || media.transcript,
          videoPath: media.videoPath,
          audioPath: media.audioPath,
        },
      ];
    } catch (error) {
      console.error("Error scraping YouTube video:", error);
      return [
        {
          error: error.message,
          url: input.sanitized,
        },
      ];
    }
  }

  async getMetadata(videoUrl) {
    try {
      const options = {
        dumpJson: true,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        youtubeSkipDashManifest: true,
      };

      const info = await ytdl(videoUrl, options);

      return {
        title: info.title || "Untitled",
        description: info.description || "",
        keywords: info.tags || [],
        channel: info.uploader || "Unknown",
        uploadDate: info.upload_date || "",
        views: info.view_count || 0,
        duration: info.duration || 0,
        videoId: info.id || this.extractVideoId(videoUrl),
        url: videoUrl,
      };
    } catch (error) {
      console.error("❌ Error fetching metadata:", error.message);
      return null;
    }
  }

  extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/,
      /(?:youtube\.com\/shorts\/)([\w-]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }
}

module.exports = YouTubeScraper;
