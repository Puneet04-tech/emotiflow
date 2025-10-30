/**
 * Emotion utilities and helper functions
 */

import { Emotion, FacialEmotion, VoiceTone, Sentiment } from '../types/index';

/**
 * Maps facial expressions to primary emotions
 */
export const facialToEmotionMap: Record<FacialEmotion, Emotion> = {
  neutral: 'calm',
  happy: 'happy',
  sad: 'sad',
  angry: 'frustrated',
  fearful: 'anxious',
  disgusted: 'stressed',
  surprised: 'energized',
};

/**
 * Maps voice tones to emotions
 */
export const voiceToEmotionMap: Record<VoiceTone, Emotion> = {
  calm: 'calm',
  stressed: 'stressed',
  excited: 'energized',
  frustrated: 'frustrated',
  tired: 'fatigued',
};

/**
 * Maps sentiment to emotions
 */
export const sentimentToEmotionMap: Record<Sentiment, Emotion> = {
  positive: 'happy',
  neutral: 'calm',
  negative: 'sad',
};

/**
 * Maps detailed text emotions (from advanced NLP) to primary emotions
 */
export const detailedEmotionToEmotionMap: Record<string, Emotion> = {
  happy: 'happy',
  sad: 'sad',
  angry: 'frustrated',
  anxious: 'anxious',
  frustrated: 'frustrated',
  disappointed: 'sad',
  calm: 'calm',
  excited: 'energized',
  neutral: 'calm',
  stressed: 'stressed',
  fatigued: 'fatigued',
  energized: 'energized',
};

/**
 * Emotion to color mapping for UI
 */
export const emotionColorMap: Record<Emotion, string> = {
  calm: '#3B82F6',
  stressed: '#F59E0B',
  anxious: '#A78BFA',
  sad: '#FB923C',
  happy: '#22C55E',
  energized: '#EC4899',
  frustrated: '#EF4444',
  fatigued: '#64748B',
  neutral: '#6B7280',
};

/**
 * Emotion to light color mapping for backgrounds
 */
export const emotionLightColorMap: Record<Emotion, string> = {
  calm: '#DBEAFE',
  stressed: '#FEF3C7',
  anxious: '#F3E8FF',
  sad: '#FFEDD5',
  happy: '#DCFCE7',
  energized: '#FCE7F3',
  frustrated: '#FEE2E2',
  fatigued: '#F1F5F9',
  neutral: '#F3F4F6',
};

/**
 * Get readable emotion label
 */
export const getEmotionLabel = (emotion: Emotion): string => {
  const labels: Record<Emotion, string> = {
    calm: 'Calm',
    stressed: 'Stressed',
    anxious: 'Anxious',
    sad: 'Sad',
    happy: 'Happy',
    energized: 'Energized',
    frustrated: 'Frustrated',
    fatigued: 'Fatigued',
    neutral: 'Neutral',
  };
  return labels[emotion];
};

/**
 * Get weather metaphor based on emotion
 */
export const getWeatherMetaphor = (emotion: Emotion): string => {
  const metaphors: Record<Emotion, string> = {
    calm: 'Clear and peaceful',
    stressed: 'Overcast with tension',
    anxious: 'Stormy with worry',
    sad: 'Rainy and melancholic',
    happy: 'Sunny and bright',
    energized: 'Vibrant with energy',
    frustrated: 'Turbulent',
    fatigued: 'Cloudy and tired',
    neutral: 'Mild conditions',
  };
  return metaphors[emotion];
};

/**
 * Determine if intervention is needed based on confidence and emotion
 */
export const shouldIntervene = (emotion: Emotion, confidence: number, threshold: number = 80): boolean => {
  const stressIndicators: Emotion[] = ['stressed', 'anxious', 'frustrated', 'sad'];
  return confidence >= threshold && stressIndicators.includes(emotion);
};

/**
 * Get emoji representation of emotion
 */
export const getEmotionEmoji = (emotion: Emotion): string => {
  const emojis: Record<Emotion, string> = {
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
  return emojis[emotion];
};

/**
 * Calculate emotion similarity (0-1)
 */
export const calculateEmotionSimilarity = (emotion1: Emotion, emotion2: Emotion): number => {
  if (emotion1 === emotion2) return 1;
  
  const similarities: Record<string, number> = {
    'calm-happy': 0.8,
    'stressed-anxious': 0.9,
    'stressed-frustrated': 0.85,
    'anxious-frustrated': 0.75,
    'sad-fatigued': 0.7,
    'happy-energized': 0.85,
    'frustrated-angry': 0.9,
  };
  
  const key = [emotion1, emotion2].sort().join('-');
  return similarities[key] || 0.2;
};
