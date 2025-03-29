const { chromium } = require("playwright-extra");
const config = require("../../config");
const { humanScroll, randomMouseMove } = require("../../utils/browserUtils");
const { retryAsync } = require("../../utils/retryHandler");
const fs = require("fs").promises;
const path = require("path");

class BaseScraper {
  constructor(platform) {
    if (new.target === BaseScraper) {
      throw new Error("Cannot instantiate abstract class");
    }
    this.platform = platform;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.instanceFolder = this.createInstanceFolder();
  }

  async initialize() {
    const { headless } = config.getScraperConfig();
    this.browser = await chromium.launch({
      headless: true, // Force headless in production
      channel: "chromium", // Explicitly specify Chromium
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  createInstanceFolder() {
    return path.join(config.DOWNLOAD_PATH, `${this.platform}_${Date.now()}`);
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

  async navigateToUrl(url) {
    await retryAsync(async () => {
      await this.page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await this.page.waitForTimeout(300);
    }, 3);
  }

  async extractMetadata(page, selectors) {
    await page.waitForLoadState("domcontentloaded");

    return page.evaluate((selectors) => {
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : "N/A";
      };

      return {
        url: window.location.href,
        caption: getText(selectors.CAPTION),
        likes: getText(selectors.LIKES),
        comments: getText(selectors.COMMENTS),
        shares: getText(selectors.SHARES),
        views: getText(selectors.VIEWS),
        uploader: getText(selectors.UPLOADER),
        hashtags: Array.from(document.querySelectorAll(selectors.HASHTAGS)).map(
          (a) => a.textContent.trim()
        ),
        uploadDate: new Date().toISOString(),
      };
    }, selectors);
  }

  async close() {
    if (this.browser) await this.browser.close();
  }

  async scrape() {
    throw new Error("Method not implemented");
  }
}

module.exports = BaseScraper;
