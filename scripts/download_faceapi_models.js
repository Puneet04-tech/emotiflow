#!/usr/bin/env node
/**
 * Small downloader to fetch face-api.js model files into public/models
 * Usage: node scripts/download_faceapi_models.js
 * This script writes into ./public/models
 */
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve(process.cwd(), 'public', 'models');
const BASE = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

const FILES = [
  // Tiny face detector
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  // Expression model
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1',
];

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function downloadWithFallback(filename, dest) {
  const primary = BASE + filename;
  const altBase = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/';
  const alt = altBase + filename;

  const attempts = 3;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const url = attempt === 1 ? primary : alt;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await fs.promises.writeFile(dest, buf);
      return;
    } catch (err) {
      if (attempt < attempts) {
        // small backoff
        await new Promise(r => setTimeout(r, 800 * attempt));
        continue;
      }
      throw new Error(`Failed to download ${filename}: ${err.message}`);
    }
  }
}

async function main() {
  console.log('Downloading face-api models into', OUT_DIR);
  await ensureDir(OUT_DIR);

  for (const file of FILES) {
    const dest = path.join(OUT_DIR, file);
    try {
      process.stdout.write(`Downloading ${file}... `);
      await downloadWithFallback(file, dest);
      console.log('done');
    } catch (err) {
      console.error('\nError downloading', file, err.message || err);
      process.exitCode = 1;
      return;
    }
  }

  console.log('\nAll files downloaded to public/models.');
  console.log('You can now build the extension; the models will be available at runtime via chrome.runtime.getURL("/models/<file>").');
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
