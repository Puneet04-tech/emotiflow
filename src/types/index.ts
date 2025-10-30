/**
 * EmotiFlow - Type Definitions
 * Comprehensive TypeScript interfaces and types for emotion detection and wellness tracking
 */

/** Core emotion types */
export type Emotion = 
  | 'calm' 
  | 'stressed' 
  | 'anxious' 
  | 'sad' 
  | 'happy' 
  | 'energized' 
  | 'frustrated' 
  | 'fatigued'
  | 'neutral';

export type FacialEmotion = 
  | 'neutral' 
  | 'happy' 
  | 'sad' 
  | 'angry' 
  | 'fearful' 
  | 'disgusted' 
  | 'surprised';

export type VoiceTone = 
  | 'calm' 
  | 'stressed' 
  | 'excited' 
  | 'frustrated' 
  | 'tired';

export type Sentiment = 'positive' | 'negative' | 'neutral';

export type InterventionType = 
  | 'breathing' 
  | 'movement' 
  | 'cognitive' 
  | 'social' 
  | 'break' 
  | 'gratitude' 
  | 'grounding';

export type InterventionPriority = 'low' | 'medium' | 'high';

export type ContentFilterMode = 
  | 'none' 
  | 'dim_negative' 
  | 'highlight_positive' 
  | 'reduce_stimulation';

export type WeatherMetaphor = 'sunny' | 'cloudy' | 'stormy' | 'mixed' | 'clear';

/** Facial detection data structure */
export interface FacialDetectionData {
  emotion: FacialEmotion;
  confidence: number; // 0-100
  timestamp: number;
  breakdown?: Record<FacialEmotion, number>; // Percentage breakdown of all emotions
}

/** Voice analysis data structure */
export interface VoiceAnalysisData {
  tone: VoiceTone;
  pitch: number;
  energy: number;
  speakingRate: 'slow' | 'normal' | 'fast';
  intensity: number; // 0-100
  timestamp: number;
  breakdown?: Record<VoiceTone, number>; // Percentage breakdown of all voice tones
}

/** Text sentiment analysis data */
export interface TextSentimentData {
  sentiment: Sentiment;
  emotionScore: number; // 0-100
  keywords: string[];
  context: 'email' | 'comment' | 'search' | 'message' | 'other';
  timestamp: number;
  detailedEmotion?: string; // More specific emotion (angry, disappointed, excited, etc.)
  breakdown?: Record<string, number>; // Percentage breakdown of all text emotions (happy, sad, angry, anxious, excited, calm)
}

/** Unified emotion state after fusion */
export interface EmotionState {
  primaryEmotion: Emotion;
  confidence: number; // 0-100
  emotionVector: Record<Emotion, number>;
  timestamp: string; // ISO8601
  modalities: {
    facial?: FacialDetectionData & { detected: string };
    voice?: VoiceAnalysisData & { detected: string };
    text?: TextSentimentData & { detected: string };
  };
  interventionNeeded: boolean;
  interventionType: InterventionType | null;
  contentFilterMode: ContentFilterMode;
  uiAdaptation: string; // Color scheme suggestion
  durationSeconds?: number;
  suggestedIntervention?: WellnessIntervention | null;
  /** Optional array of wellness suggestion strings (AI or heuristic) */
  wellnessSuggestions?: string[];
  /** Uncertainty metric: 0 (certain) - 100 (very uncertain) */
  uncertainty?: number;
  /** Optional context information (active tab, time of day, meeting detection) */
  context?: {
    host?: string;
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    isMeetingSite?: boolean;
    suppressed?: boolean;
  };
}

/** Wellness intervention */
export interface WellnessIntervention {
  interventionType: InterventionType;
  actionText: string;
  estimatedDuration: number; // in seconds
  scientificBasis: string;
  priority: InterventionPriority;
  timestamp: number;
}

/** Emotion history entry */
export interface EmotionHistoryEntry {
  timestamp: number;
  emotion: Emotion;
  confidence: number;
  duration: number;
  context?: string;
  modalities?: {
    facial?: FacialEmotion;
    voice?: VoiceTone;
    text?: Sentiment;
  };
}

/** Emotional Weather Report */
export interface EmotionalWeatherReport {
  date: string;
  weatherMetaphor: WeatherMetaphor;
  summary: string;
  keyInsight: string;
  tomorrowSuggestion: string;
  positiveHighlight: string;
  stats: {
    totalBrowsingTime: number;
    sessionCount: number;
    websiteCount: number;
    peakStressTime?: string;
    calmestTime?: string;
  };
}

/** User preferences and settings */
export interface UserSettings {
  enableFacialDetection: boolean;
  enableVoiceAnalysis: boolean;
  enableTextSentiment: boolean;
  interventionThreshold: number; // 60-95
  interventionStyle: 'active' | 'passive' | 'minimal';
  privacyMode: boolean;
  dataEncryption: boolean;
  autoSave: boolean;
}

/** Pattern insight */
export interface PatternInsight {
  pattern: string;
  frequency: string;
  correlations?: string[];
  recommendation?: string;
}

/** Wellness statistics */
export interface WellnessStats {
  date: string;
  interventionsCompleted: number;
  averageEmotionalBaseline: Emotion;
  stressReductionPercentage: number;
  positiveEmotionPercentage: number;
  streak: number;
}

/** Chrome Message types */
export interface ChromeMessage {
  type: string;
  data?: unknown;
  text?: string;
  error?: string;
  running?: boolean;
  tabId?: number;
}

/** AI Engine response */
export interface AIEngineResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

/** Storage interface for IndexedDB */
export interface StoredEmotionData {
  id?: number;
  timestamp: number;
  data: string; // Encrypted JSON
}

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
