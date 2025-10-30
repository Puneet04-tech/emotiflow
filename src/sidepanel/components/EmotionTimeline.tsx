import React from 'react';

void React;

export default function EmotionTimeline() {
  return (
    <div className="card">
      <div className="card-title">📈 Emotion Timeline (24h)</div>
      <p style={{ fontSize: '12px', color: '#999', textAlign: 'center', padding: '20px 0' }}>
        Timeline chart will display emotion trends over the last 24 hours
      </p>
      <div style={{ 
        height: '100px', 
        background: '#f5f5f5', 
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        padding: '8px'
      }}>
        {[40, 65, 55, 75, 60, 70].map((height, i) => (
          <div
            key={i}
            style={{
              width: '12px',
              height: `${height}px`,
              background: `linear-gradient(180deg, #667eea 0%, #764ba2 100%)`,
              borderRadius: '4px',
              opacity: 0.6 + i * 0.1
            }}
          />
        ))}
      </div>
    </div>
  );
}
