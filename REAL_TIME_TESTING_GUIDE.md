# 🧪 Real-Time Text & Voice Emotion Detection - Testing Guide

## ✅ What Should Happen Now

When you type into ANY text field on a webpage with the extension loaded:

1. **Text Detection (Real-Time)**
   - Console shows: `😊 [Text] #N: emotion (confidence%)`
   - Example: `😞 [Text] #1: angry (87%)`
   - Console shows: `[Background] Processing text data: "angry" (87%) → "frustrated"`
   - Dashboard updates with emotion after 3 seconds

2. **Voice Detection (Microphone)**
   - When you speak: Console shows `[Voice] Classification - tone (confidence: X%)`
   - Dashboard updates with voice emotion
   - Voice + Text combine into primary emotion

---

## 🔍 Quick Troubleshooting Checklist

### Problem: Text emotions not appearing in console

**Step 1: Verify Text Detection is Initialized**
```javascript
// Open Console (F12) and type:
console.log(document.addEventListener)
// Should output: ƒ addEventListener() { [native code] }
```

**Step 2: Check If Event Listeners Are Attached**
```javascript
// Type this in console:
const input = document.querySelector('input');
// Then type in the input field - should see console logs
```

**Step 3: Enable Debug Logging**
Add this to your browser console:
```javascript
localStorage.setItem('emotiflow_debug', 'true');
```

---

## 🧪 Manual Test Cases

### Test 1: Basic Happy Emotion
1. Find a search bar or text field
2. Type: **"I absolutely love this!"**
3. Check console for:
   - `😊 [Text] #N: happy (92%)`
   - `[Background] Processing text data: "happy" (92%)`
4. Check dashboard after 3 seconds - should show emotion

### Test 2: Anger Emotion
1. Type: **"I am very angry about this"**
2. Check console for:
   - `😞 [Text] #N: angry (88%)`
   - `[Background] Processing text data: "angry" (88%)`

### Test 3: Negation Test
1. Type: **"I am not happy"**
2. Check console for:
   - `😞 [Text] #N: sad (78%)`
   - Negation should flip emotion from happy to sad

### Test 4: Calm Emotion
1. Type: **"I feel very calm and peaceful"**
2. Check console for:
   - `😐 [Text] #N: calm (85%)`

### Test 5: Disappointed Emotion
1. Type: **"I am extremely disappointed"**
2. Check console for:
   - `😞 [Text] #N: disappointed (88%)`

---

## 📊 Data Flow Verification

### Flow 1: Text Input Detection
```
User types in input field
    ↓
handleTextInput event listener fires
    ↓
text.length > 10 check
    ↓
analyzeAndSendSentiment() called
    ↓
analyzeSentiment() calls classifyTextEmotionAdvanced()
    ↓
chrome.runtime.sendMessage() sends TEXT_SENTIMENT
    ↓
Background receives in handleMessage()
    ↓
currentTextData stored
    ↓
emotionfusion loop (every 3s) processes it
    ↓
Broadcasting to sidepanel via chrome.runtime.sendMessage()
    ↓
Dashboard receives EMOTION_STATE_UPDATE
    ↓
UI updates with emotion
```

### Check Each Step
**Step 1: Verify event listeners**
```javascript
// In console, find an input field and type text
// Should see in console: [Text] #N: emotion (X%)
// If not: event listener not firing
```

**Step 2: Verify message reaches background**
```javascript
// Check Service Worker logs in Chrome DevTools
// chrome://extensions → EmotiFlow → Service Worker
// Should see: [Background] Updating text data: {...}
```

**Step 3: Verify fusion processes it**
```javascript
// In Service Worker logs
// Should see: [Background] Processing text data: "emotion" (X%) → "emotion"
```

**Step 4: Verify broadcast to sidepanel**
```javascript
// In Sidepanel console (chrome://extensions → EmotiFlow → Sidepanel)
// Should see emotion state updates
```

---

## 🎯 Expected Console Outputs

### When you type: "I love this!"
```
😊 [Text] #1: happy (92%)
[Background] Updating text data: {sentiment: "positive", emotionScore: 92, detailedEmotion: "happy", ...}
[Background] Processing text data: "happy" (92%) → "happy" (weight: 0.25)
[Background] Fused emotion state: happy (92%)
[Background] Broadcasting emotion state to all listeners
```

### When you type: "I hate this!"
```
😞 [Text] #2: angry (85%)
[Background] Updating text data: {sentiment: "negative", emotionScore: 85, detailedEmotion: "angry", ...}
[Background] Processing text data: "angry" (85%) → "frustrated" (weight: 0.25)
[Background] Fused emotion state: frustrated (85%)
[Background] Broadcasting emotion state to all listeners
```

---

## 🔧 Debug Mode

Enable verbose logging:

```javascript
// In browser console
localStorage.setItem('emotiflow_debug', 'true');
location.reload();

// Disable
localStorage.removeItem('emotiflow_debug');
```

---

## 📱 Mobile / Edge Cases

**Minimum text length**: 10 characters (so "I love it" won't trigger, but "I love this!" will)

**Events that trigger text analysis**:
- `input` event (while typing)
- `change` event (when value changes)
- `blur` event (when field loses focus)

---

## ✨ Real-Time Verification

### Live Testing Steps:

1. **Open Extension DevTools**
   - chrome://extensions
   - Enable "Developer Mode"
   - Find EmotiFlow → "Service Worker" → Click to open console

2. **Open Sidepanel**
   - Click extension icon → should show sidepanel on right
   - Go to Dashboard tab

3. **Open Website in Left Panel**
   - Go to Google.com, Twitter, Gmail, etc.
   - Find text input field

4. **Type Text**
   - Type: "I absolutely love this!"
   - **Expected**: 
     - Service Worker console shows text analysis
     - Sidepanel dashboard updates with emotion
     - Confidence shows 90%+

5. **Observe**
   - Emotion should update every 3 seconds if new text is detected
   - Voice should update separately if microphone is active
   - Confidence % should reflect analysis strength

---

## 🚀 If Text Still Not Showing

### Nuclear Option: Full Reset
```bash
# Stop extension
1. chrome://extensions → Find EmotiFlow → OFF

# Clear data
2. chrome://extensions → EmotiFlow → "Clear data" button

# Reload
3. Rebuild extension:
   npm run build

# Load fresh
4. chrome://extensions → "Load unpacked" → select dist/ folder

# Test
5. Open any website, type in search bar
```

---

## 📋 What Each Console Line Means

| Console Output | Location | Meaning |
|---|---|---|
| `😊 [Text] #N: emotion (X%)` | Content Script | Text detected in input field |
| `[Background] Updating text data:` | Service Worker | Background received text message |
| `[Background] Processing text data:` | Service Worker | Fusion is incorporating text |
| `[Background] Fused emotion state:` | Service Worker | Final emotion calculated |
| `[Background] Broadcasting emotion state` | Service Worker | Sending to sidepanel/UI |
| `[Voice] Classification -` | Content Script | Voice detected from microphone |
| `[Voice] Features -` | Content Script | Acoustic features extracted |

---

## 💡 Advanced Debugging

### Check if Content Script is Injected
```javascript
// In any webpage console
window.__emotiflow_loaded
// Should be: true
```

### Verify Text Sentiment Module Loaded
```javascript
// In content script console  (DevTools → Sources → Content Scripts → textSentiment.ts)
// Should show all event listeners attached
```

### Check Message Queue
```javascript
// In background/service worker
console.log('Text data:', currentTextData);
console.log('Voice data:', currentVoiceData);
console.log('Last emotion:', lastEmotionState);
```

---

## 🎯 Success Criteria

- ✅ Type text → console shows emotion within 1 second
- ✅ Emotion confidence 70-95% for clear emotions
- ✅ Dashboard updates within 3 seconds of typing
- ✅ Multiple text entries accumulate (can type several sentences)
- ✅ Negations work ("not happy" → sad)
- ✅ Intensifiers work ("VERY angry" → 95% confidence)
- ✅ Voice detection works separately from text
- ✅ Both text and voice combine in final emotion

---

*If you still don't see emotions after these checks, please share:*
1. Screenshot of console output
2. Screenshot of extension logs (chrome://extensions → Service Worker)
3. What text you typed
4. Browser version
