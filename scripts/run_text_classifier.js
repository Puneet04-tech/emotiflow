// Quick JS test harness that mirrors the classifyTextBERT logic (simplified) for local testing
// This file is standalone so we can run it with `node scripts/run_text_classifier.js`

function createTokenEmbedding(word) {
  const lower = word.toLowerCase();
  return [
    lower.length / 20,
    ((lower.match(/[aeiou]/g) || []).length) / (lower.length || 1),
    (lower.match(/[!?]/g) || []).length > 0 ? 1 : 0,
    (lower.charCodeAt(0) || 0) / 255,
    (lower.charCodeAt(lower.length - 1) || 0) / 255,
  ];
}

function getPositionalEncoding(position, maxLen) {
  const pos = position / maxLen;
  return [Math.sin(pos * Math.PI), Math.cos(pos * Math.PI), pos];
}

function softmaxPercentages(logits) {
  const vals = Object.values(logits);
  const maxLogit = Math.max(...vals);
  const exps = {};
  let sum = 0;
  for (const k of Object.keys(logits)) {
    exps[k] = Math.exp(logits[k] - maxLogit);
    sum += exps[k];
  }
  const probs = {};
  for (const k of Object.keys(exps)) {
    probs[k] = (exps[k] / sum) * 100;
  }
  return probs;
}

function classifyTextBERT(text) {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);

  const emotionLexicons = {
    happy: ['love', 'joy', 'happy', 'glad', 'wonderful', 'great', 'excellent', 'amazing', 'fantastic', 'delighted', 'pleased', 'cheerful', 'thrilled', 'ecstatic'],
    sad: ['sad', 'unhappy', 'depressed', 'miserable', 'heartbroken', 'disappointed', 'gloomy', 'down', 'blue', 'sorrow', 'grief', 'despair'],
    angry: ['angry', 'mad', 'furious', 'rage', 'hate', 'irritated', 'annoyed', 'frustrated', 'outraged', 'infuriated', 'livid'],
    anxious: ['worried', 'anxious', 'nervous', 'scared', 'frightened', 'terrified', 'panic', 'dread', 'apprehensive', 'uneasy'],
    excited: ['excited', 'thrilled', 'enthusiastic', 'pumped', 'energized', 'hyped', 'stoked', 'eager', 'anticipating'],
    calm: ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'composed', 'balanced', 'centered'],
  };

  const negations = ['not', 'no', 'never', "don't", "doesn't", "didn't", "won't", "can't", "isn't", "aren't", "cannot"];
  const intensifiers = ['very', 'extremely', 'absolutely', 'really', 'so', 'incredibly', 'totally', 'completely', 'utterly'];

  const negationScope = 3;
  const negatedIndices = new Array(words.length).fill(false);
  for (let i = 0; i < words.length; i++) {
    const w = words[i].replace(/[^a-z0-9']/g, '');
    if (negations.includes(w)) {
      for (let j = i + 1; j <= Math.min(words.length - 1, i + negationScope); j++) {
        negatedIndices[j] = true;
      }
    }
  }

  // Deterministic grammar rule for "I am not X" patterns
  const deterministicBoost = {};
  const subjectWords = new Set(['i', "i'm", 'im', 'i am']);
  for (let i = 0; i < words.length; i++) {
    const w = words[i].replace(/[^a-z0-9']/g, '');
    if (negations.includes(w) && i + 1 < words.length) {
      let subjectFound = false;
      for (let k = 1; k <= 2; k++) {
        if (i - k >= 0) {
          const prev = words[i - k].replace(/[^a-z0-9']/g, '');
          if (subjectWords.has(prev)) {
            subjectFound = true;
            break;
          }
        }
      }
      const next = words[i + 1].replace(/[^a-z0-9']/g, '');
      if (subjectFound && next.length >= 3) {
        for (const [emotion, lexicon] of Object.entries(emotionLexicons)) {
          if (lexicon.includes(next)) {
            const oppositeMap = { happy: 'sad', sad: 'happy', calm: 'anxious', anxious: 'calm', excited: 'calm', angry: 'calm' };
            const opposite = oppositeMap[emotion] || null;
            if (opposite) {
              deterministicBoost[opposite] = (deterministicBoost[opposite] || 0) + 3.0;
              negatedIndices[i + 1] = true;
              console.log(`[Test] Deterministic rule: detected pattern "${words[i-2] || ''} ${words[i-1] || ''} ${w} ${next}" → boosting ${opposite}`);
            }
          }
        }
      }
    }
  }

  const emotionLogits = { happy: 0, sad: 0, angry: 0, anxious: 0, excited: 0, calm: 0 };

  for (let i = 0; i < words.length; i++) {
    const rawWord = words[i];
    const word = rawWord.replace(/[^a-z0-9']/g, '');
    if (!word) continue;

    const tokenEmbed = createTokenEmbedding(word);
    const posEmbed = getPositionalEncoding(i, words.length);
    const combinedEmbed = tokenEmbed.concat(posEmbed);

    const isNegated = !!negatedIndices[i];

    let hasIntensifier = false;
    let intensifierStrength = 1.0;
    for (let k = 1; k <= 2; k++) {
      if (i - k >= 0) {
        const prev = words[i - k].replace(/[^a-z0-9']/g, '');
        if (intensifiers.includes(prev)) {
          hasIntensifier = true;
          intensifierStrength = 1.6 - 0.2 * (k - 1);
          break;
        }
      }
    }

    // Skip very short tokens from lexicon matching (reduce false positives)
    if (word.length < 3) continue;

    for (const [emotion, lexicon] of Object.entries(emotionLexicons)) {
      const match = lexicon.some(kw => word === kw || word.endsWith(kw) || kw.endsWith(word));
      if (!match) continue;

      let score = 1.0;
      const positionWeight = 1 + (1 - Math.abs((i / words.length) - 0.5));
      score *= positionWeight;
      if (hasIntensifier) score *= intensifierStrength;

      // Contextual boost (simplified)
      let contextBoost = 0;
      const contextWindow = 2;
      for (let j = Math.max(0, i - contextWindow); j < Math.min(words.length, i + contextWindow + 1); j++) {
        if (j !== i && lexicon.some(kw => words[j].includes(kw))) contextBoost += 0.3;
      }
      score += contextBoost;

      if (isNegated) {
        const oppositeMap = { happy: 'sad', sad: 'happy', calm: 'anxious', anxious: 'calm', excited: 'calm', angry: 'calm' };
        const opposite = oppositeMap[emotion] || null;
        const transferStrength = 1.0;
        if (opposite) {
          emotionLogits[opposite] = (emotionLogits[opposite] || 0) + score * transferStrength;
        }
        console.log(`[Test] Negated token "${rawWord}" (idx ${i}) → transfer ${Math.round(transferStrength*100)}% to ${opposite}`);
        continue;
      }

      emotionLogits[emotion] += score;
      console.log(`[Test] Token "${rawWord}" → ${emotion}: +${score.toFixed(2)} (intensified: ${hasIntensifier})`);
    }
  }

  console.log('[Test] Raw logits:', emotionLogits);
  // Apply deterministic boosts before softmax
  for (const k of Object.keys(deterministicBoost)) {
    emotionLogits[k] = (emotionLogits[k] || 0) + deterministicBoost[k];
  }
  const probs = softmaxPercentages(emotionLogits);
  const sorted = Object.entries(probs).sort((a,b)=> b[1]-a[1]);
  const winner = sorted[0];
  console.log('[Test] Softmax:');
  sorted.forEach(([e,p]) => console.log(`  ${e}: ${p.toFixed(1)}%`));
  console.log(`[Test] Winner: ${winner[0]} (${winner[1].toFixed(1)}%)\n`);
  return { emotion: winner[0], confidence: Math.round(winner[1]), allScores: probs };
}

// Allow injecting custom samples via environment variable CUSTOM_SAMPLES as JSON array
let samples = [
  "I am not happy",
  "I'm not sad",
  "I don't hate it",
  "I am not very happy",
  "I am not unhappy",
  "I am not excited",
  "This is not great",
  "not happy at all",
  "I'm not feeling happy",
  "I can't say I'm happy",
  "I absolutely love this",
  "I'm really very excited",
  "I am calm and relaxed",
  "I am not calm",
];

if (process.env.CUSTOM_SAMPLES) {
  try {
    const parsed = JSON.parse(process.env.CUSTOM_SAMPLES);
    if (Array.isArray(parsed) && parsed.length > 0) {
      samples = parsed.map(String);
    }
  } catch (e) {
    console.warn('CUSTOM_SAMPLES parse failed, using default samples:', e);
  }
}

for (const s of samples) {
  console.log('=== SAMPLE:', s);
  classifyTextBERT(s);
}
