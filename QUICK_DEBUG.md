# 🚀 QUICK START - Test Text Emotion Detection

## ⚡ Fast Debugging (5 minutes)

### Step 1: Reload Extension
```
chrome://extensions → EmotiFlow → Refresh button
```

### Step 2: Go to Any Website
Example: `google.com` or `twitter.com` or `gmail.com`

### Step 3: Open Console (F12)
Press `F12` → Click "Console" tab

### Step 4: Type in a Text Field
Click on any input box (search bar, text area, etc) and type:

```
i love this
```

### ✅ What You Should See in Console

When you type, you should see these messages appear **in order**:

```
[Text] Input event triggered
[Text] Input detected: "i love this"
[Text] Processing new sentence...
[Text] ✓ EMOTION_STATE_UPDATE: happy (93%)
[Text] Sending TEXT_SENTIMENT to background: { emotion: 'happy', confidence: 93 }
[Text] ✓ MESSAGE sent to background: TEXT_SENTIMENT
```

**If you see all these messages:**
✅ Text detection is **WORKING**

**If console is empty:**
❌ Something is wrong - see troubleshooting below

---

## 🧪 Test Cases

### Test 1: Happy Emotion
```
Input: "i love this"
Expected Emotion: happy (93%)
Expected Confidence: ~93%
```

### Test 2: Negation (NEW FIX)
```
Input: "i am not happy"
Expected Emotion: sad or calm (NOT happy)
Console will show: "[Text] Negation detected: ..."
Expected Confidence: ~75-80%
```

### Test 3: Angry Emotion
```
Input: "i hate this"
Expected Emotion: angry (95%)
Expected Confidence: ~95%
```

### Test 4: Multiple Sentences
```
Type: "i am happy." → press period or Enter
Type: "i am sad"
Expected: Two separate emotion detections
```

---

## ❌ Troubleshooting

### Problem 1: Console Completely Empty
**No messages at all when typing**

**Fix:**
1. Go to `chrome://extensions` → EmotiFlow → Click **Refresh**
2. Reload page: `Ctrl+R`
3. Try typing in a different text field
4. Try a different website

### Problem 2: Only Shows Initialization
**Shows init messages but nothing when you type**

```
[Text] ✓ Text sentiment initialized - listeners attached
(then nothing happens when you type)
```

**Fix:**
1. Make sure you're clicking on an actual text input/textarea
2. Try Gmail compose box
3. Try Google search box
4. Type a complete sentence, not just one word
5. End with: `.` or `!` or `?` or press Enter

### Problem 3: Shows Input but No Emotion
**Shows input detected but not emotion**

```
[Text] Input event triggered
[Text] Input detected: "i love this"
(then stops - no emotion shown)
```

**Fix:**
1. Check browser console for any errors (red text)
2. Check sidepanel is open (right-click extension → "Show sidepanel")
3. Reload extension completely: `chrome://extensions` → Disable → Enable → Refresh

### Problem 4: Wrong Emotion Detected
**Console shows emotion but it's wrong**

```
[Text] ✓ EMOTION_STATE_UPDATE: sad (80%)
(but expected: happy)
```

**Check:**
1. Do you have a negation word? "i am not happy" → correctly shows sad
2. Did you use the right keyword? "happy" vs "happiness"
3. Advanced NLP might interpret differently

---

## 📊 Console Layout Reference

**When initializing (page load):**
```
[Text] Initializing text sentiment...
[Text] ✓ Text sentiment initialized - listeners attached
EmotiFlow Content Script initialized
✓ Text sentiment analysis started
```

**When typing (every keystroke):**
```
[Text] Input event triggered
[Text] Input detected: "your text here"
[Text] Processing new sentence...
```

**When emotion is detected:**
```
[Text] ✓ EMOTION_STATE_UPDATE: happy (93%)
[Text] Sending TEXT_SENTIMENT to background: { emotion: 'happy', confidence: 93 }
[Text] ✓ MESSAGE sent to background: TEXT_SENTIMENT
```

**When negation is detected (special case):**
```
[Text] Negation detected: "am not happy" - using advanced NLP
[Text] ✓ EMOTION_STATE_UPDATE: sad (76%)
```

---

## 🎯 Success Criteria

✅ **You'll know it's working when:**

1. Console shows initialization messages on page load
2. When you type, console shows "Input detected: ..."
3. Console shows "✓ EMOTION_STATE_UPDATE: [emotion] ([confidence]%)"
4. Messages appear IMMEDIATELY as you type
5. Different emotions show different results

❌ **You'll know it's broken when:**

1. No console messages appear at all
2. Messages appear but emotion is always "calm" or "neutral"
3. No messages for specific emotions
4. UI doesn't update with emotion

---

## 📱 Open Sidepanel

To see emotions on the dashboard:

1. **Right-click the EmotiFlow extension icon** (top-right)
2. Click **"Show sidepanel"**
3. You should see the emotion dashboard update in real-time
4. Emotion name, confidence %, and modality breakdown

---

## 🔧 Manual Test in Console

If you want to trigger text analysis manually, paste this in DevTools Console:

```javascript
// Create test input
const input = document.querySelector('textarea') || document.querySelector('input[type="text"]');
if (input) {
  input.value = 'i love this';
  input.dispatchEvent(new Event('input', { bubbles: true }));
} else {
  console.log('No textarea found, create one manually');
}
```

Then watch console for emotion messages.

---

## 📋 Checklist Before Reporting Issue

- [ ] Extension is enabled (chrome://extensions)
- [ ] Extension is **Refreshed** (Refresh button clicked)
- [ ] Page is **Reloaded** (Ctrl+R)
- [ ] Console is open (F12)
- [ ] Typing in actual text field (not URL bar)
- [ ] Text contains complete sentence
- [ ] Watched console for at least 2-3 seconds
- [ ] Tried on multiple websites
- [ ] Tried different emotions (happy, sad, angry)

---

**Expected to see emotions detected in console within 1 second of typing! ⚡**
