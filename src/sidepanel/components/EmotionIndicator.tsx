import { EmotionState } from '../../types/index';
import { emotionColorMap, emotionLightColorMap, getEmotionLabel, getEmotionEmoji } from '../../utils/emotions';
import { useState } from 'react';

interface Props {
  emotionState: EmotionState;
}

export default function EmotionIndicator({ emotionState }: Props) {
  const [copied, setCopied] = useState(false);
  
  // Handle loading and no-emotion states
  const hasVoiceInput = (emotionState.modalities.voice?.intensity || 0) > 0;
  const hasTextInput = (emotionState.modalities.text?.emotionScore || 0) > 0;
  const hasFacialInput = (emotionState.modalities.facial?.confidence || 0) > 0;
  const hasAnyInput = hasVoiceInput || hasTextInput || hasFacialInput;
  
  const isNoEmotion = !hasAnyInput || emotionState.confidence === 0;
  
  const emotionColor = isNoEmotion ? '#999' : emotionColorMap[emotionState.primaryEmotion] || '#999';
  const emotionLightColor = isNoEmotion ? '#f0f0f0' : emotionLightColorMap[emotionState.primaryEmotion] || '#f0f0f0';
  const emoji = isNoEmotion ? '👋' : getEmotionEmoji(emotionState.primaryEmotion);
  const label = isNoEmotion ? 'Waiting for input...' : getEmotionLabel(emotionState.primaryEmotion);

  const copyEmotionState = () => {
    const text = `Current Emotion: ${emoji} ${label} (${emotionState.confidence}%)\nTimestamp: ${new Date(emotionState.timestamp).toLocaleString()}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="card" style={{ background: emotionLightColor + '40', borderLeft: `4px solid ${emotionColor}` }}>
      <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Current Emotional State</span>
        <button 
          onClick={copyEmotionState}
          style={{
            background: 'none',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
          title="Copy emotion state"
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div style={{ fontSize: '32px' }}>{emoji}</div>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: emotionColor }}>{label}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Confidence: {emotionState.confidence}%
          </div>
        </div>
      </div>

      <div className="confidence-meter">
        <div className="confidence-meter-fill" style={{ width: `${emotionState.confidence}%` }} />
      </div>

      {/* Modality Breakdown */}
      <div style={{ fontSize: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
        <div style={{ fontWeight: '600', marginBottom: '8px' }}>Modality Breakdown:</div>
        
        {emotionState.modalities.facial && (
          <div className="stat">
            <span className="stat-label">👤 Facial:</span>
            <span className="stat-value">{emotionState.modalities.facial.detected || '—'}</span>
          </div>
        )}
        
        {emotionState.modalities.voice && (
          <div className="stat" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="stat-label">🎤 Voice:</span>
            <span className="stat-value">{emotionState.modalities.voice.detected || '—'}</span>
            {emotionState.modalities.voice.intensity > 5 && (
              <span style={{ 
                fontSize: '10px', 
                background: '#4ade80', 
                color: 'white', 
                padding: '2px 6px', 
                borderRadius: '4px',
                animation: 'pulse 1.5s infinite'
              }}>
                🔴 LIVE
              </span>
            )}
          </div>
        )}
        
        {emotionState.modalities.text && (
          <div className="stat">
            <span className="stat-label">📝 Text:</span>
            <span className="stat-value">{emotionState.modalities.text.detected || '—'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
