
import { useEffect, useState } from 'react';
import { getEmotionHistory } from '../../utils/storage';
import { EmotionHistoryEntry } from '../../types';

export default function PatternInsights() {
  const [insights, setInsights] = useState<Array<{ pattern: string; frequency: string }>>([]);

  useEffect(() => {
    const computeInsights = async () => {
      try {
        // Look back 7 days
        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const entries: EmotionHistoryEntry[] = await getEmotionHistory(sevenDaysAgo, now);

        if (!entries || entries.length === 0) {
          setInsights([{ pattern: 'No data yet', frequency: 'Start using EmotiFlow to see insights' }]);
          return;
        }

        // Compute most frequent emotion
        const freq: Record<string, number> = {};
        entries.forEach(e => { freq[e.emotion] = (freq[e.emotion] || 0) + 1; });
        const mostFreq = Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b);

        // Peak stress hour (hour with most stressed/anxious occurrences)
        const stressSet = new Set(['stressed', 'anxious', 'frustrated']);
        const hourCounts: Record<number, number> = {};
        entries.forEach(e => {
          const date = new Date(e.timestamp);
          const hr = date.getHours();
          if (stressSet.has(e.emotion)) {
            hourCounts[hr] = (hourCounts[hr] || 0) + 1;
          }
        });
        const peakStressHour = Object.keys(hourCounts).length === 0 ? null : Number(Object.keys(hourCounts).reduce((a,b) => hourCounts[Number(a)] > hourCounts[Number(b)] ? a : b));

        // Calmest hour (most calm/happy)
        const calmSet = new Set(['calm', 'happy', 'energized']);
        const calmHourCounts: Record<number, number> = {};
        entries.forEach(e => {
          const date = new Date(e.timestamp);
          const hr = date.getHours();
          if (calmSet.has(e.emotion)) {
            calmHourCounts[hr] = (calmHourCounts[hr] || 0) + 1;
          }
        });
        const calmHour = Object.keys(calmHourCounts).length === 0 ? null : Number(Object.keys(calmHourCounts).reduce((a,b) => calmHourCounts[Number(a)] > calmHourCounts[Number(b)] ? a : b));

        // Context correlation (which context has highest negative ratio)
        const contextMap: Record<string, { total: number; negative: number }> = {};
        entries.forEach(e => {
          const ctx = (e.context || 'other') as string;
          contextMap[ctx] = contextMap[ctx] || { total: 0, negative: 0 };
          contextMap[ctx].total += 1;
          if (!['happy','calm','energized','neutral'].includes(e.emotion)) contextMap[ctx].negative += 1;
        });
        let worstContext: string | null = null;
        let worstRatio = 0;
        Object.entries(contextMap).forEach(([ctx, stats]) => {
          const ratio = stats.total > 0 ? stats.negative / stats.total : 0;
          if (ratio > worstRatio && stats.total >= 3) {
            worstRatio = ratio;
            worstContext = ctx;
          }
        });

        // Streak (days with >50% positive emotion) in last 7 days
        const byDay: Record<string, EmotionHistoryEntry[]> = {};
        entries.forEach(e => {
          const d = new Date(e.timestamp).toDateString();
          byDay[d] = byDay[d] || [];
          byDay[d].push(e);
        });
        const dayKeys = Object.keys(byDay).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
        let streak = 0;
        for (let i = dayKeys.length - 1; i >= 0; i--) {
          const dayEntries = byDay[dayKeys[i]];
          const posCount = dayEntries.filter(d => calmSet.has(d.emotion)).length;
          const percent = Math.round((posCount / dayEntries.length) * 100);
          if (percent >= 50) streak++; else break;
        }

        const generated: Array<{ pattern: string; frequency: string }> = [];
        // 1. Most frequent emotion
        generated.push({ pattern: `Most frequent emotion: ${mostFreq}`, frequency: `${freq[mostFreq]} occurrences in last 7 days` });

        // 2-7. Counts per emotion (top emotions)
        const sortedEmotions = Object.keys(freq).sort((a,b) => freq[b]-freq[a]);
        for (let i=0;i<6 && i<sortedEmotions.length;i++) {
          const e = sortedEmotions[i];
          generated.push({ pattern: `Count: ${e}`, frequency: `${freq[e]} occurrences` });
        }

        // 8. Peak stress hour
        if (peakStressHour !== null) generated.push({ pattern: `Peak stress around ${peakStressHour}:00`, frequency: `${hourCounts[peakStressHour] || 0} stress events` });

        // 9. Calmest hour
        if (calmHour !== null) generated.push({ pattern: `Calmest time around ${calmHour}:00`, frequency: `${calmHourCounts[calmHour] || 0} calm events` });

        // 10. Worst context
        if (worstContext) generated.push({ pattern: `Contextually linked: ${worstContext}`, frequency: `${Math.round(worstRatio * 100)}% negative in ${worstContext}` });

        // 11. Positive streak
        generated.push({ pattern: `Positive streak`, frequency: `${streak} day(s)` });

        // 12. Average confidence
        const avgConfidence = Math.round(entries.reduce((s,el)=>s+el.confidence,0)/entries.length);
        generated.push({ pattern: `Average confidence`, frequency: `${avgConfidence}%` });

        // 13. Percent positive / negative
        const positiveSet = new Set(['calm','happy','energized']);
        const positiveCount = entries.filter(e=>positiveSet.has(e.emotion)).length;
        const negativeCount = entries.length - positiveCount;
        generated.push({ pattern: `Positive emotions`, frequency: `${Math.round((positiveCount/entries.length)*100)}% positive` });
        generated.push({ pattern: `Negative emotions`, frequency: `${Math.round((negativeCount/entries.length)*100)}% negative` });

        // 15. Sessions per day average
        const dayCount = Object.keys(byDay).length || 1;
        const avgSessions = Math.round(entries.length / dayCount);
        generated.push({ pattern: `Avg sessions/day`, frequency: `${avgSessions} session(s) per day` });

        // 16. Longest negative streak
        let longestNegStreak = 0; let cur = 0;
        const negSet = new Set(['stressed','anxious','frustrated','sad']);
        entries.forEach(e => { if (negSet.has(e.emotion)) { cur++; longestNegStreak = Math.max(longestNegStreak, cur); } else cur = 0; });
        generated.push({ pattern: `Longest negative run`, frequency: `${longestNegStreak} consecutive event(s)` });

        // 17. Longest positive run
        let longestPos = 0; cur = 0; entries.forEach(e=>{ if (positiveSet.has(e.emotion)) { cur++; longestPos=Math.max(longestPos,cur);} else cur=0; });
        generated.push({ pattern: `Longest positive run`, frequency: `${longestPos} consecutive event(s)` });

        // 18. Emotion transitions (how often mood changed)
        let transitions = 0; for (let i=1;i<entries.length;i++){ if (entries[i].emotion !== entries[i-1].emotion) transitions++; }
        generated.push({ pattern: `Emotion transitions`, frequency: `${transitions} changes` });

        // 19. Top contexts
        const ctxSorted = Object.keys(contextMap).sort((a,b)=> (contextMap[b].total||0)-(contextMap[a].total||0));
        for (let i=0;i<3 && i<ctxSorted.length;i++) {
          const c = ctxSorted[i];
          generated.push({ pattern: `Context: ${c}`, frequency: `${contextMap[c].total} events (${Math.round((contextMap[c].negative/contextMap[c].total)*100)}% negative)` });
        }

        // 20. Variability (standard deviation of confidence)
        const mean = entries.reduce((s,e)=>s+e.confidence,0)/entries.length;
        const variance = entries.reduce((s,e)=>s+Math.pow(e.confidence-mean,2),0)/entries.length;
        const sd = Math.round(Math.sqrt(variance));
        generated.push({ pattern: `Confidence variability`, frequency: `SD ${sd}` });

        setInsights(generated.slice(0,20));
      } catch (e) {
        console.error('Failed to compute insights:', e);
        setInsights([{ pattern: 'Insights error', frequency: 'See console for details' }]);
      }
    };

    computeInsights();
    const iv = setInterval(computeInsights, 60000); // refresh every minute
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="card">
      <div className="card-title">💡 Pattern Insights</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {insights.map((insight, i) => (
          <div key={i} style={{ 
            padding: '12px', 
            background: '#f5f5f5', 
            borderRadius: '8px',
            borderLeft: '3px solid #667eea',
            color: '#0b1220' /* dark text on light card for contrast */
          }}>
            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#0b1220' }}>
              {insight.pattern}
            </div>
            <div style={{ fontSize: '11px', color: '#334155' }}>
              {insight.frequency}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
