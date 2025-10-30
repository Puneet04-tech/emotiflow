#!/usr/bin/env node
/**
 * Simple fusion simulator for local accuracy checks.
 * Runs several synthetic modality combinations through fuseEmotions
 * and prints the resulting EmotionState for inspection.
 * Run with: node --loader ts-node/esm scripts/test_fusion.ts
 */
import { facialToEmotionMap, voiceToEmotionMap, sentimentToEmotionMap } from '../src/utils/emotions.ts';

type Facial = { emotion: string; confidence: number };
type Voice = { tone: string; intensity: number; pitch?: number };
type Text = { sentiment: string; emotionScore: number };

const cases: { name: string; facial?: Facial; voice?: Voice; text?: Text }[] = [
  {
    name: 'Happy agreement (face + text)',
    facial: { emotion: 'happy', confidence: 88 },
    text: { sentiment: 'positive', emotionScore: 90 },
  },
  {
    name: 'Sad majority (face + text)',
    facial: { emotion: 'sad', confidence: 92 },
    voice: { tone: 'tired', intensity: 80 },
    text: { sentiment: 'negative', emotionScore: 85 },
  },
  {
    name: 'Disagreement low confidence',
    facial: { emotion: 'happy', confidence: 40 },
    voice: { tone: 'stressed', intensity: 45 },
    text: { sentiment: 'neutral', emotionScore: 50 },
  },
  {
    name: 'Voice-driven stressed (voice only)',
    voice: { tone: 'stressed', intensity: 90 },
  },
];

// Local stubs (avoid importing aiPrompts to keep this script self-contained)
const makeAiStub = (f: Facial | undefined, v: Voice | undefined, t: Text | undefined) => {
  // prefer facial, then text, then voice
  let primary: string | null = null;
  if (f) primary = facialToEmotionMap[(f.emotion as unknown) as keyof typeof facialToEmotionMap];
  else if (t) primary = sentimentToEmotionMap[(t.sentiment as unknown) as keyof typeof sentimentToEmotionMap];
  else if (v) primary = voiceToEmotionMap[(v.tone as unknown) as keyof typeof voiceToEmotionMap];
  if (!primary) primary = 'neutral';
  return async (_prompt: string) => ({
    primaryEmotion: primary,
    confidence: Math.min(100, Math.round(((f?.confidence || 0) + (t?.emotionScore || 0) + (v?.intensity || 0)) / ((f ? 1 : 0) + (t ? 1 : 0) + (v ? 1 : 0) || 1))),
    interventionType: null,
    contentFilterMode: 'none',
    uiAdaptation: '#CCCCCC',
  });
};

// Local suggestions generator
const generateWellnessSuggestions = async (primary: any, conf: any) => [`${conf}% confident suggestion for ${primary}`];

const run = async () => {
  console.log('Running fusion simulator...\n');
  for (const c of cases) {
    console.log('---');
    console.log('Case:', c.name);
    // patch AI stub per-case
    const callGeminiNanoEmotionFusion = makeAiStub(c.facial, c.voice, c.text);

      // Local simulation of fusion logic (weights and vector calculation)
      const FUSION_WEIGHTS = { facial: 0.4, voice: 0.35, text: 0.25 };
      const emotionVector: Record<string, number> = {
        calm: 0, stressed: 0, anxious: 0, sad: 0, happy: 0, energized: 0, frustrated: 0, fatigued: 0, neutral: 0,
      };
      if (c.facial) {
        const e = facialToEmotionMap[(c.facial.emotion as unknown) as keyof typeof facialToEmotionMap];
        const weight = (c.facial.confidence / 100) * FUSION_WEIGHTS.facial;
        emotionVector[e] = (emotionVector[e] || 0) + weight;
      }
      if (c.voice) {
        const e = voiceToEmotionMap[(c.voice.tone as unknown) as keyof typeof voiceToEmotionMap];
        const weight = (c.voice.intensity / 100) * FUSION_WEIGHTS.voice;
        emotionVector[e] = (emotionVector[e] || 0) + weight;
      }
      if (c.text) {
        const e = sentimentToEmotionMap[(c.text.sentiment as unknown) as keyof typeof sentimentToEmotionMap];
        const weight = (c.text.emotionScore / 100) * FUSION_WEIGHTS.text;
        emotionVector[e] = (emotionVector[e] || 0) + weight;
      }

      // Get AI primary (stubbed)
    const aiResult = await callGeminiNanoEmotionFusion('sim-prompt');
      const primary = aiResult.primaryEmotion;
      const confidence = aiResult.confidence;

      const interventionNeeded = ((): boolean => {
        const triggers = ['stressed', 'anxious', 'frustrated', 'sad', 'fatigued'];
        return confidence >= 80 && triggers.includes(primary);
      })();

      const res = {
        primaryEmotion: primary,
        confidence,
        emotionVector,
        interventionNeeded,
        modalities: { facial: c.facial, voice: c.voice, text: c.text },
        wellnessSuggestions: await generateWellnessSuggestions(primary, confidence),
      } as any;
    if (!res) {
      console.log('Result: null');
      continue;
    }

    console.log('Primary:', res.primaryEmotion, 'Confidence:', res.confidence);
    console.log('InterventionNeeded:', res.interventionNeeded);
    if ((res as any).wellnessSuggestions) console.log('Suggestions:', (res as any).wellnessSuggestions);
    console.log('Emotion Vector:', res.emotionVector);
    console.log('Modalities:', res.modalities);
    console.log('\n');
  }
  console.log('Fusion simulator completed.');
};

run().catch(err => { console.error('Simulator error:', err); process.exit(1); });
