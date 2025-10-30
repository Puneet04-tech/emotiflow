#!/usr/bin/env node
/**
 * Test harness for complex sentence sentiment analysis using classifyTextEmotionAdvanced
 */
import { classifyTextEmotionAdvanced } from '../src/utils/advancedNLP.ts';

const samples = [
  { text: "I love the app, but the new update makes it crash all the time.", expect: 'sad' },
  { text: "I enjoyed the movie; however, the ending was disappointing.", expect: 'sad' },
  { text: "I'm not unhappy with the feature, but I could use better performance.", expect: 'calm' },
  { text: "I used to hate this product, but now I absolutely love it.", expect: 'happy' },
  { text: "The UI is great, the performance is okay, but overall I'm satisfied.", expect: 'happy' },
  { text: "I don't think it's terrible, it's actually pretty good.", expect: 'happy' },
  { text: "I love the idea, though the execution is somewhat clumsy.", expect: 'happy' },
  { text: "I'm not sure if I like it; perhaps I need more time.", expect: 'calm' },
];

console.log('Running complex-sentence sentiment tests...');
for (const s of samples) {
  const r = classifyTextEmotionAdvanced(s.text);
  console.log('---');
  console.log('Input:', s.text);
  console.log('Output:', r.emotion, 'confidence:', r.confidence, 'context:', r.context);
  console.log('Expected (approx):', s.expect);
}
console.log('Done.');
