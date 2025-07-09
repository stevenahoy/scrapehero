# scrapehero
With HeadlineAPI, you extract what readers care about: the headline and the story — not the ads, popups, or chaos. Designed for developers building tools, feeds, summaries, or AI apps. Simple. Clean. Fast.

# ScrapeHero

## 📦 Setup

1. Deploy backend:
   - Fork this repo
   - Push to Netlify
   - Make sure `netlify/functions/scrape.js` works (check via browser `/functions/scrape?url=https://example.com`)

2. Setup Chrome Extension:
   - Go to `chrome://extensions`
   - Enable Developer Mode
   - Click "Load Unpacked"
   - Select `extension` folder

3. Use:
   - Open any webpage
   - Click on ScrapeHero icon
   - Click "Scrape This Page"
   - Text will appear in popup

## 🛠 Free vs Pro

| Feature | Free | Pro |
|--------|------|-----|
| Scrape page | ✅ | ✅ |
| Export TXT | ✅ | ✅ |
| Clean formatting | ✅ | ✅ |
| Auto-scheduler | ❌ | ✅ |
| Export PDF | ❌ | ✅ |
| Regex extract | ❌ | ✅ |
| Cloud history | ❌ | ✅ |

Upgrade page coming soon!
