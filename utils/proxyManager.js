const fs = require("fs");
const path = require("path");

class ProxyManager {
  constructor(proxyFilePath) {
    this.proxyFilePath = proxyFilePath;
    this.proxies = [];
    this.index = 0;
    this._loadProxies();
  }

  _loadProxies() {
    try {
      const raw = fs.readFileSync(this.proxyFilePath, "utf8");
      const lines = raw
        .split("\n")
        .map((line) => line.trim())
        .filter(
          (line) => line && !line.startsWith("#") && !line.startsWith("proxy")
        ); // skip empty lines & headers

      if (lines.length === 0) throw new Error("No valid proxies found");
      this.proxies = lines;
    } catch (err) {
      console.error("Failed to load proxy list:", err.message);
    }
  }

  getRandomProxy() {
    if (!this.proxies.length) return null;
    const randomIndex = Math.floor(Math.random() * this.proxies.length);
    return this.proxies[randomIndex];
  }

  getNextProxy() {
    if (!this.proxies.length) return null;
    const proxy = this.proxies[this.index];
    this.index = (this.index + 1) % this.proxies.length;
    return proxy;
  }
}

module.exports = ProxyManager;
