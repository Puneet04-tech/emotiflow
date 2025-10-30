# 🔍 Debug Console Guide - Testing Emotion Detection

## 📋 What to Do

### Step 1: Reload Extension
1. Go to `chrome://extensions`
2. Find **EmotiFlow**
3. Click **Refresh** button

### Step 2: Open DevTools Console
1. Go to any website (e.g., google.com, twitter.com, gmail.com)
2. Press **F12** to open DevTools
3. Click on **Console** tab
4. Clear any existing messages (⊗ icon)

### Step 3: Look for These Initialization Messages
You should see **immediately** when page loads:

```
[Text] Initializing text sentiment...
[Text] ✓ Text sentiment initialized - listeners attached
```

**If you DON'T see these messages:**
- ❌ Extension may not be loaded
- ❌ Content script not injected
- ❌ Try refreshing page (Ctrl+R)
- ❌ Check manifest permissions

### Step 4: Type Text and Watch Console

#### Test Case 1: Happy
```
Type in any text field: "i love this"
Expected console output:
  [Text] Input event triggered
  [Text] Input detected: "i love this"
  [Text] Processing new sentence...
  [Text] ✓ EMOTION_STATE_UPDATE sent: happy (93%)
  [Text] MESSAGE sent to background: TEXT_SENTIMENT
```

#### Test Case 2: Negation (The Fix)
```
Type in any text field: "i am not happy"
Expected console output:
  [Text] Input event triggered
  [Text] Input detected: "i am not happy"
  [Text] Processing new sentence...
  [Text] Negation detected: "am not happy" - using advanced NLP
  [Text] ✓ EMOTION_STATE_UPDATE sent: sad (75-80%)
  [Text] MESSAGE sent to background: TEXT_SENTIMENT
```

**Important:** The negation message proves the fix is working!

#### Test Case 3: Angry
```
Type in any text field: "i am angry"
Expected console output:
  [Text] Input event triggered
  [Text] Input detected: "i am angry"
  [Text] Processing new sentence...
  [Text] ✓ EMOTION_STATE_UPDATE sent: angry (95%)
  [Text] MESSAGE sent to background: TEXT_SENTIMENT
```

#### Test Case 4: Multiple Sentences
```
Type: "i am happy" → press Enter/period
Then type: "i am sad"

Console should show TWO separate analyses:
First:
  [Text] Input detected: "i am happy"
  [Text] ✓ EMOTION_STATE_UPDATE sent: happy (93%)

Second (after new sentence):
  [Text] Input detected: "i am sad"
  [Text] Same sentence, skipping duplicate processing  ← if you type more in same sentence
  [Text] Processing new sentence...
  [Text] ✓ EMOTION_STATE_UPDATE sent: sad (92%)
```

---

## 🎯 Console Messages Meaning

| Message | Meaning |
|---------|---------|
| `[Text] Initializing text sentiment...` | Starting up text analysis |
| `[Text] ✓ Text sentiment initialized` | Successfully started |
| `[Text] Input event triggered` | User typed something |
| `[Text] Input detected: "..."` | Sentence extracted |
| `[Text] Processing new sentence...` | Analyzing for emotion |
| `[Text] Same sentence, skipping` | Duplicate (ignore) |
| `[Text] Negation detected: "..."` | Negation found (uses advanced NLP) |
| `[Text] ✓ EMOTION_STATE_UPDATE sent` | UI should update NOW |
| `[Text] MESSAGE sent to background` | Background worker received emotion |

---

## ❌ Troubleshooting

### Console is Completely Empty
**Problem:** No initialization messages at all

**Solutions:**
1. Reload extension: `chrome://extensions` → Refresh EmotiFlow
2. Reload page: `Ctrl+R`
3. Check console filter (top-left): should be "All levels"
4. Try a different website

### Console Shows Init but No Input Messages
**Problem:** Text sentiment initialized but nothing happens when you type

**Solutions:**
1. Make sure you're typing in a text field (input, textarea, contenteditable)
2. Check if input is visible in DevTools
3. Try a Gmail compose box or Google search bar
4. Try typing a sentence ending with: `.` `!` `?`

### Wrong Emotion Detected
**Problem:** Typed "happy" but got "sad"

**Solutions:**
1. Check console for negation message
2. Verify the keyword is exact: "happy" vs "happier"
3. Look at Advanced NLP confidence score
4. Review keyword list in textSentiment.ts

### UI Not Updating
**Problem:** Console shows emotion detected but sidepanel still blank

**Solutions:**
1. Open sidepanel: Right-click extension icon → "Show sidepanel"
2. Check if sidepanel shows any content
3. Look for background script messages
4. Check chrome://extensions for any errors

---

## 📊 Expected Console Flow

### 1. **Page Load**
```
✓ [Text] Initializing text sentiment...
✓ [Text] ✓ Text sentiment initialized - listeners attached
```

### 2. **User Types**
```
[Text] Input event triggered
[Text] Input detected: "i love this"
[Text] Processing new sentence...
```

### 3. **Emotion Analysis**
```
✓ [Text] ✓ EMOTION_STATE_UPDATE sent: happy (93%)
✓ [Text] MESSAGE sent to background: TEXT_SENTIMENT
```

### 4. **UI Updates**
```
(Sidepanel shows: 😊 happy 93%)
```

---

## 🔧 Advanced: Enable Detailed Logging

Add this to DevTools Console to see even more details:

```javascript
// Override to see message content
const originalSendMessage = chrome.runtime.sendMessage;
chrome.runtime.sendMessage = function(message, ...args) {
  console.log('[Debug] Message sent:', message);
  return originalSendMessage.apply(this, [message, ...args]);
};
```

---

## ✅ All Systems Go Checklist

Before concluding there's an issue, verify:

- [ ] Extension installed (chrome://extensions)
- [ ] Extension enabled (toggle switch ON)
- [ ] Page reloaded after refresh (Ctrl+R)
- [ ] Console open (F12 → Console tab)
- [ ] Typing in actual text field (not URL bar)
- [ ] Text is meaningful (not just random chars)
- [ ] Watching for `[Text]` prefix in messages
- [ ] Sidepanel opened (right-click icon → show sidepanel)

---

## 📸 What Console Should Look Like

**When typing "i love this":**

```
[Text] Initializing text sentiment...
[Text] ✓ Text sentiment initialized - listeners attached
EmotiFlow Content Script initialized
✓ Text sentiment analysis started
...
[Text] Input event triggered
[Text] Input detected: "i love this"
[Text] Processing new sentence...
[Text] ✓ EMOTION_STATE_UPDATE sent: happy (93%)
[Text] MESSAGE sent to background: TEXT_SENTIMENT
```

**When typing "i am not happy":**

```
[Text] Input event triggered
[Text] Input detected: "i am not happy"
[Text] Processing new sentence...
[Text] Negation detected: "am not happy" - using advanced NLP
[Text] ✓ EMOTION_STATE_UPDATE sent: sad (76%)
[Text] MESSAGE sent to background: TEXT_SENTIMENT
```

---

## 🚀 Quick Test Command

Paste into DevTools Console to simulate text input:

```javascript
// Create a test input
const input = document.createElement('textarea');
input.value = 'i am happy';
document.body.appendChild(input);
input.focus();

// Trigger input event
input.dispatchEvent(new Event('input', { bubbles: true }));

// You should see console messages now
// Remove test: input.remove();
```

---

*If you see all the expected messages, emotion detection is working! ✅*
