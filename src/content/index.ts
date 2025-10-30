/**
 * Content Script Entry Point
 * Coordinates facial detection, voice analysis, and text sentiment monitoring
 */

import { initializeFacialDetection } from './facialDetection';
import { initializeVoiceAnalysis } from './voiceAnalysis';
import { initializeTextSentiment } from './textSentiment';
import { initializePageAdapter, rewriteEmotionalContent, restoreOriginalContent } from './pageAdapter';
import './debugOverlay';
import { initializeInterventionUI } from './interventionUI';
import { EmotionState } from '../types/index';

/**
 * Initialize all content script modules
 */
const initializeContentScript = async (): Promise<void> => {
  console.log('[Content] EmotiFlow Content Script initializing...');

  try {
    // First verify that we're running in a valid context
    if (!document.body) {
      throw new Error('Document body not available');
    }

    // Initialize text sentiment FIRST (doesn't need permissions)
    await initializeTextSentiment();
    console.log('[Content] ✓ Text sentiment analysis started');

    // Check permissions before initializing
    const permissions = await Promise.all([
      navigator.permissions.query({ name: 'microphone' as PermissionName }),
      navigator.permissions.query({ name: 'camera' as PermissionName })
    ]);

    // Initialize voice analysis if microphone is available or promptable
    if (permissions[0].state !== 'denied') {
      try {
        await initializeVoiceAnalysis();
        console.log('[Content] ✓ Voice analysis started');
      } catch (voiceError) {
        console.warn('[Content] Voice analysis failed:', voiceError);
      }
    } else {
      console.log('[Content] Microphone permission denied:', permissions[0].state);
    }

    // Initialize facial detection if camera is available
    if (permissions[1].state !== 'denied') {
      try {
        await initializeFacialDetection();
        console.log('[Content] ✓ Facial detection started');
      } catch (facialError) {
        console.warn('[Content] Facial detection failed:', facialError);
      }
    } else {
      console.log('[Content] Camera permission denied:', permissions[1].state);
    }

    // Initialize UI components
    await initializePageAdapter();
    // Initialize optional debug overlay for dev/demo
    try {
      (window as any).__emotiflow_debug?.initialize?.();
    } catch (e) {
      console.warn('[Content] debug overlay init failed:', e);
    }
    await initializeInterventionUI();

    // Listen for messages from background
    chrome.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
      if (message.type === 'EMOTION_STATE_UPDATE') {
        handleEmotionStateUpdate(message.data as EmotionState);
      }

  // Background can request an immediate content rewrite for the active tab
      if (message.type === 'REQUEST_CONTENT_REWRITE') {
        try {
          const payload = message.data || {};
          const emotionState = payload.emotionState as EmotionState;
          if (emotionState) {
            // Perform rewrite using pageAdapter's rewrite function and reply with success/failure
            rewriteEmotionalContent(emotionState)
              .then(() => sendResponse({ success: true }))
              .catch((err: any) => {
                console.warn('[Content] rewriteEmotionalContent failed:', err);
                sendResponse({ success: false, error: String(err) });
              });
            return true; // Will respond asynchronously
          }
        } catch (e) {
          console.warn('[Content] REQUEST_CONTENT_REWRITE handling error:', e);
          sendResponse({ success: false, error: String(e) });
        }
      }

      // Restore original content on request (undo rewrites)
      if (message.type === 'RESTORE_EMOTIFLOW_ORIGINALS') {
        try {
          restoreOriginalContent();
          sendResponse({ success: true });
        } catch (e) {
          sendResponse({ success: false, error: String(e) });
        }
        return true;
      }
    });

    console.log('✓ All available EmotiFlow modules initialized');
  } catch (error) {
    console.error('Error initializing content script:', error);
  }
};

/**
 * Request necessary permissions from user
 */
const requestPermissions = async (): Promise<boolean> => {
  try {
    const permissionRequests = [];

    // Request camera permission
    permissionRequests.push(
      navigator.permissions.query({ name: 'camera' as any })
        .catch(() => ({ state: 'denied' }))
    );

    // Request microphone permission
    permissionRequests.push(
      navigator.permissions.query({ name: 'microphone' as any })
        .catch(() => ({ state: 'denied' }))
    );

    const results = await Promise.all(permissionRequests);
    
    // At least one permission should be granted
    return results.some((result: any) => result.state === 'granted');
  } catch (error) {
    console.warn('Permission check failed:', error);
    return true; // Continue anyway
  }
};

/**
 * Handle emotion state updates from background worker
 */
const handleEmotionStateUpdate = (emotionState: EmotionState): void => {
  // Dispatch custom event for other modules to listen to
  window.dispatchEvent(
    new CustomEvent('emotiflow-emotion-update', {
      detail: emotionState,
    })
  );

  // Apply adaptive styling based on emotion
  applyAdaptiveStyling(emotionState);
};

/**
 * Apply adaptive styling to the page
 */
const applyAdaptiveStyling = (emotionState: EmotionState): void => {
  let cssRules = '';

  // Base styling based on emotion
  if (emotionState.contentFilterMode === 'dim_negative') {
    cssRules = `
      body {
        filter: sepia(8%) contrast(92%);
      }
      img, video {
        filter: saturate(85%);
      }
      body::before {
        content: '';
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.03), rgba(59, 130, 246, 0.03));
        pointer-events: none;
        z-index: 999999;
      }
    `;
  } else if (emotionState.contentFilterMode === 'reduce_stimulation') {
    cssRules = `
      body {
        filter: brightness(95%);
      }
      body::before {
        content: '';
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(15, 23, 42, 0.02);
        pointer-events: none;
        z-index: 999999;
      }
    `;
  }

  // Apply CSS
  applyCSS(cssRules, 'emotiflow-adaptive-styles');
};

/**
 * Apply CSS to the page
 */
const applyCSS = (cssRules: string, styleId: string): void => {
  let styleElement = document.getElementById(styleId);
  if (styleElement) {
    styleElement.remove();
  }

  if (cssRules) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = cssRules;
    document.head.appendChild(styleElement);
  }
};

// Initialize on document load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
  initializeContentScript();
}
