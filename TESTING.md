TESTING GUIDE — EmotiFlow

Purpose
-------
This document explains how judges and evaluators can reproducibly test EmotiFlow locally. It includes prerequisites, build and load instructions, automated test harnesses, manual test scenarios, expectations for correctness, and a scoring checklist.

Quick Testing Summary
---------------------
To test EmotiFlow locally, install dependencies (npm install), optionally download the face-api models (run the included script), then load the extension into Chrome (enable Developer mode → Load unpacked and point to the built output or the repo root when using Vite in dev mode). Give the extension permission to use the camera and microphone when prompted. Open the EmotiFlow sidepanel and the popup to confirm the UI loads, then exercise each modality: speak a short sentence to trigger voice analysis, type or select text in a page to trigger the text sentiment content script, and allow the camera so facial detection (optional opt‑in) can run; check that the sidepanel updates with the current emotion, timeline, and wellness suggestions after each change. Run the included test harnesses for automated checks: run the negation test (npm run test:negation) to verify negated sentences are correctly classified, and run the fusion tests (scripts/test_fusion.ts) to simulate multi‑modal events and confirm the background fusion produces stable emotion state updates and deterministic suggestion outputs. For judges: inspect IndexedDB under Application → EmotiFlowDB to validate that emotion history and the suggestion cache are stored (encrypted), and consult the TESTING.md in the repo for step‑by‑step checklists, expected outputs, and troubleshooting tips (camera/mic permissions, Gemini availability, or fallbacks).

Problem statement
-----------------
EmotiFlow addresses the real-world problem of brittle and privacy‑sensitive emotion sensing in browser contexts by providing a robust, local‑first multimodal emotion detection and wellness intervention system that fuses facial, voice, and text signals to produce timely, contextualized suggestions. Many existing tools either run heuristics that misclassify negated language (e.g., "I'm not happy"), depend entirely on cloud models that raise privacy concerns, or fail to consistently emit interventions when users’ emotional states change; EmotiFlow solves these issues by improving negation handling in its NLP pipeline, using a deterministic on‑device suggestion generator with configurable cloud fallbacks (opt‑in), caching results locally, and ensuring the fusion and suggestion pipeline emits an updated suggestion after every detected emotion change—critical for reliable, privacy‑respecting, real‑time interventions.

Prerequisites
-------------
- Operating system: Windows (tested), macOS, Linux
- Chrome or Chromium v120+ (required for built-in AI features; flags may be required)
- Node.js v16+ and npm
- Git

Important: EmotiFlow defaults to privacy-first behavior (on-device processing and deterministic fallbacks). Some features (face models, cloud LLM refinement) are optional and require opt-in.

Quick setup (summary)
---------------------
1. Clone repo
   git clone https://github.com/yourusername/emotiflow.git
   cd emotiflow
2. Install dependencies
   npm install
3. (Optional) Download face-api models for offline face detection
   node scripts/download_faceapi_models.js
4. Build
   npm run build
5. Load extension in Chrome via chrome://extensions → Load unpacked → select dist/

Detailed instructions
---------------------
1) Clone & install
```powershell
git clone https://github.com/yourusername/emotiflow.git
cd emotiflow
npm ci
```

2) Optional: Download face models (for judges wanting local facial detection)
- Purpose: places model files in `public/models` for `face-api.js` to use locally.
- Run:
```powershell
node scripts/download_faceapi_models.js
```
- The script attempts a primary host and falls back to a CDN. If download fails, the face features will remain disabled until models are available.

3) Build extension
```powershell
npm run build
```
- Expected output: `dist/` folder with MV3-ready assets.

4) Load into Chrome
- Open `chrome://extensions/`
- Toggle **Developer mode**
- Click **Load unpacked** and select the `dist/` folder
- Enable permissions as requested (storage, sidePanel). Camera/microphone are optional and requested at runtime.

Test harnesses (automated)
--------------------------
We provide Node-based harnesses in `scripts/` to validate key behaviors.

1) Negation test harness
- Purpose: verify text negation handling (e.g., "I am not happy" should not be classified as happy)
- Run:
```powershell
node scripts/test_negation.ts
```
- Expected output: summary of cases and pass/fail counts. Key cases should show improved classification for negation.

2) Fusion simulator
- Purpose: simulate modality messages arriving in various orders and ensure background emits `EMOTION_STATE_UPDATE` with wellnessSuggestions after each change.
- Run:
```powershell
node scripts/test_fusion.ts
```
- Expected: for each scenario, the harness should print the fused state and indicate whether `wellnessSuggestions` were present. Failures indicate fusion or suggestion emission issues.

3) Complex sentiment tests
- Purpose: run a suite of complex sentences including contrasts, double negation, sarcasm heuristics.
- Run:
```powershell
node scripts/test_sentiment_complex.ts
```

Manual tests (for judges)
-------------------------
These steps verify the end-to-end behavior within Chrome with UI.

A) Text negation test
- Open any text input (e.g., Gmail compose)
- Type: "I am not happy"
- Expected: the sidepanel should either show a negative emotion (e.g., sad) or a neutral state with low confidence; it should not report "happy".
- Also test: "I was anxious but I'm calmer now" — system should favor the latter clause.

B) Voice tone test
- In sidepanel settings, enable voice monitoring and grant microphone permission.
- Say a short phrase in a stressed voice (fast, loud) and then a calm voice.
- Expected: `VOICE_EMOTION` messages appear in background logs; sidepanel updates primary emotion accordingly.

C) Facial detection (optional)
- In settings, opt-in to face models. If you ran the downloader, the face module will load locally.
- Allow camera access when prompted.
- Make expressive faces (smile, frown) and watch `EmotionIndicator` update.
- Expected: `FACIAL_EMOTION` messages appear and fusion uses them when available.

D) Suggestion emission after emotion change
- Trigger a clear emotion change (e.g., type a strongly negative sentence or perform a stressed voice sample).
- Expected: sidepanel shows an InterventionCard with a heuristic suggestion immediately and then swaps to AI-refined suggestion if cloud AI is enabled and consented.

E) WellnessStats check
- Open Dashboard → WellnessStats
- Expected: shows total sessions, interventions, dominant emotion (based on today's history), transitions, and last suggestion text.

F) Content rewrite opt-out & cooldown
- When contentFilterMode triggers (e.g., site contains negative news), background attempts a REQUEST_CONTENT_REWRITE.
- Test per-site opt-out by adding a domain to rewrite opt-out and confirming no rewrite occurs for that domain.
- Test cooldown: after a rewrite applied to a tab, further rewrites should be suppressed for the configured cooldown (default 5 minutes).

Logs & where to look
--------------------
- Background logs: Chrome -> Extensions -> Inspect views -> Service worker (background). Check console for fused state logs like `[Background] Fused emotion state: ...` and `EMOTION_STATE_UPDATE` broadcast.
- Content script logs: Inspect page DevTools console for content script activity (e.g., permission errors, FACIAL_EMOTION sends).
- Sidepanel logs: Open sidepanel and use React DevTools or sidepanel console (inspect view) to see messages received.

Scoring checklist for judges
----------------------------
Use this checklist to evaluate functionality.

1) Build & Load (10 pts)
- Clone, npm ci, npm run build, load unpacked without errors (10)

2) Core Sensing (30 pts)
- Text negation corrected and measurable in test harness (10)
- Voice detection updates on microphone sample (10)
- Facial detection works when models downloaded and enabled (10)

3) Fusion & Suggestion (30 pts)
- Immediate fusion occurs after each modality change and `EMOTION_STATE_UPDATE` includes `wellnessSuggestions` (15)
- Heuristic suggestion appears immediately; AI-refined suggestion replaces it if cloud consent enabled (15)

4) Privacy & Controls (15 pts)
- Camera/mic opt-in flows work and deny gracefully (5)
- Per-site opt-out and cooldown enforce suppression (5)
- No raw audio/video uploaded by default (5)

5) Documentation & Repro (15 pts)
- Test harnesses run and report passing cases for negation and fusion (10)
- README / TESTING.md includes step-by-step judge instructions (5)

Total: 100 pts

Notes: Judges may award partial credit for partially working features (e.g., face works only with remote models but not locally). Please annotate any unexpected behavior and include console logs where helpful.

Troubleshooting
---------------
- "Receiving end does not exist" messages: expected in MV3 when service worker restarts; use `sendMessageSafe` wrapper to reduce noise. If you see persistent errors, reload the extension.
- Camera/mic permission denied: check site controls and extension permissions in Chrome.
- Face models failing to load: re-run `scripts/download_faceapi_models.js` and ensure `public/models` contains model files.

Security & integrity
--------------------
- LICENSE: MIT (see LICENSE file in repo root)
- Confirm downloader integrity: compare model hashes if provided by a trusted manifest.

Support
-------
If you encounter any issues while running tests, collect the console output from the background service worker and any failing harness outputs and attach them to the submission. We will respond with troubleshooting and, if needed, patched builds.

Contact
-------
Project lead: [Your Name] — replace with contact email in your repo

---
End of TESTING.md
