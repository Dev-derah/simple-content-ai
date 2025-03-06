const { chromium } = require("playwright-extra");
const config = require("../../config");
const {
  humanScroll,
  randomMouseMove,
} = require("../../utils/browserUtils");

class BaseScraper {
  constructor(platform) {
    if (new.target === BaseScraper) {
      throw new Error("Cannot instantiate abstract class");
    }
    this.platform = platform;
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    const {headless} = config.getScraperConfig();
    this.browser = await chromium.launch({ headless });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
    await this.page.addInitScript(() => {
      delete navigator.webdriver;
    });
  }

  async close() {
    if (this.browser) await this.browser.close();
  }

  async scrape(query, limit) {
    throw new Error("Method not implemented");
  }
}

module.exports = BaseScraper;
