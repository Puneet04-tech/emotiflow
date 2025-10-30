import { useState } from 'react';
import { useEffect } from 'react';
import CalibrationPanel from './CalibrationPanel';

export default function SettingsPanel() {
  const [settings, setSettings] = useState({
    enableFacialDetection: true,
    enableVoiceAnalysis: true,
    enableTextSentiment: true,
    enableGemini: true,
    enableCloudAI: true,
    interventionThreshold: 80,
    privacyMode: false,
    uiThemeDark: true,
  });
  const [currentHost, setCurrentHost] = useState<string>('');
  const [optOutSites, setOptOutSites] = useState<string[]>([]);
  const [rewriteHistory, setRewriteHistory] = useState<any[]>([]);
  const [enableContextAwareness, setEnableContextAwareness] = useState<boolean>(true);
  const [calendarIntegrationEnabled, setCalendarIntegrationEnabled] = useState<boolean>(false);
  const [enableFaceModel, setEnableFaceModel] = useState<boolean>(false);

  useEffect(() => {
    // Load current tab host and stored opt-outs/history
    const load = async () => {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tabs[0]?.url || '';
        let host = '';
        try { host = new URL(url).hostname; } catch (e) { host = url; }
        setCurrentHost(host);

        const storage = await chrome.storage.local.get(['rewriteOptOutSites', 'rewriteHistory']);
        const more = await chrome.storage.local.get(['enable_gemini', 'enable_cloud_ai']);
        setOptOutSites(storage.rewriteOptOutSites || []);
        setRewriteHistory(storage.rewriteHistory || []);
        if (more && typeof more.enable_gemini === 'boolean') {
          setSettings(prev => ({ ...prev, enableGemini: more.enable_gemini }));
        }
        if (more && typeof more.enable_cloud_ai === 'boolean') {
          setSettings(prev => ({ ...prev, enableCloudAI: more.enable_cloud_ai }));
        }
  const ctx = await chrome.storage.local.get(['enable_context_awareness', 'calendar_integration_enabled', 'enable_face_model']);
  if (typeof ctx.enable_context_awareness === 'boolean') setEnableContextAwareness(ctx.enable_context_awareness);
  if (typeof ctx.calendar_integration_enabled === 'boolean') setCalendarIntegrationEnabled(ctx.calendar_integration_enabled);
  if (typeof ctx.enable_face_model === 'boolean') setEnableFaceModel(ctx.enable_face_model);
        // load theme preference
        const uiThemeDark = storage.uiThemeDark;
        if (typeof uiThemeDark === 'boolean') {
          setSettings(prev => ({ ...prev, uiThemeDark }));
          try { document.body.classList.toggle('emotiflow-dark', uiThemeDark); } catch (e) {}
        }
      } catch (e) {
        console.warn('[SettingsPanel] Failed to load opt-outs/history:', e);
      }
    };

    load();
  }, []);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleGemini = async () => {
    try {
      const next = !settings.enableGemini;
      setSettings(prev => ({ ...prev, enableGemini: next }));
      await chrome.storage.local.set({ enable_gemini: next });
    } catch (e) {
      console.error('[SettingsPanel] Failed to toggle Gemini setting:', e);
    }
  };

  const toggleCloudAI = async () => {
    try {
      const next = !settings.enableCloudAI;
      setSettings(prev => ({ ...prev, enableCloudAI: next }));
      await chrome.storage.local.set({ enable_cloud_ai: next });
    } catch (e) {
      console.error('[SettingsPanel] Failed to toggle Cloud AI setting:', e);
    }
  };

  const toggleContextAwareness = async () => {
    try {
      const next = !enableContextAwareness;
      setEnableContextAwareness(next);
      await chrome.storage.local.set({ enable_context_awareness: next });
    } catch (e) {
      console.error('[SettingsPanel] Failed to toggle context awareness:', e);
    }
  };

  const toggleCalendarIntegration = async () => {
    try {
      const next = !calendarIntegrationEnabled;
      setCalendarIntegrationEnabled(next);
      await chrome.storage.local.set({ calendar_integration_enabled: next });
      if (next) {
        // Inform user that full calendar integration requires granting permissions (outside scope)
        console.log('[SettingsPanel] Calendar integration opt-in enabled (note: full OAuth flow not implemented here)');
      }
    } catch (e) {
      console.error('[SettingsPanel] Failed to toggle calendar integration:', e);
    }
  };

  const handleSliderChange = (value: number) => {
    setSettings(prev => ({
      ...prev,
      interventionThreshold: value
    }));
  };

  const handleExportData = async () => {
    try {
      // Trigger data export
      console.log('Exporting emotion data...');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const toggleSiteOptOut = async () => {
    try {
      const updated = new Set(optOutSites);
      if (updated.has(currentHost)) updated.delete(currentHost);
      else updated.add(currentHost);
      const arr = Array.from(updated);
      await chrome.storage.local.set({ rewriteOptOutSites: arr });
      setOptOutSites(arr);
    } catch (e) {
      console.error('[SettingsPanel] Failed to toggle opt-out:', e);
    }
  };

  const toggleTheme = async () => {
    try {
      const next = !settings.uiThemeDark;
      setSettings(prev => ({ ...prev, uiThemeDark: next }));
      await chrome.storage.local.set({ uiThemeDark: next });
      try { document.body.classList.toggle('emotiflow-dark', next); } catch (e) {}
    } catch (e) {
      console.error('[SettingsPanel] Failed to toggle theme:', e);
    }
  };

  const undoRewrite = async (entry: any) => {
    try {
      // Send message to the tab to restore originals
      if (entry && entry.tabId) {
        chrome.tabs.sendMessage(entry.tabId, { type: 'RESTORE_EMOTIFLOW_ORIGINALS' }, async (resp) => {
          if (chrome.runtime.lastError) {
            console.warn('[SettingsPanel] Undo rewrite failed (no content script):', chrome.runtime.lastError.message);
            return;
          }
          if (resp && resp.success) {
            // Remove entry from history
            const storage = await chrome.storage.local.get(['rewriteHistory']);
            const history = storage.rewriteHistory || [];
            const newHistory = history.filter((h: any) => h.timestamp !== entry.timestamp || h.tabId !== entry.tabId);
            await chrome.storage.local.set({ rewriteHistory: newHistory });
            setRewriteHistory(newHistory);
          }
        });
      }
    } catch (e) {
      console.error('[SettingsPanel] Undo failed:', e);
    }
  };

  const clearHistory = async () => {
    try {
      await chrome.storage.local.set({ rewriteHistory: [] });
      setRewriteHistory([]);
    } catch (e) {
      console.error('[SettingsPanel] Clear history failed:', e);
    }
  };

  return (
    <div className="card">
      <div className="card-title">⚙️ Settings & Privacy</div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>Detection Modules</div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <label style={{ fontSize: '13px' }}>👤 Facial Detection</label>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={settings.enableFacialDetection}
              onChange={() => handleToggle('enableFacialDetection')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <label style={{ fontSize: '13px' }}>🎤 Voice Analysis</label>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={settings.enableVoiceAnalysis}
              onChange={() => handleToggle('enableVoiceAnalysis')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <label style={{ fontSize: '13px' }}>📝 Text Sentiment</label>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={settings.enableTextSentiment}
              onChange={() => handleToggle('enableTextSentiment')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div style={{ marginBottom: '16px', paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
        <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
          Intervention Sensitivity: {settings.interventionThreshold}%
        </label>
        <input 
          type="range" 
          min="60" 
          max="95" 
          value={settings.interventionThreshold}
          onChange={(e) => handleSliderChange(parseInt(e.target.value))}
        />
        <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
          Higher value = fewer interventions
        </p>
      </div>

      <div style={{ marginBottom: '16px', paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '13px' }}>🔒 Privacy Mode</label>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={settings.privacyMode}
              onChange={() => handleToggle('privacyMode')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
          All data stays on your device
        </p>
      </div>

      <div style={{ marginBottom: '16px', paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Content Rewrites</div>
        <div style={{ fontSize: '12px', marginBottom: '8px' }}>
          Current site: <strong>{currentHost || 'unknown'}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ fontSize: '13px' }}>Auto-rewrite enabled</div>
          <label className="toggle-switch">
            <input 
              type="checkbox"
              checked={!optOutSites.includes(currentHost)}
              onChange={toggleSiteOptOut}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Recent rewrites</div>
          {rewriteHistory.length === 0 && <div style={{ fontSize: '12px', color: '#777' }}>No rewrites logged yet.</div>}
          {rewriteHistory.slice().reverse().slice(0, 10).map((entry: any) => (
            <div key={entry.timestamp} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: '12px' }}>
                <div style={{ fontWeight: 600 }}>{entry.primaryEmotion} — {entry.mode}</div>
                <div style={{ fontSize: '11px', color: '#666' }}>{new Date(entry.timestamp).toLocaleString()} • {entry.url}</div>
              </div>
              <div>
                <button className="btn btn-small" onClick={() => undoRewrite(entry)}>Undo</button>
              </div>
            </div>
          ))}
          {rewriteHistory.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <button className="btn btn-danger" onClick={clearHistory}>Clear rewrite history</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
        <CalibrationPanel />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '13px' }}>Use Gemini Nano when available</div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.enableGemini}
              onChange={toggleGemini}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <div style={{ fontSize: '13px' }}>Context-aware interventions</div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={enableContextAwareness}
              onChange={toggleContextAwareness}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <p style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
          When enabled, EmotiFlow avoids showing interventions during meetings or sensitive contexts.
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <div style={{ fontSize: '13px' }}>Connect Calendar (opt-in)</div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={calendarIntegrationEnabled}
              onChange={toggleCalendarIntegration}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <p style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
          Optional: enable calendar integration to let EmotiFlow respect scheduled meetings (requires granting calendar permissions and OAuth; this toggle only opts you in).
        </p>
        <p style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
          Enable Gemini Nano (local) where available. When disabled, EmotiFlow uses configured fallbacks.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <div style={{ fontSize: '13px' }}>Enable Cloud AI (Firebase)</div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.enableCloudAI}
              onChange={toggleCloudAI}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <p style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
          Allow EmotiFlow to call cloud AI fallback (encrypted/anonymized) if Gemini is unavailable.
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <div style={{ fontSize: '13px' }}>Enable Face Model (opt-in)</div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={enableFaceModel}
              onChange={async () => {
                try {
                  const next = !enableFaceModel;
                  setEnableFaceModel(next);
                  await chrome.storage.local.set({ enable_face_model: next });
                  if (next) console.log('[SettingsPanel] Face-model opt-in enabled. Models will be loaded when facial detection starts.');
                } catch (e) {
                  console.error('[SettingsPanel] Failed to toggle face model opt-in:', e);
                }
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <button 
        className="btn btn-secondary"
        onClick={handleExportData}
        style={{ width: '100%', marginTop: '12px' }}
      >
        📥 Export Data as CSV
      </button>
    </div>
  );
}
