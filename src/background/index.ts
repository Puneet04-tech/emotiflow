/**
 * Background Service Worker
 * Manages emotion fusion, AI integration, and data persistence
 */

import {
  Emotion,
  EmotionState,
  FacialDetectionData,
  VoiceAnalysisData,
  TextSentimentData,
  ChromeMessage,
  WellnessIntervention,
} from '../types/index';
import {
  facialToEmotionMap,
  voiceToEmotionMap,
  sentimentToEmotionMap,
  detailedEmotionToEmotionMap,
  shouldIntervene,
  emotionColorMap,
} from '../utils/emotions';
import {
  saveEmotionData,
  getUserSettings,
  initializeDatabase,
  getTodayEmotionHistory,
  getUserBaseline,
  getCalibrationMapping,
} from '../utils/storage';
import { saveBaselineSample, logWellnessIntervention as storageLogWellnessIntervention } from '../utils/storage';
import {
  createEmotionFusionPrompt,
  createWellnessInterventionPrompt,
} from '../utils/prompts';
import { generateWellnessSuggestions } from '../utils/aiPrompts';
import { logWellnessIntervention } from '../utils/storage';
import { classifyTextEmotionAdvanced } from '../utils/advancedNLP';

let emotionFusionInterval: NodeJS.Timeout | null = null;

// Initialize with default neutral state instead of null
// In-memory modality buffers and state
let currentFacialData: FacialDetectionData | null = null;
let currentVoiceData: VoiceAnalysisData | null = null;
let currentTextData: TextSentimentData | null = null;

let lastEmotionStateTs: number = 0;
let lastEmotionState: EmotionState = {
  primaryEmotion: 'neutral',
  confidence: 50,
  emotionVector: { calm: 0, stressed: 0, anxious: 0, sad: 0, happy: 0, energized: 0, frustrated: 0, fatigued: 0, neutral: 1 },
  timestamp: new Date().toISOString(),
  modalities: {},
  interventionNeeded: false,
  interventionType: null,
  contentFilterMode: 'none',
  uiAdaptation: emotionColorMap['neutral'],
  suggestedIntervention: null,
};
const handleMessage = (
  message: ChromeMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
): boolean => {
  try {
    const incomingTs = (message && (message as any).data && (message as any).data.timestamp) ? Number((message as any).data.timestamp) : Date.now();
    console.log(`[Background] Received message: ${message.type} (ts=${incomingTs}) from ${sender?.tab?.id || 'svc'}`);

    switch (message.type) {
      case 'FACIAL_EMOTION': {
        console.log('[Background] Updating facial data:', message.data);
        currentFacialData = message.data as FacialDetectionData;
        if (currentFacialData && currentFacialData.emotion) {
          // Run a quick fusion pass so we emit a consistent fused state (including suggestions)
          (async () => {
            try {
              const fused = await fuseEmotionData();
              if (fused) {
                lastEmotionState = fused;
                lastEmotionStateTs = Date.now();
                try { chrome.runtime.sendMessage({ type: 'EMOTION_STATE_UPDATE', data: lastEmotionState }); } catch (e) { console.warn('[Background] Failed to broadcast facial state:', e); }
                // Also notify tabs (silently ignore failures)
                try {
                  chrome.tabs.query({}, (tabs) => {
                    tabs.forEach((tab) => {
                      if (tab.id) {
                        chrome.tabs.sendMessage(tab.id as number, { type: 'EMOTION_STATE_UPDATE', data: lastEmotionState }, () => { /* ignore */ });
                      }
                    });
                  });
                } catch (e) { /* ignore */ }
              }
            } catch (err) {
              console.warn('[Background] Failed to fuse on FACIAL_EMOTION:', err);
            }
          })();
        }
        return false;
      }
      case 'VOICE_EMOTION': {
        console.log('[Background] Updating voice data:', message.data);
        currentVoiceData = message.data as VoiceAnalysisData;
        if (currentVoiceData && currentVoiceData.tone) {
          // Run an immediate fusion and broadcast the fused state so wellness suggestions accompany the update
          (async () => {
            try {
              const fused = await fuseEmotionData();
              if (fused) {
                lastEmotionState = fused;
                lastEmotionStateTs = Date.now();
                try { chrome.runtime.sendMessage({ type: 'EMOTION_STATE_UPDATE', data: lastEmotionState }); } catch (e) { console.warn('[Background] Failed to broadcast voice state:', e); }
                try {
                  chrome.tabs.query({}, (tabs) => {
                    tabs.forEach((tab) => {
                      if (tab.id) chrome.tabs.sendMessage(tab.id as number, { type: 'EMOTION_STATE_UPDATE', data: lastEmotionState }, () => {});
                    });
                  });
                } catch (e) { /* ignore */ }
              }
            } catch (err) {
              console.warn('[Background] Failed to fuse on VOICE_EMOTION:', err);
            }
          })();
        }
        return false;
      }
      case 'TEXT_SENTIMENT': {
        console.log('[Background] Updating text data:', message.data);
        currentTextData = message.data as TextSentimentData;
        console.log('[Background] Text data stored. Current state:', { text: currentTextData?.detailedEmotion, score: currentTextData?.emotionScore, sentiment: currentTextData?.sentiment, incomingTs });

        if (currentTextData && currentTextData.detailedEmotion) {
          // Run fusion now so text-driven changes also get wellness suggestions attached
          (async () => {
            try {
              const fused = await fuseEmotionData();
              if (fused) {
                lastEmotionState = fused;
                lastEmotionStateTs = Date.now();
                try { chrome.runtime.sendMessage({ type: 'EMOTION_STATE_UPDATE', data: lastEmotionState }, () => { if (chrome.runtime.lastError) { /* ignore */ } });
                } catch (e) { /* ignore */ }
              }
            } catch (err) {
              console.warn('[Background] Failed to fuse on TEXT_SENTIMENT:', err);
            }
          })();
        }
        return false;
      }
      case 'GET_EMOTION_STATE': {
        console.log('[Background] Sending emotion state:', lastEmotionState);
        sendResponse(lastEmotionState);
        return false;
      }
      case 'ANALYZE_TEXT': {
        // Async response
        (async () => {
          try {
            const textResult = await analyzeText(message.text || '');
            sendResponse({ sentiment: textResult });
          } catch (e) {
            sendResponse({ error: String(e) });
          }
        })();
        return true;
      }
      case 'REQUEST_INTERVENTION': {
        (async () => {
          try {
            const intervention = await generateIntervention();
            sendResponse(intervention);
          } catch (e) {
            sendResponse({ error: String(e) });
          }
        })();
        return true;
      }
      case 'OPEN_DASHBOARD': {
        (async () => {
          try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]?.id) {
              try {
                await (chrome.sidePanel as any).open({ tabId: tabs[0].id });
                sendResponse({ success: true });
              } catch (err) {
                console.log('Sidepanel not available, opening in new tab');
                sendResponse({ success: false });
              }
            } else sendResponse({ success: false });
          } catch (e) {
            sendResponse({ error: String(e) });
          }
        })();
        return true;
      }
      case 'SAVE_BASELINE_SAMPLE': {
        // Expect message.data = { primaryEmotion: string, confidence: number, timestamp?: number }
        (async () => {
          try {
            const d = (message as any).data || {};
            await saveBaselineSample({ primaryEmotion: d.primaryEmotion || 'neutral', confidence: Number(d.confidence) || 50, timestamp: d.timestamp });
            sendResponse({ success: true });
          } catch (err) {
            console.error('[Background] Failed to save baseline sample:', err);
            sendResponse({ success: false, error: String(err) });
          }
        })();
        return true;
      }
      case 'INTERVENTION_FEEDBACK': {
        // Expect message.data = { interventionType, completed: boolean, feedback?: string }
        (async () => {
          try {
            const d = (message as any).data || {};
            // Log to wellnessLog table
            await storageLogWellnessIntervention(d.interventionType || 'breathing', !!d.completed, d.feedback || '');
            // Also record a baseline-like sample if completed=true to reinforce signals
            if (d.completed && lastEmotionState) {
              try {
                await saveBaselineSample({ primaryEmotion: lastEmotionState.primaryEmotion, confidence: lastEmotionState.confidence, timestamp: Date.now() });
              } catch {}
            }
            sendResponse({ success: true });
          } catch (err) {
            console.error('[Background] Failed to process intervention feedback:', err);
            sendResponse({ success: false, error: String(err) });
          }
        })();
        return true;
      }
      case 'OPEN_SETTINGS': {
        chrome.tabs.create({ url: 'chrome-extension://' + chrome.runtime.id + '/src/sidepanel/index.html?tab=settings' });
        sendResponse({ success: true });
        return false;
      }
      case 'OPEN_HELP': {
        chrome.tabs.create({ url: chrome.runtime.getURL('README.md') || 'chrome-extension://' + chrome.runtime.id + '/README.md' });
        sendResponse({ success: true });
        return false;
      }
      case 'TOGGLE_TRACKING': {
        const newState = message.running;
        if (newState) {
          if (!emotionFusionInterval) startEmotionFusion();
        } else {
          if (emotionFusionInterval) { clearInterval(emotionFusionInterval); emotionFusionInterval = null; }
        }
        sendResponse({ success: true, running: newState });
        return false;
      }
      case 'LOG_WELLNESS_INTERVENTION': {
        (async () => {
          try {
            const d = message.data as any;
            await logWellnessIntervention(d.interventionType || 'breathing', !!d.completed, d.feedback || '');
            sendResponse({ success: true });
          } catch (err) {
            console.error('[Background] Failed to log wellness intervention:', err);
            sendResponse({ success: false, error: String(err) });
          }
        })();
        return true;
      }
      default: {
        console.warn('[Background] Unknown message type:', message.type);
        sendResponse({ error: 'Unknown message type' });
        return false;
      }
    }
  } catch (error) {
    console.error('Error handling message:', error);
    try { sendResponse({ error: String(error) }); } catch (e) { /* ignore */ }
    return false;
  }
};

/**
 * Fuse multimodal emotion data with weighted algorithm
 */
const fuseEmotionData = async (): Promise<EmotionState | null> => {
  // Check if we have any recent data to fuse
  if (!currentFacialData && !currentVoiceData && !currentTextData) {
    return null;
  }

  try {
    const weights = {
      facial: 0.4,
      voice: 0.35,
      text: 0.25,
    };

    let confidence = 0;
    let emotionVector: Record<string, number> = {};
    const modalities: any = {};

    // Process facial data
    if (currentFacialData) {
      const emotion = facialToEmotionMap[currentFacialData.emotion];
      confidence += (currentFacialData.confidence / 100) * weights.facial;
      emotionVector[emotion] = (emotionVector[emotion] || 0) + (currentFacialData.confidence / 100) * weights.facial;
      modalities.facial = {
        ...currentFacialData,
        detected: emotion,
      };
    }

    // Process voice data
    if (currentVoiceData) {
      const emotion = voiceToEmotionMap[currentVoiceData.tone];
      confidence += (currentVoiceData.intensity / 100) * weights.voice;
      emotionVector[emotion] = (emotionVector[emotion] || 0) + (currentVoiceData.intensity / 100) * weights.voice;
      modalities.voice = {
        ...currentVoiceData,
        detected: emotion,
      };
    }

    // Process text data
    if (currentTextData) {
      // Use detailed emotion if available, otherwise fall back to sentiment mapping
      let emotion: Emotion;
      if (currentTextData.detailedEmotion && detailedEmotionToEmotionMap[currentTextData.detailedEmotion]) {
        emotion = detailedEmotionToEmotionMap[currentTextData.detailedEmotion];
      } else {
        emotion = sentimentToEmotionMap[currentTextData.sentiment];
      }
      
      confidence += (currentTextData.emotionScore / 100) * weights.text;
      emotionVector[emotion] = (emotionVector[emotion] || 0) + (currentTextData.emotionScore / 100) * weights.text;
      modalities.text = {
        ...currentTextData,
        detected: emotion,
      };
      console.log(`[Background] Processing text data: "${currentTextData.detailedEmotion}" (${currentTextData.emotionScore}%) → "${emotion}" (weight: ${weights.text})`);
    }

    // Determine primary emotion - ensure we have at least one
    const emotionKeys = Object.keys(emotionVector);
    if (emotionKeys.length === 0) {
      return null;
    }

    const primaryEmotion = emotionKeys.reduce((a, b) =>
      (emotionVector[a] || 0) > (emotionVector[b] || 0) ? a : b
    ) as Emotion;

    confidence = Math.max(1, Math.min(100, Math.round(confidence * 100)));

    // Apply simple per-emotion calibration mapping derived from user baseline
    try {
      const calib = await getCalibrationMapping();
      const mult = (calib && (calib as any)[primaryEmotion]) || 1;
      if (mult && typeof mult === 'number') {
        confidence = Math.max(1, Math.min(100, Math.round(confidence * mult)));
      }
    } catch (e) {
      // ignore calibration errors
    }

    // Normalize emotionVector into probability distribution
    const totalWeight = Object.values(emotionVector).reduce((s, v) => s + (v || 0), 0) || 1;
    const normalized: Record<Emotion, number> = {
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
    Object.keys(emotionVector).forEach((k) => {
      const key = k as Emotion;
      normalized[key] = (emotionVector[k] || 0) / totalWeight;
    });

    const maxProb = Math.max(...Object.values(normalized));
    const uncertainty = Math.round((1 - maxProb) * 100); // 0-100, higher = more uncertain

    // Gather lightweight context (active tab host, time of day)
    let contextInfo: { host?: string; timeOfDay?: 'morning'|'afternoon'|'evening'|'night'; isMeetingSite?: boolean; suppressed?: boolean } = {};
    try {
      // Query active tab once and gather additional signals
      const activeTabs = await new Promise<chrome.tabs.Tab[]>((resolve) => chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs)));
      const activeTab = activeTabs && activeTabs[0];
      const url = activeTab?.url || '';
      let host = '';
      try { host = new URL(url).hostname; } catch (e) { host = url; }
      const hour = new Date().getHours();
      const timeOfDay = hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 17 ? 'afternoon' : hour >= 17 && hour < 21 ? 'evening' : 'night';

      // Detect audible playing (tab.audible) and inspect title for meeting keywords
      const audible = !!(activeTab && (activeTab as any).audible);
      const title = (activeTab && activeTab.title) ? (activeTab.title as string).toLowerCase() : '';
      const titlePatterns = ['zoom', 'google meet', 'meet.google', 'teams', 'microsoft teams', 'webex', 'discord', 'hangouts', 'whereby', 'jitsi', 'call', 'meeting', 'video call'];

      const meetingDomainPatterns = ['zoom.us', 'meet.google.com', 'teams.microsoft.com', 'webex.com', 'discord.com', 'hangouts.google.com', 'appear.in', 'whereby.com', 'jitsi.org'];
      const domainMatch = meetingDomainPatterns.some(p => host.includes(p) || url.includes(p));
      const titleMatch = titlePatterns.some(p => title.includes(p));

      // Simple rule: audible + title/domain match => meeting; or domain/title match alone is likely meeting
      const isMeetingSite = (audible && (titleMatch || domainMatch)) || titleMatch || domainMatch;

      contextInfo = { host, timeOfDay: timeOfDay as any, isMeetingSite };
    } catch (e) {
      contextInfo = {};
    }

    const emotionState: EmotionState = {
      primaryEmotion,
      confidence,
      emotionVector,
      timestamp: new Date().toISOString(),
      modalities,
      // suppress intervention if uncertainty is high
      interventionNeeded: shouldIntervene(primaryEmotion, confidence) && uncertainty <= 60,
      interventionType: (shouldIntervene(primaryEmotion, confidence) && uncertainty <= 60) ? 'breathing' : null,
      contentFilterMode: confidence > 80 && primaryEmotion === 'stressed' ? 'dim_negative' : 'none',
      uiAdaptation: emotionColorMap[primaryEmotion as Emotion],
      suggestedIntervention: null,
      uncertainty,
      context: contextInfo,
    };

    // Apply temporal smoothing
    if (lastEmotionState && emotionState.primaryEmotion !== lastEmotionState.primaryEmotion) {
      // Only change emotion if confidence is high enough
      if (emotionState.confidence < 70) {
        emotionState.primaryEmotion = lastEmotionState.primaryEmotion;
        emotionState.confidence = (emotionState.confidence + lastEmotionState.confidence) / 2;
      }
    }

    // If intervention is needed, generate one now and include it in the state
    try {
      // Respect context-aware suppression: if active site appears to be a meeting, avoid interventions
      try {
        const storage = await chrome.storage.local.get(['enable_context_awareness', 'calendar_integration_enabled']);
        const enabled = storage.enable_context_awareness !== false; // default true
        const calendarOptIn = storage.calendar_integration_enabled === true;

        // If calendar integration is enabled, we could (in the future) check calendar busy status here.
        // For now we include a scaffold and respect the opt-in flag. Full calendar integration requires
        // manifest changes and OAuth flow (not performed automatically here).
        let calendarBusy = false;
        if (calendarOptIn) {
          try {
            // Placeholder: real implementation would call chrome.identity/OAuth and query Calendar API.
            // Keep calendarBusy = false until integration implemented.
            calendarBusy = false;
          } catch (e) {
            calendarBusy = false;
          }
        }

        if ((contextInfo.isMeetingSite || calendarBusy) && enabled) {
          emotionState.interventionNeeded = false;
          emotionState.suggestedIntervention = null;
          emotionState.context = { ...emotionState.context, suppressed: true } as any;
        }
      } catch (e) {
        // ignore
      }
      // Attempt to generate suggestions when modalities agree (>=2) or when interventionNeeded is true
      const modalEmotions: string[] = [];
      if (currentFacialData) modalEmotions.push(facialToEmotionMap[currentFacialData.emotion]);
      if (currentVoiceData) modalEmotions.push(voiceToEmotionMap[currentVoiceData.tone]);
      if (currentTextData) {
        const td = (currentTextData.detailedEmotion && (currentTextData.detailedEmotion in ({} as any))) ? currentTextData.detailedEmotion : currentTextData.detailedEmotion || sentimentToEmotionMap[currentTextData.sentiment];
        modalEmotions.push((td as string) || sentimentToEmotionMap[currentTextData.sentiment]);
      }

      const counts: Record<string, number> = {};
      modalEmotions.forEach(m => { counts[m] = (counts[m] || 0) + 1; });
      let modalDominant: string | null = null;
      let modalMax = 0;
      Object.entries(counts).forEach(([k,v]) => { if (v > modalMax) { modalMax = v; modalDominant = k; } });

      // Get a small recent history for context
      let recentHistory: string[] = [];
      try {
        const hist = await getTodayEmotionHistory();
        recentHistory = hist.slice(-5).map(h => h.emotion);
      } catch (e) {
        recentHistory = [];
      }

  if (modalDominant && modalMax >= 2) {
        // Majority agreement among modalities — create an immediate heuristic suggestion
        const agreedEmotion = modalDominant as Emotion;
        // personalize threshold using user settings and baseline
        const settings = (await getUserSettings()) || { interventionThreshold: 80 } as any;
        const baseline = await getUserBaseline();
        let adjustedThreshold = settings.interventionThreshold || 80;
        if (baseline && baseline.summary && baseline.summary.avgConfidence) {
          // If user's baseline shows generally higher confidence for 'stressed', nudge threshold up
          const baseStressAvg = baseline.summary.avgConfidence['stressed'] || 0;
          if (baseStressAvg > 60) adjustedThreshold = Math.min(95, adjustedThreshold + 5);
        }

        const agreedConf = Math.min(100, Math.round(emotionState.confidence));

        // Quick heuristic suggestion (instant) so UI has something to show
        const heuristicMap: Record<Emotion, string> = {
          calm: 'Take a moment to notice your breath for 30 seconds.',
          stressed: 'Try 5 deep diaphragmatic breaths: 4 in, 4 hold, 6 out.',
          anxious: 'Grounding: name 3 things you can see, 2 you can touch, 1 you can hear.',
          sad: 'Write down one small positive thing that happened recently.',
          happy: 'Celebrate the moment — take a mindful pause and smile.',
          energized: 'Channel energy into a 1-minute stretch or walk.',
          frustrated: 'Take a 60-second break away from the task and breathe.',
          fatigued: 'Stand up and shake out your limbs for 30 seconds.',
          neutral: 'Take a short mindful pause.',
        };

        const immediateText = heuristicMap[agreedEmotion] || 'Take a short mindful pause.';
        const immediateSuggestion: WellnessIntervention = {
          interventionType: emotionState.interventionType || 'breathing',
          actionText: immediateText,
          estimatedDuration: 30,
          scientificBasis: 'Instant heuristic suggestion for quick support',
          priority: agreedConf > 85 ? 'high' : 'medium',
          timestamp: Date.now(),
        };

        (emotionState as any).wellnessSuggestions = [immediateText];
        emotionState.suggestedIntervention = immediateSuggestion;
        emotionState.interventionNeeded = true;

        // Kick off async AI suggestion generation; when it returns, replace and broadcast
        (async () => {
          try {
            const aiSuggestions = await generateWellnessSuggestions(agreedEmotion as Emotion, agreedConf, recentHistory as Emotion[], Math.max(1, recentHistory.length) * 3);
            if (aiSuggestions && aiSuggestions.length > 0) {
              (emotionState as any).wellnessSuggestions = aiSuggestions;
              emotionState.suggestedIntervention = {
                interventionType: emotionState.interventionType || 'breathing',
                actionText: aiSuggestions[0],
                estimatedDuration: 60,
                scientificBasis: 'AI-generated wellness suggestion',
                priority: agreedConf > 85 ? 'high' : 'medium',
                timestamp: Date.now(),
              } as WellnessIntervention;

              // Update the global lastEmotionState and broadcast updated state to UI
              try {
                lastEmotionState = emotionState;
                chrome.runtime.sendMessage({ type: 'EMOTION_STATE_UPDATE', data: lastEmotionState });
              } catch (e) {
                // ignore
              }

              // Also broadcast to tabs
              try {
                chrome.tabs.query({}, (tabs) => {
                  tabs.forEach((tab) => {
                    if (tab.id) {
                      chrome.tabs.sendMessage(tab.id as number, { type: 'EMOTION_STATE_UPDATE', data: lastEmotionState }, () => { /* ignore */ });
                    }
                  });
                });
              } catch (e) {
                // ignore
              }
            }
          } catch (err) {
            console.warn('[Background] Async AI suggestion generation failed:', err);
          }
        })();
      } else if (emotionState.interventionNeeded) {
        // Fallback: if intervention is needed by threshold rules, generate a single intervention
        const intervention = await generateIntervention();
        emotionState.suggestedIntervention = intervention;
      }
    } catch (e) {
      console.warn('[Background] Failed to generate suggested intervention:', e);
    }

    console.log(`[Background] Fused emotion state: ${primaryEmotion} (${confidence}%)`);
    return emotionState;
  } catch (error) {
    console.error('Error fusing emotion data:', error);
    return null;
  }
};

/**
 * Start continuous emotion fusion process
 */
const startEmotionFusion = (): void => {
  emotionFusionInterval = setInterval(async () => {
    const emotionState = await fuseEmotionData();
    if (emotionState) {
      lastEmotionState = emotionState;
      
      // Save to storage
      await saveEmotionData({
        timestamp: Date.now(),
        emotion: emotionState.primaryEmotion,
        confidence: emotionState.confidence,
        duration: 3,
        modalities: emotionState.modalities as any,
      });
      
      // Also save to emotion history for stats
      try {
        const result = await chrome.storage.local.get(['emotionHistory']);
        const history = result.emotionHistory || [];
        history.push({
          timestamp: Date.now(),
          emotion: emotionState.primaryEmotion,
          confidence: emotionState.confidence,
        });
        // Keep only last 1000 entries
        if (history.length > 1000) {
          history.shift();
        }
        await chrome.storage.local.set({ emotionHistory: history });
      } catch (e) {
        // Ignore errors
      }

      console.log('[Background] Broadcasting emotion state to all listeners');

      // Broadcast to content scripts (web pages)
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(
              tab.id,
              {
                type: 'EMOTION_STATE_UPDATE',
                data: emotionState,
              },
              (result) => {
                // Silently handle errors - tab may not have content script
                if (chrome.runtime.lastError) {
                  // Expected for some tabs
                }
              }
            );
          }
        });
      });

      // If fusion suggests content filtering (e.g., dim_negative), request a targeted rewrite
      try {
        if (emotionState.contentFilterMode && emotionState.contentFilterMode !== 'none' && emotionState.confidence >= 70) {
          // Send to active tab only to avoid surprising background tabs
          chrome.tabs.query({ active: true, currentWindow: true }, async (activeTabs) => {
            try {
              if (!activeTabs || !activeTabs[0] || !activeTabs[0].id) return;
              const activeTab = activeTabs[0];

              // Check per-site opt-out and cooldown
              const url = activeTab.url || '';
              const host = (() => {
                try {
                  return new URL(url).hostname;
                } catch (e) {
                  return url;
                }
              })();

              const storage = await chrome.storage.local.get(['rewriteOptOutSites', 'rewriteCooldowns', 'rewriteHistory']);
              const optOutSites: string[] = storage.rewriteOptOutSites || [];
              const cooldowns: Record<string, number> = storage.rewriteCooldowns || {};

              if (optOutSites.includes(host)) {
                console.log('[Background] Site opted-out of rewrites:', host);
                return;
              }

              const lastTs = cooldowns[String(activeTab.id)] || 0;
              const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
              if (Date.now() - lastTs < COOLDOWN_MS) {
                console.log('[Background] Skipping rewrite due to cooldown for tab', activeTab.id);
                return;
              }

              const tabId = activeTab.id as number;

              chrome.tabs.sendMessage(
                tabId,
                {
                  type: 'REQUEST_CONTENT_REWRITE',
                  data: {
                    mode: emotionState.contentFilterMode,
                    emotionState,
                  },
                },
                async (resp) => {
                  if (chrome.runtime.lastError) {
                    // Tab may not have the content script injected - ignore
                    console.warn('[Background] REQUEST_CONTENT_REWRITE failed (no content script):', chrome.runtime.lastError.message);
                    return;
                  }

                  if (resp && resp.success) {
                    // Update cooldown for this tab and log the rewrite
                    cooldowns[String(tabId)] = Date.now();
                    const history = storage.rewriteHistory || [];
                    history.push({
                      timestamp: Date.now(),
                      tabId,
                      url,
                      mode: emotionState.contentFilterMode,
                      primaryEmotion: emotionState.primaryEmotion,
                    });

                    // Keep history size bounded
                    if (history.length > 1000) history.shift();

                    await chrome.storage.local.set({ rewriteCooldowns: cooldowns, rewriteHistory: history });
                    console.log('[Background] Rewrite applied and logged for tab', activeTab.id);
                  } else {
                    console.log('[Background] Rewrite response indicated failure for tab', activeTab.id, resp);
                  }
                }
              );
              console.log('[Background] Sent REQUEST_CONTENT_REWRITE to active tab', activeTab.id, emotionState.contentFilterMode);
            } catch (err) {
              console.warn('[Background] Error while attempting REQUEST_CONTENT_REWRITE:', err);
            }
          });
        }
      } catch (e) {
        // Ignore messaging errors
      }

      // Also send to sidepanel via runtime message (for dashboard)
      try {
        chrome.runtime.sendMessage(
          {
            type: 'EMOTION_STATE_UPDATE',
            data: emotionState,
          },
          (result) => {
            if (chrome.runtime.lastError) {
              // This is expected if no listener
            }
          }
        );
      } catch (e) {
        // Ignore errors
      }
    }
  }, 3000); // Every 3 seconds
};

/**
 * Analyze text sentiment using local advanced NLP classifier when available
 * Falls back to simple heuristics only if the advanced classifier throws
 */
const analyzeText = async (text: string): Promise<any> => {
  try {
    if (!text || text.trim().length === 0) {
      return { sentiment: 'neutral', emotionScore: 0, keywords: [], detailedEmotion: 'neutral' };
    }

    // Use local advanced NLP classifier (deterministic, CSP-compliant)
    try {
      const result = classifyTextEmotionAdvanced(text);
      // Map classifier emotion to sentiment
      const positiveSet = new Set(['happy', 'excited', 'calm', 'optimistic', 'grateful']);
      const negativeSet = new Set(['sad', 'angry', 'frustrated', 'disappointed', 'anxious', 'stressed']);
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (positiveSet.has(result.emotion)) sentiment = 'positive';
      else if (negativeSet.has(result.emotion)) sentiment = 'negative';

      return {
        sentiment,
        emotionScore: Math.min(100, Math.max(0, result.confidence || 0)),
        keywords: [],
        detailedEmotion: result.emotion,
        context: result.context || 'other',
      };
    } catch (e) {
      console.warn('[Background] advancedNLP failed, falling back to heuristics:', e);
    }

    // Fallback heuristics (fast, non-network)
    const negativeWords = ['bad', 'angry', 'sad', 'hate', 'awful', 'terrible', 'horrible'];
    const positiveWords = ['good', 'happy', 'love', 'great', 'awesome', 'excellent', 'wonderful'];
    const textLower = text.toLowerCase();
    const negativeCount = negativeWords.filter(w => textLower.includes(w)).length;
    const positiveCount = positiveWords.filter(w => textLower.includes(w)).length;

    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (negativeCount > positiveCount) sentiment = 'negative';
    else if (positiveCount > negativeCount) sentiment = 'positive';

    return {
      sentiment,
      emotionScore: Math.min(100, (Math.abs(negativeCount - positiveCount) / Math.max(1, text.length)) * 100),
      keywords: text.split(/\s+/).filter(w => w.length > 5),
      detailedEmotion: sentiment === 'positive' ? 'happy' : sentiment === 'negative' ? 'sad' : 'neutral',
      context: 'other',
    };
  } catch (error) {
    console.error('Error analyzing text:', error);
    return { sentiment: 'neutral', emotionScore: 0, keywords: [], detailedEmotion: 'neutral' };
  }
};

/**
 * Generate wellness intervention
 */
const generateIntervention = async (): Promise<WellnessIntervention | null> => {
  if (!lastEmotionState) return null;

  try {
    const history = await getTodayEmotionHistory();
    const settings = await getUserSettings();

    const interventionTypes = ['breathing', 'movement', 'cognitive', 'break', 'gratitude', 'grounding'];
    const randomType = interventionTypes[Math.floor(Math.random() * interventionTypes.length)];

    const interventions: Record<string, string> = {
      breathing: 'Take 5 deep breaths: inhale for 4, hold for 4, exhale for 6.',
      movement: 'Stand up and stretch for 30 seconds. Reduces muscle tension.',
      cognitive: 'Name 3 things you\'re grateful for today.',
      break: 'Step away from the screen for 2 minutes.',
      gratitude: 'Write down one positive thing that happened today.',
      grounding: 'Name 3 things you see, 2 you hear, 1 you touch.',
    };

    return {
      interventionType: randomType as any,
      actionText: interventions[randomType],
      estimatedDuration: randomType === 'break' ? 120 : randomType === 'breathing' ? 30 : 60,
      scientificBasis: 'Evidence-based wellness technique for emotional regulation.',
      priority: lastEmotionState.confidence > 85 ? 'high' : 'medium',
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error generating intervention:', error);
    return null;
  }
};

/**
 * Stop emotion fusion on unload
 */
const cleanup = (): void => {
  if (emotionFusionInterval) {
    clearInterval(emotionFusionInterval);
  }
};

// Initialize on load
const initializeWorker = async (): Promise<void> => {
  try {
    await initializeDatabase();
  } catch (e) {
    console.warn('[Background] initializeDatabase failed or already initialized:', e);
  }

  try {
    chrome.runtime.onMessage.addListener(handleMessage as any);
  } catch (e) {
    console.warn('[Background] Failed to register message listener:', e);
  }

  // Start fusion loop
  if (!emotionFusionInterval) {
    startEmotionFusion();
  }
};

initializeWorker();

// Cleanup on unload
self.addEventListener('unload', cleanup);
