module.exports = {
  retryAsync: async (fn, retries = 3, delayMs = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
      }
    }
  },
};
