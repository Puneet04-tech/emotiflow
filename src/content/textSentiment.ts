import { TextSentimentData, Sentiment } from '../types/index';
import { classifyTextEmotionAdvanced } from '../utils/advancedNLP';
import { classifyTextBERT } from '../utils/bertLikeNLP';
import { detailedEmotionToEmotionMap } from '../utils/emotions';

// Local safe messaging helper for content script
const sendMessageSafeLocal = async (msg: any): Promise<{ response: any | null; error: string | null }> => {
  try {
    if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
      return { response: null, error: 'chrome.runtime.sendMessage not available' };
    }
    return await new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(msg, (resp) => {
          const last = (chrome.runtime && (chrome.runtime as any).lastError) || (chrome && (chrome as any).lastError);
          if (last) {
            const message = last.message || String(last);
            console.warn('[Text Messaging] sendMessage failed:', message, 'msg=', msg);
            resolve({ response: null, error: message });
            return;
          }
          resolve({ response: resp, error: null });
        });
      } catch (e: any) {
        const m = e?.message || String(e);
        console.warn('[Text Messaging] sendMessage exception:', m, 'msg=', msg);
        resolve({ response: null, error: m });
      }
    });
  } catch (err: any) {
    const m = err?.message || String(err);
    console.warn('[Text Messaging] sendMessage top-level error:', m);
    return { response: null, error: m };
  }
};
let textSentimentEnabled = true;
let textCaptureCount = 0;
let _lastSentSentence: string | null = null; // track last processed sentence to avoid duplicates
let _debounceTimer: number | null = null;
const DEBOUNCE_MS = 600; // wait for typing to pause before analyzing
export const initializeTextSentiment = async (): Promise<void> => {
  try {
    console.log('[Text] Initializing text sentiment...');
    document.addEventListener('input', handleTextInput, true);
    document.addEventListener('change', handleTextChange, true);
    document.addEventListener('blur', handleTextBlur, true);
    textSentimentEnabled = true;
    console.log('[Text] ✓ Text sentiment initialized - listeners attached');
  } catch (error) {
    console.warn('Text sentiment init failed:', error);
  }
};
const handleTextInput = (event: Event): void => {
  if (!textSentimentEnabled) return;
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  if (target && (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement)) {
    const text = target.value;
    if (text.length > 0) console.log('[Text] Input event triggered');
    processTextForSentenceChange(text, target as HTMLElement);
  }
};
const handleTextChange = (event: Event): void => {
  if (!textSentimentEnabled) return;
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  if (target && (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement)) {
    const text = target.value;
    processTextForSentenceChange(text, target as HTMLElement);
  }
};
const handleTextBlur = (event: Event): void => {
  if (!textSentimentEnabled) return;
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  if (target && (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement)) {
    const text = target.value;
    processTextForSentenceChange(text, target as HTMLElement);
  }
};

/**
 * Get last sentence from text. Splits on ., !, ? or newline and returns the last non-empty trimmed sentence.
 */
const getLastSentence = (text: string): string => {
  if (!text) return '';
  const parts = text.split(/(?:[.!?]\s+|\n)+/g).map(s => s.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : text.trim();
};

/**
 * Extract simple keywords from a sentence (fallback light-weight extractor).
 */
const extractKeywords = (text: string): string[] => {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter(w => w.length > 3)
    .slice(0, 6);
};

/**
 * Process text when last sentence changes. Debounced to avoid analyzing intermediate typing.
 */
const processTextForSentenceChange = (fullText: string, el?: HTMLElement) => {
  const lastSentence = getLastSentence(fullText);
  console.log(`[Text] Input detected: "${lastSentence.substring(0, 50)}${lastSentence.length > 50 ? '...' : ''}"`);
  if (!lastSentence) {
    console.log('[Text] No sentence extracted, skipping');
    return;
  }

  // If sentence unchanged, schedule a debounced re-check and return
  if (_lastSentSentence && _lastSentSentence === lastSentence) {
    if (_debounceTimer) {
      clearTimeout(_debounceTimer);
      _debounceTimer = null;
    }
    _debounceTimer = window.setTimeout(() => {
      processTextForSentenceChange(lastSentence, el);
    }, DEBOUNCE_MS) as unknown as number;
    return;
  }

  // Clear any existing timer and schedule analysis after typing pause
  if (_debounceTimer) {
    clearTimeout(_debounceTimer);
    _debounceTimer = null;
  }

  _debounceTimer = window.setTimeout(async () => {
    _lastSentSentence = lastSentence;
    console.log('[Text] Processing new sentence after debounce...');

    const bertResult = classifyTextBERT(lastSentence);
    if (!bertResult || !bertResult.emotion) {
      bertResult.emotion = 'calm';
      bertResult.confidence = 50;
    }

    const detailed = bertResult.emotion || 'calm';
    const primary = (detailed && detailedEmotionToEmotionMap[detailed]) ? detailedEmotionToEmotionMap[detailed] : 'calm';
    const conf = Math.round(bertResult.confidence || 50);

    const payload: any = {
      sentiment: (['happy', 'excited'].includes(detailed) ? 'positive' : ['sad', 'angry', 'disappointed', 'frustrated', 'anxious'].includes(detailed) ? 'negative' : 'neutral'),
      emotionScore: conf,
      keywords: extractKeywords(lastSentence),
      context: getContext(el || document.body),
      timestamp: Date.now(),
      detailedEmotion: detailed,
      breakdown: bertResult.allScores,
    };

    try {
      const { response, error } = await sendMessageSafeLocal({ type: 'TEXT_SENTIMENT', data: payload } as any);
      if (error) console.warn('[Text] Failed to send TEXT_SENTIMENT', error);
    } catch (e) {
      console.warn('[Text] Failed to send TEXT_SENTIMENT (unexpected)', e);
    }

    try {
      const immediateState = {
        primaryEmotion: primary,
        confidence: conf,
        emotionVector: { [primary]: conf },
        timestamp: new Date().toISOString(),
        modalities: {
          text: {
            sentiment: payload.sentiment,
            emotionScore: conf,
            keywords: payload.keywords,
            context: payload.context,
            timestamp: Date.now(),
            detected: primary,
          },
        },
      } as any;
      const { response, error } = await sendMessageSafeLocal({ type: 'EMOTION_STATE_UPDATE', data: immediateState } as any);
      if (error) console.warn('[Text] Failed to send EMOTION_STATE_UPDATE', error);
    } catch (err) {
      console.warn('[Text] Failed to send EMOTION_STATE_UPDATE', err);
    }

    _debounceTimer = null;
  }, DEBOUNCE_MS) as unknown as number;
};
// (old analyzeAndSendSentiment removed - replaced by debounced processTextForSentenceChange)
const getContext = (el: HTMLElement): 'email' | 'comment' | 'search' | 'message' | 'other' => {
  if (!el) return 'other';
  const id = el.id?.toLowerCase() || '';
  const name = el.getAttribute('name')?.toLowerCase() || '';
  const cls = el.className?.toLowerCase() || '';
  const ph = el.getAttribute('placeholder')?.toLowerCase() || '';
  if (id.includes('search') || name.includes('q') || name.includes('search')) return 'search';
  if (id.includes('subject') || id.includes('email')) return 'email';
  if (id.includes('comment')) return 'comment';
  if (id.includes('message') || cls.includes('message')) return 'message';
  return 'other';
};
export const stopTextSentiment = (): void => {
  textSentimentEnabled = false;
  document.removeEventListener('input', handleTextInput, true);
  document.removeEventListener('change', handleTextChange, true);
  document.removeEventListener('blur', handleTextBlur, true);
};
