const express = require("express");
const router = express.Router();
const { processContentRequest } = require("../controllers/contentController");
const { validateContentRequest } = require("../middleware/validators");

// Process content from various sources
router.post("/process", validateContentRequest, processContentRequest);

// POST /api/v1/content
router.post("/", processContentRequest);

module.exports = router;
