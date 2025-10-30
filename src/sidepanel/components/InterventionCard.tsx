import { EmotionState } from '../../types/index';
import { useState } from 'react';

interface Props {
  emotionState: EmotionState;
}

export default function InterventionCard({ emotionState }: Props) {
  // If uncertainty is high, don't show intervention; show a gentle suggestion instead
  const UNCERTAINTY_SUPPRESS_THRESHOLD = 60; // 0-100
  if (!emotionState.interventionNeeded || (emotionState.uncertainty || 0) > UNCERTAINTY_SUPPRESS_THRESHOLD) {
    // Optionally show a subtle nudge when uncertain
    if ((emotionState.uncertainty || 0) > UNCERTAINTY_SUPPRESS_THRESHOLD) {
      return (
        <div className="card" style={{ background: '#333', color: 'white', border: 'none' }}>
          <div className="card-title">✨ Monitoring</div>
          <p style={{ fontSize: '13px', opacity: 0.9 }}>
            We're seeing mixed signals right now. We'll suggest a wellness moment when we are more confident.
          </p>
        </div>
      );
    }
    return null;
  }

  const handleStartIntervention = async () => {
    try {
      const { sendMessageSafe } = await import('../../utils/messaging');
      const { response, error } = await sendMessageSafe({ type: 'REQUEST_INTERVENTION' });
      if (error) console.warn('[InterventionCard] REQUEST_INTERVENTION failed:', error);
    } catch (e) {
      console.warn('[InterventionCard] REQUEST_INTERVENTION error:', e);
    }
  };

  const [completed, setCompleted] = useState(false);

  const handleMarkCompleted = async () => {
    try {
      // Send message to background to log the completed intervention
      chrome.runtime.sendMessage({ type: 'LOG_WELLNESS_INTERVENTION', data: { interventionType: emotionState.interventionType || 'breathing', completed: true, feedback: '' } }, () => {
        // ignore callback
      });
      setCompleted(true);
    } catch (e) {
      console.warn('Failed to log wellness completion', e);
    }
  };

  return (
    <div className="card" style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none'
    }}>
      <div className="card-title" style={{ color: 'white' }}>
        ✨ Wellness Moment Suggested
      </div>
      {emotionState.wellnessSuggestions && emotionState.wellnessSuggestions.length > 0 ? (
        <>
          <div style={{ fontSize: '13px', marginBottom: '12px', opacity: 0.95 }}>
            {emotionState.wellnessSuggestions.slice(0, 3).map((s, i) => (
              <div key={i} style={{ marginBottom: i === 2 ? 0 : 8 }}>{s}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className="btn btn-primary" 
              onClick={handleStartIntervention}
              style={{ flex: 1, background: 'white', color: '#667eea' }}
            >
              Start Guided Exercise
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleMarkCompleted}
              style={{ flex: 0.7 }}
              disabled={completed}
            >
              {completed ? 'Completed' : 'Mark Completed'}
            </button>
          </div>
        </>
      ) : emotionState.suggestedIntervention ? (
        <>
          <p style={{ fontSize: '13px', marginBottom: '12px', opacity: 0.95 }}>
            {emotionState.suggestedIntervention.actionText}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className="btn btn-primary" 
              onClick={handleStartIntervention}
              style={{ flex: 1, background: 'white', color: '#667eea' }}
            >
              Start Guided Exercise
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleMarkCompleted}
              style={{ flex: 0.7 }}
              disabled={completed}
            >
              {completed ? 'Completed' : 'Mark Completed'}
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={{ fontSize: '13px', marginBottom: '12px', opacity: 0.9 }}>
            We notice you might benefit from a brief wellness exercise right now.
          </p>
          <button 
            className="btn btn-primary" 
            onClick={handleStartIntervention}
            style={{ 
              width: '100%',
              background: 'white',
              color: '#667eea'
            }}
          >
            Start Guided Exercise
          </button>
        </>
      )}
    </div>
  );
}
