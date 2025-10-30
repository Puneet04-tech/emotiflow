/**
 * Emotion Fusion Engine
 * Combines multimodal emotion detection with weighted algorithm
 * Integrates facial, voice, and text analysis with AI-powered confidence scoring
 */

import {
  Emotion,
  EmotionState,
  FacialDetectionData,
  VoiceAnalysisData,
  TextSentimentData,
  InterventionType,
  ContentFilterMode,
} from '../types/index';
import {
  facialToEmotionMap,
  voiceToEmotionMap,
  sentimentToEmotionMap,
  emotionColorMap,
  calculateEmotionSimilarity,
} from '../utils/emotions';
import {
  callGeminiNanoEmotionFusion,
  createEmotionFusionPrompt,
  generateWellnessSuggestions,
} from '../utils/aiPrompts';

/**
 * Fusion weights for multimodal integration
 */
const FUSION_WEIGHTS = {
  facial: 0.4,
  voice: 0.35,
  text: 0.25,
};

/**
 * Smoothing parameters for temporal consistency
 */
const SMOOTHING_WINDOW = 5000; // 5 seconds
const SMOOTHING_FACTOR = 0.7;

interface HistoryEntry {
  emotion: Emotion;
  confidence: number;
  timestamp: number;
}

let emotionHistory: HistoryEntry[] = [];

/**
 * Fuse multimodal emotion data with AI-powered inference
 * Combines facial, voice, and text inputs using weighted decision-level integration
 */
export const fuseEmotions = async (
  facialData?: FacialDetectionData,
  voiceData?: VoiceAnalysisData,
  textData?: TextSentimentData
): Promise<EmotionState | null> => {
  if (!facialData && !voiceData && !textData) {
    return null;
  }

  try {
    // Create AI prompt for emotion fusion
    const prompt = createEmotionFusionPrompt(
      facialData ? { emotion: facialData.emotion, confidence: facialData.confidence } : undefined,
      voiceData ? { tone: voiceToEmotionMap[voiceData.tone], energy: voiceData.intensity, pitch: voiceData.pitch } : undefined,
      textData ? { sentiment: textData.sentiment, score: textData.emotionScore } : undefined
    );

    // Call Gemini Nano or Firebase fallback
    const aiResult = await callGeminiNanoEmotionFusion(prompt);

    // Parse AI response
    const primaryEmotion = (aiResult.primaryEmotion || 'neutral') as Emotion;
    const confidence = Math.min(100, Math.round(aiResult.confidence || 50));
    const interventionType = aiResult.interventionType as InterventionType | null;
    const contentFilterMode = aiResult.contentFilterMode as ContentFilterMode;

    // Build emotion vector for history
    const emotionVector: Record<Emotion, number> = {
      calm: 0,
      stressed: 0,
      anxious: 0,
      sad: 0,
      happy: 0,
      energized: 0,
      frustrated: 0,
      fatigued: 0,
      neutral: 0,
    };

    // Weighted contribution from each modality
    if (facialData) {
      const emotion = facialToEmotionMap[facialData.emotion];
      const weight = (facialData.confidence / 100) * FUSION_WEIGHTS.facial;
      emotionVector[emotion] += weight;
    }

    if (voiceData) {
      const emotion = voiceToEmotionMap[voiceData.tone];
      const weight = (voiceData.intensity / 100) * FUSION_WEIGHTS.voice;
      emotionVector[emotion] += weight;
    }

    if (textData) {
      const emotion = sentimentToEmotionMap[textData.sentiment];
      const weight = (textData.emotionScore / 100) * FUSION_WEIGHTS.text;
      emotionVector[emotion] += weight;
    }

    // Apply temporal smoothing
    const smoothedState = applyTemporalSmoothing(primaryEmotion, confidence);

    // Build emotionState skeleton
    const emotionState: EmotionState = {
      primaryEmotion: smoothedState.emotion,
      confidence: smoothedState.confidence,
      emotionVector,
      timestamp: new Date().toISOString(),
      modalities: {
        facial: facialData ? { ...facialData, detected: facialToEmotionMap[facialData.emotion] } : undefined,
        voice: voiceData ? { ...voiceData, detected: voiceToEmotionMap[voiceData.tone] } : undefined,
        text: textData ? { ...textData, detected: sentimentToEmotionMap[textData.sentiment] } : undefined,
      },
      interventionNeeded: shouldIntervene(smoothedState.emotion, smoothedState.confidence),
      interventionType: interventionType as InterventionType | null,
      contentFilterMode: contentFilterMode as ContentFilterMode,
      uiAdaptation: emotionColorMap[smoothedState.emotion],
    };

    // If at least two modalities are present and they agree on an emotion, proactively generate suggestions
    try {
      const modalEmotions: string[] = [];
      if (facialData) modalEmotions.push(facialToEmotionMap[facialData.emotion]);
      if (voiceData) modalEmotions.push(voiceToEmotionMap[voiceData.tone]);
      if (textData) {
        // prefer detailed mapping if present
        const td = (textData.detailedEmotion && (textData.detailedEmotion in ({} as any))) ? textData.detailedEmotion : textData.detailedEmotion || sentimentToEmotionMap[textData.sentiment];
        modalEmotions.push((td as string) || sentimentToEmotionMap[textData.sentiment]);
      }

      // Count occurrences
      const counts: Record<string, number> = {};
      modalEmotions.forEach(m => { counts[m] = (counts[m] || 0) + 1; });
      let modalDominant: string | null = null;
      let modalMax = 0;
      Object.entries(counts).forEach(([k,v]) => { if (v > modalMax) { modalMax = v; modalDominant = k; } });

      if (modalDominant && modalMax >= 2) {
        // Majority agreement among modalities
        const agreedEmotion = modalDominant as Emotion;
        const agreedConf = Math.min(100, Math.round(smoothedState.confidence));
        const suggested = await generateWellnessSuggestions(agreedEmotion, agreedConf, emotionHistory.slice(-5).map(e => e.emotion), emotionHistory.length * 3);

        // Mark intervention needed if emotion is in intervention triggers
        if (shouldIntervene(agreedEmotion as Emotion, agreedConf)) {
          (emotionState as any).wellnessSuggestions = suggested;
          emotionState.interventionNeeded = true;
          emotionState.interventionType = getInterventionType(agreedEmotion as Emotion);
          // Attach a lightweight suggestedIntervention object if suggestions exist
          if (suggested && suggested.length > 0) {
            (emotionState as any).suggestedIntervention = {
              interventionType: emotionState.interventionType as any || 'breathing',
              actionText: suggested[0],
              estimatedDuration: 60,
              scientificBasis: 'Auto-generated wellness suggestion',
              priority: agreedConf > 85 ? 'high' : 'medium',
              timestamp: Date.now(),
            };
          }
        } else {
          // still store suggestions for UI without forcing an intervention
          (emotionState as any).wellnessSuggestions = suggested;
        }
      } else {
        // No clear modal consensus — still generate suggestions from smoothed state (AI fallback)
        const wellnessSuggestions = await generateWellnessSuggestions(
          smoothedState.emotion,
          smoothedState.confidence,
          emotionHistory.slice(-5).map(e => e.emotion),
          emotionHistory.length * 3 // Approximate session duration in minutes
        );
        (emotionState as any).wellnessSuggestions = wellnessSuggestions;
      }
    } catch (e) {
      console.warn('[EmotionFusion] Failed to generate modality-based suggestions:', e);
    }

    return emotionState;
  } catch (error) {
    console.error('Error in emotion fusion:', error);
    // Return null on AI error; fallback handled by caller
    return null;
  }
};

/**
 * Apply temporal smoothing to avoid rapid mood swings
 */
const applyTemporalSmoothing = (
  newEmotion: Emotion,
  newConfidence: number
): { emotion: Emotion; confidence: number } => {
  const now = Date.now();

  // Remove old entries outside smoothing window
  emotionHistory = emotionHistory.filter((entry) => now - entry.timestamp < SMOOTHING_WINDOW);

  if (emotionHistory.length === 0) {
    emotionHistory.push({ emotion: newEmotion, confidence: newConfidence, timestamp: now });
    return { emotion: newEmotion, confidence: newConfidence };
  }

  // Calculate weighted average
  const lastEntry = emotionHistory[emotionHistory.length - 1];
  const similarity = calculateEmotionSimilarity(lastEntry.emotion, newEmotion);

  if (similarity > 0.7) {
    // Emotions are similar - smooth the transition
    const smoothedConfidence = Math.round(
      lastEntry.confidence * SMOOTHING_FACTOR + newConfidence * (1 - SMOOTHING_FACTOR)
    );
    emotionHistory.push({ emotion: newEmotion, confidence: smoothedConfidence, timestamp: now });
    return { emotion: lastEntry.emotion, confidence: smoothedConfidence };
  } else {
    // Significant emotion change - only accept if confidence is high
    if (newConfidence > 80) {
      emotionHistory.push({ emotion: newEmotion, confidence: newConfidence, timestamp: now });
      return { emotion: newEmotion, confidence: newConfidence };
    } else {
      return { emotion: lastEntry.emotion, confidence: lastEntry.confidence };
    }
  }
};

/**
 * Determine if intervention is needed
 */
const shouldIntervene = (emotion: Emotion, confidence: number, threshold: number = 80): boolean => {
  const interventionTriggers: Emotion[] = ['stressed', 'anxious', 'frustrated', 'sad', 'fatigued'];
  return confidence >= threshold && interventionTriggers.includes(emotion);
};
/**
 * Get appropriate intervention type
 */
const getInterventionType = (emotion: Emotion): InterventionType | null => {
  const interventions: Record<Emotion, InterventionType | null> = {
    calm: null,
    stressed: 'breathing',
    anxious: 'grounding',
    sad: 'gratitude',
    happy: null,
    energized: null,
    frustrated: 'break',
    fatigued: 'movement',
    neutral: null,
  };

  return interventions[emotion];
};

/**
/**
 * Get emotion statistics
 */
export const getEmotionStatistics = (): {
  dominantEmotion: Emotion;
  emotionTransitions: number;
  averageStability: number;
} => {
  if (emotionHistory.length === 0) {
    return {
      dominantEmotion: 'neutral',
      emotionTransitions: 0,
      averageStability: 100,
    };
  }

  // Calculate emotion transitions
  let transitions = 0;
  for (let i = 1; i < emotionHistory.length; i++) {
    if (emotionHistory[i].emotion !== emotionHistory[i - 1].emotion) {
      transitions++;
    }
  }

  // Find dominant emotion
  const emotionCounts: Record<Emotion, number> = {
    calm: 0,
    stressed: 0,
    anxious: 0,
    sad: 0,
    happy: 0,
    energized: 0,
    frustrated: 0,
    fatigued: 0,
    neutral: 0,
  };

  emotionHistory.forEach((entry) => {
    emotionCounts[entry.emotion]++;
  });

  const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) =>
    (emotionCounts[a as Emotion] || 0) > (emotionCounts[b as Emotion] || 0) ? a : b
  ) as Emotion;

  // Calculate average stability
  const averageConfidence = emotionHistory.reduce((sum, entry) => sum + entry.confidence, 0) / emotionHistory.length;
  const averageStability = Math.round(averageConfidence);

  return {
    dominantEmotion,
    emotionTransitions: transitions,
    averageStability,
  };
};

/**
 * Reset emotion history
 */
function getContentFilterMode(emotion: Emotion, confidence: number): ContentFilterMode {
  // If confidence is low, don't apply any filtering
  if (confidence < 70) return 'none';

  const filters: Record<Emotion, ContentFilterMode> = {
    calm: 'none',
    stressed: 'dim_negative',
    anxious: 'reduce_stimulation',
    sad: 'highlight_positive',
    happy: 'none',
    energized: 'none',
    frustrated: 'dim_negative',
    fatigued: 'reduce_stimulation',
    neutral: 'none',
  };

  return filters[emotion] ?? 'none';
}

