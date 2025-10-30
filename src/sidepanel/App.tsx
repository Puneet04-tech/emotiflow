import { useEffect, useState } from 'react';
import EmotionIndicator from './components/EmotionIndicator';
import EmotionTimeline from './components/EmotionTimeline';
import PatternInsights from './components/PatternInsights';
import WellnessStats from './components/WellnessStats';
import InterventionCard from './components/InterventionCard';
import SettingsPanel from './components/SettingsPanel';
import { EmotionState } from '../types/index';
import { detailedEmotionToEmotionMap } from '../utils/emotions';
import { initializeDatabase } from '../utils/storage';

export default function App() {
  // Set default state to show waiting for input
  const defaultEmotionState: EmotionState = {
    primaryEmotion: 'neutral',
    confidence: 0,
    emotionVector: {
      calm: 0,
      stressed: 0,
      anxious: 0,
      sad: 0,
      happy: 0,
      energized: 0,
      frustrated: 0,
      fatigued: 0,
      neutral: 0,
    },
    timestamp: new Date().toISOString(),
    modalities: {},
    interventionNeeded: false,
    interventionType: null,
    contentFilterMode: 'none',
    uiAdaptation: 'neutral',
  };

  const [emotionState, setEmotionState] = useState<EmotionState>(defaultEmotionState);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'insights' | 'settings'>('dashboard');
  const [lastProvider, setLastProvider] = useState<string>('unknown');
  const [providerSettings, setProviderSettings] = useState({ enableGemini: true, enableCloudAI: true });

  useEffect(() => {
    // Ensure local DB is initialized for sidepanel usage (wellness stats, settings)
    (async () => {
      try {
        await initializeDatabase();
        console.log('[Sidepanel] Local DB initialized');
      } catch (e) {
        console.warn('[Sidepanel] Failed to initialize local DB:', e);
      }
    })();

    // Listen for emotion state updates
    const listener = (message: any) => {
      // Immediate update when a full fused state arrives
      if (message.type === 'EMOTION_STATE_UPDATE') {
        setEmotionState(message.data);
        return;
      }

      // Also handle quick text-only sentiment messages so the sidepanel updates instantly
      if (message.type === 'TEXT_SENTIMENT' && message.data) {
        try {
          const detailed = message.data.detailedEmotion || 'neutral';
          const primary = (detailed && detailedEmotionToEmotionMap[detailed]) ? detailedEmotionToEmotionMap[detailed] : 'calm';
          const conf = Math.round(message.data.emotionScore || 50);

          const vector: Record<string, number> = {
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
          vector[primary] = conf;

          const immediateState: EmotionState = {
            primaryEmotion: primary,
            confidence: conf,
            emotionVector: vector as any,
            timestamp: new Date().toISOString(),
            modalities: {
              text: {
                sentiment: message.data.sentiment || 'neutral',
                emotionScore: conf,
                keywords: message.data.keywords || [],
                context: message.data.context || 'other',
                timestamp: Date.now(),
                detected: primary,
              },
            },
            interventionNeeded: false,
            interventionType: null,
            contentFilterMode: 'none',
            uiAdaptation: 'neutral',
          };

          console.log('[Sidepanel] Received TEXT_SENTIMENT, updating immediate state:', immediateState);
          setEmotionState(immediateState);
        } catch (err) {
          console.warn('[Sidepanel] Failed to apply TEXT_SENTIMENT immediate update:', err);
        }
      }
    };

    chrome.runtime.onMessage.addListener(listener);

    // Request current emotion state and set up retry mechanism
    const requestState = async () => {
      try {
        console.log('[Sidepanel] Requesting initial emotion state...');
        chrome.runtime.sendMessage({ type: 'GET_EMOTION_STATE' }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('[Sidepanel] Error getting state:', chrome.runtime.lastError);
            // Retry after 1 second
            setTimeout(requestState, 1000);
            return;
          }
          
          if (response && response.primaryEmotion) {
            console.log('[Sidepanel] Received initial state:', response);
            setEmotionState(response);
          } else {
            console.warn('[Sidepanel] No valid state received');
          }
        });
      } catch (e) {
        console.error('[Sidepanel] Failed to request state:', e);
        // Retry after 1 second
        setTimeout(requestState, 1000);
      }
    };

    requestState();

    // Load last provider and provider settings
    chrome.storage.local.get(['last_ai_provider', 'enable_gemini', 'enable_cloud_ai'], (res) => {
      if (res) {
        if (res.last_ai_provider) setLastProvider(res.last_ai_provider as string);
        setProviderSettings({ enableGemini: res.enable_gemini !== false, enableCloudAI: res.enable_cloud_ai !== false });
      }
    });

    const storageListener = (changes: any, areaName: string) => {
      if (areaName !== 'local') return;
      if (changes.last_ai_provider) setLastProvider(changes.last_ai_provider.newValue || 'unknown');
      if (changes.enable_gemini || changes.enable_cloud_ai) {
        chrome.storage.local.get(['enable_gemini', 'enable_cloud_ai'], (r) => {
          setProviderSettings({ enableGemini: r.enable_gemini !== false, enableCloudAI: r.enable_cloud_ai !== false });
        });
      }
    };
    chrome.storage.onChanged.addListener(storageListener);

    return () => {
      chrome.storage.onChanged.removeListener(storageListener);
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);

  return (
    <div className="emotiflow-app">
      <div className="app-header">
        <h1 className="app-title">EmotiFlow</h1>
        <p className="app-subtitle">Your Emotional Wellness Companion</p>
        <div style={{ fontSize: '12px', color: '#9AA' }}>
          Last AI provider: <strong>{lastProvider}</strong>
          {' '}• Gemini: {providerSettings.enableGemini ? 'on' : 'off'} • Cloud AI: {providerSettings.enableCloudAI ? 'on' : 'off'}
        </div>
      </div>

      <div className="app-tabs">
        <button
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`tab-button ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          💡 Insights
        </button>
        <button
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'dashboard' && (
          <>
            <EmotionIndicator emotionState={emotionState} />
            <InterventionCard emotionState={emotionState} />
            <EmotionTimeline />
            <WellnessStats />
          </>
        )}

        {activeTab === 'insights' && (
          emotionState ? (
            <PatternInsights />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <h2>No Insights Yet</h2>
              <p>Insights will appear once EmotiFlow has detected your emotions</p>
            </div>
          )
        )}

        {activeTab === 'settings' && (
          <SettingsPanel />
        )}
      </div>
    </div>
  );
}
