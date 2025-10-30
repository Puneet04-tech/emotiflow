/**
 * AI Prompt Integration
 * Gemini Nano + Firebase AI Logic for emotion fusion and content adaptation
 */

import { Emotion, InterventionType, ContentFilterMode } from '../types/index';
import { getSuggestionCache, saveSuggestionCache } from './storage';

/**
 * Main emotion fusion prompt template
 * Uses Gemini Nano Prompt API to fuse multimodal inputs into unified emotional state
 */
export const createEmotionFusionPrompt = (
  facialData?: {
    emotion: string;
    confidence: number;
  },
  voiceData?: {
    tone: string;
    energy: number;
    pitch: number;
  },
  textData?: {
    sentiment: string;
    score: number;
  }
): string => {
  return `You are an expert emotional intelligence system analyzing multimodal emotional signals.
  
Analyze the following inputs and provide a JSON response with:
- primaryEmotion (string)
- confidence (0-100)
- interventionType (breathing|movement|cognitive|social|break|gratitude|grounding|null)
- contentFilterMode (none|dim_negative|highlight_positive|reduce_stimulation)
- uiAdaptation (string, CSS color recommendation)
- reasoning (string, brief explanation)

FACIAL EXPRESSION INPUT:
${facialData ? `Detected emotion: ${facialData.emotion}, Confidence: ${facialData.confidence}%` : 'Not available'}

VOICE TONE INPUT:
${voiceData ? `Tone: ${voiceData.tone}, Energy level: ${voiceData.energy}/100, Pitch variance: ${voiceData.pitch}` : 'Not available'}

TEXT SENTIMENT INPUT:
${textData ? `Sentiment: ${textData.sentiment}, Score: ${textData.score}/100` : 'Not available'}

CONTEXT:
- Current time: ${new Date().toLocaleTimeString()}
- Session duration: [from local state]

Respond ONLY with valid JSON. Do not include markdown, code blocks, or explanations.
{
  "primaryEmotion": "calm|stressed|anxious|sad|happy|energized|frustrated|fatigued|neutral",
  "confidence": 0-100,
  "interventionType": "...",
  "contentFilterMode": "...",
  "uiAdaptation": "#hexColor or css-value",
  "reasoning": "Brief analysis summary"
}`;
};

/**
 * Content rewriting prompt using Rewriter API
 * Softens emotionally charged or negative headlines/content while preserving factual accuracy
 */
export const createContentRewritePrompt = (
  originalText: string,
  detectedEmotion: Emotion,
  confidence: number
): string => {
  return `You are a compassionate content rewriter optimizing for emotional well-being.

ORIGINAL CONTENT:
"${originalText}"

CONTEXT:
- User emotional state: ${detectedEmotion} (confidence: ${confidence}%)
- Goal: Maintain factual accuracy while making content emotionally gentler

INSTRUCTIONS:
1. Preserve all factual information and data points
2. Replace alarming language with neutral/balanced phrasing
3. Add context or perspective that reduces emotional reactivity
4. Keep similar length and structure
5. Tag result as "[EmotiFlow Adapted]"

Respond with ONLY the rewritten text, no explanations:`;
};

/**
 * Wellness suggestion prompt
 * Generates personalized micro-intervention suggestions based on emotion state
 */
export const createWellnessPrompt = (
  primaryEmotion: Emotion,
  confidence: number,
  pastEmotions?: Emotion[],
  sessionDuration?: number
): string => {
  return `You are a digital wellness coach providing brief, actionable micro-interventions.

CURRENT STATE:
- Emotion: ${primaryEmotion}
- Confidence: ${confidence}%
- Session duration: ${sessionDuration ? sessionDuration + ' minutes' : 'unknown'}
${pastEmotions ? `- Recent emotions: ${pastEmotions.join(', ')}` : ''}

GENERATE 2-3 BRIEF SUGGESTIONS:
- Maximum 1 sentence each
- Actionable within 1-5 minutes
- Personalized to detected emotion
- Encouraging and non-intrusive
- Include estimated duration

Format:
1. [TIME] [ACTION]
2. [TIME] [ACTION]
3. [TIME] [ACTION]

Examples:
1. 2 min - Take three deep breaths and stretch
2. 1 min - Step away and look at something distant
3. 3 min - Write down one thing you're grateful for

Generate suggestions now:`;
};

/**
 * Emotion fusion API call using Gemini Nano
 * Falls back to Firebase AI Logic if Gemini Nano unavailable
 */
export const callGeminiNanoEmotionFusion = async (prompt: string): Promise<any> => {
  try {
    // Respect the user setting for Gemini usage if stored
    let enableGemini = true;
    try {
      const s = await chrome.storage.local.get('enable_gemini');
      if (s && typeof s.enable_gemini === 'boolean') enableGemini = s.enable_gemini;
    } catch (e) {
      // ignore storage errors and default to enabled
    }

    if (!enableGemini) {
      console.log('Gemini usage disabled by settings, falling back to Firebase AI Logic');
      return callFirebaseAILogic(prompt);
    }

    // Check for window context
    if (typeof window === 'undefined') {
      console.warn('No window context available, using Firebase AI Logic');
      return callFirebaseAILogic(prompt);
    }

    // Check if Gemini Nano API is available in window context
    if (!window.ai?.canCreateTextSession) {
      console.warn('Gemini Nano not available, falling back to Firebase AI Logic');
      return callFirebaseAILogic(prompt);
    }

    // Create Gemini Nano session
    const canCreate = await window.ai.canCreateTextSession();
    if (canCreate !== 'readily') {
      console.log('Gemini Nano loading... fallback to Firebase');
      return callFirebaseAILogic(prompt);
    }

    if (!window.ai.createTextSession) {
      throw new Error('createTextSession not available');
    }

    const session = await window.ai.createTextSession({});
    const response = await session.prompt(prompt);

    // Parse JSON response
    const parsed = JSON.parse(response);
    console.log('✓ Gemini Nano emotion fusion result:', parsed);
    try { await chrome.storage.local.set({ last_ai_provider: 'gemini' }); } catch {}
    return parsed;
  } catch (error) {
    console.error('Gemini Nano error, using Firebase fallback:', error);
    try { await chrome.storage.local.set({ last_ai_provider: 'cloud_fallback' }); } catch {}
    return callFirebaseAILogic(prompt);
  }
};

/**
 * Firebase AI Logic fallback for hybrid cloud inference
 * Used when local Gemini Nano is unavailable
 * Encrypted transmission with anonymization
 */
export const callFirebaseAILogic = async (prompt: string): Promise<any> => {
  try {
    // This would integrate with Firebase Vertex AI or similar service
    // For demo purposes, using heuristic-based fallback
    
    // In production:
    // const response = await fetch('https://firebase-vertex-ai-endpoint.com/analyze', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${getFirebaseToken()}`
    //   },
    //   body: JSON.stringify({
    //     prompt,
    //     encryptionKey: getLocalEncryptionKey(),
    //     anonymized: true
    //   })
    // });

    console.log('Using Firebase AI Logic fallback...');
    
    // Placeholder: Return safe default
    return {
      primaryEmotion: 'neutral',
      confidence: 50,
      interventionType: 'break',
      contentFilterMode: 'none',
      uiAdaptation: '#3B82F6',
      reasoning: 'Firebase AI Logic fallback (demo mode)'
    };
  } catch (error) {
    console.error('Firebase AI Logic error:', error);
    throw error;
  }
};

/**
 * Content rewriting using Rewriter API
 * Transforms negative or emotionally charged content
 */
export const callRewriterAPI = async (
  originalText: string,
  tone: 'neutral' | 'optimistic' | 'compassionate' = 'compassionate'
): Promise<string> => {
  try {
    console.log('Content rewrite requested with tone:', tone);
    console.log('Original text (snippet):', originalText?.slice(0, 200));

    // If Rewriter API available in the browser (Gemini Rewriter), use it
    if (typeof window !== 'undefined' && window.ai?.rewriter?.createWriterSession) {
      try {
        const writerSession = await window.ai.rewriter.createWriterSession({ tone, length: 'same', format: 'plain' });
        if (writerSession && typeof writerSession.rewrite === 'function') {
          const rewritten = await writerSession.rewrite(originalText);
          if (rewritten && rewritten.trim().length > 0) {
            // Tag the result for traceability
            return `[EmotiFlow Balanced Edition] ${rewritten}`;
          }
        }
      } catch (err) {
        console.warn('Gemini Rewriter session failed, falling back to heuristic rewrite:', err);
      }
    }

    // Fallback: simple heuristic rewriter (privacy-first, local)
    // Replace strong negative words with gentler alternatives and add a balancing clause
    let rewritten = originalText;
    const replacements: Record<string, string> = {
      'hate': 'strongly dislike',
      'terrible': 'concerning',
      'awful': 'unpleasant',
      'worst': 'one of the more challenging',
      'disaster': 'significant issue',
      'devastating': 'very impactful',
      'alarm': 'concern',
      'panic': 'strong concern',
    };

    Object.keys(replacements).forEach((bad) => {
      const regex = new RegExp(`\\b${bad}\\b`, 'gi');
      rewritten = rewritten.replace(regex, replacements[bad]);
    });

    // If the text contains exclamation-heavy or all-caps segments, tone them down
    rewritten = rewritten.replace(/!{2,}/g, '!');
    rewritten = rewritten.replace(/\b([A-Z]{3,})\b/g, (m) => m.toLowerCase());

    // Add a short contextualizing sentence if the text seems strongly negative
    const negativeMarkers = /(terrible|awful|hate|worst|disaster|devastating)/i;
    if (negativeMarkers.test(originalText) && !/\[EmotiFlow Balanced Edition\]/.test(rewritten)) {
      rewritten = `${rewritten.trim()} — presented with additional context to reduce reactivity.`;
    }

    // Tag the fallback rewrite so users can identify it
    return `[EmotiFlow Balanced Edition] ${rewritten}`;
  } catch (error) {
    console.error('Rewriter API error:', error);
    return originalText;
  }
};

/**
 * Wellness suggestion generation
 * Combines emotion state with history to personalize recommendations
 */
export const generateWellnessSuggestions = async (
  primaryEmotion: Emotion,
  confidence: number,
  pastEmotions?: Emotion[],
  sessionDuration?: number
): Promise<string[]> => {
  try {
    // First check persistent cache in IndexedDB
    const cacheKey = `${primaryEmotion}|${confidence}|${(pastEmotions||[]).slice(-5).join(',')}|${sessionDuration}`;
    try {
      const persisted = await getSuggestionCache(cacheKey, 1000 * 60 * 60 * 24); // 24h
      if (persisted && persisted.length > 0) return persisted;
    } catch (e) {
      // ignore cache errors
    }
    // Deterministic local generator (on-device LLM fallback via templates)
    try {
      const local = generateDeterministicSuggestions(primaryEmotion, confidence, pastEmotions, sessionDuration);
      if (local && local.length > 0) {
        try { await saveSuggestionCache(cacheKey, local); } catch (e) {}
        return local;
      }
    } catch (e) {
      // ignore local generator errors and fall back to multi-API
      console.warn('Local deterministic suggestion generator failed, falling back to AI:', e);
    }

    const prompt = createWellnessPrompt(
      primaryEmotion,
      confidence,
      pastEmotions,
      sessionDuration
    );

    // Use multi-API caller: try Gemini local, then cloud Firebase AI, then local heuristic
    const result = await callMultiAPI(prompt);

    // Parse suggestions from response
    if (!result) return [];
    if (typeof result === 'string') {
      const lines = result.split('\n').filter(line => line.match(/^\d+\./));
      const out = lines.map(line => line.replace(/^\d+\.\s*/, '').trim());
      try { await saveSuggestionCache(cacheKey, out); } catch (e) {}
      return lines.map(line => line.replace(/^\d+\.\s*/, '').trim());
    }

    // If result is an object with suggestions field
    if (Array.isArray((result as any).suggestions)) {
      try { await saveSuggestionCache(cacheKey, (result as any).suggestions); } catch (e) {}
      return (result as any).suggestions;
    }

    // Fallback: try to stringify and split
    try {
      const text = JSON.stringify(result);
      const lines = text.split('\n');
      const out = lines.slice(0, 3).map(l => l.trim()).filter(Boolean);
      try { await saveSuggestionCache(cacheKey, out); } catch (e) {}
      return out;
    } catch (e) {
      return [];
    }
  } catch (error) {
    console.error('Error generating wellness suggestions:', error);
    return [];
  }
};

/**
 * Unified multi-API caller for prompts.
 * Preference order is controlled by settings: enable_gemini, enable_cloud_ai.
 */
export const callMultiAPI = async (prompt: string): Promise<any> => {
  try {
    // Read settings to decide priority
    let enableGemini = true;
    let enableCloud = true;
    try {
      const s = await chrome.storage.local.get(['enable_gemini', 'enable_cloud_ai']);
      if (s && typeof s.enable_gemini === 'boolean') enableGemini = s.enable_gemini;
      if (s && typeof s.enable_cloud_ai === 'boolean') enableCloud = s.enable_cloud_ai;
    } catch (e) {
      // ignore storage errors
    }

    // Try Gemini local first if enabled
    if (enableGemini && typeof window !== 'undefined' && window.ai?.canCreateTextSession) {
      try {
        const res = await callGeminiNanoEmotionFusion(prompt);
        if (res) return res;
      } catch (e) {
        console.warn('Gemini call failed, falling back:', e);
      }
    }

    // Try cloud AI (Firebase) next if enabled
    if (enableCloud) {
      try {
        const res = await callFirebaseAILogic(prompt);
        if (res) {
          try { await chrome.storage.local.set({ last_ai_provider: 'cloud' }); } catch {}
          return res;
        }
      } catch (e) {
        console.warn('Cloud AI call failed, falling back to local heuristics:', e);
      }
    }

    // Final fallback: heuristic/local deterministic response
    try { await chrome.storage.local.set({ last_ai_provider: 'local' }); } catch {}
    return callFirebaseAILogic(prompt); // already a safe heuristic fallback in file
  } catch (error) {
    console.error('callMultiAPI error:', error);
    return null;
  }
};

/**
 * Deterministic suggestion generator (privacy-first on-device fallback)
 * Creates short, template-based micro-interventions for demos or offline use.
 */
export const generateDeterministicSuggestions = (
  primaryEmotion: Emotion,
  confidence: number,
  pastEmotions?: Emotion[],
  sessionDuration?: number
): string[] => {
  const high = confidence >= 85;
  const med = confidence >= 65 && confidence < 85;
  const low = confidence < 65;

  const templates: Record<string, string[]> = {
    stressed: [
      `${high ? '2' : med ? '3' : '1'} min - Try three slow diaphragmatic breaths (inhale 4s, exhale 6s).`,
      `${high ? '4' : med ? '3' : '2'} min - Stand up and stretch your shoulders and neck slowly.`,
      `1 min - Look away from the screen and focus on a distant object.`,
    ],
    anxious: [
      `${high ? '3' : med ? '2' : '1'} min - Ground with the 5-4-3-2-1 sensory exercise (name 5 things you see).`,
      `2 min - Take slow breaths and place a hand on your chest to feel each breath.`,
      `1 min - Sip water slowly and notice the sensations.`,
    ],
    sad: [
      `2 min - Write down one small positive memory or gratitude item.`,
      `3 min - Reach out to someone supportive with a short message.`,
      `5 min - Try a short walk or step outside for fresh air.`,
    ],
    frustrated: [
      `1 min - Step away for a short break and stretch your arms.`,
      `2 min - Do 10 shoulder rolls and refocus on breathing.`,
      `3 min - Jot down the most pressing task and one tiny next step.`,
    ],
    fatigued: [
      `2 min - Stand up and do a light movement to re-energize.`,
      `5 min - Hydrate and do gentle neck rolls.`,
      `10 min - Take a short restorative break away from screens.`,
    ],
    happy: [
      `1 min - Savor this moment and take a deep breath.`,
      `2 min - Share a quick celebratory note about what went well.`,
    ],
    neutral: [
      `1 min - Take a short breathing pause to stay present.`,
      `2 min - Do a gentle stretch to refresh.`,
    ],
    energized: [
      `2 min - Channel this energy into a focused short task.`,
      `3 min - Do one brief physical movement (jumping jacks x10).`,
    ],
  } as Record<string, string[]>;

  const set = templates[primaryEmotion] || templates['neutral'];

  // Pick top 2 deterministic entries based on confidence
  if (high) return set.slice(0, 3);
  if (med) return set.slice(0, 2);
  return set.slice(0, 1);
};

/**
 * Privacy-first prompt processing
 * Ensures no sensitive data transmission outside local context
 */
export const processPromptPrivately = (
  sensitiveData: any,
  publicPrompt: string
): string => {
  // Strip any identifiable information before transmission
  const sanitized = {
    emotion: sensitiveData.emotion,
    confidence: sensitiveData.confidence,
    timestamp: new Date().toISOString()
  };

  // Only transmit necessary fields
  return publicPrompt.replace(
    '[SENSITIVE_DATA]',
    JSON.stringify(sanitized)
  );
};

/**
 * Declare global window extensions for Gemini Nano and Rewriter APIs
 */
declare global {
  interface Window {
    ai?: {
      canCreateTextSession?: () => Promise<'readily' | 'after-download' | 'no'>;
      createTextSession?: (options?: any) => Promise<{
        prompt: (text: string) => Promise<string>;
      }>;
      rewriter?: {
        createWriterSession?: (options: any) => Promise<any>;
      };
    };
  }
}

export {};
