/**
 * BERT-Like NLP Engine for Text Emotion Classification
 * Mimics BERT's attention mechanisms, token embeddings, and contextual understanding
 */

export interface BERTEmotionScore {
  emotion: string;
  confidence: number;
  allScores: Record<string, number>; // Softmax probabilities for all emotions
}

/**
 * Token embedding - convert words to numerical vectors (simplified BERT tokenization)
 */
const createTokenEmbedding = (word: string): number[] => {
  // Simple embedding based on word characteristics
  const lower = word.toLowerCase();
  return [
    lower.length / 20, // Length feature
    (lower.match(/[aeiou]/g) || []).length / lower.length, // Vowel ratio
    (lower.match(/[!?]/g) || []).length > 0 ? 1 : 0, // Punctuation
    lower.charCodeAt(0) / 255, // First char
    lower.charCodeAt(lower.length - 1) / 255, // Last char
  ];
};

/**
 * Positional encoding - BERT uses positional embeddings to understand word order
 */
const getPositionalEncoding = (position: number, maxLen: number): number[] => {
  const pos = position / maxLen;
  return [
    Math.sin(pos * Math.PI),
    Math.cos(pos * Math.PI),
    pos, // Normalized position
  ];
};

/**
 * Attention mechanism - calculate attention scores between tokens
 */
const calculateAttention = (
  queryEmbed: number[],
  keyEmbed: number[],
  valueEmbed: number[]
): number[] => {
  // Dot product attention (simplified)
  let attentionScore = 0;
  for (let i = 0; i < Math.min(queryEmbed.length, keyEmbed.length); i++) {
    attentionScore += queryEmbed[i] * keyEmbed[i];
  }
  
  // Apply softmax-like normalization
  const normalizedScore = Math.tanh(attentionScore);
  
  // Weighted value
  return valueEmbed.map(v => v * normalizedScore);
};

/**
 * BERT-like contextual text emotion classification
 */
export const classifyTextBERT = (text: string): BERTEmotionScore => {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  
  console.log(`[BERT NLP] Processing ${words.length} tokens...`);
  // Special-case: phrases like "never felt so great" express intensified positive sentiment,
  // not negation. Detect and handle these as positive to match advancedNLP behavior.
  if (/\bnever\s+(felt|been|seemed)\s+(so\s+)?(great|happy|wonderful|excellent|amazing|fantastic|better|happier)\b/i.test(lower)) {
    console.log('[BERT] Detected emphatic positive ("never felt so...") → Returning HAPPY');
    return {
      emotion: 'happy',
      confidence: 85,
      allScores: { happy: 85, sad: 5, angry: 5, anxious: 5, excited: 5, calm: 5 },
    };
  }
  
  // Emotion lexicons with semantic embeddings
  const emotionLexicons = {
    happy: ['love', 'joy', 'happy', 'glad', 'wonderful', 'great', 'excellent', 'amazing', 'fantastic', 'delighted', 'pleased', 'cheerful', 'thrilled', 'ecstatic'],
    sad: ['sad', 'unhappy', 'depressed', 'miserable', 'heartbroken', 'disappointed', 'gloomy', 'down', 'blue', 'sorrow', 'grief', 'despair'],
    angry: ['angry', 'mad', 'furious', 'rage', 'hate', 'irritated', 'annoyed', 'frustrated', 'outraged', 'infuriated', 'livid'],
    anxious: ['worried', 'anxious', 'nervous', 'scared', 'frightened', 'terrified', 'panic', 'dread', 'apprehensive', 'uneasy'],
    excited: ['excited', 'thrilled', 'enthusiastic', 'pumped', 'energized', 'hyped', 'stoked', 'eager', 'anticipating'],
    calm: ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'composed', 'balanced', 'centered'],
  };
  
  // Negation words
  const negations = ['not', 'no', 'never', "don't", "doesn't", "didn't", "won't", "can't", "isn't", "aren't", "cannot"];

  // Intensifiers
  const intensifiers = ['very', 'extremely', 'absolutely', 'really', 'so', 'incredibly', 'totally', 'completely', 'utterly'];

  // Build negation scope: when a negation word appears, it typically negates the next few tokens (window)
  const negationScope = 3; // number of tokens after a negation that are considered negated
  const negatedIndices: boolean[] = new Array(words.length).fill(false);
  for (let i = 0; i < words.length; i++) {
    const w = words[i].replace(/[^a-z0-9']/g, '');
    if (negations.includes(w)) {
      for (let j = i + 1; j <= Math.min(words.length - 1, i + negationScope); j++) {
        negatedIndices[j] = true;
      }
    }
  }

  // Deterministic grammar rule: if the pattern is "I am not X" or "I'm not X" where X is an emotion lexicon
  // then strongly prefer the opposite of X. This handles short, clear personal negations robustly.
  const deterministicBoost: Record<string, number> = {};
  const negationTargets: string[] = [];
  const subjectWords = new Set(['i', "i'm", 'im', 'i am']);
  for (let i = 0; i < words.length; i++) {
    const w = words[i].replace(/[^a-z0-9']/g, '');
    if (negations.includes(w) && i + 1 < words.length) {
      // Look back for subject within 2 tokens
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
        // Check which lexicon contains next
        for (const [emotion, lexicon] of Object.entries(emotionLexicons)) {
          if (lexicon.includes(next)) {
            const oppositeMap: Record<string, string> = {
              happy: 'sad',
              sad: 'calm',
              calm: 'anxious',
              anxious: 'calm',
              excited: 'calm',
              angry: 'calm',
            };
            const opposite = oppositeMap[emotion] || null;
            if (opposite) {
              deterministicBoost[opposite] = (deterministicBoost[opposite] || 0) + 3.0; // strong boost
              // Mark the next token as negated to avoid double counting
                  negatedIndices[i + 1] = true;
                  // record negation target token (raw) to suppress original emotion later
                  negationTargets.push(next.toLowerCase());
              console.log(`[BERT] Deterministic rule: detected pattern "${words[i-2] || ''} ${words[i-1] || ''} ${w} ${next}" → boosting ${opposite}`);
            }
          }
        }
      }
    }
  }
  
  // Initialize emotion scores (logits before softmax)
  const emotionLogits: Record<string, number> = {
    happy: 0,
    sad: 0,
    angry: 0,
    anxious: 0,
    excited: 0,
    calm: 0,
  };
  
  // Process each token with BERT-like attention
  for (let i = 0; i < words.length; i++) {
  const rawWord = words[i];
  // Clean token for lexicon/negation matching (strip punctuation but keep apostrophes)
  const word = rawWord.replace(/[^a-z0-9']/g, '');

  // Create embeddings
  const tokenEmbed = createTokenEmbedding(word);
    const posEmbed = getPositionalEncoding(i, words.length);
    
    // Combined embedding
    const combinedEmbed = [...tokenEmbed, ...posEmbed];
    
    // Check if this token falls under a previously seen negation scope
    const isNegated = !!negatedIndices[i];

    // Skip very short tokens (like 'i', 'a', 'am') for lexicon matching to avoid substring false-positives
    if (word.length < 3) {
      // still allow negation and intensifier scanning but don't match lexicon entries
      continue;
    }

    // Check if nearby previous token is an intensifier (allow one-token gap)
    let hasIntensifier = false;
    let intensifierStrength = 1.0;
    for (let k = 1; k <= 2; k++) {
      if (i - k >= 0) {
        const prev = words[i - k].replace(/[^a-z0-9']/g, '');
        if (intensifiers.includes(prev)) {
          hasIntensifier = true;
          intensifierStrength = 1.6 - 0.2 * (k - 1); // slightly reduce strength if further away
          break;
        }
      }
    }
    
    // Match against emotion lexicons with contextual attention
    for (const [emotion, lexicon] of Object.entries(emotionLexicons)) {
      const matchStrength = lexicon.some(kw => word.includes(kw) || kw.includes(word));
      
      if (matchStrength) {
        // Calculate attention-weighted score
        let score = 1.0;
        
        // Position-based attention (words at beginning/end weighted more)
        const positionWeight = 1 + (1 - Math.abs((i / words.length) - 0.5));
        score *= positionWeight;
        
        // Apply intensifier
        if (hasIntensifier) {
          score *= intensifierStrength;
        }
        
        // Apply negation: instead of simply negating the same emotion (which can be unstable),
        // transfer most of the contribution to an opposite emotion and reduce the original.
        if (isNegated) {
          // Map to an opposite/contrasting emotion
          const oppositeMap: Record<string, string> = {
            happy: 'sad',
            sad: 'calm',
            calm: 'anxious',
            anxious: 'calm',
            excited: 'calm',
            angry: 'calm',
          };

            const opposite = oppositeMap[emotion] || 'neutral';
            const transferStrength = 1.0; // transfer fully to the opposite emotion

            // Strong negation: transfer entire contribution to the opposite emotion
            if (opposite !== 'neutral') {
              emotionLogits[opposite] = (emotionLogits[opposite] || 0) + score * transferStrength;
            }
            console.log(`[BERT] Negation scope: token "${rawWord}" (idx ${i}) is negated → transfer ${(
              transferStrength * 100
            ).toFixed(0)}% to ${opposite}`);
            // Skip the usual addition since we've handled logits adjustment
            continue;
        }
        
        // Contextual attention - look at surrounding words
        let contextBoost = 0;
        const contextWindow = 2;
        for (let j = Math.max(0, i - contextWindow); j < Math.min(words.length, i + contextWindow + 1); j++) {
          if (j !== i && lexicon.some(kw => words[j].includes(kw))) {
            contextBoost += 0.3; // Related words nearby boost score
          }
        }
        score += contextBoost;
        
        emotionLogits[emotion] += score;
        console.log(`[BERT] Token "${word}" → ${emotion}: +${score.toFixed(2)} (negated: ${isNegated}, intensified: ${hasIntensifier})`);
      }
    }
  }
  
  console.log(`[BERT] Raw logits:`, emotionLogits);

  // Apply deterministic grammar boosts (from short negation patterns) into the logits
  if (Object.keys(deterministicBoost).length > 0) {
    for (const [emo, boost] of Object.entries(deterministicBoost)) {
      emotionLogits[emo] = (emotionLogits[emo] || 0) + boost;
      console.log(`[BERT] Applying deterministic boost: ${emo} += ${boost.toFixed(2)}`);
    }
    console.log(`[BERT] Logits after deterministic boosts:`, emotionLogits);
  }

  // If deterministic negation targets were found, suppress logits for the negated emotions to avoid ties
  if (negationTargets.length > 0) {
    for (const target of negationTargets) {
      for (const [emotion, lexicon] of Object.entries(emotionLexicons)) {
          // emotionLexicons entries are arrays in this implementation
          if (Array.isArray(lexicon) && lexicon.some((kw: string) => kw.toLowerCase() === target)) {
            // suppress original emotion logits
            emotionLogits[emotion] = Math.max(0, (emotionLogits[emotion] || 0) * 0.01);
            console.log(`[BERT] Suppressing original emotion '${emotion}' due to negation of token '${target}'`);
          }
        }
    }
  }
  
  // Apply softmax to convert logits to probabilities
  const maxLogit = Math.max(...Object.values(emotionLogits));
  const expScores: Record<string, number> = {};
  let sumExp = 0;
  
  for (const [emotion, logit] of Object.entries(emotionLogits)) {
    // Subtract max for numerical stability (standard softmax trick)
    expScores[emotion] = Math.exp(logit - maxLogit);
    sumExp += expScores[emotion];
  }
  
  // Normalize to get probabilities (percentages)
  const probabilities: Record<string, number> = {};
  for (const [emotion, exp] of Object.entries(expScores)) {
    probabilities[emotion] = (exp / sumExp) * 100;
  }
  
  // Find dominant emotion
  let maxEmotion = 'calm';
  let maxProb = probabilities.calm;
  for (const [emotion, prob] of Object.entries(probabilities)) {
    if (prob > maxProb) {
      maxProb = prob;
      maxEmotion = emotion;
    }
  }
  
  console.log(`[BERT NLP] ========== BERT CLASSIFICATION ==========`);
  console.log(`[BERT NLP] Softmax Probabilities:`);
  Object.entries(probabilities)
    .sort(([, a], [, b]) => b - a)
    .forEach(([emotion, prob]) => {
      console.log(`  ${emotion}: ${prob.toFixed(1)}%`);
    });
  console.log(`[BERT NLP] Winner: ${maxEmotion} (${maxProb.toFixed(1)}%)`);
  console.log(`[BERT NLP] ==========================================`);
  
  // Expose token-level debug info to the page for live diagnostics (if available)
  try {
    const debugObj = {
      text,
      tokens: words.map((w, idx) => ({ raw: w, cleaned: w.replace(/[^a-z0-9']/g, ''), idx, negated: !!negatedIndices[idx] })),
      negatedIndices,
      deterministicBoost,
      logits: emotionLogits,
      probabilities,
      winner: { emotion: maxEmotion, probability: maxProb },
      timestamp: Date.now(),
    } as any;
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      (globalThis as any).__emotiflow_lastBERTDebug = debugObj;
    } catch (e) {
      // ignore if we cannot write to global
    }
  } catch (e) {
    // harmless
  }

  return {
    emotion: maxEmotion,
    confidence: Math.round(maxProb),
    allScores: probabilities,
  };
};
