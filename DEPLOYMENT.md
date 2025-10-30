# EmotiFlow Deployment & Installation Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
cd d:\emotiflow
npm install
```

### Step 2: Build the Extension
```bash
npm run build
```

This creates the `dist/` folder with the complete extension.

### Step 3: Load in Chrome

1. Open **Chrome** (or Edge/Chromium-based browser)
2. Navigate to `chrome://extensions/`
3. Enable **"Developer mode"** (toggle in top-right corner)
4. Click **"Load unpacked"**
5. Select the `dist/` folder from this project
6. ✅ **EmotiFlow extension is now installed!**

### Step 4: Grant Permissions

When you first use EmotiFlow:
1. Click the extension icon in the toolbar
2. A popup will request permissions:
   - ✅ Camera access (for facial emotion detection)
   - ✅ Microphone access (for voice tone analysis)
   - ✅ Storage access (for encrypted emotion logs)
   - ✅ Tab access (for content adaptation)
3. **Click "Allow" for all permissions** to enable full functionality

### Step 5: Start Using

- **Open any website** and EmotiFlow will automatically start detecting your emotion
- **Click the extension icon** to see the side panel dashboard
- **Interact naturally** — just browse, type, and let the extension analyze your emotional state

---

## 🎯 What Happens During Emotion Detection

When you visit a website:

```
┌──────────────────────────────────────────────────────┐
│ 1. EmotiFlow Starts Monitoring                       │
├──────────────────────────────────────────────────────┤
│ • Accesses your webcam → Facial expressions          │
│ • Listens to audio (if available) → Voice tone       │
│ • Reads your text input → Sentiment analysis         │
└──────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────┐
│ 2. Local AI Processing (Gemini Nano)                 │
├──────────────────────────────────────────────────────┤
│ • Fuses three emotion signals                        │
│ • Runs AI inference ON YOUR DEVICE                   │
│ • Generates confidence score & emotion state         │
│ • Suggests personalized wellness interventions       │
└──────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────┐
│ 3. Adaptive Browsing Experience                      │
├──────────────────────────────────────────────────────┤
│ • Webpage colors/contrast adjust                     │
│ • Negative content softened                          │
│ • Wellness suggestions displayed                     │
│ • Animation speed reduced (if fatigued)              │
└──────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────┐
│ 4. Encrypted Storage                                 │
├──────────────────────────────────────────────────────┤
│ • Emotion data encrypted (AES-256)                   │
│ • Stored in local IndexedDB                          │
│ • ✅ NEVER leaves your device                        │
│ • Accessible only to you                             │
└──────────────────────────────────────────────────────┘
```

---

## 🎮 How to Use EmotiFlow

### 📊 View Your Emotion Dashboard

1. **Click the EmotiFlow icon** in the Chrome toolbar (top right)
2. **A popup appears** with quick emotion status
3. **Click "Open side panel"** or use the side panel icon
4. **See real-time emotion data:**
   - Current emotion (calm, stressed, anxious, etc.)
   - Confidence percentage
   - Which modalities detected it (facial, voice, text)
   - Real-time emotion timeline

### 💡 Try Wellness Interventions

1. **Dashboard shows suggested interventions** based on your emotion
2. **Click "Try Now"** on any suggestion
3. **A guided experience appears:**
   - **Breathing exercise** — Visual breathing circle, guided instructions
   - **Movement guide** — Stretch recommendations with timer
   - **Gratitude prompt** — Write down something you're grateful for
   - **Break timer** — Countdown for a 2-minute pause

### 📈 Check Your Emotion History

1. **Open side panel**
2. **Click "Emotion Timeline"** tab
3. **See your emotions throughout the day:**
   - Color-coded timeline
   - Confidence scores
   - Detected modalities for each emotion state
   - Time spent in each emotion

### ⚙️ Customize Settings

1. **Open side panel**
2. **Click "Settings"** gear icon
3. **Options:**
   - Toggle facial detection ON/OFF
   - Toggle voice analysis ON/OFF
   - Toggle text sentiment ON/OFF
   - Adjust intervention threshold (60-95%)
   - Change notification style (active, passive, minimal)
   - Enable/disable content filtering
   - Privacy preferences (see privacy dashboard)

### 📥 Export Your Emotion Data

1. **Open side panel**
2. **Click "Settings"** gear icon
3. **Scroll to "Data Export"**
4. **Click "Download Emotion Log"**
5. **CSV file downloads** containing:
   - Timestamp
   - Detected emotion
   - Confidence score
   - Duration
   - Context
   - Modality breakdown (facial, voice, text)

---

## 🔒 Privacy & Security

### ✅ What EmotiFlow Does

- ✅ Analyzes your **facial expressions locally** using your webcam
- ✅ Analyzes your **voice tone locally** using your microphone
- ✅ Analyzes your **text sentiment locally**
- ✅ Runs **AI inference on your device** (Gemini Nano)
- ✅ **Encrypts all data** with AES-256
- ✅ **Stores data locally** in IndexedDB (never transmitted)

### ❌ What EmotiFlow Does NOT Do

- ❌ Send your face/voice data to any server
- ❌ Record you — only processes real-time signals
- ❌ Track your identity
- ❌ Share data with third parties
- ❌ Require an account or login
- ❌ Collect browsing history (except for emotion context)

### 🛡️ Encryption Details

All emotion data is encrypted using **AES-256** before storage:

```
Unencrypted Emotion Data (in memory):
{
  "emotion": "stressed",
  "confidence": 85,
  "timestamp": 1729969200000,
  "modalities": { "facial": "anxious", "voice": "frustrated", "text": "negative" }
}
         ↓ (encrypted with CryptoJS.AES)
Encrypted Data (in storage):
U2FsdGVkX1+aBcD...encrypted string...cXyZ9k==
         ↓ (stored locally in IndexedDB)
Local Device Storage:
[Only accessible from within this extension on this device]
```

---

## 🐛 Troubleshooting

### 1. Extension Won't Load

**Problem:** Extension doesn't appear in toolbar

**Solution:**
- Ensure Chrome is v120+ (run `chrome://version` to check)
- Verify `dist/` folder exists: `npm run build`
- Reload the extension: Go to `chrome://extensions` → Reload button

### 2. "Camera Permission Denied"

**Problem:** Can't see facial expressions

**Solution:**
- Go to `chrome://settings/content/camera`
- Find **emotiflow** in site settings
- Change from "Block" to "Allow"
- Reload the extension

### 3. "Microphone Permission Denied"

**Problem:** Voice analysis not working

**Solution:**
- Go to `chrome://settings/content/microphone`
- Find **emotiflow** in site settings
- Change from "Block" to "Allow"
- Reload the extension

### 4. "Gemini Nano Not Available"

**Problem:** See this message in console

**Solution:**
- Update Chrome to latest version (chrome://update)
- Gemini Nano requires Chrome 120+
- If still unavailable, extension will use Firebase AI Logic (encrypted fallback)
- You can manually enable Gemini Nano:
  1. Go to `chrome://flags`
  2. Search for "Prompt API"
  3. Set to "Enabled"
  4. Restart Chrome

### 5. No Emotion Detection Happening

**Problem:** Dashboard shows "neutral" but not detecting emotion changes

**Solution:**
1. **Check lighting** — Make sure your webcam can see your face clearly
2. **Check permissions** — Verify camera/microphone are allowed (see Step 2 above)
3. **Check console for errors** — Press F12 → Console tab → Look for red errors
4. **Check face-api.js** — Make sure models loaded:
   - Open DevTools (F12)
   - Open Console
   - Should see "✓ Face detection models loaded"
5. **Reload extension** — Go to `chrome://extensions` → Click reload

### 6. Storage Space Issues

**Problem:** "Storage quota exceeded" error

**Solution:**
- IndexedDB limit is 50MB+ per extension
- If you have years of emotion logs, you may exceed this
- Export your data: Settings → "Download Emotion Log"
- Clear old data: Settings → "Clear emotion history"

---

## 🔧 Development

### Running Dev Server

```bash
npm run dev
```

This starts Vite in watch mode. Changes auto-reload (you may need to reload the extension manually).

### Type Checking

```bash
npm run type-check
```

Ensures TypeScript strictness.

### Building for Production

```bash
npm run build
```

Creates optimized, minified extension in `dist/`.

### Debugging

1. **Open DevTools:**
   - Right-click extension popup → "Inspect popup"
   - Or go to `chrome://extensions/` → "Details" → "Inspect views"

2. **Check Console Logs:**
   - Search for "EmotiFlow" messages
   - Look for ✓ (success) or ✗ (error) indicators

3. **Monitor Background Worker:**
   - Go to `chrome://extensions/`
   - Find EmotiFlow → Click "Details"
   - Click "Inspect views" → "service_worker"

---

## 📦 What Gets Installed

When you click "Load unpacked" and select `dist/`:

```
dist/
├── manifest.json                  # Extension configuration
├── service-worker-loader.js       # Background script loader
├── src/                           # Bundled source code
│   ├── background/                # Service worker code
│   ├── content/                   # Content scripts (run on pages)
│   ├── sidepanel/                 # Dashboard UI
│   ├── popup/                     # Quick popup
│   └── utils/                     # AI, storage, styling utilities
├── assets/                        # Bundled JavaScript/CSS
├── public/icons/                  # Extension icons
└── .vite/                         # Vite build metadata
```

**Total size:** ~400KB (includes React, face-api.js, and all models)

---

## 🌍 Cloud Fallback (Optional)

If Gemini Nano is unavailable, EmotiFlow can use **Firebase AI Logic** as a fallback:

- **Encrypted transmission** — HTTPS + TLS
- **Anonymized data** — No personal identifiers
- **User opt-out** — Can disable in settings
- **No cost** — Processed within your Google account quota

To enable:
1. Settings → "Fallback AI"
2. Toggle "Use Firebase AI Logic"
3. Accept encrypted data transmission

---

## 📊 Supported Emotions

EmotiFlow detects 9 primary emotions:

| Emotion | Color | Typical Triggers | Suggested Intervention |
|---------|-------|------------------|----------------------|
| **Calm** | 🔵 Cyan | Relaxing content, meditation | Maintain moment, gratitude |
| **Stressed** | 🔴 Red | Deadlines, alerts, chaos | Breathing exercise |
| **Anxious** | 🟠 Amber | Uncertainty, waiting | Grounding technique |
| **Sad** | 🟣 Purple | Negative news, failure | Gratitude reflection |
| **Happy** | 🟡 Gold | Good news, achievement | Savor the moment |
| **Energized** | 🟢 Green | Success, exciting content | Channel productively |
| **Frustrated** | 🔴 Red | Obstacles, errors | Take a break |
| **Fatigued** | ⚪ Gray | Long sessions, repetitive | Rest & reduce stimulation |
| **Neutral** | ⚫ Gray | Default/no signals detected | Observe & continue |

---

## 🎓 Understanding the Emotion Fusion

EmotiFlow combines three emotion signals with weighted averaging:

```
Facial Expression (40% weight) +
Voice Tone (35% weight) +
Text Sentiment (25% weight)
= Final Emotion Confidence
```

**Example:**
- Facial shows "frustrated" (90% confidence) → 0.40 × 0.90 = 0.36
- Voice shows "stressed" (75% confidence) → 0.35 × 0.75 = 0.26
- Text shows "angry" (60% confidence) → 0.25 × 0.60 = 0.15
- **Final:** Highest combined score is "frustrated" → Primary emotion

---

## 🏆 2025 Google Chrome Built-in AI Challenge

EmotiFlow demonstrates:

✅ **Gemini Nano Usage** — Local on-device AI inference  
✅ **Privacy-First Design** — No data transmission, encrypted storage  
✅ **Multimodal AI** — Facial, voice, text fusion  
✅ **User Well-being** — Mental health focus with wellness interventions  
✅ **Manifest V3** — Modern Chrome extension best practices  
✅ **Scalability** — Works across all websites  

---

## 📧 Support & Feedback

For issues or feedback:
1. Check the Troubleshooting section above
2. Open DevTools (F12) and check Console for errors
3. Share error messages when reporting issues

---

**Ready to experience emotion-aware browsing? 🎉**

1. ` npm install`
2. `npm run build`
3. Load the `dist/` folder in Chrome
4. Grant permissions
5. Start browsing! 🌐

EmotiFlow — Your AI Emotional Intelligence Assistant ✨
