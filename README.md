# **Simple Content AI**  

📢 **Automatically scrape and repurpose content from social media platforms with AI-driven optimization.**  

## **📝 Overview**  
**Simple Content AI** is a Node.js-powered tool that scrapes videos from platforms like **TikTok, YouTube, Instagram, and Twitter** and transforms them into platform-optimized content. Users can input URLs or keywords, define a scraping limit, and generate repurposed content automatically.  

### 🔹 **Key Features:**  
✅ **Multi-Platform Support** – Scrapes TikTok, YouTube, Instagram, and Twitter content.  
✅ **Automated AI Repurposing** – Generates optimized captions, scripts, and post formats.  
✅ **Custom Scraping Configuration** – Easily configure scraping settings via an `.env` file.  
✅ **Modular and Scalable Design** – Extend functionality with additional scrapers or AI processing.  

---

## **🛠 Project Structure**  
```
/simple-content-ai
│── .env                             # Environment variables
│── config.js                        # Configuration settings
│── index.js                         # Main script entry point
│── /src
│   │── /scrapers
│   │   │── scraperFactory.js        # Initializes the correct scraper
│   │   │── tiktokScraper.js         # TikTok scraper logic
│   │   │── youtubeScraper.js        # YouTube scraper logic
│   │   │── instagramScraper.js      # Instagram scraper logic
│   │   │── twitterScraper.js        # Twitter scraper logic
│   │── /workflows
│   │   └── contentRepurposer.js     # Processes scraped content for repurposing
│   │── /utils
│   │   │── inputUtils.js            # Handles user input
│   │   └── fileUtils.js             # File handling utilities
└── package.json                     # Dependencies and scripts
```

---

## **🚀 Installation & Setup**  
### **1️⃣ Prerequisites**  
Ensure you have the following installed:  
- [Node.js](https://nodejs.org/) (v16+ recommended)  
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)  

### **2️⃣ Clone the Repository**  
```bash
git clone https://github.com/your-username/simple-content-ai.git
cd simple-content-ai
```

### **3️⃣ Install Dependencies**  
```bash
npm install
# or
yarn install
```

---

## **🔑 Environment Variables (.env)**  
Before running the script, create a `.env` file in the project root and add the following variables:

```
HF_API_KEY=your_api_key_here  # API key for external AI services
HEADLESS=false                # Whether to run browser scrapers in headless mode
DOWNLOAD_PATH=./downloads     # Path to store downloaded content
RATE_LIMIT_MS=10              # Rate limit between requests in milliseconds
```

### **Configuration File (`config.js`)**  
The script loads these environment variables via `config.js`:
```javascript
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

module.exports = {
  HF_API_KEY: process.env.HF_API_KEY,
  DOWNLOAD_PATH: path.join(process.cwd(), "downloads"),
  getScraperConfig: () => ({
    headless: process.env.HEADLESS === "true",  // Ensures correct boolean parsing
    rateLimit: parseInt(process.env.RATE_LIMIT_MS) || 100,
  }),
};
```
You can modify these settings in the `.env` file without changing the source code.

---

## **🛠 How to Use**  
### **Run the Script**  
```bash
node index.js
```

### **User Input Flow**  
1. Enter a **URL or keyword** (TikTok, YouTube, Instagram, Twitter).  
2. Specify the number of videos to scrape.  
3. The scraper fetches videos, and **Simple Content AI** repurposes them.  

### **Example Input**  
```
📥 Enter content source (URL or keyword):  
> https://www.tiktok.com/@example/video/123456789  

🎯 Enter the number of videos to scrape:  
> 5  
```

### **Example Output**  
```
✅ Scraped 5 videos from TikTok  
✅ Repurposed content for https://www.tiktok.com/@example/video/123456789  
📄 Generated caption: "🚀 5 Productivity Hacks You Need to Try Today! #motivation #success"
```

---

## **📌 Configuration**  
Modify the **`config.js`** file to adjust settings dynamically. Example:
```javascript
module.exports = {
  defaultLimit: 10,
  platforms: ["tiktok", "youtube", "instagram", "twitter"],
};
```

---

## **🛠 Future Improvements**  
🚀 **Add support for more platforms** (Facebook, LinkedIn, Reddit, etc.).  
📊 **Improve content repurposing AI** (Use GPT models for better output).  
📅 **Automated scheduling** (Post directly to social media).  

---

## **🤝 Contributing**  
Want to improve Simple Content AI?  
- Fork the repository  
- Create a new branch  
- Submit a pull request  

---

## **📝 License**  
This project is licensed under the **MIT License**.  

---

## **🙌 Acknowledgments**  
Built by **Chidera** 🚀  

---

