# EmotiFlow - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
cd /workspace/emotiflow
npm install
```

### Step 2: Build the Extension
```bash
npm run build
```

This creates a `dist/` folder with your compiled extension.

### Step 3: Load in Chrome
1. Open `chrome://extensions/`
2. Enable **Developer Mode** (top-right corner toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder
5. EmotiFlow should now appear in your extensions!

### Step 4: Open the Dashboard
- Click the EmotiFlow extension icon
- Click "Dashboard" to open the side panel
- Allow camera/microphone permissions when prompted

---

## 💻 Development Workflow

### Watch Mode (Auto-reload)
```bash
npm run dev
```
This starts Vite in watch mode. Changes will hot-reload in Chrome.

### Type Checking
```bash
npm run type-check
```

### Production Build
```bash
npm run build
```

---

## 🔧 Enable Chrome AI APIs

### Option A: Early Preview Program (Recommended)
1. Visit: https://developer.chrome.com/docs/ai/
2. Click "Try the Early Preview"
3. Follow the enrollment steps
4. Restart Chrome after approval

### Option B: Manual Flags (Testing Only)
1. Open `chrome://flags/`
2. Search "Prompt API" → Enable
3. Search "Rewriter API" → Enable
4. Restart Chrome

---

## 📁 Key Files to Know

### For AI Integration
- `src/background/aiEngine.ts` - Chrome Prompt API setup
- `src/utils/prompts.ts` - AI prompt templates

### For Emotion Detection
- `src/background/emotionFusion.ts` - Fusion algorithm
- `src/content/facialDetection.ts` - Webcam analysis
- `src/content/voiceAnalysis.ts` - Audio processing
- `src/content/textSentiment.ts` - Text sentiment

### For UI
- `src/sidepanel/App.tsx` - Main dashboard
- `src/sidepanel/components/` - Dashboard components
- `src/content/interventionUI.ts` - Toast notifications

### For Storage
- `src/utils/storage.ts` - Encrypted database

---

## 🧪 Testing Emotion Detection

### Manual Test via DevTools
1. Open any webpage
2. Right-click → Inspect → Console
3. Send test emotion data:

```javascript
chrome.runtime.sendMessage({
  type: 'FACIAL_EMOTION',
  data: { 
    emotion: 'stressed', 
    confidence: 85, 
    timestamp: Date.now() 
  }
});
```

### Test Different Emotions
```javascript
// Stressed
chrome.runtime.sendMessage({ type: 'FACIAL_EMOTION', data: { emotion: 'angry', confidence: 85, timestamp: Date.now() } });

// Calm
chrome.runtime.sendMessage({ type: 'FACIAL_EMOTION', data: { emotion: 'neutral', confidence: 75, timestamp: Date.now() } });

// Happy
chrome.runtime.sendMessage({ type: 'FACIAL_EMOTION', data: { emotion: 'happy', confidence: 90, timestamp: Date.now() } });
```

---

## 🎨 Customizing the Dashboard

### Change Colors
Edit `src/sidepanel/index.css` and modify the color variables in `tailwind.config.js`

### Add New Dashboard Component
1. Create new file in `src/sidepanel/components/`
2. Import in `src/sidepanel/App.tsx`
3. Add to the appropriate tab

### Modify Emotion Colors
Edit emotion color mappings in:
- `src/utils/emotions.ts` - `emotionColorMap`
- `tailwind.config.js` - emotion color palette

---

## 🔐 Testing Privacy Features

### Verify Encryption
1. Open DevTools
2. Go to Application → IndexedDB → EmotiFlowDB
3. All stored emotion data should be encrypted (gibberish)

### Check Permissions
1. Go to Extension Details page
2. Verify requested permissions (should be minimal)
3. Grant camera/microphone as needed

---

## 📊 Project Structure Reminder

```
emotiflow/
├── src/
│   ├── background/        ← Service worker (emotion fusion)
│   ├── content/           ← Detection (facial, voice, text)
│   ├── sidepanel/         ← React dashboard
│   ├── popup/             ← Quick controls
│   ├── utils/             ← Helpers & storage
│   └── types/             ← TypeScript definitions
├── public/
│   ├── icons/             ← Extension icons
│   └── models/            ← TensorFlow.js models (add here)
├── manifest.json          ← Extension config
├── package.json           ← Dependencies
├── tsconfig.json          ← TypeScript config
├── vite.config.ts         ← Vite config
└── README.md             ← Full documentation
```

---

## ⚠️ Common Issues

### "Permission Denied" for Camera
**Fix**: Go to Chrome Settings → Privacy & Security → Site Settings → Camera, allow the extension

### "Manifest not found" error
**Fix**: Make sure you ran `npm run build` and selected the `dist/` folder (not `src/`)

### Extension not updating
**Fix**: 
1. Go to `chrome://extensions/`
2. Find EmotiFlow
3. Click the refresh icon or unload/reload

### No emotion state showing
**Fix**: Check DevTools console for errors; make sure a webpage is loaded

---

## 🎯 Next Development Steps

1. **Implement Face Detection**
   - Download face-api.js models: https://github.com/vladmandic/face-api
   - Place in `public/models/`
   - Update `src/content/facialDetection.ts`

2. **Integrate Gemini Nano**
   - Update `src/background/aiEngine.ts` with actual API calls
   - Test with emotion interpretation prompts

3. **Add Real Sentiment Analysis**
   - Implement actual NLP in `src/content/textSentiment.ts`
   - Or call Prompt API for analysis

4. **Implement Recharts**
   - Add chart library: `npm install recharts`
   - Update `src/sidepanel/components/EmotionTimeline.tsx`

5. **Add Web Workers**
   - Create `src/workers/emotion-fusion-worker.ts`
   - Offload heavy computation from main thread

---

## 📝 Useful Commands

```bash
# Install dependencies
npm install

# Watch mode (development)
npm run dev

# Build for production
npm run build

# Type checking only
npm run type-check

# Clean dist folder
rm -rf dist/

# View package size
npm ls --depth=0
```

---

## 🐛 Debugging Tips

### Enable Verbose Logging
Add to `src/background/index.ts`:
```typescript
const DEBUG = true;
if (DEBUG) console.log('Message:', message);
```

### Monitor Messages in DevTools
1. Open DevTools → Sources → Background Page
2. Set breakpoints in message handlers
3. Send test messages to trigger

### Check Emotion State
In DevTools Console:
```javascript
chrome.runtime.sendMessage({ type: 'GET_EMOTION_STATE' }, (state) => {
  console.log('Current emotion:', state);
});
```

---

## 📚 Documentation Links

- [Chrome Extension API](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/)
- [Chrome AI Docs](https://developer.chrome.com/docs/ai/)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 🆘 Need Help?

### Check These Files First
1. `README.md` - Full project documentation
2. `PROJECT_SUMMARY.md` - Detailed architecture overview
3. Comments in source files - Inline JSDoc comments
4. Console errors - Chrome DevTools console

### Common Questions

**Q: Where are the AI prompts?**  
A: In `src/utils/prompts.ts` - ready to integrate with Gemini Nano

**Q: How is emotion data encrypted?**  
A: AES encryption in `src/utils/storage.ts` using crypto-js

**Q: Can I export my emotion data?**  
A: Yes! Use the Settings panel → "Export Data as CSV"

**Q: Is my data sent to servers?**  
A: No! 100% on-device processing. Zero external API calls (except Gemini Nano which is on-device)

---

## 🎉 You're Ready!

Your EmotiFlow extension is now set up and ready for development. Start by:

1. ✅ Running `npm run build`
2. ✅ Loading in Chrome
3. ✅ Clicking around the dashboard
4. ✅ Reading the source code comments
5. ✅ Implementing AI integration

**Happy coding!** 🚀

---

Last Updated: October 26, 2025
