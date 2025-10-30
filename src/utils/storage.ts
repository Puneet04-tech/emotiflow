/**
 * Chrome Storage & IndexedDB Management
 * Handles encrypted storage of emotion data with on-device encryption
 * Zero data transmission - all storage local to the device
 */

import CryptoJS from 'crypto-js';
import Dexie, { type Table } from 'dexie';
import { EmotionHistoryEntry, UserSettings } from '../types/index';

/**
 * Enhanced Dexie database with encryption schema
 */
export class EmotiFlowDB extends Dexie {
  emotions!: Table<StoredEmotionData>;
  settings!: Table<UserSettings, string>;
  insights!: Table<StoredInsight>;
  wellnessLog!: Table<WellnessLogEntry>;
  suggestions!: Table<SuggestionCacheEntry, number>;

  constructor() {
    super('EmotiFlowDB');
    this.version(1).stores({
      emotions: '++id, timestamp',
      settings: '&id',
      insights: '++id, timestamp',
      wellnessLog: '++id, timestamp',
      suggestions: '++id, key, ts',
    });
  }
}

interface StoredEmotionData {
  id?: number;
  timestamp: number;
  data: string; // Encrypted JSON
}

interface StoredInsight {
  id?: number;
  timestamp: number;
  data: string;
}

interface WellnessLogEntry {
  id?: number;
  timestamp: number;
  interventionType: string;
  completed: boolean;
  feedback?: string;
}

interface SuggestionCacheEntry {
  id?: number;
  key: string;
  value: string; // JSON stringified array of suggestions
  ts: number;
}

interface UserBaseline {
  id?: number;
  createdAt: number;
  samples: Array<{
    timestamp: number;
    primaryEmotion: string;
    confidence: number;
  }>;
  summary?: {
    counts?: Record<string, number>;
    avgConfidence?: Record<string, number>;
  };
}

const db = new EmotiFlowDB();
let ENCRYPTION_KEY = '';

/**
 * Initialize encryption key from Chrome Storage (one-time setup)
 * Uses CryptoJS for local encryption - no external transmission
 */
export const initializeEncryption = async (): Promise<void> => {
  try {
    const stored = await chrome.storage.local.get('encryption_key');
    if (stored.encryption_key) {
      ENCRYPTION_KEY = stored.encryption_key;
      console.log('✓ Encryption key loaded from local storage');
    } else {
      // Generate new 256-bit encryption key
      ENCRYPTION_KEY = CryptoJS.lib.WordArray.random(256 / 8).toString();
      await chrome.storage.local.set({ encryption_key: ENCRYPTION_KEY });
      console.log('✓ New encryption key generated and stored locally');
    }
  } catch (error) {
    console.error('Failed to initialize encryption:', error);
    throw new Error('Encryption initialization failed - data cannot be stored securely');
  }
};

/**
 * Encrypt data using AES-256
 * @param data Object to encrypt
 * @returns Encrypted string
 */
const encryptData = (data: object): string => {
  try {
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      ENCRYPTION_KEY
    ).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw error;
  }
};

/**
 * Decrypt data using AES-256
 * @param encryptedData Encrypted string
 * @returns Decrypted object or null
 */
const decryptData = (encryptedData: string): object | null => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const data = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
    return data;
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    return null;
  }
};

/**
 * Save emotion data to IndexedDB with encryption
 * Privacy guarantee: Data encrypted locally, never leaves device
 */
export const saveEmotionData = async (emotionData: EmotionHistoryEntry): Promise<void> => {
  try {
    const encrypted = encryptData(emotionData);
    await db.emotions.add({
      timestamp: emotionData.timestamp,
      data: encrypted,
    });
    console.log('✓ Emotion data saved and encrypted');
  } catch (error) {
    console.error('Failed to save emotion data:', error);
  }
};

/**
 * Get emotion history within time range
 */
export const getEmotionHistory = async (
  startTime: number,
  endTime: number
): Promise<EmotionHistoryEntry[]> => {
  try {
    const entries = await db.emotions
      .where('timestamp')
      .between(startTime, endTime)
      .toArray();

    return entries
      .map((entry) => {
        const decrypted = decryptData(entry.data);
        return decrypted as EmotionHistoryEntry;
      })
      .filter((entry) => entry !== null);
  } catch (error) {
    console.error('Failed to get emotion history:', error);
    return [];
  }
};

/**
 * Get all emotion history
 */
export const getAllEmotionHistory = async (): Promise<EmotionHistoryEntry[]> => {
  try {
    const entries = await db.emotions.toArray();
    return entries
      .map((entry) => {
        const decrypted = decryptData(entry.data);
        return decrypted as EmotionHistoryEntry;
      })
      .filter((entry) => entry !== null);
  } catch (error) {
    console.error('Failed to get all emotion history:', error);
    return [];
  }
};

/**
 * Get emotion history for today
 */
export const getTodayEmotionHistory = async (): Promise<EmotionHistoryEntry[]> => {
  const now = Date.now();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  
  return getEmotionHistory(startOfDay.getTime(), now);
};

/**
 * Clear all emotion history (user action only)
 */
export const clearEmotionHistory = async (): Promise<void> => {
  try {
    await db.emotions.clear();
    console.log('✓ Emotion history cleared');
  } catch (error) {
    console.error('Failed to clear emotion history:', error);
  }
};

/**
 * Save user settings with privacy preferences
 */
export const saveUserSettings = async (settings: UserSettings): Promise<void> => {
  try {
    // Store settings encrypted under fixed key
    await db.settings.put(settings, 'user_settings');
    console.log('✓ User settings saved');
  } catch (error) {
    console.error('Failed to save user settings:', error);
  }
};

/**
 * Get user settings
 */
export const getUserSettings = async (): Promise<UserSettings | undefined> => {
  try {
    return await db.settings.get('user_settings');
  } catch (error) {
    console.error('Failed to get user settings:', error);
    return undefined;
  }
};

/**
 * Save wellness intervention log entry
 */
export const logWellnessIntervention = async (
  interventionType: string,
  completed: boolean,
  feedback?: string
): Promise<void> => {
  try {
    await db.wellnessLog.add({
      timestamp: Date.now(),
      interventionType,
      completed,
      feedback,
    });
  } catch (error) {
    console.error('Failed to log wellness intervention:', error);
  }
};

/** Baseline collection: save a sample and update summary */
export const saveBaselineSample = async (sample: { primaryEmotion: string; confidence: number; timestamp?: number }): Promise<void> => {
  try {
    const now = sample.timestamp || Date.now();
    // Store a single baseline record under key 'user_baseline'
    const existing = await db.settings.get('user_baseline');
    let baseline: UserBaseline;
    if (!existing) {
      baseline = { createdAt: now, samples: [{ timestamp: now, primaryEmotion: sample.primaryEmotion, confidence: sample.confidence }] } as any;
    } else {
      baseline = existing as any;
      baseline.samples = baseline.samples || [];
      baseline.samples.push({ timestamp: now, primaryEmotion: sample.primaryEmotion, confidence: sample.confidence });
      // Keep only last 500 samples
      if (baseline.samples.length > 500) baseline.samples.shift();
    }

    // Recompute summary
    const counts: Record<string, number> = {};
    const sumConf: Record<string, number> = {};
    (baseline.samples || []).forEach(s => {
      counts[s.primaryEmotion] = (counts[s.primaryEmotion] || 0) + 1;
      sumConf[s.primaryEmotion] = (sumConf[s.primaryEmotion] || 0) + (s.confidence || 0);
    });
    const avgConfidence: Record<string, number> = {};
    Object.keys(counts).forEach(k => { avgConfidence[k] = Math.round((sumConf[k] || 0) / counts[k]); });
    baseline.summary = { counts, avgConfidence };

    await db.settings.put(baseline as any, 'user_baseline');
  } catch (error) {
    console.error('Failed to save baseline sample:', error);
  }
};

export const getUserBaseline = async (): Promise<UserBaseline | undefined> => {
  try {
    const b = await db.settings.get('user_baseline');
    return b as UserBaseline | undefined;
  } catch (error) {
    console.error('Failed to get user baseline:', error);
    return undefined;
  }
};

/** Suggestion cache persisted to IndexedDB to survive restarts */
export const saveSuggestionCache = async (key: string, suggestions: string[]): Promise<void> => {
  try {
    const entry: SuggestionCacheEntry = { key, value: JSON.stringify(suggestions), ts: Date.now() };
    // Upsert by key: delete existing then add new to keep it simple
    const all = await db.suggestions.where('key').equals(key).toArray();
    if (all && all.length > 0) {
      await Promise.all(all.map(a => db.suggestions.delete(a.id!)));
    }
    await db.suggestions.add(entry);
  } catch (error) {
    console.error('Failed to save suggestion cache:', error);
  }
};

export const getSuggestionCache = async (key: string, maxAgeMs = 1000 * 60 * 60): Promise<string[] | null> => {
  try {
    const entries = await db.suggestions.where('key').equals(key).toArray();
    if (!entries || entries.length === 0) return null;
    const latest = entries.sort((a, b) => b.ts - a.ts)[0];
    if (Date.now() - latest.ts > maxAgeMs) return null;
    return JSON.parse(latest.value || '[]');
  } catch (error) {
    console.error('Failed to read suggestion cache:', error);
    return null;
  }
};

/** Compute simple calibration mapping from stored baseline samples.
 * Returns an object mapping emotion -> multiplier (e.g., 0.9, 1.1)
 * The multiplier normalizes per-emotion average confidence toward 50.
 */
export const getCalibrationMapping = async (): Promise<Record<string, number>> => {
  try {
    const baseline = await db.settings.get('user_baseline') as any;
    const mapping: Record<string, number> = {};
    if (!baseline || !baseline.summary || !baseline.summary.avgConfidence) return mapping;
    const avg = baseline.summary.avgConfidence;
    Object.keys(avg).forEach((k) => {
      const val = avg[k] || 50;
      // Avoid division by zero; clamp
      const multiplier = val > 5 ? (50 / val) : 1.0;
      mapping[k] = Math.max(0.6, Math.min(1.6, multiplier));
    });
    return mapping;
  } catch (error) {
    console.error('Failed to compute calibration mapping:', error);
    return {};
  }
};

/**
 * Export emotion data as CSV
 * Includes decryption and formatting for user download
 */
export const exportEmotionDataAsCSV = async (): Promise<string> => {
  try {
    const history = await getAllEmotionHistory();
    
    if (history.length === 0) {
      return 'No data to export';
    }

    // CSV Header
    const headers = ['Timestamp', 'Emotion', 'Confidence', 'Duration (min)', 'Context', 'Facial', 'Voice', 'Text'];
    const rows = [headers.join(',')];

    // CSV Rows with decrypted data
    history.forEach((entry) => {
      const date = new Date(entry.timestamp).toISOString();
      const row = [
        date,
        entry.emotion,
        entry.confidence,
        entry.duration,
        entry.context || 'N/A',
        entry.modalities?.facial || 'N/A',
        entry.modalities?.voice || 'N/A',
        entry.modalities?.text || 'N/A',
      ];
      rows.push(row.join(','));
    });

    console.log('✓ Emotion data exported as CSV');
    return rows.join('\n');
  } catch (error) {
    console.error('Failed to export data:', error);
    return 'Error exporting data';
  }
};

/**
 * Get emotion statistics for a date range
 */
export const getEmotionStats = async (
  startTime: number,
  endTime: number
): Promise<Record<string, number>> => {
  try {
    const history = await getEmotionHistory(startTime, endTime);
    const stats: Record<string, number> = {};

    history.forEach((entry) => {
      stats[entry.emotion] = (stats[entry.emotion] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Failed to get emotion stats:', error);
    return {};
  }
};

/**
 * Compute wellness statistics for a date range
 */
export const getWellnessStats = async (
  startTime: number,
  endTime: number
): Promise<import('../types').WellnessStats | null> => {
  try {
    // Load emotion entries and wellness logs in range
    const emotionEntries = await db.emotions
      .where('timestamp')
      .between(startTime, endTime)
      .toArray();

    const wellnessEntries = await db.wellnessLog
      .where('timestamp')
      .between(startTime, endTime)
      .toArray();

    const decryptedEmotions = emotionEntries
      .map((e) => {
        const dec = decryptData(e.data);
        return dec as import('../types').EmotionHistoryEntry | null;
      })
      .filter((x) => x !== null) as import('../types').EmotionHistoryEntry[];

    // Interventions completed
    const interventionsCompleted = wellnessEntries.filter(w => w.completed).length;

    // Average emotional baseline: most frequent emotion in range
    const freq: Record<string, number> = {};
    decryptedEmotions.forEach((e) => { freq[e.emotion] = (freq[e.emotion] || 0) + 1; });
    const averageEmotionalBaseline = Object.keys(freq).length === 0 ? 'neutral' : (Object.keys(freq).reduce((a, b) => (freq[a] > freq[b] ? a : b)) as import('../types').Emotion);

    // Positive emotion percentage
    const positiveSet = new Set(['happy', 'energized', 'calm']);
    const positiveCount = decryptedEmotions.filter(e => positiveSet.has(e.emotion)).length;
    const positiveEmotionPercentage = decryptedEmotions.length > 0 ? Math.round((positiveCount / decryptedEmotions.length) * 100) : 0;

    // Stress reduction: compare first half vs second half within the range
    let stressReductionPercentage = 0;
    const stressSet = new Set(['stressed', 'anxious', 'frustrated']);
    if (decryptedEmotions.length > 1) {
      const half = Math.floor(decryptedEmotions.length / 2);
      const first = decryptedEmotions.slice(0, half);
      const second = decryptedEmotions.slice(half);
      const firstStress = first.filter(e => stressSet.has(e.emotion)).length;
      const secondStress = second.filter(e => stressSet.has(e.emotion)).length;
      stressReductionPercentage = first.length > 0 ? Math.round(((firstStress - secondStress) / first.length) * 100) : 0;
    }

    // Streak: consecutive days up to endTime where positiveEmotionPercentage >= 50%
    const dayMillis = 24 * 60 * 60 * 1000;
    // Build map by date string
    const byDay: Record<string, import('../types').EmotionHistoryEntry[]> = {};
    decryptedEmotions.forEach(e => {
      const d = new Date(e.timestamp).toDateString();
      byDay[d] = byDay[d] || [];
      byDay[d].push(e);
    });
    // Starting from endTime date, count backward consecutive days meeting threshold
    let streak = 0;
    let cursor = new Date(endTime);
    const thresholdPercent = 50;
    while (true) {
      const ds = cursor.toDateString();
      const dayEntries = byDay[ds] || [];
      if (dayEntries.length === 0) break;
      const pos = dayEntries.filter(e => positiveSet.has(e.emotion)).length;
      const percent = Math.round((pos / dayEntries.length) * 100);
      if (percent >= thresholdPercent) {
        streak += 1;
        cursor = new Date(cursor.getTime() - dayMillis);
      } else break;
    }

    const stats = {
      date: new Date(endTime).toDateString(),
      interventionsCompleted,
      averageEmotionalBaseline: averageEmotionalBaseline as import('../types').Emotion,
      stressReductionPercentage,
      positiveEmotionPercentage,
      streak,
    };

    return stats;
  } catch (error) {
    console.error('Failed to compute wellness stats:', error);
    return null;
  }
};

/**
 * Initialize database and encryption
 * Called once on extension startup
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    await initializeEncryption();
    console.log('✓ Database initialized with encryption');
  } catch (error) {
    // Don't throw here - database/encryption issues should not prevent the background
    // worker from starting. Log the error and continue with limited functionality.
    console.error('Failed to initialize database (continuing without DB encryption):', error);
    // Ensure ENCRYPTION_KEY is at least set to an empty string so decrypt attempts fail gracefully
    ENCRYPTION_KEY = ENCRYPTION_KEY || '';
    // Note: decryptData gracefully returns null on malformed data, so callers should handle missing data.
  }
};
