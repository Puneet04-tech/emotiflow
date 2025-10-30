// Emotion emoji mapping
const emotionEmojis: Record<string, string> = {
  calm: '😌',
  stressed: '😰',
  anxious: '😟',
  sad: '😢',
  happy: '😊',
  energized: '🚀',
  frustrated: '😠',
  fatigued: '😴',
  neutral: '😐'
};

// Open dashboard (open sidepanel)
const openDashboardBtn = document.getElementById('open-dashboard');
if (openDashboardBtn) {
  openDashboardBtn.addEventListener('click', async () => {
    try {
      // Use Chrome API to open sidepanel
      await (chrome.sidePanel as any).open({ tabId: (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id });
      // Close popup after opening sidepanel
      setTimeout(() => window.close(), 500);
    } catch (error) {
      console.error('Error opening sidepanel:', error);
      // Fallback: send message to background (safe)
      try {
        // Lazy-import shared messaging to avoid circularity
        const { sendMessageSafe } = await import('../utils/messaging');
        await sendMessageSafe({ type: 'OPEN_DASHBOARD' });
      } catch (err) {
        console.warn('[Popup] OPEN_DASHBOARD fallback failed:', err);
      }
      setTimeout(() => window.close(), 500);
    }
  });
}

// Toggle tracking
const toggleTrackingBtn = document.getElementById('toggle-tracking');
if (toggleTrackingBtn) {
  toggleTrackingBtn.addEventListener('click', () => {
    const btn = toggleTrackingBtn as HTMLButtonElement;
    const isRunning = btn.textContent === 'Pause';
    
    chrome.runtime.sendMessage(
      { type: 'TOGGLE_TRACKING', running: !isRunning },
      (response: any) => {
        if (chrome.runtime.lastError) {
          console.warn('[Popup] TOGGLE_TRACKING sendMessage error:', chrome.runtime.lastError.message);
          // Toggle UI optimistically
          btn.textContent = isRunning ? 'Resume' : 'Pause';
          return;
        }

        if (response && !response.error) {
          btn.textContent = isRunning ? 'Resume' : 'Pause';
        }
      }
    );
  });
}

// Settings button - open in new tab
const settingsBtn = document.getElementById('settings-btn');
if (settingsBtn) {
  settingsBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_SETTINGS' }, () => {
      if (chrome.runtime.lastError) {
        console.warn('[Popup] OPEN_SETTINGS sendMessage error:', chrome.runtime.lastError.message);
      }
      setTimeout(() => window.close(), 300);
    });
  });
}

// Help button - open in new tab
const helpBtn = document.getElementById('help-btn');
if (helpBtn) {
  helpBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_HELP' }, () => {
      if (chrome.runtime.lastError) {
        console.warn('[Popup] OPEN_HELP sendMessage error:', chrome.runtime.lastError.message);
      }
      setTimeout(() => window.close(), 300);
    });
  });
}

// Load current emotion status
function updateEmotionStatus() {
  chrome.runtime.sendMessage({ type: 'GET_EMOTION_STATE' }, (response: any) => {
    if (chrome.runtime.lastError) {
      console.warn('[Popup] GET_EMOTION_STATE error:', chrome.runtime.lastError.message);
      const emotionStatusEl = document.getElementById('emotion-status');
      if (emotionStatusEl) {
        emotionStatusEl.textContent = 'Unavailable';
      }
      return;
    }

    if (response && response.primaryEmotion) {
      const emoji = emotionEmojis[response.primaryEmotion] || '😐';
      const emotionName = response.primaryEmotion.charAt(0).toUpperCase() + response.primaryEmotion.slice(1);
      const confidence = Math.round((response.confidence || 0) * 100);
      
      const emotionStatusEl = document.getElementById('emotion-status');
      if (emotionStatusEl) {
        emotionStatusEl.textContent = `${emoji} ${emotionName}\nConfidence: ${confidence}%`;
      }
    }
  });
}

// Update on popup open
updateEmotionStatus();

// Refresh emotion status every 2 seconds
setInterval(updateEmotionStatus, 2000);
