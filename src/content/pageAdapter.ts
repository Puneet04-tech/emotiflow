/**
 * Page Adapter - Real-Time Adaptive Browsing
 * Handles CSS injection and content rewriting for emotional adaptation
 * Implements dynamic styling, content rewriting, and visual adaptation
 */

import { EmotionState, ContentFilterMode } from '../types/index';
import { emotionColorMap, emotionLightColorMap } from '../utils/emotions';
import { classifyTextEmotionAdvanced } from '../utils/advancedNLP';
import { callRewriterAPI } from '../utils/aiPrompts';

let pageAdapterEnabled = true;
const styleId = 'emotiflow-adaptive-styles';
let lastAppliedEmotion: string | null = null;
let rewrittenElements = new WeakSet<HTMLElement>();
const ambientId = 'emotiflow-ambient-indicator';

/**
 * Initialize page adapter with all features
 */
export const initializePageAdapter = async (): Promise<void> => {
  try {
    console.log('[PageAdapter] Initializing adaptive browsing features...');
    
    // Listen for emotion state updates
    window.addEventListener('emotiflow-emotion-update', (event: Event) => {
      const customEvent = event as CustomEvent;
      const emotionState = customEvent.detail as EmotionState;
      
      // Apply all adaptations
      updateAmbientIndicator(emotionState);
      applyEmotionalStyling(emotionState);
      rewriteEmotionalContent(emotionState);
      // Show contextual suggestions / interventions in-page when fusion recommends
      showInterventionForEmotion(emotionState).catch(() => {});
    });

    // Create ambient indicator UI
    createAmbientIndicator();

  // Initialize composer assistant for calming suggestions
  initComposerAssistant();

    pageAdapterEnabled = true;
    console.log('[PageAdapter] ✓ Adaptive browsing initialized - ready for real-time adaptation');
  } catch (error) {
    console.warn('[PageAdapter] Initialization failed:', error);
  }
};

/**
 * Apply comprehensive emotional styling to the page
 */
export const applyEmotionalStyling = (emotionState: EmotionState): void => {
  if (!pageAdapterEnabled) return;

  const emotion = emotionState.primaryEmotion;
  const confidence = emotionState.confidence;
  const filterMode = emotionState.contentFilterMode;

  // Skip if confidence is too low or emotion hasn't changed significantly
  if (confidence < 50 || emotion === lastAppliedEmotion) {
    return;
  }

  console.log(`[PageAdapter] Applying ${emotion} styling (${confidence}% confidence, mode: ${filterMode})`);
  lastAppliedEmotion = emotion;

  let cssRules = '';
  const emotionColor = emotionColorMap[emotion] || '#6366f1';
  const emotionLightColor = emotionLightColorMap[emotion] || '#e0e7ff';

  // Base adaptive styling based on emotional state
  switch (emotion) {
    case 'stressed':
    case 'anxious':
      // Dim harsh colors, reduce contrast, calm visuals
      cssRules = `
        body {
          filter: sepia(12%) contrast(88%) brightness(98%);
          transition: filter 2s ease-in-out;
        }
        body::before {
          content: '';
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, rgba(147, 197, 253, 0.08), rgba(191, 219, 254, 0.04));
          pointer-events: none;
          z-index: 999998;
          opacity: ${Math.min(confidence / 100, 0.3)};
          transition: opacity 2s ease-in-out;
        }
        img, video {
          filter: saturate(75%) brightness(95%);
          transition: filter 1.5s ease-in-out;
        }
        h1, h2, h3 {
          color: #475569 !important;
          font-weight: 500 !important;
        }
        button, a.button, input[type="submit"] {
          filter: brightness(98%) saturate(90%);
        }
      `;
      break;

    case 'sad':
      // Soften tones, add warmth, gentle contrast
      cssRules = `
        body {
          filter: sepia(8%) saturate(110%) brightness(102%);
          transition: filter 2s ease-in-out;
        }
        body::before {
          content: '';
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.06), rgba(253, 224, 71, 0.03));
          pointer-events: none;
          z-index: 999998;
          transition: opacity 2s ease-in-out;
        }
        h1, h2, h3 {
          color: #78716c !important;
        }
      `;
      break;

    case 'frustrated':
      // Reduce stimulation, desaturate reds
      cssRules = `
        body {
          filter: saturate(85%) contrast(92%);
          transition: filter 2s ease-in-out;
        }
        body::before {
          content: '';
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(226, 232, 240, 0.12);
          pointer-events: none;
          z-index: 999998;
        }
      `;
      break;

    case 'fatigued':
      // Increase readability, reduce eye strain
      cssRules = `
        body {
          filter: brightness(105%) contrast(110%);
          font-size: 106% !important;
          line-height: 1.7 !important;
          letter-spacing: 0.01em !important;
          transition: all 2s ease-in-out;
        }
        p, li, span, div {
          font-size: inherit !important;
          line-height: inherit !important;
        }
        h1, h2, h3, h4, h5, h6 {
          font-weight: 600 !important;
          margin-top: 1.5em !important;
          margin-bottom: 0.8em !important;
        }
      `;
      break;

    case 'happy':
    case 'energized':
      // Enhance vibrancy slightly
      cssRules = `
        body {
          filter: saturate(105%) brightness(101%);
          transition: filter 2s ease-in-out;
        }
      `;
      break;

    case 'calm':
    case 'neutral':
    default:
      // Minimal or no filter
      cssRules = `
        body {
          filter: none;
          transition: filter 2s ease-in-out;
        }
      `;
      break;
  }

  // Apply the CSS
  applyCSS(cssRules);
};

/**
 * Apply CSS to the page
 */
const applyCSS = (cssRules: string): void => {
  let styleElement = document.getElementById(styleId) as HTMLStyleElement;

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

/**
 * Create an ambient emotion indicator (floating ring) and append to document
 */
const createAmbientIndicator = (): void => {
  try {
    if (document.getElementById(ambientId)) return;

    const el = document.createElement('div');
    el.id = ambientId;
    el.style.cssText = `
      position: fixed;
      top: 18px;
      right: 18px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      pointer-events: none;
      z-index: 999999;
      box-shadow: 0 0 0 4px rgba(0,0,0,0.04) inset;
      transition: box-shadow 600ms ease, transform 400ms ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const inner = document.createElement('div');
    inner.style.cssText = `
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #9ca3ff;
      box-shadow: 0 0 18px rgba(99,102,241,0.45);
      transition: background 600ms ease, box-shadow 600ms ease, transform 300ms ease;
    `;

    el.appendChild(inner);
    document.body.appendChild(el);
  } catch (e) {
    // ignore DOM errors
  }
};

/**
 * Composer assistant: detects text composers and intercepts send to suggest calm/balanced rewrite
 */
const initComposerAssistant = (): void => {
  try {
    // Avoid creating multiple assistants
    if ((window as any).__emotiflow_composer_installed) return;
    (window as any).__emotiflow_composer_installed = true;

    const observer = new MutationObserver(() => {
      attachToComposers();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial pass
    attachToComposers();
  } catch (e) {
    console.warn('[PageAdapter] Composer assistant init failed:', e);
  }
};

const attachToComposers = (): void => {
  try {
    const selectors = 'textarea, input[type="text"], [contenteditable="true"]';
    const nodes = Array.from(document.querySelectorAll(selectors)) as HTMLElement[];

    nodes.forEach((node) => {
      // Skip inputs that are part of forms we can't intercept (e.g., search boxes)
      if ((node as any).__emotiflow_composer_attached) return;
      (node as any).__emotiflow_composer_attached = true;

      // Find parent form or nearest send button
      const form = node.closest('form');

      // Insert assistant UI near the node
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerText = 'Calm-check ✨';
      btn.style.cssText = 'position:relative; margin-left:8px; padding:4px 8px; font-size:12px; border-radius:6px; border:none; cursor:pointer; background:rgba(255,255,255,0.03); color:var(--text);';

      // When clicked, analyze and propose rewrite
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          const text = getComposerText(node);
          if (!text || text.trim().length < 8) return;
          const nlp = classifyTextEmotionAdvanced(text);
          console.log('[ComposerAssistant] NLP:', nlp);
          if (nlp.confidence >= 65 && (nlp.emotion === 'sad' || nlp.emotion === 'angry' || nlp.emotion === 'frustrated' || nlp.emotion === 'stressed')) {
            // Offer a rewrite
            const suggestion = await rewriteTextBalanced(text);
            showComposerSuggest(node, suggestion);
          } else {
            showComposerToast('Looks fine — no strong emotion detected');
          }
        } catch (err) {
          console.warn('[ComposerAssistant] Error analyzing composer:', err);
        }
      });

      // Try to insert after node if it has a parent that allows insertion
      try {
        if (node.parentElement) node.parentElement.appendChild(btn);
      } catch (e) {
        // fallback: append to body (not ideal)
        document.body.appendChild(btn);
      }

      // Intercept form submit or common send buttons
      if (form) {
        form.addEventListener('submit', async (ev) => {
          try {
            const text = getComposerText(node);
            if (!text || text.trim().length < 6) return;
            const nlp = classifyTextEmotionAdvanced(text);
            if (nlp.confidence >= 75 && (nlp.emotion === 'angry' || nlp.emotion === 'stressed' || nlp.emotion === 'frustrated')) {
              // Prevent immediate submit and show suggestion
              ev.preventDefault();
              ev.stopPropagation();
              const suggestion = await rewriteTextBalanced(text);
              showComposerSuggest(node, suggestion, () => {
                // After user applies or dismisses we programmatically submit
                try { (form as HTMLFormElement).submit(); } catch (e) { console.warn('Submit failed after suggestion apply:', e); }
              });
            }
          } catch (e) { console.warn('[ComposerAssistant] submit intercept error:', e); }
        }, true);
      }
    });
  } catch (e) {
    console.warn('[ComposerAssistant] attach error:', e);
  }
};

const getComposerText = (node: HTMLElement): string => {
  if (!node) return '';
  if (node.tagName.toLowerCase() === 'textarea' || (node as HTMLInputElement).value !== undefined) {
    return (node as HTMLInputElement).value || '';
  }
  if (node.isContentEditable) {
    return node.textContent || '';
  }
  return (node as HTMLInputElement).value || '';
};

const showComposerToast = (message: string): void => {
  try {
    const id = 'emotiflow-composer-toast';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.style.cssText = 'position:fixed; right:18px; bottom:18px; background:rgba(15,23,42,0.9); color:var(--text); padding:10px 14px; border-radius:10px; z-index:999999; box-shadow:0 6px 18px rgba(0,0,0,0.6);';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 1 }, { opacity: 0 }], { duration: 4000 });
    setTimeout(() => { try { el?.remove(); } catch {} }, 4200);
  } catch (e) {}
};

const showComposerSuggest = (node: HTMLElement, suggestion: string, onDone?: () => void): void => {
  try {
    const wrapId = 'emotiflow-composer-suggest';
    let container = document.getElementById(wrapId);
    if (container) container.remove();

    container = document.createElement('div');
    container.id = wrapId;
    container.style.cssText = 'position:fixed; right:18px; bottom:80px; width:360px; max-width:calc(100% - 40px); background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); color:var(--text); padding:12px; border-radius:10px; box-shadow:0 8px 28px rgba(2,6,23,0.7); z-index:999999;';

    const title = document.createElement('div');
    title.style.cssText = 'font-weight:700; margin-bottom:8px;';
    title.textContent = 'EmotiFlow Suggestion — Calmer tone';

    const body = document.createElement('div');
    body.style.cssText = 'font-size:13px; color:var(--muted); margin-bottom:10px; max-height:160px; overflow:auto;';
    body.textContent = suggestion;

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex; gap:8px; justify-content:flex-end;';

    const applyBtn = document.createElement('button');
    applyBtn.textContent = 'Apply suggestion';
    applyBtn.style.cssText = 'padding:8px 12px; border-radius:8px; background:linear-gradient(90deg,var(--accent-1),var(--accent-2)); color:white; border:none; cursor:pointer;';
    applyBtn.onclick = () => {
      try {
        applySuggestionToComposer(node, suggestion);
        container?.remove();
        showComposerToast('Suggestion applied — you can edit before sending');
        if (onDone) onDone();
      } catch (e) { console.warn('applySuggestion failed', e); }
    };

    const dismissBtn = document.createElement('button');
    dismissBtn.textContent = 'Dismiss';
    dismissBtn.style.cssText = 'padding:8px 12px; border-radius:8px; background:transparent; color:var(--muted); border:1px solid rgba(255,255,255,0.04); cursor:pointer;';
    dismissBtn.onclick = () => { container?.remove(); if (onDone) onDone(); };

    actions.appendChild(dismissBtn);
    actions.appendChild(applyBtn);

    container.appendChild(title);
    container.appendChild(body);
    container.appendChild(actions);

    document.body.appendChild(container);
  } catch (e) { console.warn('[ComposerAssistant] show suggest error:', e); }
};

const applySuggestionToComposer = (node: HTMLElement, suggestion: string): void => {
  try {
    if (!node) return;
    if (node.tagName.toLowerCase() === 'textarea' || (node as HTMLInputElement).value !== undefined) {
      (node as HTMLInputElement).value = suggestion;
      node.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (node.isContentEditable) {
      node.textContent = suggestion;
      node.dispatchEvent(new Event('input', { bubbles: true }));
    }
  } catch (e) { console.warn('[ComposerAssistant] apply error:', e); }
};

/**
 * Update ambient indicator color and pulse based on emotion state
 */
const updateAmbientIndicator = (emotionState: EmotionState): void => {
  try {
    const el = document.getElementById(ambientId);
    if (!el) return;
    const inner = el.firstElementChild as HTMLElement;
    if (!inner) return;

    const color = (emotionLightColorMap as any)[emotionState.primaryEmotion] || '#9ca3ff';
    const main = (emotionColorMap as any)[emotionState.primaryEmotion] || '#6366f1';
    const confidence = Math.max(0, Math.min(100, emotionState.confidence || 50));

    // Set inner color and shadow intensity based on confidence
    inner.style.background = main;
    inner.style.boxShadow = `0 0 ${8 + (confidence / 10)}px ${main}66`;

    // Pulse the outer ring by adjusting box-shadow spread
    const spread = Math.min(18, 4 + Math.floor(confidence / 6));
    (el as HTMLElement).style.boxShadow = `0 0 0 ${spread}px ${color}22`;

    // Small transform for emphasis when confidence high
    if (confidence > 75) {
      inner.style.transform = 'scale(1.12)';
      el.style.transform = 'scale(1.03)';
    } else {
      inner.style.transform = 'scale(1)';
      el.style.transform = 'scale(1)';
    }
  } catch (e) {
    // ignore
  }
};

// Simple cooldown map to avoid repeating suggestions too often per page
const suggestionCooldownMs = 3 * 60 * 1000; // 3 minutes
let lastSuggestionTs: number = 0;

/**
 * When fusion suggests an intervention, request one from background and show it in-page
 */
const showInterventionForEmotion = async (emotionState: EmotionState): Promise<void> => {
  try {
    if (!emotionState) return;

    // Only show if intervention needed or high confidence negative emotion
    const shouldShow = emotionState.interventionNeeded || (emotionState.confidence >= 85 && ['stressed', 'anxious', 'sad', 'frustrated'].includes(emotionState.primaryEmotion));
    if (!shouldShow) return;

    if (Date.now() - lastSuggestionTs < suggestionCooldownMs) {
      // cooldown active
      return;
    }

    lastSuggestionTs = Date.now();

    // If the fused state already includes a suggested intervention, use that first
    if ((emotionState as any).suggestedIntervention) {
      try {
        showInterventionPopover((emotionState as any).suggestedIntervention, emotionState.primaryEmotion);
      } catch (e) {
        console.warn('[PageAdapter] Failed to show suggestedIntervention from state:', e);
      }
      return;
    }

    // Ask background for a suggested intervention as a fallback
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: 'REQUEST_INTERVENTION' }, (intervention: any) => {
          if (chrome.runtime.lastError) {
            console.warn('[PageAdapter] Intervention request failed:', chrome.runtime.lastError.message);
            resolve();
            return;
          }

          if (!intervention) {
            resolve();
            return;
          }

          // Show popover with intervention.actionText and buttons
          showInterventionPopover(intervention, emotionState.primaryEmotion);
          resolve();
        });
      } catch (e) {
        console.warn('[PageAdapter] REQUEST_INTERVENTION error:', e);
        resolve();
      }
    });
  } catch (e) {
    // ignore
  }
};

/**
 * Render a simple intervention popover in-page
 */
const showInterventionPopover = (intervention: any, primaryEmotion: string): void => {
  try {
    const id = 'emotiflow-intervention-popover';
    let el = document.getElementById(id);
    if (el) el.remove();

    el = document.createElement('div');
    el.id = id;
    el.style.cssText = `position:fixed; right:18px; bottom:18px; width:360px; max-width:calc(100% - 40px); background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); color:var(--text); padding:14px; border-radius:12px; box-shadow:0 10px 36px rgba(2,6,23,0.7); z-index:999999;`;

    const title = document.createElement('div');
    title.style.cssText = 'font-weight:700; margin-bottom:8px;';
    title.textContent = `Suggestion — ${primaryEmotion}`;

    const body = document.createElement('div');
    body.style.cssText = 'font-size:13px; color:var(--muted); margin-bottom:12px; max-height:180px; overflow:auto;';
    body.textContent = intervention.actionText || 'Try a short grounding exercise';

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex; gap:8px; justify-content:flex-end;';

    const startBtn = document.createElement('button');
    startBtn.textContent = intervention.interventionType === 'breathing' ? 'Start breathing' : 'Try suggestion';
    startBtn.style.cssText = 'padding:8px 12px; border-radius:8px; background:linear-gradient(90deg,var(--accent-1),var(--accent-2)); color:white; border:none; cursor:pointer;';
    startBtn.onclick = () => {
      try {
        if (intervention.interventionType === 'breathing') {
          startBreathingOverlay(intervention.estimatedDuration || 30);
        } else {
          showComposerToast(intervention.actionText || 'Try this: ' + intervention.actionText);
        }
        el?.remove();
      } catch (e) { console.warn('start action failed', e); }
    };

    const dismissBtn = document.createElement('button');
    dismissBtn.textContent = 'Dismiss';
    dismissBtn.style.cssText = 'padding:8px 12px; border-radius:8px; background:transparent; color:var(--muted); border:1px solid rgba(255,255,255,0.04); cursor:pointer;';
    dismissBtn.onclick = () => { el?.remove(); };

    actions.appendChild(dismissBtn);
    actions.appendChild(startBtn);

    el.appendChild(title);
    el.appendChild(body);
    el.appendChild(actions);

    document.body.appendChild(el);
  } catch (e) {
    console.warn('[PageAdapter] showInterventionPopover error:', e);
  }
};

/**
 * Simple breathing overlay: expands/contracts a circle with counts
 */
const startBreathingOverlay = (durationSec: number): void => {
  try {
    const id = 'emotiflow-breathing-overlay';
    if (document.getElementById(id)) return;

    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.style.cssText = `position:fixed; inset:0; display:flex; align-items:center; justify-content:center; z-index:1000000; background:rgba(2,6,23,0.45);`;

    const circle = document.createElement('div');
    circle.style.cssText = `width:140px; height:140px; border-radius:50%; background: radial-gradient(circle at 30% 20%, rgba(109,126,248,0.25), transparent 40%), radial-gradient(circle at 70% 80%, rgba(139,92,246,0.18), transparent 40%), rgba(255,255,255,0.03); display:flex; align-items:center; justify-content:center; color:var(--text); font-weight:700; font-size:20px; transition: transform 1.6s ease-in-out;`;

    const info = document.createElement('div');
    info.style.cssText = 'text-align:center; color:var(--text); margin-top:12px; font-size:14px;';
    info.textContent = 'Follow the circle — breathe with it';

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:12px;';
    wrapper.appendChild(circle);
    wrapper.appendChild(info);
    overlay.appendChild(wrapper);
    document.body.appendChild(overlay);

    let elapsed = 0;
    const cycleMs = 4000; // inhale 2s, exhale 2s
    const totalMs = Math.max(8, durationSec) * 1000;

    const ticker = setInterval(() => {
      try {
        // animate
        circle.style.transform = 'scale(1.12)';
        setTimeout(() => { circle.style.transform = 'scale(0.85)'; }, cycleMs / 2);
        elapsed += cycleMs;
        if (elapsed >= totalMs) {
          clearInterval(ticker);
          overlay.remove();
          showComposerToast('Nice — breathing session finished');
        }
      } catch (e) { clearInterval(ticker); overlay.remove(); }
    }, cycleMs);

    // allow click to cancel
    overlay.addEventListener('click', () => {
      try { overlay.remove(); showComposerToast('Cancelled'); } catch (e) {}
    });
  } catch (e) {
    console.warn('[PageAdapter] startBreathingOverlay error:', e);
  }
};

/**
 * Rewrite emotional content based on detected emotion
 * Uses Chrome's Rewriter API to balance negative headlines
 */
export const rewriteEmotionalContent = async (emotionState: EmotionState): Promise<void> => {
  if (!pageAdapterEnabled) return;

  const emotion = emotionState.primaryEmotion;
  const confidence = emotionState.confidence;

  // Only rewrite if user is stressed, anxious, or sad with high confidence
  if (confidence < 70) return;
  
  const shouldRewrite = ['stressed', 'anxious', 'sad', 'frustrated'].includes(emotion);
  if (!shouldRewrite) return;

  console.log(`[PageAdapter] Rewriting content for ${emotion} state (${confidence}% confidence)`);

  // Find headlines and negative content
  const headlineSelectors = 'h1, h2, h3, h4, .headline, .title, [class*="headline"], [class*="title"]';
  const headlines = document.querySelectorAll(headlineSelectors);

  for (const headline of Array.from(headlines)) {
    const element = headline as HTMLElement;
    
    // Skip if already rewritten
    if (rewrittenElements.has(element)) continue;
    
    const originalText = element.textContent?.trim();
    if (!originalText || originalText.length < 10) continue;

    // Check if content contains negative keywords
    const negativeKeywords = ['crisis', 'disaster', 'death', 'war', 'violence', 'terror', 'collapse', 'crash', 'attack', 'threat', 'danger', 'severe', 'critical', 'emergency'];
    const hasNegativeContent = negativeKeywords.some(keyword => 
      originalText.toLowerCase().includes(keyword)
    );

    if (hasNegativeContent) {
        try {
          // Prefer unified rewriter helper (uses Gemini Rewriter when available, otherwise local heuristic)
          const rewrittenText = await callRewriterAPI(originalText, 'compassionate');

          if (rewrittenText && rewrittenText !== originalText) {
            // Store original and apply rewritten version
            element.setAttribute('data-emotiflow-original', originalText);
            // callRewriterAPI already tags the result with [EmotiFlow Balanced Edition]
            element.textContent = rewrittenText;
            element.style.borderLeft = '3px solid #60a5fa';
            element.style.paddingLeft = '12px';
            element.style.fontStyle = 'normal';

            rewrittenElements.add(element);
            console.log(`[PageAdapter] Rewritten: "${originalText.substring(0, 50)}..." → "${rewrittenText.substring(0, 50)}..."`);
          }
        } catch (error) {
          console.warn('[PageAdapter] Failed to rewrite content:', error);
        }
    }
  }
};

/**
 * Rewrite text to balanced, neutral tone
 * Uses Chrome's AI Rewriter API or fallback
 */
const rewriteTextBalanced = async (text: string): Promise<string> => {
  try {
    // Try to use Chrome's Rewriter API (if available)
    if ('ai' in window && 'rewriter' in (window as any).ai) {
      const rewriter = await (window as any).ai.rewriter.create({
        tone: 'neutral',
        length: 'as-is',
        context: 'Rewrite this headline to be more balanced and less emotionally charged while preserving factual accuracy.'
      });
      
      const result = await rewriter.rewrite(text);
      rewriter.destroy();
      return result;
    }
  } catch (error) {
    console.warn('[PageAdapter] Rewriter API not available, using fallback');
  }

  // Fallback: Simple rule-based rewriting
  return rewriteTextFallback(text);
};

/**
 * Fallback text rewriting using simple rules
 */
const rewriteTextFallback = (text: string): string => {
  let rewritten = text;

  // Replace extreme language with neutral alternatives
  const replacements: Record<string, string> = {
    'disaster': 'significant event',
    'catastrophe': 'major situation',
    'crisis': 'challenging situation',
    'collapse': 'significant change',
    'crash': 'sharp decline',
    'terror': 'concern',
    'violence': 'conflict',
    'death': 'loss',
    'severe': 'significant',
    'critical': 'important',
    'emergency': 'urgent situation',
    'threat': 'concern',
    'danger': 'risk',
    'attack': 'incident',
  };

  for (const [negative, neutral] of Object.entries(replacements)) {
    const regex = new RegExp(`\\b${negative}\\b`, 'gi');
    rewritten = rewritten.replace(regex, neutral);
  }

  return rewritten;
};

/**
 * Restore original content
 */
export const restoreOriginalContent = (): void => {
  const rewrittenElements = document.querySelectorAll('[data-emotiflow-original]');
  
  for (const element of Array.from(rewrittenElements)) {
    const original = element.getAttribute('data-emotiflow-original');
    if (original) {
      element.textContent = original;
      element.removeAttribute('data-emotiflow-original');
      (element as HTMLElement).style.borderLeft = '';
      (element as HTMLElement).style.paddingLeft = '';
    }
  }
};

/**
 * Rewrite page content based on emotion (legacy function)
 */
export const rewritePageContent = (emotionState: EmotionState): void => {
  if (!pageAdapterEnabled) return;

  const emotion = emotionState.primaryEmotion;

  // Hide distressing elements if stressed
  if (emotion === 'stressed' && emotionState.confidence > 80) {
    hideDistressingElements();
  }

  // Highlight positive content if sad
  if (emotion === 'sad' && emotionState.confidence > 80) {
    highlightPositiveContent();
  }
};

/**
 * Hide elements that might be distressing
 */
const hideDistressingElements = (): void => {
  // Find and hide elements with negative keywords
  const negativeSelectors = [
    '[class*="error"]',
    '[class*="danger"]',
    '[class*="alert"]',
    '[class*="warning"]',
  ];

  negativeSelectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.opacity = '0.6';
      htmlEl.style.transition = 'opacity 0.3s';
    });
  });
};

/**
 * Highlight positive content
 */
const highlightPositiveContent = (): void => {
  // Find and highlight elements with positive keywords
  const positiveSelectors = [
    '[class*="success"]',
    '[class*="positive"]',
    '[class*="good"]',
    '[class*="great"]',
  ];

  positiveSelectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.boxShadow = '0 0 10px rgba(34, 197, 94, 0.3)';
      htmlEl.style.backgroundColor = 'rgba(34, 197, 94, 0.05)';
      htmlEl.style.padding = '8px';
      htmlEl.style.borderRadius = '4px';
    });
  });
};

/**
 * Reset page styling
 */
export const resetPageStyling = (): void => {
  const styleElement = document.getElementById(styleId);
  if (styleElement) {
    styleElement.remove();
  }
};
