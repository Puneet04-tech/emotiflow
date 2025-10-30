import { classifyTextEmotionAdvanced } from '../src/utils/advancedNLP.ts';
import { classifyTextBERT } from '../src/utils/bertLikeNLP.ts';

const samples = [
  { text: "I am not happy", expected: 'sad' },
  { text: "I'm not angry", expected: 'calm' },
  { text: "I do not love this", expected: 'sad' },
  { text: "I never felt so great", expected: 'happy' },
  { text: "I'm not sad", expected: 'calm' },
  { text: "I am not excited", expected: 'calm' },
];

const run = () => {
  console.log('Running negation tests...');
  for (const s of samples) {
    try {
      const adv = classifyTextEmotionAdvanced(s.text);
      const bert = classifyTextBERT(s.text);
      console.log('---');
      console.log('Input:', s.text);
      console.log('Advanced NLP -> emotion:', adv.emotion, 'confidence:', adv.confidence, 'context:', adv.context);
      console.log('BERT-like    -> emotion:', bert.emotion, 'confidence:', bert.confidence);
      const advPass = adv.emotion === s.expected;
      const bertPass = bert.emotion === s.expected || (s.expected === 'calm' && bert.emotion === 'calm');
      console.log('Expected:', s.expected, '  Advanced pass:', advPass, '  BERT pass:', bertPass);
    } catch (e) {
      console.error('Error running test for', s.text, e);
    }
  }
  console.log('Negation tests completed.');
};

run();
