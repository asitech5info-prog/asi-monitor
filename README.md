# ASI Monitor 📱⚡

**ASI Monitor** is a real-time Facebook Page & Profile monitoring application designed for Android and mobile web. Instead of opening Facebook profiles one by one, ASI Monitor aggregates all your monitored pages into a unified, high-tech dashboard displaying live followers, real-time views, growth velocities, and profile avatars.

---

## ✨ Features

- 📊 **Unified Dashboard**: Monitor multiple Facebook pages/profiles simultaneously on one screen.
- ⚡ **Real-Time Follower Counter**: Live dynamic tickers with green growth delta badges (`+3.1K ↗`).
- 👁️ **Live Views Tracking**: Total cumulative views counter for reels, videos, and page post reach.
- 🔗 **Direct URL Ingestion**: Add any public Facebook page/profile link (`facebook.com/...`) to start monitoring immediately.
- 🛠️ **Smart Fallback Engine**: Intelligent OpenGraph parser extracts avatars, titles, and metrics with offline simulation support.
- 📱 **Native Android APK & PWA**: Packaged with Capacitor for Android APK generation and PWA 1-click install.
- 🔔 **Activity Feed & Notifications**: Real-time notifications of follower milestones and growth events.

---

## 📲 Download the Android APK

1. Go to the **Actions** tab in this GitHub repository.
2. Click on the latest **Build Android APK** workflow run.
3. Under the **Artifacts** section, download **`ASI-Monitor-Debug-APK`**.
4. Transfer `app-debug.apk` to your Android device and install it!

---

## 💻 Local Development

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
```bash
# Clone repository
git clone https://github.com/asitech5info-prog/asi-monitor.git
cd asi-monitor

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser or navigate to your local network IP on mobile.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Lucide Icons, Canvas Confetti
- **Mobile Engine**: Capacitor 7 (Android)
- **Styling**: Modern dark-mode OLED CSS with cyan neon glow and responsive mobile layouts
- **Backend**: Express, Axios, Cheerio (OpenGraph scraper)
- **CI/CD**: GitHub Actions for automated Android APK builds

---

## 📄 License
MIT © 2026 ASI Tech
