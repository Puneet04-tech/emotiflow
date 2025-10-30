/**
 * Intervention UI - Wellness Micro-Interventions
 * Displays personalized wellness interventions based on emotional state
 * Includes breathing exercises, stretching prompts, gratitude journaling, screen breaks
 */

import { WellnessIntervention, EmotionState, InterventionType } from '../types/index';

let interventionUIEnabled = true;
const toastContainerId = 'emotiflow-toast-container';
let lastInterventionTime = 0;
const INTERVENTION_COOLDOWN = 300000; // 5 minutes between interventions

/**
 * Initialize intervention UI with all wellness features
 */
export const initializeInterventionUI = async (): Promise<void> => {
  try {
    console.log('[InterventionUI] Initializing wellness micro-interventions...');
    
    // Create toast container
    createToastContainer();
    
    // Inject intervention styles
    injectInterventionStyles();

    // Listen for intervention requests
    window.addEventListener('emotiflow-emotion-update', (event: Event) => {
      const customEvent = event as CustomEvent;
      const emotionState = customEvent.detail as EmotionState;

      // Show intervention if needed and cooldown has passed
      const now = Date.now();
      if (emotionState.interventionNeeded && 
          (now - lastInterventionTime) > INTERVENTION_COOLDOWN) {
        lastInterventionTime = now;
        showIntervention(emotionState);
      }
    });

    interventionUIEnabled = true;
    console.log('[InterventionUI] ✓ Wellness interventions ready');
  } catch (error) {
    console.warn('[InterventionUI] Initialization failed:', error);
  }
};

/**
 * Inject intervention styles
 */
const injectInterventionStyles = (): void => {
  const styleId = 'emotiflow-intervention-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
    
    @keyframes breatheIn {
      from { transform: scale(1); }
      to { transform: scale(1.2); }
    }
    
    @keyframes breatheOut {
      from { transform: scale(1.2); }
      to { transform: scale(1); }
    }
    
    .emotiflow-intervention-card:hover {
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    }
    
    .emotiflow-btn-start:hover {
      background: #4f46e5 !important;
      transform: translateY(-1px);
    }
    
    .emotiflow-btn-dismiss:hover {
      background: #f3f4f6 !important;
    }
  `;
  document.head.appendChild(style);
};

/**
 * Create toast container
 */
const createToastContainer = (): void => {
  if (document.getElementById(toastContainerId)) return;

  const container = document.createElement('div');
  container.id = toastContainerId;
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  document.body.appendChild(container);
};

/**
 * Show intervention toast
 */
const showIntervention = (emotionState: EmotionState): void => {
  if (!interventionUIEnabled) return;

  const container = document.getElementById(toastContainerId);
  if (!container) return;

  // Create intervention card
  const card = document.createElement('div');
  card.className = 'emotiflow-intervention-card';
  card.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 12px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
    max-width: 320px;
    animation: slideIn 0.3s ease-out;
    font-size: 14px;
    line-height: 1.5;
  `;

  // Add emotion-specific suggestion
  const suggestion = getInterventionSuggestion(emotionState);

  card.innerHTML = `
    <div style="display: flex; gap: 12px; margin-bottom: 12px;">
      <span style="font-size: 24px;">${getEmotionEmoji(emotionState.primaryEmotion)}</span>
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">Quick Wellness Check</div>
        <div style="color: #666; font-size: 13px;">${suggestion}</div>
      </div>
    </div>
    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button class="emotiflow-btn-dismiss" style="
        padding: 6px 12px;
        border: 1px solid #ddd;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      ">Dismiss</button>
      <button class="emotiflow-btn-start" style="
        padding: 6px 12px;
        border: none;
        background: #3B82F6;
        color: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      ">Try Now</button>
    </div>
  `;

  // Add event listeners
  const dismissBtn = card.querySelector('.emotiflow-btn-dismiss');
  const startBtn = card.querySelector('.emotiflow-btn-start');

  dismissBtn?.addEventListener('click', () => {
    card.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => card.remove(), 300);
  });

  startBtn?.addEventListener('click', () => {
    launchGuidedExperience(emotionState.interventionType || 'breathing');
    card.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => card.remove(), 300);
  });

  // Add hover effects
  dismissBtn?.addEventListener('mouseenter', (e) => {
    const target = e.currentTarget as HTMLElement | null;
    if (target) target.style.background = '#f5f5f5';
  });
  dismissBtn?.addEventListener('mouseleave', (e) => {
    const target = e.currentTarget as HTMLElement | null;
    if (target) target.style.background = 'white';
  });

  startBtn?.addEventListener('mouseenter', (e) => {
    const target = e.currentTarget as HTMLElement | null;
    if (target) target.style.background = '#2563EB';
  });
  startBtn?.addEventListener('mouseleave', (e) => {
    const target = e.currentTarget as HTMLElement | null;
    if (target) target.style.background = '#3B82F6';
  });

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (card.parentNode) {
      card.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => card.remove(), 300);
    }
  }, 10000);

  container.appendChild(card);
};

/**
 * Get intervention suggestion based on emotion
 */
const getInterventionSuggestion = (emotionState: EmotionState): string => {
  // Prefer a suggestedIntervention (structured) if available
  try {
    if ((emotionState as any).suggestedIntervention && (emotionState as any).suggestedIntervention.actionText) {
      return (emotionState as any).suggestedIntervention.actionText;
    }

    // Next, prefer any wellnessSuggestions array provided by the fusion engine
    if ((emotionState as any).wellnessSuggestions && Array.isArray((emotionState as any).wellnessSuggestions) && (emotionState as any).wellnessSuggestions.length > 0) {
      return (emotionState as any).wellnessSuggestions[0];
    }
  } catch (e) {
    // ignore and fall back to canned suggestions
  }

  const suggestions: Record<string, string> = {
    calm: 'You\'re doing well! Keep it up.',
    stressed: 'Take a deep breath and ground yourself.',
    anxious: 'Try the 5-4-6 breathing technique.',
    sad: 'Remember what makes you happy today.',
    happy: 'Wonderful mood! Savor this moment.',
    energized: 'Channel that energy productively.',
    frustrated: 'Take a short break to reset.',
    fatigued: 'Move your body for an energy boost.',
    neutral: 'Everything\'s balanced.',
  };

  return suggestions[emotionState.primaryEmotion] || 'Time for a wellness moment.';
};

/**
 * Get emotion emoji
 */
const getEmotionEmoji = (emotion: string): string => {
  const emojis: Record<string, string> = {
    calm: '😌',
    stressed: '😰',
    anxious: '😟',
    sad: '😢',
    happy: '😊',
    energized: '🚀',
    frustrated: '😠',
    fatigued: '😴',
    neutral: '😐',
  };
  return emojis[emotion] || '😐';
};

/**
 * Launch guided intervention experience
 */
const launchGuidedExperience = (interventionType: string): void => {
  switch (interventionType) {
    case 'breathing':
      launchBreathingExercise();
      break;
    case 'movement':
      launchMovementGuide();
      break;
    case 'gratitude':
      launchGratitudeJournal();
      break;
    case 'break':
      launchBreakTimer();
      break;
    default:
      launchBreathingExercise();
  }
};

/**
 * Breathing exercise
 */
const launchBreathingExercise = (): void => {
  const overlay = createOverlay();

  const breathingCircle = document.createElement('div');
  breathingCircle.style.cssText = `
    position: absolute;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.1));
    border: 2px solid #3B82F6;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: breathing 8s ease-in-out infinite;
  `;

  const instruction = document.createElement('div');
  instruction.style.cssText = `
    position: absolute;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    color: #333;
    font-size: 16px;
    font-weight: 600;
    text-align: center;
    width: 200px;
  `;
  instruction.textContent = 'Breathe in and out slowly';

  overlay.appendChild(breathingCircle);
  overlay.appendChild(instruction);

  // Auto-close after 2 minutes
  setTimeout(() => overlay.remove(), 120000);
};

/**
 * Movement guide
 */
const launchMovementGuide = (): void => {
  const overlay = createOverlay();

  const guide = document.createElement('div');
  guide.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 30px;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  `;

  guide.innerHTML = `
    <div style="font-size: 32px; margin-bottom: 16px;">🤸</div>
    <div style="font-size: 18px; font-weight: 600; margin-bottom: 12px;">Quick Stretch</div>
    <div style="color: #666; margin-bottom: 16px; line-height: 1.6;">
      Stand up and stretch your arms overhead.<br>
      Hold for 15 seconds. Repeat 3 times.<br>
      Feel the tension release.
    </div>
    <button id="emotiflow-movement-done" style="
      padding: 10px 20px;
      background: #22C55E;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    ">Done</button>
  `;

  overlay.appendChild(guide);

  document.getElementById('emotiflow-movement-done')?.addEventListener('click', () => {
    overlay.remove();
  });

  // Auto-close after 2 minutes
  setTimeout(() => overlay.remove(), 120000);
};

/**
 * Gratitude journal
 */
const launchGratitudeJournal = (): void => {
  const overlay = createOverlay();

  const journal = document.createElement('div');
  journal.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    width: 90%;
    max-width: 400px;
  `;

  journal.innerHTML = `
    <div style="font-size: 32px; margin-bottom: 16px; text-align: center;">🙏</div>
    <div style="font-size: 18px; font-weight: 600; margin-bottom: 12px; text-align: center;">Today I'm grateful for...</div>
    <textarea id="emotiflow-gratitude" placeholder="Write one thing you're grateful for..." style="
      width: 100%;
      height: 100px;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-family: inherit;
      resize: none;
      margin-bottom: 12px;
    "></textarea>
    <button id="emotiflow-gratitude-done" style="
      width: 100%;
      padding: 10px;
      background: #22C55E;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    ">Save & Close</button>
  `;

  overlay.appendChild(journal);

  document.getElementById('emotiflow-gratitude-done')?.addEventListener('click', () => {
    overlay.remove();
  });

  // Auto-close after 5 minutes
  setTimeout(() => overlay.remove(), 300000);
};

/**
 * Break timer
 */
const launchBreakTimer = (): void => {
  const overlay = createOverlay();

  let seconds = 120; // 2 minute break
  const timer = document.createElement('div');
  timer.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    font-size: 48px;
    font-weight: 700;
    color: #3B82F6;
  `;

  const updateTimer = () => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

    if (seconds > 0) {
      seconds--;
      setTimeout(updateTimer, 1000);
    } else {
      overlay.remove();
    }
  };

  updateTimer();
  overlay.appendChild(timer);
};

/**
 * Create overlay for guided experiences
 */
const createOverlay = (): HTMLElement => {
  const overlay = document.createElement('div');
  overlay.id = 'emotiflow-guided-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease-out;
  `;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });

  document.body.appendChild(overlay);
  return overlay;
};

/**
 * Add CSS animations
 */
const addAnimationStyles = (): void => {
  if (document.getElementById('emotiflow-animations')) return;

  const style = document.createElement('style');
  style.id = 'emotiflow-animations';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
    @keyframes breathing {
      0%, 100% {
        transform: translate(-50%, -50%) scale(1);
      }
      50% {
        transform: translate(-50%, -50%) scale(1.2);
      }
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
};

// Add animations on init
addAnimationStyles();
