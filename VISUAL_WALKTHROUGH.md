# 🎬 EmotiFlow - Visual Walkthrough

## What You're Seeing Right Now

The popup you captured shows:

```
┌─────────────────────────────────┐
│  EmotiFlow                       │
│  Emotional Wellness Companion    │
│                                  │
│  Current Status                  │
│  😊 Analyzing...                 │
│                                  │
│  [Dashboard]  [Pause]            │
│                                  │
│  ⚙️ Settings    ❓ Help           │
└─────────────────────────────────┘
```

### What This Means:

✅ **Extension is working!**
- The popup loaded successfully
- Emotion detection is running
- It's analyzing your current emotion from:
  - 📷 Facial expression (if camera allowed)
  - 🎤 Voice/tone (if microphone allowed)
  - 📝 Text/typing patterns (if text analysis enabled)

⏳ **Status: "Analyzing..."**
- This is **normal** for the first 5-10 seconds
- The AI models are loading
- System is processing sensor data

---

## Next Steps (What Should Happen)

### After 10-15 Seconds

The "Analyzing..." text should change to:

```
┌─────────────────────────────────┐
│  EmotiFlow                       │
│  Emotional Wellness Companion    │
│                                  │
│  Current Status                  │
│  😌 CALM                          │
│  Confidence: 78%                 │
│                                  │
│  [Dashboard]  [Pause]            │
│                                  │
│  ⚙️ Settings    ❓ Help           │
└─────────────────────────────────┘
```

### What Each Button Does

| Button | Action |
|--------|--------|
| **Dashboard** | Opens full side panel with all features |
| **Pause** | Stops emotion detection (privacy mode) |
| **⚙️ Settings** | Configure preferences |
| **❓ Help** | Opens help documentation |

---

## If It Stays "Analyzing..." for Too Long

### Problem: Stuck on "Analyzing..."

**This means one of these:**

1. **Models still loading** (first time)
   - **Solution:** Wait 30 more seconds
   - Face-api.js model downloads ~30MB first run
   - Completely normal

2. **Camera/Microphone not working**
   - **Solution:** Grant permissions
   - See "Fix Permissions" section below

3. **No sensor data coming in**
   - **Solution:** Check if devices allowed
   - Open DevTools (F12) to debug

---

## Fix: Grant Permissions Properly

### Step 1: Check Camera Permission

1. **In the Chrome toolbar**, find the **lock icon** (left of URL bar)
2. Click it → Opens permission menu
3. Look for **Camera**:
   - If **red X**: Click it → Change to **"Allow"**
   - If **checkmark**: Already allowed ✓

### Step 2: Check Microphone Permission

Same process:
1. Click **lock icon**
2. Find **Microphone**:
   - If **red X**: Click it → Change to **"Allow"**
   - If **checkmark**: Already allowed ✓

### Step 3: Reload Extension

Go to `chrome://extensions/`:
1. Find **EmotiFlow**
2. Click **reload button** (circular arrow icon)
3. Wait 5 seconds

Now click the EmotiFlow icon again → Should see emotion name instead of "Analyzing..."

---

## The Full Dashboard (What Comes Next)

After clicking **"Dashboard"**, you'll see:

### Screen 1: Emotion Overview

```
┌────────────────────────────────────────┐
│  EmotiFlow Dashboard                   │
├────────────────────────────────────────┤
│                                        │
│  😌  CALM                              │
│  Confidence: 78%                       │
│  Modalities: Facial, Voice             │
│                                        │
│  Time detected: 2:34 PM                │
│  Duration in emotion: 12 minutes       │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  Emotion Timeline                      │
│                                        │
│  [Blue]  [Cyan]  [Blue]  [Blue]       │
│  1:00 PM - 2:00 PM - 3:00 PM - NOW     │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  💡 Suggested Actions                  │
│                                        │
│  ✓ Take a 2-minute breathing break    │
│    [Try Now]                           │
│                                        │
│  ✓ Stretch your shoulders             │
│    [Try Now]                           │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  📊 Today's Statistics                 │
│                                        │
│  • Dominant emotion: Calm (65%)        │
│  • Interventions completed: 2          │
│  • Average confidence: 82%             │
│  • Wellness streak: 3 days             │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  [📅 Timeline]  [📊 Stats]  [⚙️ Settings] │
│                                        │
└────────────────────────────────────────┘
```

---

## Expected Emotions & Colors

After analysis completes, you'll see one of these:

| Emotion | Emoji | Color | Modalities Detected |
|---------|-------|-------|---------------------|
| **Calm** | 😌 | 🔵 Cyan | Facial + Voice |
| **Stressed** | 😰 | 🔴 Red | Voice + Facial |
| **Anxious** | 😟 | 🟠 Orange | Facial + Text |
| **Sad** | 😢 | 🟣 Purple | Voice + Text |
| **Happy** | 😊 | 🟡 Yellow | Facial + Voice |
| **Energized** | 🤩 | 🟢 Green | Voice + Movement |
| **Neutral** | 😐 | ⚫ Gray | Facial |
| **Fatigued** | 😴 | ⚫ Dark Gray | Text patterns |
| **Frustrated** | 😤 | 🔴 Dark Red | Voice tone + Facial |

---

## If You See Different Emotions

### Your Emotion = STRESSED 😰 (Red)

**Automatic changes happen:**

The webpage you're viewing will automatically:
- Colors **dim** (less bright)
- Harsh reds become **softer**
- Animations **slow down**
- Ads become **less prominent**

This helps reduce stress!

### Your Emotion = FATIGUED 😴 (Gray)

**Automatic changes happen:**

The webpage will:
- **Brighten slightly** (helps keep you awake)
- Font size **increases**
- Line spacing **widens**
- Animations **stop**

This reduces eye strain!

### Your Emotion = HAPPY 😊 (Yellow)

**Automatic changes happen:**

The webpage will:
- Colors **brighten** (match your mood)
- Warm tones **enhance**
- Positive content **highlights**

This reinforces your positive mood!

---

## The Intervention System

### When You See "Suggested Actions"

If EmotiFlow detects **stress** or **anxiety**, it offers interventions:

#### Intervention 1: Breathing Exercise

**What you see:**
```
┌──────────────────────┐
│   Take a deep breath │
│                      │
│      ◯◯◯◯◯          │
│    ◯       ◯        │
│   ◯         ◯       │
│    ◯       ◯        │
│      ◯◯◯◯◯          │
│                      │
│   Breathe IN (4s)    │
│   then OUT (6s)      │
│   Follow the circle  │
│                      │
│  [Try Now] [Skip]    │
└──────────────────────┘
```

**How to use:**
1. Click **"Try Now"**
2. Watch the circle expand/contract
3. Breathe in when it expands
4. Breathe out when it contracts
5. Do 5-10 cycles
6. Click to close

---

#### Intervention 2: Movement Stretch

**What you see:**
```
┌──────────────────────┐
│  Do a quick stretch  │
│                      │
│   Stand up and       │
│   reach arms up      │
│                      │
│   Hold for           │
│   15 seconds         │
│   Repeat 3x          │
│                      │
│  [Try Now] [Skip]    │
└──────────────────────┘
```

---

#### Intervention 3: Gratitude Prompt

**What you see:**
```
┌─────────────────────────────┐
│   Practice gratitude        │
│                             │
│   What's one thing you're   │
│   grateful for today?       │
│                             │
│   ┌─────────────────────┐   │
│   │ [Type here...]      │   │
│   └─────────────────────┘   │
│                             │
│   [Save & Close] [Skip]     │
└─────────────────────────────┘
```

---

#### Intervention 4: Break Timer

**What you see:**
```
┌──────────────────────┐
│   Take a break       │
│                      │
│        2:00          │
│                      │
│   Rest your eyes     │
│   for 2 minutes      │
│                      │
│  ⏸ Pause  ✕ Close   │
└──────────────────────┘
```

The timer counts down automatically.

---

## Settings Panel

### Click Settings (Gear Icon)

You'll see 3 tabs:

#### Tab 1: Features

```
┌─────────────────────────────────┐
│ 📋 Features                     │
├─────────────────────────────────┤
│                                 │
│ Facial Detection          [ON]  │
│ Voice Analysis            [ON]  │
│ Text Sentiment Analysis   [ON]  │
│ Page Adaptation           [ON]  │
│                                 │
│ Intervention Threshold    75%   │
│ ├─────────────────────────|    │
│                                 │
│ Notification Style:             │
│ ◯ Active                       │
│ ◉ Passive                      │
│ ◯ Minimal                      │
│                                 │
└─────────────────────────────────┘
```

**What each does:**

- **Facial Detection**: Uses camera to read face
- **Voice Analysis**: Listens to tone of voice
- **Text Sentiment**: Analyzes your typing patterns
- **Page Adaptation**: Changes website colors based on emotion
- **Intervention Threshold**: How confident AI must be to suggest help (75-95%)
- **Notification Style**: How often you get suggestions

#### Tab 2: Privacy

```
┌─────────────────────────────────┐
│ 🔒 Privacy                      │
├─────────────────────────────────┤
│                                 │
│ Storage Status:                 │
│ • Total entries: 1,247         │
│ • Date range: Oct 1-26         │
│ • Storage used: 2.3 MB         │
│ • Encrypted: AES-256 ✓         │
│                                 │
│ [Download My Data] (CSV)       │
│ [Clear All Data] ⚠️             │
│                                 │
│ Data Collected:                 │
│ ✓ Emotion states               │
│ ✓ Confidence scores            │
│ ✗ Facial images (NOT saved)    │
│ ✗ Audio recordings (NOT saved) │
│ ✗ Browsing history             │
│                                 │
└─────────────────────────────────┘
```

**Important:**
- All data stays on YOUR device
- Encrypted automatically
- No servers involved
- You can export or delete anytime

#### Tab 3: About

```
┌─────────────────────────────────┐
│ ℹ️ About                        │
├─────────────────────────────────┤
│                                 │
│ EmotiFlow v1.0.0               │
│ Emotional Wellness Companion    │
│                                 │
│ Built with:                     │
│ • React + TypeScript            │
│ • Chrome Gemini Nano API       │
│ • Face-api.js                  │
│ • Web Audio API                │
│ • IndexedDB + AES-256          │
│                                 │
│ Privacy First 🔒               │
│ All processing on-device       │
│ No data collection             │
│                                 │
│ [📖 Documentation]             │
│ [🐛 Report Issue]              │
│ [⭐ Rate on Chrome Store]      │
│                                 │
└─────────────────────────────────┘
```

---

## Timeline Tab (Click 📅)

### View Your Emotions Over Time

```
┌──────────────────────────────────┐
│ 📅 Emotion Timeline              │
├──────────────────────────────────┤
│                                  │
│ Today (Oct 26)                   │
│                                  │
│ [Cyan] [Cyan] [Red] [Orange]    │
│ 9am    10am   11am   12pm        │
│                                  │
│ [Cyan] [Red]  [Cyan] [Calm]     │
│ 1pm    2pm    3pm    4pm (now)   │
│                                  │
│ Color Legend:                    │
│ 🔵 Calm (blue)                  │
│ 🔴 Stressed (red)               │
│ 🟠 Anxious (orange)             │
│ 🟣 Sad (purple)                 │
│ 🟡 Happy (yellow)               │
│ 🟢 Energized (green)            │
│ ⚫ Neutral/Fatigued (gray)       │
│                                  │
│ Hover over colors to see:        │
│ • Exact time                     │
│ • Emotion name                   │
│ • Confidence %                   │
│ • Duration                       │
│                                  │
└──────────────────────────────────┘
```

---

## Statistics Tab (Click 📊)

### View Trends & Insights

```
┌──────────────────────────────────┐
│ 📊 Statistics                    │
├──────────────────────────────────┤
│                                  │
│ Today's Emotions                 │
│                                  │
│ Calm        ████████░ 65%       │
│ Stressed    ████░     25%        │
│ Anxious     ██░       10%        │
│                                  │
│ This Week                        │
│ • Most common: Calm (72%)       │
│ • Least common: Fatigued (5%)   │
│ • Average confidence: 81%        │
│                                  │
│ Interventions                    │
│ • Completed this week: 8        │
│ • Most helpful: Breathing       │
│ • Wellness streak: 3 days       │
│                                  │
│ Trends                           │
│ ▲ Stress down 15% vs last week  │
│ ✓ Meditation streak: 5 days     │
│                                  │
└──────────────────────────────────┘
```

---

## Troubleshooting: What If...

### "Still shows Analyzing after 30 seconds?"

**Likely causes:**

1. **Models downloading**
   - Face-api model = ~30MB
   - First-time setup = 1-2 minutes
   - **Just wait, it's normal**

2. **Camera/Mic permissions needed**
   - Click the **lock icon** in address bar
   - Set Camera and Microphone to **"Allow"**
   - Reload extension

3. **Poor lighting**
   - Facial detection needs good lighting
   - Sit facing a window or lamp
   - Avoid strong backlighting

### "Shows emotion but no interventions?"

**Why:** You're in a positive state!
- Only suggests interventions for stressed/anxious emotions
- If you're calm → No intervention needed ✓

### "Dashboard won't open?"

1. Click EmotiFlow icon
2. Look for **"Dashboard"** button
3. If not visible:
   - Reload extension: `chrome://extensions`
   - Find EmotiFlow → Click reload

### "Data not saving?"

1. Check **Storage permission** is granted
   - Settings icon → Gear → Privacy
   - See storage status
2. Check available disk space
3. Try **"Clear Data"** and restart

---

## Your First 5 Minutes (Quick Summary)

**Minute 1:** Click EmotiFlow icon
- See "Analyzing..." popup

**Minute 2:** Wait for emotion detection
- Should change from "Analyzing..." to actual emotion

**Minute 3:** Click "Dashboard"
- See full side panel with all features

**Minute 4:** Check timeline
- See colored blocks showing emotion history

**Minute 5:** Try an intervention (if offered)
- Click "Try Now" on any suggestion
- Complete the breathing/movement/gratitude exercise

**✅ Done!** You're now using EmotiFlow! 🎉

---

## You're All Set! 🚀

The popup you're seeing is just the beginning. Once "Analyzing..." finishes:

1. ✅ Click **Dashboard** to see full interface
2. ✅ View your **Emotion Timeline**
3. ✅ Check **Statistics**
4. ✅ Try **Wellness Interventions**
5. ✅ Manage **Privacy Settings**

**Everything should work smoothly from there!** 💙

If anything doesn't load, check the Troubleshooting section above.
