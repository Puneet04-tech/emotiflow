/**
 * AI Prompt Templates
 * Pre-built prompts for Gemini Nano integration
 */

export const EMOTIFLOW_SYSTEM_PROMPT = `You are EmotiFlow, an empathetic AI wellness companion integrated into the Chrome browser.
Your purpose is to support users' emotional well-being while they browse the internet.

Guidelines:
1. Detect emotional patterns indicating stress, anxiety, sadness, or fatigue
2. Generate compassionate, non-intrusive micro-interventions
3. Adapt web content to reduce emotional overwhelm
4. Respect user privacy—all processing happens on their device

Always be:
- Gentle, supportive, and never judgmental
- Careful to intervene only when confidence >80% to avoid false positives
- Brief in suggestions (max 15 words) and actionable
- Never diagnosing mental health conditions
- Respectful of user autonomy—always offer opt-out options
- Scientifically accurate in wellness recommendations`;

/**
 * Emotion Fusion & Interpretation Prompt
 */
export const createEmotionFusionPrompt = (
  facialEmotion: string,
  facialConfidence: number,
  voiceTone: string,
  voiceIntensity: number,
  speakingRate: string,
  textSentiment: string,
  emotionalKeywords: string[],
  textContext: string,
  websiteCategory: string,
  timeOnPage: number,
  browsingPattern: string
): string => {
  return `Analyze the following multimodal emotional data and determine the user's current mental state:

FACIAL EXPRESSION DATA:
- Detected emotion: ${facialEmotion}
- Confidence level: ${facialConfidence}%

VOICE TONE INDICATORS:
- Tone pattern: ${voiceTone}
- Acoustic intensity: ${voiceIntensity}
- Speaking rate: ${speakingRate}

TEXT SENTIMENT ANALYSIS:
- Recent typed text sentiment: ${textSentiment}
- Emotional keywords detected: ${emotionalKeywords.join(', ')}
- Context: User was typing ${textContext}

BROWSING CONTEXT:
- Current website category: ${websiteCategory}
- Time on current page: ${timeOnPage} minutes
- Recent browsing pattern: ${browsingPattern}

Based on this multimodal analysis, output a JSON object with:
{
  "primaryEmotion": "one of: calm, stressed, anxious, sad, happy, energized, frustrated, fatigued",
  "confidence": 0-100,
  "emotionalState": "brief description in 10 words",
  "interventionNeeded": true/false,
  "interventionPriority": "low/medium/high",
  "suggestedAction": "specific wellness tip or null",
  "contentFilterMode": "none/dim_negative/highlight_positive/reduce_stimulation",
  "uiAdaptation": "color scheme suggestion based on mood"
}

Provide empathetic, scientifically-grounded analysis.`;
};

/**
 * Content Rewriting Prompt
 */
export const createContentRewritingPrompt = (
  detectedEmotion: string,
  confidence: number,
  originalHeadline: string,
  articleSnippet: string,
  contentType: string,
  contentTone: string,
  timeOfDay: string
): string => {
  return `You have detected that the user is currently feeling ${detectedEmotion} with ${confidence}% certainty.

The user is viewing the following webpage content:

HEADLINE: "${originalHeadline}"
ARTICLE SNIPPET (first 200 words):
"${articleSnippet}"

CONTENT TYPE: ${contentType} (news/blog/social media/documentation)
EMOTIONAL TONE: ${contentTone} (negative/neutral/positive)
TIME OF DAY: ${timeOfDay}

Your task is to REWRITE this content to be more emotionally appropriate for the user's current state while:
1. Maintaining 100% factual accuracy—never change facts or data
2. Preserving the core message and journalistic integrity
3. Softening emotionally charged language if user is stressed/anxious
4. Adding context or nuance to reduce alarm
5. Using gentle, balanced tone without being condescending
6. Keeping the same approximate length

Output format:
{
  "rewrittenHeadline": "emotionally adapted version",
  "rewrittenSnippet": "first 200 words adapted",
  "adaptationNote": "brief explanation of changes made",
  "modificationTag": "[EmotiFlow Balanced Edition]"
}

If the content is already appropriate for the user's emotional state, return original text with note "No adaptation needed."`;
};

/**
 * Wellness Micro-Intervention Prompt
 */
export const createWellnessInterventionPrompt = (
  currentEmotion: string,
  confidence: number,
  intensityLevel: string,
  emotionHistory: string[],
  stressCount: number,
  baselineMood: string,
  triggers: string[],
  browsingDuration: number,
  currentActivity: string,
  interventionCount: number,
  userPreference: string,
  timeWindow: number
): string => {
  return `Based on the user's emotional pattern over the last ${timeWindow} minutes:

CURRENT STATE:
- Primary emotion: ${currentEmotion}
- Confidence: ${confidence}%
- Intensity level: ${intensityLevel}

HISTORICAL PATTERN (last 3 hours):
- Predominant emotions: ${emotionHistory.join(', ')}
- Stress episodes: ${stressCount}
- Average baseline mood: ${baselineMood}
- Notable triggers: ${triggers.join(', ')}

USER CONTEXT:
- Time spent browsing: ${browsingDuration} minutes without break
- Current activity: ${currentActivity}
- Previous interventions today: ${interventionCount}
- User's preferred intervention style: ${userPreference}

Generate ONE brief, actionable wellness intervention that:
1. Directly addresses the detected emotional need
2. Is scientifically grounded (evidence-based)
3. Takes 30 seconds to 3 minutes to complete
4. Requires no special equipment or apps
5. Feels supportive, not preachy
6. Respects the user's time and context

Output format (max 20 words total):
{
  "interventionType": "breathing|movement|cognitive|social|break|gratitude|grounding",
  "actionText": "Clear, kind instruction in imperative form",
  "estimatedDuration": "in seconds",
  "scientificBasis": "one-sentence research backing"
}

Examples of good interventions:
- "Take 5 deep breaths: inhale for 4, hold for 4, exhale for 6. Activates parasympathetic nervous system."
- "Stand up and stretch your arms overhead for 30 seconds. Reduces muscle tension and boosts alertness."
- "Name 3 things you can see, 2 you can hear, 1 you can touch. Grounding technique for anxiety."`;
};

/**
 * Emotional Weather Report Prompt
 */
export const createWeatherReportPrompt = (
  date: string,
  totalTime: number,
  sessionCount: number,
  websiteCount: number,
  emotionTimeline: Array<{ time: string; emotion: string; duration: number; context?: string }>,
  peakStressTimes: string[],
  calmPeriods: string[],
  triggers: string[],
  positiveEvents: string[]
): string => {
  return `Analyze the user's emotional browsing data for ${date}:

SESSION DATA:
- Total browsing time: ${totalTime} hours
- Sessions: ${sessionCount}
- Websites visited: ${websiteCount}

EMOTIONAL BREAKDOWN:
${emotionTimeline.map(e => `  ${e.time}: ${e.emotion} (${e.duration}min) - ${e.context || 'N/A'}`).join('\n')}

DETECTED PATTERNS:
- Peak stress times: ${peakStressTimes.join(', ')}
- Calm periods: ${calmPeriods.join(', ')}
- Emotional triggers: ${triggers.join(', ')}
- Positive moments: ${positiveEvents.join(', ')}

Create an "Emotional Weather Report" that:
1. Summarizes the day's emotional journey in 2-3 sentences
2. Identifies patterns or insights (e.g., "Stress increases after 3pm")
3. Suggests one daily habit adjustment for tomorrow
4. Celebrates positive moments
5. Uses weather metaphors for accessibility

Output format:
{
  "weatherMetaphor": "sunny|cloudy|stormy|mixed|clear",
  "summary": "2-3 sentence emotional narrative",
  "keyInsight": "one pattern observation",
  "tomorrowSuggestion": "one actionable habit change",
  "positiveHighlight": "one good moment from today"
}

Tone: Warm, reflective, encouraging—like a supportive friend reviewing the day together.`;
};

/**
 * Text Sentiment Analysis Prompt
 */
export const createTextSentimentPrompt = (text: string): string => {
  return `Analyze the sentiment and emotions in this text:

TEXT: "${text}"

Output a JSON object with:
{
  "sentiment": "positive|negative|neutral",
  "emotionScore": 0-100,
  "keywords": ["keyword1", "keyword2"],
  "primaryEmotions": ["emotion1", "emotion2"]
}`;
};
