const validateContentRequest = (req, res, next) => {
  const { url, text, keyword, platform } = req.body;

  // Check if at least one content source is provided
  if (!url && !text && !keyword) {
    return res.status(400).json({
      error: 'Must provide either url, text, or keyword'
    });
  }

  // Validate platform
  if (!platform) {
    return res.status(400).json({
      error: 'Platform must be specified'
    });
  }

  next();
};

module.exports = {
  validateContentRequest
}; 