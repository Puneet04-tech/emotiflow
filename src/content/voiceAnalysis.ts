/**
 * Voice Tone Analysis
 * Analyzes microphone input for emotional tone indicators
 */

import { VoiceAnalysisData, VoiceTone } from '../types/index';
import { classifyVoiceEmotionAdvanced } from '../utils/advancedNLP';

/**
 * Local safe sendMessage helper (content-script scope).
 */
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
            console.warn('[Voice Messaging] sendMessage failed:', message, 'msg=', msg);
            resolve({ response: null, error: message });
            return;
          }
          resolve({ response: resp, error: null });
        });
      } catch (e: any) {
        const m = e?.message || String(e);
        console.warn('[Voice Messaging] sendMessage exception:', m, 'msg=', msg);
        resolve({ response: null, error: m });
      }
    });
  } catch (err: any) {
    const m = err?.message || String(err);
    console.warn('[Voice Messaging] sendMessage top-level error:', m);
    return { response: null, error: m };
  }
};

let voiceAnalysisEnabled = false;
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let voiceCaptureCount = 0;
// Smoothing state to reduce oscillation
let emaBreakdown: Record<string, number> | null = null;
let lastEmittedTone: string = 'calm';
let lastToneChangeTs = 0;
const EMA_ALPHA = 0.35; // smoothing factor (0-1), higher = more responsive
const SWITCH_THRESHOLD = 8; // min percent advantage to switch tones
const MIN_DWELL_MS = 4000; // minimum time to keep a tone before switching

/**
 * Initialize voice analysis
 */
export const initializeVoiceAnalysis = async (): Promise<void> => {
  try {
    console.log('[Voice] Requesting microphone permission...');
    
    // First check if we already have permission
    const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    
    if (permissionStatus.state === 'denied') {
      throw new Error('Microphone permission denied');
    }

    // Request microphone with specific constraints
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
        channelCount: 1,
        sampleRate: 44100,
      }
    });

    console.log('[Voice] Microphone access granted, initializing audio context...');
    console.log('[Voice] Stream details:', {
      active: stream.active,
      tracks: stream.getTracks().length,
      audioTrack: stream.getAudioTracks()[0]?.label
    });

    // Create audio context with proper settings
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    audioContext = new AudioContextClass({
      latencyHint: 'interactive',
      sampleRate: 44100,
    });
    
    if (!audioContext) throw new Error('AudioContext not available');
    
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    
    source.connect(analyser);
    
    console.log('[Voice] Audio analyser connected to REAL microphone stream');
    console.log('[Voice] AudioContext state:', audioContext.state);
    console.log('[Voice] Analyser settings:', {
      fftSize: analyser.fftSize,
      frequencyBinCount: analyser.frequencyBinCount,
      sampleRate: audioContext.sampleRate
    });

    voiceAnalysisEnabled = true;

    // Start analysis loop
    startVoiceAnalysisLoop();
    
    // Add visual indicator for voice analysis
    createVoiceIndicator();

    console.log('[Voice] ✓ Voice analysis initialized - using REAL microphone data');
    console.log('[Voice] Speak into your microphone to see real-time analysis...');
  } catch (error: any) {
    console.warn('[Voice] Voice analysis not available:', error?.name || error?.message || error);
  }
};

/**
 * Create visual indicator for voice analysis
 */
const createVoiceIndicator = (): void => {
  if (document.getElementById('emotiflow-voice-indicator')) return;
  
  const indicator = document.createElement('div');
  indicator.id = 'emotiflow-voice-indicator';
  indicator.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(34, 197, 94, 0.95);
    color: white;
    padding: 12px 16px;
    border-radius: 24px;
    font-size: 12px;
    font-weight: 600;
    z-index: 999998;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  indicator.innerHTML = `
    <span style="font-size: 16px;">🎤</span>
    <span>Listening...</span>
  `;
  document.body.appendChild(indicator);
};

/**
 * Start voice analysis loop - REAL AUDIO ANALYSIS
 */
const startVoiceAnalysisLoop = (): void => {
  if (!analyser || !voiceAnalysisEnabled) {
    console.log('[Voice] Analysis not available or disabled');
    return;
  }

  // Analyze voice every 1.5 seconds for real-time updates
  const analysisInterval = setInterval(async () => {
    if (!analyser || !voiceAnalysisEnabled) {
      console.log('[Voice] Analyser not available');
      return;
    }

    try {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const timeDataArray = new Uint8Array(analyser.fftSize);
      
      analyser.getByteFrequencyData(dataArray);
      analyser.getByteTimeDomainData(timeDataArray);

      // Log raw data to prove it's real (first few samples)
      if (voiceCaptureCount % 20 === 0) {
        console.log('[Voice] RAW MICROPHONE DATA Sample:', {
          frequency: Array.from(dataArray.slice(0, 10)),
          timeDomain: Array.from(timeDataArray.slice(0, 10)),
          maxFrequency: Math.max(...Array.from(dataArray)),
          maxTime: Math.max(...Array.from(timeDataArray))
        });
      }

      // Extract acoustic features from REAL audio
      const features = extractAcousticFeatures(dataArray, timeDataArray);

      // Log raw features for debugging
      console.log(`[Voice Debug] Raw Features - Energy: ${features.energy.toFixed(3)}, Pitch: ${features.pitch.toFixed(1)}Hz, ZCR: ${features.zcr.toFixed(3)}`);

      // Only analyze if voice activity detected (very low threshold)
      if (features.energy < 0.01) {
        // Silent - but still log occasionally
        if (voiceCaptureCount % 10 === 0) {
          console.log('[Voice] Waiting for voice input (silence detected)');
        }
        return;
      }

      // Classify voice tone based on real features (don't modify features, pass as-is)
      const voiceToneResult = classifyVoiceToneFromFeatures(features);

      // Initialize EMA breakdown if first time
      if (!emaBreakdown) {
        emaBreakdown = {} as Record<VoiceTone, number>;
        const entries = Object.entries(voiceToneResult.breakdown) as [VoiceTone, number][];
        for (const [tone, pct] of entries) {
          emaBreakdown[tone] = pct;
        }
      } else {
        // Update EMA for each tone
        const entries = Object.entries(voiceToneResult.breakdown) as [VoiceTone, number][];
        for (const [tone, pct] of entries) {
          const prev = emaBreakdown[tone] || 0;
          emaBreakdown[tone] = EMA_ALPHA * pct + (1 - EMA_ALPHA) * prev;
        }
      }

      // Normalize EMA to sum to 100
      const sumEma = Object.values(emaBreakdown).reduce((s, v) => s + v, 0) || 1;
      for (const k of Object.keys(emaBreakdown)) emaBreakdown[k] = (emaBreakdown[k] / sumEma) * 100;

      // Determine top two tones from EMA
      const sorted = Object.entries(emaBreakdown).sort(([, a], [, b]) => b - a);
      const topTone = sorted[0][0];
      const topPct = sorted[0][1];
      const secondPct = sorted[1] ? sorted[1][1] : 0;

      // Hysteresis / dwell logic to prevent oscillation
      let emittedTone = lastEmittedTone;
      const now = Date.now();
      const timeSinceChange = now - lastToneChangeTs;

      const sufficientGap = (topPct - (emaBreakdown[lastEmittedTone] || 0)) >= SWITCH_THRESHOLD;
      const clearWinner = (topPct - secondPct) >= 6; // avoid switching when tie

      if (topTone !== lastEmittedTone) {
        if ((timeSinceChange >= MIN_DWELL_MS && (sufficientGap || topPct >= 60)) && clearWinner) {
          emittedTone = topTone;
          lastEmittedTone = emittedTone;
          lastToneChangeTs = now;
        } else {
          // keep previous tone
          emittedTone = lastEmittedTone;
        }
      } else {
        // keep same
        emittedTone = lastEmittedTone;
      }

      const voiceData: VoiceAnalysisData = {
        tone: emittedTone as any,
        pitch: features.pitch,
        energy: features.energy,
        speakingRate: features.speakingRate,
        intensity: Math.round(Math.min(features.energy * 200, 100)), // More sensitive intensity calculation
        timestamp: Date.now(),
        breakdown: { ...(emaBreakdown as any) }, // send smoothed breakdown
      };

      voiceCaptureCount++;
      console.log(`[Voice Analysis] #${voiceCaptureCount}: ${emittedTone} (smoothed top ${topPct.toFixed(1)}%, raw winner ${voiceToneResult.tone})`);

      // Update voice indicator with top 2 tones
      const indicator = document.getElementById('emotiflow-voice-indicator');
      if (indicator && emaBreakdown) {
        const topTones = Object.entries(emaBreakdown)
          .sort(([, a]: any, [, b]: any) => b - a)
          .slice(0, 2)
          .map(([tone, pct]: any) => `${tone} ${pct.toFixed(0)}%`)
          .join(' | ');
        indicator.innerHTML = `
          <span style="font-size: 16px;">🎤</span>
          <span>${topTones}</span>
        `;
        indicator.style.background = 'rgba(34, 197, 94, 0.95)';
        
        // Pulse animation
        setTimeout(() => {
          if (indicator) {
            indicator.style.background = 'rgba(59, 130, 246, 0.95)';
          }
        }, 500);
      }

      // Send smoothed result to background worker with error handling
      try {
        const { response, error } = await sendMessageSafeLocal({ type: 'VOICE_EMOTION', data: voiceData });
        if (error) {
          console.error('[Voice] Failed to send VOICE_EMOTION:', error);
          // If extension context invalidated, consider stopping analysis (do not throw)
          if (error.includes('Extension context invalidated') || error.includes('Receiving end does not exist')) {
            console.log('[Voice] Extension context invalidated or receiver missing for voice - stopping voice analysis');
            voiceAnalysisEnabled = false;
            if (audioContext) {
              try { audioContext.close(); } catch {};
              audioContext = null;
            }
            if ((window as any).voiceAnalysisInterval) {
              clearInterval((window as any).voiceAnalysisInterval);
            }
          }
        } else {
          console.log('[Voice] ✓ Smoothed voice data sent to background');
        }
      } catch (error) {
        console.error('[Voice] Unexpected send error:', error);
      }
    } catch (error) {
      console.warn('Voice analysis error:', error);
    }
  }, 1500);

  // Store interval ID for cleanup
  (window as any).voiceAnalysisInterval = analysisInterval;
};

/**
 * Extract real acoustic features from frequency data
 */
const extractAcousticFeatures = (dataArray: Uint8Array, timeDataArray?: Uint8Array) => {
  // Calculate energy (RMS - Root Mean Square)
  let sum = 0;

  // Use time domain data if available for better energy calculation
  const sourceData = timeDataArray || dataArray;
  if (timeDataArray) {
    // time domain values are centered at 128 (unsigned); normalize to [-1,1]
    for (let i = 0; i < sourceData.length; i++) {
      const centered = (sourceData[i] - 128) / 128; // now in [-1,1]
      sum += centered * centered;
    }
    // RMS energy in 0..1
    const energy = Math.sqrt(sum / sourceData.length);

    // calculate pitch (find fundamental frequency) using frequency data
    const pitch = extractPitchFromFrequency(dataArray);

    // Calculate spectral centroid (brightness of sound)
    const spectralCentroid = calculateSpectralCentroid(dataArray);

    // Calculate zero crossing rate (changes in signal)
    const zcr = calculateZeroCrossingRate(timeDataArray);

    // Determine speaking rate based on energy fluctuations
    const speakingRate = determineSpeakingRate(energy, zcr);

    return {
      energy: Math.min(energy, 1.0), // Normalize to 0-1
      pitch,
      spectralCentroid,
      zcr,
      speakingRate,
    };
  } else {
    // Fallback when only frequency domain is available - approximate energy
    for (let i = 0; i < sourceData.length; i++) {
      const normalized = sourceData[i] / 255;
      sum += normalized * normalized;
    }
    const energy = Math.sqrt(sum / sourceData.length) * 0.7; // scale down since freq magnitudes are larger

    const pitch = extractPitchFromFrequency(dataArray);
    const spectralCentroid = calculateSpectralCentroid(dataArray);
    const zcr = calculateZeroCrossingRate(dataArray);
    const speakingRate = determineSpeakingRate(energy, zcr);

    return {
      energy: Math.min(energy, 1.0),
      pitch,
      spectralCentroid,
      zcr,
      speakingRate,
    };
  }
};

/**
 * Extract pitch from frequency spectrum
 */
const extractPitchFromFrequency = (dataArray: Uint8Array): number => {
  // Find the frequency bin with maximum magnitude
  let maxValue = 0;
  let maxFreqBin = 0;

  // Search in human speech range (roughly 80-400 Hz)
  const minFreqBin = Math.floor((80 * dataArray.length) / 22050);
  const maxFreqBinRange = Math.floor((400 * dataArray.length) / 22050);

  for (let i = Math.max(1, minFreqBin); i < Math.min(dataArray.length, maxFreqBinRange); i++) {
    if (dataArray[i] > maxValue) {
      maxValue = dataArray[i];
      maxFreqBin = i;
    }
  }

  // Convert bin to Hz (assuming 44.1kHz sample rate)
  const pitch = (maxFreqBin * 22050) / dataArray.length;
  return Math.min(Math.max(pitch, 40), 400); // Clamp to 40-400 Hz
};

/**
 * Calculate spectral centroid (tonal brightness)
 */
const calculateSpectralCentroid = (dataArray: Uint8Array): number => {
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < dataArray.length; i++) {
    numerator += i * dataArray[i];
    denominator += dataArray[i];
  }

  return denominator > 0 ? numerator / denominator : 0;
};

/**
 * Calculate zero crossing rate
 */
const calculateZeroCrossingRate = (dataArray: Uint8Array): number => {
  let zeroCrossings = 0;
  for (let i = 1; i < dataArray.length; i++) {
    const curr = dataArray[i] - 128;
    const prev = dataArray[i - 1] - 128;
    if ((curr * prev) < 0) {
      zeroCrossings++;
    }
  }
  return zeroCrossings / dataArray.length;
};

/**
 * Determine speaking rate from acoustic features
 */
const determineSpeakingRate = (energy: number, zcr: number): 'slow' | 'normal' | 'fast' => {
  // Combined analysis of energy and zero crossing rate
  const speechActivity = energy * (1 + zcr);

  if (speechActivity < 0.2) return 'slow';
  if (speechActivity < 0.6) return 'normal';
  return 'fast';
};

/**
 * Classify voice tone based on extracted features - BERT-LIKE CLASSIFICATION
 * Mimics BERT's attention mechanism and contextual feature weighting
 */
const classifyVoiceToneFromFeatures = (features: any): { tone: VoiceTone; breakdown: Record<VoiceTone, number> } => {
  const { energy, pitch, spectralCentroid, zcr, speakingRate } = features;

  // BERT-like feature embeddings - normalize and create feature vectors
  const featureVector = {
    energyEmbed: Math.tanh(energy * 10), // Non-linear activation
    pitchEmbed: Math.tanh((pitch - 150) / 100), // Centered at 150Hz
    spectralEmbed: Math.tanh(spectralCentroid * 10),
    zcrEmbed: Math.tanh(zcr * 100),
    rateEmbed: speakingRate === 'slow' ? -1 : speakingRate === 'fast' ? 1 : 0,
  };

  console.log(`[Voice BERT] Feature Embeddings:`, featureVector);

  // BERT-like attention weights - which features are most important for each emotion
  const attentionWeights = {
    calm: { energy: 0.3, pitch: 0.2, spectral: 0.2, zcr: 0.1, rate: 0.2 },
    stressed: { energy: 0.25, pitch: 0.25, spectral: 0.2, zcr: 0.15, rate: 0.15 },
    excited: { energy: 0.35, pitch: 0.3, spectral: 0.2, zcr: 0.05, rate: 0.1 },
    frustrated: { energy: 0.2, pitch: 0.15, spectral: 0.15, zcr: 0.35, rate: 0.15 },
    tired: { energy: 0.4, pitch: 0.25, spectral: 0.2, zcr: 0.05, rate: 0.1 },
  };

  // BERT-like contextual scoring - calculate weighted combinations
  const scores: Record<VoiceTone, number> = {
    calm: 0,
    stressed: 0,
    excited: 0,
    frustrated: 0,
    tired: 0,
  };

  // CALM - Low energy, low pitch, smooth (negative embeddings preferred)
  scores.calm += -featureVector.energyEmbed * 100 * attentionWeights.calm.energy;
  scores.calm += -featureVector.pitchEmbed * 80 * attentionWeights.calm.pitch;
  scores.calm += -featureVector.spectralEmbed * 70 * attentionWeights.calm.spectral;
  scores.calm += -featureVector.zcrEmbed * 50 * attentionWeights.calm.zcr;
  scores.calm += -featureVector.rateEmbed * 60 * attentionWeights.calm.rate;
  scores.calm += 50; // Base score

  // STRESSED - High energy, high pitch, fast, choppy
  scores.stressed += featureVector.energyEmbed * 120 * attentionWeights.stressed.energy;
  scores.stressed += featureVector.pitchEmbed * 100 * attentionWeights.stressed.pitch;
  scores.stressed += featureVector.spectralEmbed * 80 * attentionWeights.stressed.spectral;
  scores.stressed += featureVector.zcrEmbed * 90 * attentionWeights.stressed.zcr;
  scores.stressed += featureVector.rateEmbed * 70 * attentionWeights.stressed.rate;

  // EXCITED - Very high energy, very high pitch
  scores.excited += Math.max(0, featureVector.energyEmbed) * 150 * attentionWeights.excited.energy;
  scores.excited += Math.max(0, featureVector.pitchEmbed) * 130 * attentionWeights.excited.pitch;
  scores.excited += Math.max(0, featureVector.spectralEmbed) * 100 * attentionWeights.excited.spectral;
  scores.excited += Math.max(0, featureVector.rateEmbed) * 80 * attentionWeights.excited.rate;

  // FRUSTRATED - Variable pitch, high ZCR (choppy), moderate energy
  const frustrationPattern = Math.abs(featureVector.pitchEmbed) * featureVector.zcrEmbed;
  scores.frustrated += frustrationPattern * 100 * attentionWeights.frustrated.zcr;
  scores.frustrated += Math.abs(featureVector.energyEmbed - 0.3) * 80 * attentionWeights.frustrated.energy;
  scores.frustrated += featureVector.zcrEmbed * 120 * attentionWeights.frustrated.zcr;

  // TIRED - Very low energy, low pitch, slow
  scores.tired += Math.max(0, -featureVector.energyEmbed) * 140 * attentionWeights.tired.energy;
  scores.tired += Math.max(0, -featureVector.pitchEmbed) * 110 * attentionWeights.tired.pitch;
  scores.tired += Math.max(0, -featureVector.spectralEmbed) * 90 * attentionWeights.tired.spectral;
  scores.tired += Math.max(0, -featureVector.rateEmbed) * 70 * attentionWeights.tired.rate;

  // BERT-like softmax activation for final probabilities
  const expScores: Record<VoiceTone, number> = {
    calm: Math.exp(scores.calm / 50),
    stressed: Math.exp(scores.stressed / 50),
    excited: Math.exp(scores.excited / 50),
    frustrated: Math.exp(scores.frustrated / 50),
    tired: Math.exp(scores.tired / 50),
  };

  const sumExp = Object.values(expScores).reduce((sum, val) => sum + val, 0);
  
  // Convert to percentages using softmax
  const percentages: Record<VoiceTone, number> = {
    calm: (expScores.calm / sumExp) * 100,
    stressed: (expScores.stressed / sumExp) * 100,
    excited: (expScores.excited / sumExp) * 100,
    frustrated: (expScores.frustrated / sumExp) * 100,
    tired: (expScores.tired / sumExp) * 100,
  };

  // Find winner
  let maxTone: VoiceTone = 'calm';
  let maxPercentage = percentages.calm;
  for (const [tone, pct] of Object.entries(percentages)) {
    if (pct > maxPercentage) {
      maxPercentage = pct;
      maxTone = tone as VoiceTone;
    }
  }

  console.log(`[Voice BERT] ========== BERT-LIKE CLASSIFICATION ==========`);
  console.log(`[Voice BERT] Raw Scores:`, scores);
  console.log(`[Voice BERT] Attention-Weighted PERCENTAGES (Softmax):`);
  Object.entries(percentages)
    .sort(([, a], [, b]) => b - a)
    .forEach(([tone, pct]) => {
      console.log(`  ${tone}: ${pct.toFixed(1)}%`);
    });
  console.log(`[Voice BERT] WINNER: ${maxTone} (${maxPercentage.toFixed(1)}%)`);
  console.log(`[Voice BERT] ==========================================`);

  return {
    tone: maxTone,
    breakdown: percentages,
  };
};

/**
 * Stop voice analysis
 */
export const stopVoiceAnalysis = (): void => {
  voiceAnalysisEnabled = false;
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  if ((window as any).voiceAnalysisInterval) {
    clearInterval((window as any).voiceAnalysisInterval);
  }
};

/**
 * Check if voice analysis is available
 */
export const isVoiceAnalysisAvailable = (): boolean => {
  return navigator.mediaDevices?.getUserMedia !== undefined;
};
