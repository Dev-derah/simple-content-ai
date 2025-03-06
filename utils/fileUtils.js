const fs = require("fs").promises;
const path = require("path");

module.exports = {
  ensureDir: async (dirPath) => {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new Error(`Directory creation failed: ${error.message}`);
    }
  },

  saveJSON: async (filePath, data) => {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      throw new Error(`File save failed: ${error.message}`);
    }
  },
};
