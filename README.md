# **Simple Content AI**

📢 **Automatically scrape and repurpose content from social media platforms with AI-driven optimization.**

## **📝 Overview**

**Simple Content AI** is a Node.js + Docker-powered tool that scrapes videos from platforms like **YouTube, TikTok, Instagram, and Twitter**, then repurposes them into platform-optimized content using AI.

---

## **🔥 New Features**

✅ **Rotating Proxy Support** – Use a `proxies.txt` file to avoid rate limits and bans  
✅ **YouTube Cookie File Support** – Use `YouTube_cookies.txt` for authenticated scraping  
✅ **Dockerized for Easy Deployment**  
✅ **AI Transcription & Repurposing** with Gemini models  
✅ **Regenerate specific platform content with custom prompts**

---

## **📁 Project Structure**

```
/simple-content-ai
│── .env
│── proxies.txt                         # List of proxies for rotation
│── youTube_cookies.txt                 # YouTube cookie file for authenticated access
│── Dockerfile
│── package.json
│── /config
│   └── /index.js
│── /src
│   └── /scrapers
│   └── /content
│   └── /api
│   └── /utils
│   └── /services
│   └── /workflows
│   └── index.js
└── script.js
└── README.md
```

---

## **⚙️ Environment Variables (.env)**

Create a `.env` file with the following:

```
HEADLESS=true
DOWNLOAD_PATH=./downloads
GEMINI_API_KEY=your_gemini_api_key
YOUTUBE_API_KEY=your_youtube_api_key
NODE_ENV=production
FFMPEG_PATH=/usr/bin/ffmpeg
```

---

## **🧱 Required Files**

Place these files in your project root:

- `proxies.txt` – List of proxies, one per line (e.g., `http://user:pass@ip:port`)
- `YouTube_cookies.txt` – Exported cookies file from your browser for YouTube

---

## **🐳 Docker Setup**

**Dockerfile Overview** (already present):

```Dockerfile
FROM mcr.microsoft.com/playwright:v1.38.1-jammy

RUN apt-get update && \
    apt-get install -y ffmpeg libx264-dev libx265-dev libvpx-dev libopus-dev libgconf-2-4 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production --no-optional

RUN npx playwright install --with-deps

RUN mkdir -p /etc/secrets && chmod 755 /etc/secrets

COPY . .

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NODE_ENV=production
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV YOUTUBE_COOKIES_FILE=/etc/secrets/youtube_cookies.txt

EXPOSE 3000
CMD ["npm", "start"]
```

---

## **🚀 Run with Docker**

```bash
docker build -t simple-content-ai .
docker run --env-file .env -v $(pwd)/YouTube_cookies.txt:/etc/secrets/youtube_cookies.txt -p 3000:3000 simple-content-ai
```

---

## **🌐 API Usage**

**Base URL**: `http://localhost:3000/api/v1/content`

### ▶️ Repurpose Content from URL

```json
POST /api/v1/content

{
  "url": "https://www.youtube.com/watch?v=Y9kg_YS-M9k",
  "platform": "youtube",
  "contentType": "video",
  "options": {
    "limit": 1
  }
}
```

### 🧪 Example Response

Here’s a sample response you can expect when repurposing content:

```json
{
  "success": true,
  "repurposedContent": [
    {
      "source": "https://youtu.be/Y9kg_YS-M9k",
      "repurposedContent": {
        "metadata": {
          "source": {
            "originalUrl": "https://youtu.be/Y9kg_YS-M9k",
            "platform": "YouTube",
            "scrapedAt": "2023-05-11T13:30:08Z"
          },
          "contentMetadata": {
            "language": "en",
            "contentType": "text",
            "length": 1175,
            "hashtags": []
          }
        },
        "content": {
          "linkedin": "Tired of feeling stuck? Discipline is the key to unlocking your full potential. Imagine achieving your biggest goals, not by luck, but by consistently choosing the hard road. Discipline isn't just about waking up early; it's the foundation of making smart decisions, building healthy habits, and conquering your fears. It's about making steady progress towards a stronger, healthier, and happier you. Cultivating discipline can transform every aspect of your life, from your career to your relationships. It empowers you to take control and create the life you desire. What's one area of your life where you want to apply more discipline? #discipline #selfimprovement #motivation",
          "twitter": "Discipline isn't about restriction; it's about empowerment. It's the daily choices that build your strongest self. #discipline",
          "tiktok": {
            "caption": "🔥Unlock your POWER!🔥 Discipline isn't just waking up early. It's the SECRET SAUCE to conquering your fears and achieving your DREAMS! 🚀 #discipline #motivation #selfimprovement #growthmindset #success",
            "script": "🎬 HOOK: Stop scrolling! This is your sign to level up. BODY: Discipline is the KEY to unlocking your full potential. It's about making those tough choices, even when you don't want to. Conquer your fears and build the life you deserve! 💪 CALL TO ACTION: Double tap if you're ready to embrace discipline! 👇"
          },
          "youtube": "Hey everyone, and welcome back to the channel! Today, we're diving deep into the power of discipline and how it can transform your life. Discipline is often misunderstood. It's not about punishment or restriction. It's about building the strength to make consistent, positive choices that align with your goals. It's about choosing long-term growth over instant gratification. Think of it as your inner compass, guiding you towards your best self. From waking up early to making healthy food choices, to sticking to your workout routine – discipline is the foundation of success in every area of life. It allows you to push past your comfort zone, face your fears, and achieve what you never thought possible. So, what are your thoughts on discipline? Share your strategies in the comments below! Don't forget to like and subscribe for more videos on personal development and achieving your full potential."
        }
      }
    }
  ],
  "processedPlatforms": "all",
  "customPromptUsed": false
}
```


### ✍️ Regenerate for Specific Platform with Prompt

```json
GET /api/v1/content/regenerate

{
  "text": "CREATE CONTECT LIKE THIS BECAUSE TAILWIND NO LONGER NEEDS A CONFIG FILE...",
  "options": {
    "platforms": ["twitter"],
    "customPrompt": "Make this more formal and add emoji's"
  }
}
```
### 🎯 Example Response (Regenerated Content for Specific Platform)

```json
{
  "success": true,
  "repurposedContent": {
    "metadata": {
      "source": {
        "type": "user-provided",
        "receivedAt": "2025-04-07T17:00:31.493Z"
      },
      "contentMetadata": {
        "language": "en",
        "contentType": "text",
        "length": 285,
        "hashtags": []
      }
    },
    "content": {
      "twitter": "🤯 Tailwind CSS just dropped a bombshell! No more config files! 😱 All customizations go directly into your CSS. One dev somewhere is having an existential crisis right now. 😂 #TailwindCSS"
    }
  },
  "processedPlatforms": [
    "twitter"
  ],
  "customPromptUsed": true
}
```
---

## ✅ Best Practices

- Add multiple **rotating proxies** in `proxies.txt` to avoid bans
- Use **YouTube cookies** for content requiring login
- Use the `.env` file to adjust scraper behavior without editing code
- Transcriptions are saved and reused to reduce processing cost


---

## **🛠 Future Improvements**  
🚀 **Add support for more platforms** (Facebook, LinkedIn, Reddit, etc.).  
📊 **Improve content repurposing AI**.  
📅 **Automated scheduling** (Post directly to social media).  

---

## **📝 License**  
This project is licensed under the **MIT License**.  

---

## **🙌 Acknowledgments**  
Built by **derah** 🚀  

---

