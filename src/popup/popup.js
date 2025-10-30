// Emotion emoji mapping
const emotionEmojis = {
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

// Open dashboard
document.getElementById('open-dashboard').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD' }, () => {
    window.close();
  });
});

// Toggle tracking
document.getElementById('toggle-tracking').addEventListener('click', () => {
  const btn = document.getElementById('toggle-tracking');
  const isRunning = btn.textContent === 'Pause';
  
  chrome.runtime.sendMessage(
    { type: 'TOGGLE_TRACKING', running: !isRunning },
    () => {
      btn.textContent = isRunning ? 'Resume' : 'Pause';
    }
  );
});

// Settings button
document.getElementById('settings-btn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'OPEN_SETTINGS' }, () => {
    window.close();
  });
});

// Help button
document.getElementById('help-btn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'OPEN_HELP' }, () => {
    window.close();
  });
});

// Load current emotion status
function updateEmotionStatus() {
  chrome.runtime.sendMessage({ type: 'GET_EMOTION_STATE' }, (response) => {
    if (response && response.primaryEmotion) {
      const emoji = emotionEmojis[response.primaryEmotion] || '😐';
      const emotionName = response.primaryEmotion.charAt(0).toUpperCase() + response.primaryEmotion.slice(1);
      const confidence = Math.round((response.confidence || 0) * 100);
      
      document.getElementById('emotion-status').textContent = 
        `${emoji} ${emotionName}\nConfidence: ${confidence}%`;
    }
  });
}

// Update on popup open
updateEmotionStatus();

// Refresh emotion status every 2 seconds
setInterval(updateEmotionStatus, 2000);
