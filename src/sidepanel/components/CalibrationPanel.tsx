import React, { useEffect, useRef, useState } from 'react';
import { getUserBaseline } from '../../utils/storage';

export default function CalibrationPanel() {
  const [running, setRunning] = useState(false);
  const [duration, setDuration] = useState<number>(30); // seconds
  const [samples, setSamples] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [baseline, setBaseline] = useState<any>(null);
  const intervalRef = useRef<number | null>(null);
  const startTsRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const b = await getUserBaseline();
        setBaseline(b);
      } catch (e) {
        // ignore
      }
    })();
  }, [samples]);

  const start = () => {
    if (running) return;
    setRunning(true);
    setSamples(0);
    setProgress(0);
    startTsRef.current = Date.now();

    // Poll every 2 seconds for samples
    intervalRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - (startTsRef.current || Date.now())) / 1000;
      setProgress(Math.min(100, Math.round((elapsed / duration) * 100)));

      // Request current emotion state and forward as baseline sample
      try {
        chrome.runtime.sendMessage({ type: 'GET_EMOTION_STATE' }, (resp) => {
          if (chrome.runtime.lastError) return;
          if (resp && resp.primaryEmotion) {
            const data = { primaryEmotion: resp.primaryEmotion, confidence: resp.confidence || 50, timestamp: Date.now() };
            chrome.runtime.sendMessage({ type: 'SAVE_BASELINE_SAMPLE', data }, () => {
              // ignore
            });
            setSamples((s) => s + 1);
          }
        });
      } catch (e) {
        // ignore
      }

      if (elapsed >= duration) {
        stop();
      }
    }, 2000);
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
    setProgress(100);
    // Refresh baseline
    (async () => {
      try {
        const b = await getUserBaseline();
        setBaseline(b);
      } catch (e) {}
    })();
  };

  const clearBaseline = async () => {
    try {
      await chrome.storage.local.set({ user_baseline: null });
      setBaseline(null);
    } catch (e) {
      console.warn('Failed to clear baseline', e);
    }
  };

  return (
    <div style={{ marginTop: 12 }} className="card">
      <div style={{ fontWeight: 700, marginBottom: 8 }}>🧭 Personal Calibration</div>
      <div style={{ fontSize: 13, marginBottom: 8 }}>Calibrate EmotiFlow to your baseline. This helps reduce false positives and tailors suggestions to you.</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <label style={{ fontSize: 13 }}>Duration (seconds):</label>
        <input type="number" value={duration} min={10} max={120} onChange={(e) => setDuration(parseInt(e.target.value || '30'))} style={{ width: 80 }} />
        {!running ? (
          <button className="btn btn-primary" onClick={start}>Start Calibration</button>
        ) : (
          <button className="btn btn-secondary" onClick={stop}>Stop</button>
        )}
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: '#667eea' }}></div>
        </div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>{samples} samples collected</div>
      </div>

      {baseline ? (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>Baseline summary</div>
          <div style={{ fontSize: 12, color: '#444' }}>
            {baseline.summary ? (
              <div>
                <div>Sample count: {baseline.samples?.length || 0}</div>
                <div style={{ marginTop: 6 }}>
                  {Object.entries(baseline.summary.counts || {}).map(([k, v]: any) => (
                    <div key={k} style={{ fontSize: 12 }}>{k}: {v} (avg conf: {baseline.summary.avgConfidence?.[k] ?? 'N/A'})</div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#777' }}>Collect baseline samples to see summary here.</div>
            )}
          </div>
          <div style={{ marginTop: 8 }}>
            <button className="btn btn-danger" onClick={clearBaseline}>Clear Baseline</button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: '#777', marginTop: 8 }}>No baseline yet. Run calibration to personalize EmotiFlow.</div>
      )}
    </div>
  );
}
