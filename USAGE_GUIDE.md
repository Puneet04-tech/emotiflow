# 📖 EmotiFlow - Step-by-Step Usage Guide

## Phase 1: Installation (5 minutes)

### Step 1.1: Build the Extension

Open PowerShell and run:

```powershell
cd D:\emotiflow
npm run build
```

**What happens:**
- Vite compiles TypeScript to JavaScript
- CRXJS packages everything into a Chrome extension
- Creates `dist/` folder with all files ready

**Expected output:**
```
✓ 127 modules transformed.
✓ built in 1.80s
```

### Step 1.2: Open Chrome Extensions Page

1. **Open Google Chrome** (or Edge, Brave, any Chromium browser)
2. **Type in address bar:** `chrome://extensions/`
3. **Press Enter**

You should see a page titled "Extensions" with a list of installed extensions.

### Step 1.3: Enable Developer Mode

Look at the **top-right corner** of the extensions page.

You'll see a toggle labeled **"Developer mode"**

- Click the toggle to turn it **ON** (should turn blue)

**Why?** Developer mode lets you load unpacked extensions (our `dist/` folder).

### Step 1.4: Load the Extension

After enabling Developer mode, new buttons appear:

- Click **"Load unpacked"** button

A file browser opens.

1. **Navigate to:** `D:\emotiflow`
2. **Select the folder:** `dist`
3. **Click "Select Folder"**

**Wait 2-3 seconds...**

✅ **EmotiFlow should now appear in your extensions list!**

You'll see:
- Extension name: "EmotiFlow - Emotional Intelligence Browser Assistant"
- A colored icon (blue circle with emoji)
- Status: "Enabled"

### Step 1.5: Grant Permissions

**Important!** EmotiFlow needs permissions to work.

1. **Click the EmotiFlow extension icon** in the Chrome toolbar (top-right area)
2. A popup appears saying "EmotiFlow wants access to:"
3. **Grant these permissions:**
   - ✅ **Camera** — Needed for facial emotion detection
   - ✅ **Microphone** — Needed for voice tone analysis
   - ✅ **Storage** — Needed for encrypted emotion logs
   - ✅ **Tabs** — Needed for content adaptation

**Click "Allow" for each permission.**

💡 **Tip:** If you don't see permission prompts, go to:
- `chrome://settings/content/camera` → Find "EmotiFlow" → Set to "Allow"
- `chrome://settings/content/microphone` → Find "EmotiFlow" → Set to "Allow"

---

## Phase 2: First Use (2 minutes)

### Step 2.1: Open Any Website

1. **Click on any website** in a new tab
   - Example: Google, YouTube, News site, etc.
   - EmotiFlow works on ANY website

2. **Keep the page open for 10-15 seconds**
   - EmotiFlow is analyzing your emotion
   - Facial detection needs good lighting (no backlight)

### Step 2.2: View Your Emotion in the Dashboard

**Two ways to view:**

**Option A: Click the EmotiFlow Icon (Quick View)**
1. Click the **EmotiFlow icon** in the toolbar
2. A small popup shows:
   - Current emotion (e.g., "Calm", "Stressed")
   - Confidence percentage (e.g., "78%")
   - Small visualization

**Option B: Open Full Dashboard (Recommended)**
1. Click the **EmotiFlow icon** in the toolbar
2. Look for button that says **"Open side panel"** or **"View Dashboard"**
3. A **large panel opens on the right side** of your browser

---

## Phase 3: Understanding the Dashboard

The side panel dashboard shows 5 main sections:

### Section 1: Emotion Indicator (Top)

```
╔════════════════════════════════╗
║  😌  CALM                       ║
║  Confidence: 78%               ║
║  Modalities: Facial, Voice     ║
╚════════════════════════════════╝
```

**What it shows:**
- **Emoji** — Visual emotion representation
- **Emotion name** — Primary detected emotion (calm, stressed, anxious, etc.)
- **Confidence** — How sure the AI is (0-100%)
- **Modalities** — Which sensors detected it:
  - 📷 Facial (webcam)
  - 🎤 Voice (microphone)
  - 📝 Text (typing analysis)

### Section 2: Emotion Timeline (Middle)

A **colored timeline** showing your emotions over the last hour.

**Color legend:**
- 🔵 Cyan = Calm
- 🔴 Red = Stressed
- 🟠 Amber = Anxious
- 🟣 Purple = Sad
- 🟡 Gold = Happy
- 🟢 Green = Energized
- ⚫ Gray = Neutral/Fatigued

**How to read it:**
- Move your mouse over colored blocks
- See: Time, emotion, confidence percentage

### Section 3: Wellness Suggestions (Below Timeline)

AI-generated personalized suggestions:

```
💡 Suggested Actions:
1. Take a 2-minute breathing break
2. Step away from screen for 30 seconds
3. Write down one thing you're grateful for
```

**Click "Try Now"** to launch the suggested intervention.

### Section 4: Statistics (Lower)

- **Today's dominant emotion** (most common emotion detected)
- **Intervention completed** (how many you've tried)
- **Wellness streak** (consecutive days with good emotional balance)
- **Average confidence** (how accurate detections have been)

### Section 5: Settings (Bottom - Gear Icon)

Three tabs:
- **Features** — Turn on/off facial, voice, text detection
- **Privacy** — See what data is stored and export it
- **Interventions** — Customize which suggestions you see

---

## Phase 4: Using Wellness Interventions

### When Are They Offered?

When EmotiFlow detects:
- 🔴 Stressed
- 🟠 Anxious
- 🟣 Sad
- 🟡 Frustrated
- ⚫ Fatigued

A **card appears** suggesting an intervention.

### Intervention Types

#### Type 1: Breathing Exercise ✨

1. **Card appears:** "Take a deep breath"
2. **Click "Try Now"**
3. **A circle appears in the center of your screen**
4. The circle **expands and contracts** to guide your breathing:
   - **Expands** = Breathe IN (4 seconds)
   - **Contracts** = Breathe OUT (6 seconds)
5. **Follow the circle** for 2-5 minutes
6. **Click anywhere to close** when done

**Best for:** Stress, anxiety, racing thoughts

#### Type 2: Movement Guide 🤸

1. **Card appears:** "Do a quick stretch"
2. **Click "Try Now"**
3. **Instructions appear** with illustration:
   - "Stand up and stretch arms overhead"
   - "Hold for 15 seconds, repeat 3 times"
4. **Follow the instructions**
5. **Click "Done" when finished**

**Best for:** Fatigue, stiffness, low energy

#### Type 3: Gratitude Prompt 🙏

1. **Card appears:** "Practice gratitude"
2. **Click "Try Now"**
3. **A text box appears** asking:
   - "What's one thing you're grateful for today?"
4. **Type your response** (anything — a person, moment, achievement)
5. **Click "Save & Close"**
6. Your entry is **encrypted and stored locally**

**Best for:** Sadness, frustration, negative thoughts

#### Type 4: Break Timer ⏱️

1. **Card appears:** "Take a break"
2. **Click "Try Now"**
3. **A large timer appears** showing **2:00 (2 minutes)**
4. **Timer counts down** from 2 minutes
5. When done, **timer disappears** automatically

**Best for:** Fatigue, overwhelm, burnout prevention

---

## Phase 5: Checking Your History

### View Emotion Timeline

1. **Open EmotiFlow dashboard**
2. **Click "Timeline" tab** (calendar icon)
3. **See your emotions throughout the day:**
   - Each color block = one emotion detected
   - Hover over blocks to see details:
     - Time detected
     - Emotion name
     - Confidence percentage
     - Which modalities detected it

### View Statistics

1. **Open EmotiFlow dashboard**
2. **Click "Statistics" tab** (chart icon)
3. **See:**
   - Emotions distribution (pie chart)
   - Time spent in each emotion
   - Intervention completion rate
   - Wellness streak

### Export Your Data

1. **Open EmotiFlow dashboard**
2. **Click "Settings" gear icon**
3. **Go to "Privacy" tab**
4. **Click "Download My Data" button**
5. **A CSV file downloads** with your emotion history
6. **Open in Excel or Google Sheets** to analyze

**Data includes:**
- Timestamp (when detected)
- Emotion name
- Confidence percentage
- Duration
- Which modalities (facial/voice/text)
- Wellness interventions completed

---

## Phase 6: Understanding Page Adaptation

### What Happens Automatically

When EmotiFlow detects your emotion, **the webpage changes:**

#### If You're STRESSED 🔴

Website appearance **automatically changes:**
- Colors **dim** (less bright)
- Harsh reds/oranges **soften**
- **Animations slow down**
- Negative news headlines **softened**
- Ads become **less prominent**

**Purpose:** Reduce visual stress and urgency

#### If You're ANXIOUS 🟠

- Colors become **more muted**
- Flashing content **stops**
- Text becomes **larger and easier to read**
- Videos **auto-pause**

**Purpose:** Reduce overstimulation

#### If You're FATIGUED ⚫

- Page **becomes slightly dimmer**
- Font size **increases**
- Line spacing **widens**
- Animations **stop completely**
- Sidebar and ads **hidden**

**Purpose:** Reduce eye strain and effort

#### If You're CALM 🔵

- Colors **brighten slightly**
- Blue/green tones **enhance**
- Everything looks **peaceful and relaxed**

**Purpose:** Maintain the calm state

### Disabling Automatic Adaptation

If you don't want the website to change:

1. **Open EmotiFlow dashboard**
2. **Click "Settings" gear icon**
3. **Go to "Features" tab**
4. **Toggle OFF:** "Adapt page styling"
5. Websites will **look normal** (no automatic changes)

---

## Phase 7: Privacy & Data Control

### Where Is My Data Stored?

**All data is stored:**
- 🔐 On YOUR device only
- 🔒 Encrypted with AES-256
- 📱 In Chrome's IndexedDB
- ❌ NOT sent to any server
- ❌ NOT shared with anyone

### What Data Is Collected?

✅ **Emotion states** (calm, stressed, etc.)
✅ **Confidence scores** (how sure the AI is)
✅ **Timestamps** (when detected)
❌ **NOT facial images** (only analyzed, not saved)
❌ **NOT audio recordings** (only tone analyzed, not saved)
❌ **NOT browsing history** (only emotion context)

### Viewing Stored Data

1. **Open EmotiFlow dashboard**
2. **Click "Settings" gear icon**
3. **Go to "Privacy" tab**
4. **See:**
   - Total entries stored
   - Date range of data
   - Storage size

### Clearing Data

⚠️ **This deletes all emotion history permanently!**

1. **Open EmotiFlow dashboard**
2. **Click "Settings" gear icon**
3. **Go to "Privacy" tab**
4. **Click "Clear All Data"**
5. **Confirm: "Yes, delete everything"**
6. ✓ All data is **instantly deleted**

### Exporting Data

**Backup your emotions before clearing:**

1. **Open EmotiFlow dashboard**
2. **Click "Settings" gear icon**
3. **Go to "Privacy" tab**
4. **Click "Download My Data"**
5. **CSV file saves** to your Downloads folder
6. **Import into Excel/Google Sheets** for analysis

---

## Phase 8: Troubleshooting

### Problem 1: Extension Icon Doesn't Appear

**Solution:**
1. Go to `chrome://extensions/`
2. Find "EmotiFlow"
3. Click **"Details"**
4. Toggle **"Show in toolbar"** to ON

### Problem 2: "No Emotion Detected" (Shows Neutral)

**Possible causes:**

1. **Lighting issue:**
   - Face-api.js needs good lighting
   - Sit facing a window or lamp
   - Avoid backlight (light behind you)

2. **Permissions not granted:**
   - Go to `chrome://settings/content/camera`
   - Find "EmotiFlow" → Set to "Allow"
   - Do the same for microphone

3. **Models not loaded:**
   - Open DevTools (F12)
   - Go to Console
   - Look for red errors
   - Reload extension: `chrome://extensions` → Reload

### Problem 3: "Camera Permission Denied"

**Solution:**
1. Go to `chrome://settings/content/camera`
2. Find "emotiflow" in the list
3. Click "Allow"
4. Reload the extension (refresh button on `chrome://extensions`)

### Problem 4: Microphone Not Working

**Solution:**
1. Go to `chrome://settings/content/microphone`
2. Find "emotiflow" in the list
3. Click "Allow"
4. Make sure your microphone is **not muted** (check system volume)

### Problem 5: "Gemini Nano Not Available"

**Solution (optional):**
1. Ensure Chrome is up-to-date: `chrome://update`
2. EmotiFlow will still work (falls back to heuristics)
3. To enable Gemini Nano:
   - Go to `chrome://flags`
   - Search: "Prompt API"
   - Set to "Enabled"
   - Restart Chrome

### Problem 6: Dashboard Won't Open

**Solution:**
1. Click extension icon in toolbar
2. If "Open side panel" button appears, click it
3. If nothing happens, reload extension:
   - Go to `chrome://extensions`
   - Find EmotiFlow
   - Click reload button (circular arrow)

### Problem 7: Data Storage Full

**Solution:**
1. **Export your data first** (see Phase 7)
2. **Clear data** (see Phase 7)
3. This frees up space for new emotions

---

## Phase 9: Advanced Features

### Custom Emotion Thresholds

1. **Open EmotiFlow dashboard**
2. **Click "Settings" gear icon**
3. **Go to "Features" tab**
4. **Find "Intervention Threshold"** slider
5. **Adjust 60-95%:**
   - Lower (60%) = More frequent suggestions
   - Higher (95%) = Only when very confident

### Changing Notification Style

1. **Open EmotiFlow dashboard**
2. **Click "Settings" gear icon**
3. **Go to "Features" tab**
4. **Find "Notification Style":**
   - **Active** = Pop-ups appear frequently
   - **Passive** = Subtle, non-intrusive notifications
   - **Minimal** = Only dashboard updates

### Disabling Individual Modalities

If you don't want one type of detection:

1. **Open EmotiFlow dashboard**
2. **Click "Settings" gear icon**
3. **Go to "Features" tab**
4. **Toggle OFF:**
   - "Facial Detection" — Stop using webcam
   - "Voice Analysis" — Stop using microphone
   - "Text Sentiment" — Stop analyzing typing

---

## Phase 10: Daily Usage Tips

### Best Practices

✅ **Use during work/study sessions** — Track productivity moods
✅ **Check dashboard in evening** — See your emotional pattern for the day
✅ **Try interventions when prompted** — They actually help!
✅ **Export data weekly** — Build a personal emotion journal
✅ **Use in good lighting** — Better facial detection accuracy
✅ **Allow microphone during calls** — Voice tone is most accurate then

### When EmotiFlow Works Best

- ✅ While browsing news sites
- ✅ During video calls or meetings
- ✅ When writing emails or messages
- ✅ During study/work sessions
- ✅ While watching videos

### When It Might Not Work Well

- ❌ In very dark rooms (need lighting for facial)
- ❌ When camera is covered
- ❌ When microphone is muted
- ❌ Wearing sunglasses or masks
- ❌ With extreme backlighting

---

## Quick Reference Card

**Install:** `npm install && npm run build` → Load `dist/` in Chrome  
**Open Dashboard:** Click EmotiFlow icon → "Open side panel"  
**View Emotion:** Top of dashboard shows current state + confidence  
**Get Suggestions:** Cards appear below emotion  
**Try Intervention:** Click "Try Now" on any suggestion  
**View History:** Click "Timeline" tab  
**Export Data:** Settings → Privacy → "Download My Data"  
**Clear Data:** Settings → Privacy → "Clear All Data"  

---

## 🎉 You're Ready!

You now know:
1. ✅ How to install EmotiFlow
2. ✅ How to view your emotion state
3. ✅ How to use wellness interventions
4. ✅ How to check your history
5. ✅ How page adaptation works
6. ✅ How to protect your privacy
7. ✅ How to troubleshoot issues

**Start using EmotiFlow now!** 🚀

Your emotions are important. Let EmotiFlow help you understand and balance them. 💙

---

## 📞 Quick Help

**Stuck?** Check these docs:
- `DEPLOYMENT.md` — Installation troubleshooting
- `README.md` — Project overview
- `IMPLEMENTATION_SUMMARY.md` — Technical details

**Need help?** Open DevTools (F12) and check Console for error messages.
