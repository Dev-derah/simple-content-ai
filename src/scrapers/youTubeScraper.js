const ytdl = require("youtube-dl-exec");
const { getTranscript } = require("youtube-transcript");
const VideoDownloader = require("../media-processing/video-processing/videoDownloader");
const ProcessAudio = require("../media-processing/audio-processing/processAudio");
const config = require("../../config");
const fs = require("fs").promises;
const path = require("path");

class YouTubeScraper {
  constructor() {
    this.instanceFolder = path.join(
      config.DOWNLOAD_PATH,
      `youtube_${Date.now()}`
    );
  }

  extractVideoId(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    return match ? match[1] : null;
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

      if (!info) {
        throw new Error("No metadata received from youtube-dl");
      }

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
      // Attempt fallback with different options if first attempt fails
      try {
        const fallbackOptions = {
          dumpSingleJson: true,
          noWarnings: true,
          noCallHome: true,
          format: "best",
        };

        const info = await ytdl(videoUrl, fallbackOptions);

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
      } catch (fallbackError) {
        console.error(
          "❌ Fallback metadata fetch failed:",
          fallbackError.message
        );
        return null;
      }
    }
  }

  async getTranscript(videoUrl) {
    try {
      const transcript = await getTranscript(videoUrl);
      return transcript.map((entry) => entry.text).join(" ");
    } catch (error) {
      console.warn("⚠️ Transcript not available...");
      return null;
    }
  }

  async createFolderStructure() {
    await fs.mkdir(path.join(this.instanceFolder, "videos"), {
      recursive: true,
    });
    await fs.mkdir(path.join(this.instanceFolder, "audio"), {
      recursive: true,
    });
    await fs.mkdir(path.join(this.instanceFolder, "metadata"), {
      recursive: true,
    });
  }

  async downloadAndTranscribe(videoUrl, videoId) {
    try {
      await this.createFolderStructure();

      const videoDownloader = new VideoDownloader(
        path.join(this.instanceFolder, "videos"),
        videoId
      );
      const videoPath = await videoDownloader.downloadVideo(videoUrl, videoId);

      console.log("🎞️ Video downloaded, extracting audio...");
      const { transcript, audioPath } = await ProcessAudio(
        videoPath,
        path.join(this.instanceFolder, "audio")
      );
      return transcript;
    } catch (error) {
      console.error("❌ Failed to transcribe from audio:", error);
      return null;
    }
  }

  // async scrape(input) {
  //   if (!input || !input.sanitized) {
  //     console.error(input);
  //     throw new Error("Invalid input: Missing sanitized URL.");
  //   }

  //   const videoUrl = input.sanitized;
  //   const videoId = this.extractVideoId(videoUrl);
  //   if (!videoId) {
  //     throw new Error("Failed to extract video ID from URL.");
  //   }

  //   await this.createFolderStructure();

  //   const metadata = await this.getMetadata(videoUrl);
  //   if (!metadata) return { error: "Failed to fetch metadata." };

  //   // Save metadata
  //   await fs.writeFile(
  //     path.join(this.instanceFolder, "metadata", `${videoId}.json`),
  //     JSON.stringify(metadata, null, 2)
  //   );

  //   let transcript = await this.getTranscript(videoUrl);

  //   // Limit: If video is more than 5 minutes & has no transcript, don't download
  //   if (!transcript && metadata.duration > 300) {
  //     console.log("⏳ Skipping video download (too long & no transcript).");
  //     return { ...metadata, transcript: "N/A (Skipped due to duration limit)" };
  //   }

  //   // Proceed with download if needed
  //   if (!transcript) {
  //     transcript = await this.downloadAndTranscribe(videoUrl, videoId);
  //   }

  //   return { ...metadata, transcript };
  // }

  async scrape(input) {
    if (!input || !input.sanitized) {
      console.error(input);
      throw new Error("Invalid input: Missing sanitized URL.");
    }

    const videoUrl = input.sanitized;
    const videoId = this.extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error("Failed to extract video ID from URL.");
    }

    await this.createFolderStructure();

    const videos = []; // Initialize an empty array

    const metadata = await this.getMetadata(videoUrl);
    if (!metadata) {
      videos.push({ error: "Failed to fetch metadata." });
      return videos;
    }

    // Save metadata
    await fs.writeFile(
      path.join(this.instanceFolder, "metadata", `${videoId}.json`),
      JSON.stringify(metadata, null, 2)
    );

    let transcript = await this.getTranscript(videoUrl);

    // Limit: If video is more than 5 minutes & has no transcript, don't download
    if (!transcript && metadata.duration > 300) {
      console.log("⏳ Skipping video download (too long & no transcript).");
      videos.push({
        ...metadata,
        transcript: "N/A (Skipped due to duration limit)",
      });
      return videos;
    }

    // Proceed with download if needed
    if (!transcript) {
      transcript = await this.downloadAndTranscribe(videoUrl, videoId);
    }

    videos.push({ ...metadata, transcript });

    return videos; // Return the array
  }
}

module.exports = YouTubeScraper;
