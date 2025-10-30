// Run classifier tests with expected labels and report pass/fail
import { execSync } from 'child_process';

console.log('Tests runner: invoking the classifier harness and summarizing results.');

// Predefined samples and expected dominant emotions
const cases = [
  { text: 'I am not happy', expected: 'sad' },
  { text: "I'm not sad", expected: 'happy' },
  { text: "I don't hate it", expected: 'calm' },
  { text: 'I absolutely love this', expected: 'happy' },
  { text: 'I am calm and relaxed', expected: 'calm' },
  { text: "I am not calm", expected: 'anxious' },
];

// We'll call the existing runner and parse its output to find winners
const output = execSync('node scripts/run_text_classifier.js', { encoding: 'utf8' });

// Parse winners from harness output
const lines = output.split('\n');
const results = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('=== SAMPLE:')) {
    const sampleText = line.replace('=== SAMPLE: ', '').trim();
    // winner appears later with pattern: [Test] Winner: sad (92.2%)
    for (let j = i + 1; j < i + 30 && j < lines.length; j++) {
      const l = lines[j];
      const m = l.match(/\[Test\] Winner: (\w+) \(([0-9.]+)%\)/);
      if (m) {
        results.push({ text: sampleText, winner: m[1], score: parseFloat(m[2]) });
        break;
      }
    }
  }
}

// Evaluate our subset
let passed = 0;
for (const c of cases) {
  const r = results.find(rr => rr.text === c.text);
  if (!r) {
    console.log(`[TEST] Missing result for: ${c.text}`);
    continue;
  }
  const ok = r.winner === c.expected;
  console.log(`[TEST] ${c.text} → expected: ${c.expected}, got: ${r.winner} (${r.score}%) → ${ok ? 'PASS' : 'FAIL'}`);
  if (ok) passed++;
}
console.log(`\nSummary: ${passed}/${cases.length} tests passed.`);

// --- User-requested: print the test sentences, then keep the process in a loop printing them ---
const sentencesToPrint = cases.map(c => c.text);
console.log('\n--- Now printing the test sentences once ---');
sentencesToPrint.forEach(s => console.log(s));

console.log('\n--- Entering continuous print loop (press Ctrl+C to stop) ---');
// Print every 2 seconds to keep process alive and observable
setInterval(() => {
  sentencesToPrint.forEach(s => console.log(s));
}, 2000);

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, exiting loop.');
  process.exit(0);
});
