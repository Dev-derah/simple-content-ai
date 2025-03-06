module.exports = {
  humanScroll: async (page, scrollCount = 2) => {
    for (let i = 0; i < scrollCount; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight * Math.random());
      });
      await page.waitForTimeout(1000 + Math.random() * 1000);
    }
  },

  randomMouseMove: async (page) => {
    const viewport = page.viewportSize();
    for (let i = 0; i < 5; i++) {
      await page.mouse.move(
        Math.random() * viewport.width,
        Math.random() * viewport.height
      );
      await page.waitForTimeout(500 + Math.random() * 500);
    }
  },
};
