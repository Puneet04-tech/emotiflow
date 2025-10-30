import { useState, useEffect } from 'react';
import { getWellnessStats, getEmotionHistory } from '../../utils/storage';

export default function WellnessStats() {
  const [stats, setStats] = useState({
    interventions: 0,
    avgBaseline: 'Calm',
    stressReduction: 0,
    positiveEmotions: 0,
    streak: 1,
    totalSessions: 0,
    dominantEmotion: 'neutral',
    transitions: 0,
    avgConfidence: 0,
    recentSuggestions: [] as string[],
    lastInterventionText: '' as string,
  });

  useEffect(() => {
    // Calculate real-time stats from storage and background state
    const updateStats = async () => {
      try {
        const now = Date.now();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const statsResult = await getWellnessStats(startOfDay.getTime(), now);
        if (!statsResult) return;

        // Also compute total sessions (number of emotion entries today)
        const todayEntries = await getEmotionHistory(startOfDay.getTime(), now);

        // Compute dominant emotion and transitions from history
        const counts: Record<string, number> = {};
        let transitions = 0;
        let lastEmotion: string | null = null;
        let sumConfidence = 0;
        todayEntries.forEach((e: any) => {
          counts[e.emotion] = (counts[e.emotion] || 0) + 1;
          if (lastEmotion && lastEmotion !== e.emotion) transitions++;
          lastEmotion = e.emotion;
          sumConfidence += (e.confidence || 0);
        });

        let dominant = 'neutral';
        let max = 0;
        Object.entries(counts).forEach(([k, v]) => { if (v > max) { max = v; dominant = k; } });

        const avgConfidence = todayEntries.length ? Math.round((sumConfidence / todayEntries.length)) : 0;

        // Pull last wellness suggestions from background state
        let recentSuggestions: string[] = [];
        let lastInterventionText = '';
        try {
          chrome.runtime.sendMessage({ type: 'GET_EMOTION_STATE' }, (resp) => {
            if (chrome.runtime.lastError) return;
            if (resp) {
              if ((resp as any).wellnessSuggestions && Array.isArray((resp as any).wellnessSuggestions)) {
                recentSuggestions = (resp as any).wellnessSuggestions.slice(0, 5);
              }
              if ((resp as any).suggestedIntervention && (resp as any).suggestedIntervention.actionText) {
                lastInterventionText = (resp as any).suggestedIntervention.actionText;
              }

              setStats((prev) => ({ ...prev,
                interventions: statsResult.interventionsCompleted,
                avgBaseline: statsResult.averageEmotionalBaseline.charAt(0).toUpperCase() + statsResult.averageEmotionalBaseline.slice(1),
                stressReduction: statsResult.stressReductionPercentage,
                positiveEmotions: statsResult.positiveEmotionPercentage,
                streak: statsResult.streak || 0,
                totalSessions: todayEntries.length || 0,
                dominantEmotion: dominant,
                transitions,
                avgConfidence,
                recentSuggestions,
                lastInterventionText,
              }));
            }
          });
        } catch (e) {
          // fallback set without background suggestions
          setStats((prev) => ({ ...prev,
            interventions: statsResult.interventionsCompleted,
            avgBaseline: statsResult.averageEmotionalBaseline.charAt(0).toUpperCase() + statsResult.averageEmotionalBaseline.slice(1),
            stressReduction: statsResult.stressReductionPercentage,
            positiveEmotions: statsResult.positiveEmotionPercentage,
            streak: statsResult.streak || 0,
            totalSessions: todayEntries.length || 0,
            dominantEmotion: dominant,
            transitions,
            avgConfidence,
          }));
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card">
      <div className="card-title">🎯 Wellness Statistics</div>
      <div className="stat">
        <span className="stat-label">Today's Sessions</span>
        <span className="stat-value">{stats.totalSessions}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Today's Interventions</span>
        <span className="stat-value">{stats.interventions}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Dominant Emotion</span>
        <span className="stat-value">{stats.dominantEmotion}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Transitions</span>
        <span className="stat-value">{stats.transitions}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Avg Confidence</span>
        <span className="stat-value">{stats.avgConfidence}%</span>
      </div>
      <div className="stat">
        <span className="stat-label">Stress Reduction</span>
        <span className="stat-value">{stats.stressReduction > 0 ? '+' : ''}{stats.stressReduction}%</span>
      </div>
      <div className="stat">
        <span className="stat-label">Positive Emotions</span>
        <span className="stat-value">{stats.positiveEmotions}%</span>
      </div>
      <div className="stat">
        <span className="stat-label">Last Suggestion</span>
        <span className="stat-value">{stats.lastInterventionText || (stats.recentSuggestions[0] || '—')}</span>
      </div>
      {stats.recentSuggestions && stats.recentSuggestions.length > 0 && (
        <div className="recent-suggestions">
          <div className="card-subtitle">Recent Suggestions</div>
          <ul>
            {stats.recentSuggestions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
