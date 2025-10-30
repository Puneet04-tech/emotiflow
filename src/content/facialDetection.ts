/**
 * facialDetection.ts
 * CSP-Compliant Facial Emotion Detection for Chrome Extension MV3
 * Uses Canvas API and rule-based computer vision - no external libraries
 * Safe for content scripts with proper permission handling
 */

import { FacialDetectionData, FacialEmotion } from '../types/index';

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

let facialDetectionEnabled = false;
let videoElement: HTMLVideoElement | null = null;
let canvas: HTMLCanvasElement | null = null;
let canvasContext: CanvasRenderingContext2D | null = null;
let facialCaptureCount = 0;
let analysisInterval: number | null = null;
let cameraStream: MediaStream | null = null;
let isInitializing = false;
// Smoothing for breakdown to reduce rapid flicker
let lastSmoothedBreakdown: Record<FacialEmotion, number> | null = null;
const SMOOTH_ALPHA = 0.35; // EMA alpha (0-1): higher -> more responsive, lower -> smoother

// Drag handler references so we can remove listeners on cleanup
let _dragMouseMove: ((e: MouseEvent) => void) | null = null;
let _dragMouseUp: ((e: MouseEvent) => void) | null = null;
let _dragTouchMove: ((e: TouchEvent) => void) | null = null;
let _dragTouchEnd: ((e: TouchEvent) => void) | null = null;

// Optional face-api.js model integration (opt-in)
let faceApi: any = null;
let faceModelLoaded = false;

const tryLoadFaceModel = async (): Promise<void> => {
  try {
    const s = await chrome.storage.local.get('enable_face_model');
    if (!s || !s.enable_face_model) return;

    // Dynamic import to avoid bundling heavy dependency unless opted-in
    faceApi = await import('face-api.js');
    const base = chrome.runtime.getURL('/models');

    // Load tiny face detector and expression model (small, opt-in)
    await faceApi.nets.tinyFaceDetector.loadFromUri(base);
    await faceApi.nets.faceExpressionNet.loadFromUri(base);

    faceModelLoaded = true;
    console.log('[Facial] Face-api models loaded from', base);
  } catch (error) {
    faceModelLoaded = false;
    console.warn('[Facial] Face model load failed or not present - continuing with fallback:', error);
  }
};

// Prevent multiple instances in same context
const INJECTION_KEY = '__emotiflow_facial_detection_active__';
if ((window as any)[INJECTION_KEY]) {
  throw new Error('Facial detection already initialized in this context');
}
(window as any)[INJECTION_KEY] = true;

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Initialize facial detection with extension-safe approach
 * Handles MV3 permissions, CSP constraints, and cleanup
 */
export const initializeFacialDetection = async (): Promise<boolean> => {
  // Prevent concurrent initialization
  if (isInitializing) {
    console.log('[Facial] Already initializing...');
    return false;
  }

  if (facialDetectionEnabled) {
    console.log('[Facial] Already running');
    return false;
  }

  isInitializing = true;

  try {
    console.log('[Facial] Starting CSP-compliant facial detection for MV3...');

    // Check if getUserMedia is available
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('getUserMedia not supported in this context');
    }

    // Step 1: Check/request camera permission (MV3-safe)
    let permissionDenied = false;
    try {
      // Some browsers don't support permissions.query for camera
      const permissionStatus = await navigator.permissions.query({
        name: 'camera' as PermissionName,
      });

      if (permissionStatus.state === 'denied') {
        permissionDenied = true;
      }

      console.log('[Facial] Permission state:', permissionStatus.state);
    } catch (permError) {
      // Permission API not available, will prompt via getUserMedia
      console.log('[Facial] Permission query not supported, will prompt directly');
    }

    if (permissionDenied) {
      throw new Error('Camera permission denied. Please enable camera access in browser settings.');
    }

    // Step 2: Request camera stream
    console.log('[Facial] Requesting camera access...');
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user',
      },
      audio: false,
    });

  console.log('[Facial] Camera access granted');

    // Step 3: Create video element (visible for user awareness)
    videoElement = document.createElement('video');
  // Make camera overlay smaller by default so it doesn't obscure the page
  videoElement.width = 200;
  videoElement.height = 150;
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    videoElement.muted = true; // Required for autoplay
    videoElement.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      width: 200px !important;
      height: 150px !important;
      border-radius: 10px !important;
      border: 2px solid #6366f1 !important;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18) !important;
      z-index: 2147483646 !important;
      object-fit: cover !important;
      transform: scaleX(-1) !important;
      pointer-events: auto !important;
      cursor: move !important;
    `;
    videoElement.setAttribute('data-emotiflow', 'camera');

  // Make overlay draggable so user can move it out of the way
  makeElementDraggable(videoElement);

    // Append to documentElement (more reliable than body in extensions)
    (document.documentElement || document.body).appendChild(videoElement);

    // Step 4: Create hidden canvas for processing
    canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    canvas.style.display = 'none';
    canvas.setAttribute('data-emotiflow', 'processing');
    (document.documentElement || document.body).appendChild(canvas);

    canvasContext = canvas.getContext('2d', { willReadFrequently: true });

    if (!canvasContext) {
      throw new Error('Failed to get 2D canvas context');
    }

    // Step 5: Bind stream to video
    videoElement.srcObject = cameraStream;

    console.log('[Facial] Waiting for video to load...');

    // Wait for video metadata and play
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Video loading timeout'));
      }, 10000);

      videoElement!.onloadedmetadata = () => {
        clearTimeout(timeout);
        videoElement!
          .play()
          .then(() => {
            console.log('[Facial] Video playing successfully');
            resolve();
          })
          .catch(reject);
      };

      videoElement!.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Video element error'));
      };
    });

  // Step 6: Create status label
  createStatusLabel();

    // Step 7: Start analysis loop
    facialDetectionEnabled = true;
  // Try to load optional face model (if user opted in)
  tryLoadFaceModel().catch(() => {});
  startFacialAnalysisLoop();

    // Step 8: Setup cleanup handlers
    setupCleanupHandlers();

    console.log('[Facial] ✓ Facial detection initialized successfully');
    console.log('[Facial] Camera feed visible at top-right corner');
    return true;
  } catch (error: any) {
    // Log the DOMException name/message when possible for easier debugging
    console.error('[Facial] Initialization failed:', error?.name || error?.message || error);

    // Cleanup on failure
    await cleanupResources();

    facialDetectionEnabled = false;

    // Return false instead of throwing to avoid unhandled promise rejections
    try {
      const name = error?.name;
      if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') {
        console.warn('[Facial] Initialization failed - camera permission denied');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        console.warn('[Facial] Initialization failed - no camera found');
      } else if (name === 'NotReadableError') {
        console.warn('[Facial] Initialization failed - camera not readable');
      }
    } catch (e) {
      // ignore
    }

    return false;
  } finally {
    isInitializing = false;
  }
};

/**
 * Stop facial detection and cleanup all resources
 */
export const stopFacialDetection = async (): Promise<void> => {
  console.log('[Facial] Stopping detection...');

  facialDetectionEnabled = false;

  // Stop analysis loop
  if (analysisInterval !== null) {
    clearInterval(analysisInterval);
    analysisInterval = null;
  }

  // Cleanup all resources
  await cleanupResources();

  console.log('[Facial] ✓ Detection stopped and cleaned up');
};

/**
 * Check if facial detection is available in current context
 */
export const isFacialDetectionAvailable = (): boolean => {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
};

/**
 * Get current detection status
 */
export const getFacialDetectionStatus = () => {
  return {
    enabled: facialDetectionEnabled,
    captureCount: facialCaptureCount,
    hasVideo: videoElement !== null,
    hasCanvas: canvas !== null,
  };
};

// ============================================================================
// ANALYSIS LOOP
// ============================================================================

/**
 * Start the facial analysis loop (runs every 2 seconds)
 */
const startFacialAnalysisLoop = (): void => {
  if (!videoElement || !canvas || !canvasContext || !facialDetectionEnabled) {
    console.warn('[Facial] Cannot start loop - missing components');
    return;
  }

  console.log('[Facial] Starting analysis loop (2s interval)');

  analysisInterval = window.setInterval(async () => {
    // Safety check
    if (!videoElement || !canvas || !canvasContext || !facialDetectionEnabled) {
      return;
    }

    try {
      // If model is loaded and available, prefer face-api.js detection (opt-in)
      let rawEmotionData = null as any;
      if (faceModelLoaded && faceApi && videoElement) {
        try {
          rawEmotionData = await detectWithFaceApi(videoElement);
        } catch (mErr) {
          console.warn('[Facial] face-api detection failed, falling back to local pipeline:', mErr);
          rawEmotionData = null;
        }
      }

      // Fallback to canvas-based pipeline
      if (!rawEmotionData) {
        // Draw current frame to canvas
        canvasContext.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Get image data
        const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);

        // Detect emotion
        rawEmotionData = detectEmotionFromImageData(imageData);
      }

      if (rawEmotionData) {
        facialCaptureCount++;

        // Smooth breakdown with EMA to reduce rapid flicker
        if (!lastSmoothedBreakdown) {
          lastSmoothedBreakdown = { ...rawEmotionData.breakdown } as Record<FacialEmotion, number>;
        } else {
          (Object.keys(lastSmoothedBreakdown) as FacialEmotion[]).forEach((k) => {
            const rawVal = rawEmotionData.breakdown?.[k] ?? 0;
            lastSmoothedBreakdown![k] = lastSmoothedBreakdown![k] * (1 - SMOOTH_ALPHA) + rawVal * SMOOTH_ALPHA;
          });
        }

        // Recompute winner and confidence from smoothed breakdown
        const smoothedEntries = Object.entries(lastSmoothedBreakdown || {}) as [FacialEmotion, number][];
        let smoothedMaxEmotion: FacialEmotion = 'neutral';
        let smoothedMax = 0;
        smoothedEntries.forEach(([k, v]) => {
          if (v > smoothedMax) {
            smoothedMax = v;
            smoothedMaxEmotion = k;
          }
        });

        const smoothedConfidence = Math.round(Math.min(100, Math.max(30, smoothedMax)));

        const emotionData = {
          emotion: smoothedMaxEmotion,
          confidence: smoothedConfidence,
          timestamp: Date.now(),
          breakdown: lastSmoothedBreakdown || rawEmotionData.breakdown,
        } as FacialDetectionData;

        // Log every 10th capture to reduce noise
        if (facialCaptureCount % 10 === 0) {
          console.log(`[Facial] #${facialCaptureCount}: ${emotionData.emotion} (${emotionData.confidence}%)`);
        }

        // Update UI label
        updateStatusLabel(emotionData.breakdown);

        // Send to background service worker
          try {
            const { response, error } = await sendMessageSafe({ type: 'FACIAL_EMOTION', data: emotionData });
            if (error) {
              // If the extension context was invalidated or no receiver exists, stop gracefully
              if (error.includes('Extension context invalidated') || error.includes('Receiving end does not exist')) {
                console.log('[Facial] Extension context invalidated or receiver missing, stopping...');
                await stopFacialDetection();
              } else {
                // generic warning
                console.warn('[Facial] sendMessageSafe returned error:', error);
              }
            }
          } catch (msgError) {
            console.warn('[Facial] Unexpected send message error:', msgError);
          }
      }
    } catch (error) {
      // Log but don't stop loop for transient errors
      if (facialCaptureCount % 20 === 0) {
        console.warn('[Facial] Analysis error:', error);
      }
    }
  }, 2000);
};

// ============================================================================
// EMOTION DETECTION PIPELINE
// ============================================================================

/**
 * Main emotion detection function
 */
const detectEmotionFromImageData = (imageData: ImageData): FacialDetectionData | null => {
  try {
    const { width, height, data } = imageData;

    // Step 1: Detect face region using skin tone
    const faceRegion = detectFaceRegion(data, width, height);

    if (!faceRegion) {
      // No face detected
      return null;
    }

    // Step 2: Extract facial features
    const features = analyzeFacialFeatures(data, width, height, faceRegion);

    // Step 3: Classify emotion
    const emotion = classifyEmotion(features);

    return {
      emotion: emotion.type,
      confidence: emotion.confidence,
      timestamp: Date.now(),
      breakdown: emotion.breakdown,
    };
    } catch (error: any) {
      console.warn('[Facial] Detection error:', error?.name || error?.message || error);
      return null;
    }
};

/**
 * Detect emotion using face-api.js (opt-in). Returns FacialDetectionData or null.
 */
const detectWithFaceApi = async (video: HTMLVideoElement): Promise<FacialDetectionData | null> => {
  try {
    if (!faceApi) return null;
    // Use tiny face detector for speed
    const options = new faceApi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
    const detection = await faceApi.detectSingleFace(video, options).withFaceExpressions();
    if (!detection || !detection.expressions) return null;

    // Map face-api expressions to our FacialEmotion set and create breakdown
    const expr = detection.expressions as Record<string, number>;
    const breakdown: Record<FacialEmotion, number> = {
      happy: (expr.happy || 0) * 100,
      sad: (expr.sad || 0) * 100,
      angry: (expr.angry || 0) * 100,
      fearful: (expr.fearful || 0) * 100,
      disgusted: (expr.disgusted || 0) * 100,
      surprised: (expr.surprised || 0) * 100,
      neutral: (expr.neutral || 0) * 100,
    };

    // Determine winner
    let winner: FacialEmotion = 'neutral';
    let max = 0;
    (Object.keys(breakdown) as FacialEmotion[]).forEach((k) => {
      if (breakdown[k] > max) { max = breakdown[k]; winner = k; }
    });

    const confidence = Math.round(Math.min(100, Math.max(30, max)));

    return {
      emotion: winner,
      confidence,
      timestamp: Date.now(),
      breakdown,
    } as FacialDetectionData;
  } catch (error) {
    console.warn('[Facial] detectWithFaceApi error:', error);
    return null;
  }
};

/**
 * Detect face region using skin tone detection
 */
const detectFaceRegion = (
  data: Uint8ClampedArray,
  width: number,
  height: number
): { x: number; y: number; w: number; h: number } | null => {
  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0;
  let skinPixelCount = 0;

  // Sample every 4th pixel for performance
  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (isSkinTone(r, g, b)) {
        skinPixelCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Need at least 100 skin pixels to consider it a face
  if (skinPixelCount < 100) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    w: Math.max(1, maxX - minX),
    h: Math.max(1, maxY - minY),
  };
};

/**
 * Simple skin tone detection
 */
const isSkinTone = (r: number, g: number, b: number): boolean => {
  // Convert RGB to YCbCr and use Cb/Cr ranges which are more stable across skin tones
  // Reference ranges (approx): Cb in [77,127], Cr in [133,173] (may vary across lighting)
  // Fall back to a relaxed check if Y (luma) is very low/high.
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

  // Relaxed bounds to reduce false negatives for darker or lighter skin under varied lighting
  const cbOk = cb >= 60 && cb <= 140;
  const crOk = cr >= 120 && cr <= 180;

  // Additional heuristics: ensure reasonably face-like chroma relationship and luma
  const lumaOk = y > 20 && y < 240;

  return cbOk && crOk && lumaOk;
};

/**
 * Analyze facial features for emotion classification
 */
const analyzeFacialFeatures = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  faceRegion: { x: number; y: number; w: number; h: number }
) => {
  // Divide face into thirds vertically
  const upperBrightness = calculateRegionBrightness(
    data,
    width,
    faceRegion.x,
    faceRegion.y,
    faceRegion.w,
    Math.floor(faceRegion.h / 3)
  );

  const middleBrightness = calculateRegionBrightness(
    data,
    width,
    faceRegion.x,
    faceRegion.y + Math.floor(faceRegion.h / 3),
    faceRegion.w,
    Math.floor(faceRegion.h / 3)
  );

  const lowerBrightness = calculateRegionBrightness(
    data,
    width,
    faceRegion.x,
    faceRegion.y + Math.floor((2 * faceRegion.h) / 3),
    faceRegion.w,
    Math.floor(faceRegion.h / 3)
  );

  const edgeDensity = calculateEdgeDensity(data, width, faceRegion);
  const colorVariance = calculateColorVariance(data, width, faceRegion);

  return {
    upperBrightness,
    middleBrightness,
    lowerBrightness,
    edgeDensity,
    colorVariance,
    faceSize: faceRegion.w * faceRegion.h,
  };
};

/**
 * Calculate average brightness in a region
 */
const calculateRegionBrightness = (
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  w: number,
  h: number
): number => {
  let sum = 0;
  let count = 0;

  const xEnd = Math.min(x + w, width);
  const yEnd = Math.min(y + h, Math.floor(data.length / 4 / width));

  for (let py = y; py < yEnd; py += 2) {
    for (let px = x; px < xEnd; px += 2) {
      const i = (py * width + px) * 4;
      if (i + 2 < data.length) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        sum += brightness;
        count++;
      }
    }
  }

  return count > 0 ? sum / count / 255 : 0;
};

/**
 * Calculate edge density (Sobel-like)
 */
const calculateEdgeDensity = (
  data: Uint8ClampedArray,
  width: number,
  faceRegion: { x: number; y: number; w: number; h: number }
): number => {
  let edgeCount = 0;
  let totalPixels = 0;

  const xStart = Math.max(faceRegion.x + 1, 1);
  const yStart = Math.max(faceRegion.y + 1, 1);
  const xEnd = Math.min(faceRegion.x + faceRegion.w - 1, width - 2);
  const yEnd = Math.min(faceRegion.y + faceRegion.h - 1, Math.floor(data.length / 4 / width) - 2);

  for (let y = yStart; y < yEnd; y += 4) {
    for (let x = xStart; x < xEnd; x += 4) {
      const i = (y * width + x) * 4;

      if (i + width * 4 + 6 < data.length) {
        const curr = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const right = (data[i + 4] + data[i + 5] + data[i + 6]) / 3;
        const bottom = (data[i + width * 4] + data[i + width * 4 + 1] + data[i + width * 4 + 2]) / 3;

        const gradient = Math.abs(curr - right) + Math.abs(curr - bottom);

        if (gradient > 30) {
          edgeCount++;
        }
        totalPixels++;
      }
    }
  }

  return totalPixels > 0 ? edgeCount / totalPixels : 0;
};

/**
 * Calculate color variance
 */
const calculateColorVariance = (
  data: Uint8ClampedArray,
  width: number,
  faceRegion: { x: number; y: number; w: number; h: number }
): number => {
  const values: number[] = [];

  for (let y = faceRegion.y; y < faceRegion.y + faceRegion.h; y += 4) {
    for (let x = faceRegion.x; x < faceRegion.x + faceRegion.w; x += 4) {
      const i = (y * width + x) * 4;
      if (i + 2 < data.length) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        values.push(brightness);
      }
    }
  }

  if (values.length === 0) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

  return Math.sqrt(variance) / 255;
};

/**
 * Classify emotion using ML-inspired Gaussian probability distributions
 */
const classifyEmotion = (features: any): {
  type: FacialEmotion;
  confidence: number;
  breakdown: Record<FacialEmotion, number>;
} => {
  const { upperBrightness, middleBrightness, lowerBrightness, edgeDensity, colorVariance } =
    features;

  // Calculate derived features
  const avgBrightness = (upperBrightness + middleBrightness + lowerBrightness) / 3;
  const upperMiddleRatio = upperBrightness / Math.max(middleBrightness, 0.001);
  const lowerMiddleRatio = lowerBrightness / Math.max(middleBrightness, 0.001);

  // Emotion profiles based on statistical patterns
  const emotionProfiles: Record<
    FacialEmotion,
    Record<string, { mean: number; std: number }>
  > = {
    happy: {
      lowerMiddleRatio: { mean: 1.15, std: 0.25 },
      edgeDensity: { mean: 0.15, std: 0.08 },
      avgBrightness: { mean: 0.5, std: 0.15 },
      colorVariance: { mean: 0.15, std: 0.1 },
    },
    sad: {
      lowerMiddleRatio: { mean: 0.85, std: 0.2 },
      edgeDensity: { mean: 0.08, std: 0.05 },
      avgBrightness: { mean: 0.35, std: 0.12 },
      colorVariance: { mean: 0.1, std: 0.08 },
    },
    angry: {
      upperMiddleRatio: { mean: 0.85, std: 0.2 },
      edgeDensity: { mean: 0.22, std: 0.08 },
      avgBrightness: { mean: 0.42, std: 0.15 },
      colorVariance: { mean: 0.18, std: 0.1 },
    },
    fearful: {
      upperMiddleRatio: { mean: 1.1, std: 0.2 },
      edgeDensity: { mean: 0.18, std: 0.08 },
      avgBrightness: { mean: 0.48, std: 0.15 },
      colorVariance: { mean: 0.22, std: 0.1 },
    },
    disgusted: {
      upperMiddleRatio: { mean: 1.05, std: 0.2 },
      edgeDensity: { mean: 0.2, std: 0.08 },
      avgBrightness: { mean: 0.4, std: 0.15 },
      colorVariance: { mean: 0.16, std: 0.1 },
    },
    surprised: {
      upperMiddleRatio: { mean: 1.2, std: 0.25 },
      edgeDensity: { mean: 0.25, std: 0.1 },
      avgBrightness: { mean: 0.52, std: 0.15 },
      colorVariance: { mean: 0.25, std: 0.12 },
    },
    neutral: {
      upperMiddleRatio: { mean: 1.0, std: 0.12 },
      lowerMiddleRatio: { mean: 1.0, std: 0.12 },
      edgeDensity: { mean: 0.13, std: 0.06 },
      avgBrightness: { mean: 0.45, std: 0.15 },
      colorVariance: { mean: 0.12, std: 0.08 },
    },
  };

  // Calculate probability scores
  const scores: Record<FacialEmotion, number> = {
    happy: 0,
    sad: 0,
    angry: 0,
    fearful: 0,
    disgusted: 0,
    surprised: 0,
    neutral: 0,
  };

  // Gaussian probability density function
  const gaussian = (value: number, mean: number, std: number): number => {
    const exponent = -Math.pow(value - mean, 2) / (2 * Math.pow(std, 2));
    return Math.exp(exponent) / (std * Math.sqrt(2 * Math.PI));
  };

  // Feature map
  const featureValues: Record<string, number> = {
    upperMiddleRatio,
    lowerMiddleRatio,
    edgeDensity,
    avgBrightness,
    colorVariance,
  };

  // Calculate match probability for each emotion
  for (const [emotion, profile] of Object.entries(emotionProfiles)) {
    let probability = 1.0;
    let featureCount = 0;

    for (const [featureName, params] of Object.entries(profile)) {
      const featureValue = featureValues[featureName];
      if (featureValue !== undefined) {
        const p = gaussian(featureValue, params.mean, params.std);
        probability *= p;
        featureCount++;
      }
    }

    // Normalize by taking nth root
    const normalizedScore = Math.pow(probability, 1 / Math.max(featureCount, 1)) * 1000;
    scores[emotion as FacialEmotion] = normalizedScore;
  }

  // Convert to percentages
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0) || 1;

  const percentages: Record<FacialEmotion, number> = {
    happy: (scores.happy / totalScore) * 100,
    sad: (scores.sad / totalScore) * 100,
    angry: (scores.angry / totalScore) * 100,
    fearful: (scores.fearful / totalScore) * 100,
    disgusted: (scores.disgusted / totalScore) * 100,
    surprised: (scores.surprised / totalScore) * 100,
    neutral: (scores.neutral / totalScore) * 100,
  };

  // Find winner
  let maxEmotion: FacialEmotion = 'neutral';
  let maxPercentage = 0;

  for (const [emotion, pct] of Object.entries(percentages)) {
    if (pct > maxPercentage) {
      maxPercentage = pct;
      maxEmotion = emotion as FacialEmotion;
    }
  }

  const confidence = Math.round(Math.min(100, Math.max(30, maxPercentage)));

  return {
    type: maxEmotion,
    confidence,
    breakdown: percentages,
  };
};

// ============================================================================
// UI COMPONENTS
// ============================================================================

/**
 * Create status label overlay
 */
const createStatusLabel = (): void => {
  const existingLabel = document.getElementById('emotiflow-camera-label');
  if (existingLabel) {
    existingLabel.remove();
  }

  const label = document.createElement('div');
  label.id = 'emotiflow-camera-label';
  label.style.cssText = `
    position: fixed !important;
    top: 270px !important;
    right: 20px !important;
    background: rgba(99, 102, 241, 0.95) !important;
    color: white !important;
    padding: 8px 14px !important;
    border-radius: 8px !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    z-index: 2147483647 !important;
    font-family: 'Courier New', monospace !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    max-width: 300px !important;
    line-height: 1.6 !important;
    pointer-events: none !important;
  `;
  label.textContent = '👤 EmotiFlow Camera - Analyzing...';
  label.setAttribute('data-emotiflow', 'label');

  (document.documentElement || document.body).appendChild(label);
};

/**
 * Safe sendMessage helper that protects against missing background listeners
 * Returns an object { response, error } where error is a string message when send failed.
 */
const sendMessageSafe = async (msg: any): Promise<{ response: any | null; error: string | null }> => {
  try {
    if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
      return { response: null, error: 'chrome.runtime.sendMessage not available' };
    }

    return await new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(msg, (resp) => {
          const last = (chrome.runtime && (chrome.runtime as any).lastError) || (chrome.runtime && (chrome as any).lastError);
          if (last) {
            // lastError exists when there's no receiver or other runtime error
            const message = last.message || String(last);
            console.warn('[Messaging] sendMessage failed:', message, 'msg=', msg);
            resolve({ response: null, error: message });
            return;
          }
          resolve({ response: resp, error: null });
        });
      } catch (e: any) {
        const m = e?.message || String(e);
        console.warn('[Messaging] sendMessage exception:', m, 'msg=', msg);
        resolve({ response: null, error: m });
      }
    });
  } catch (err: any) {
    const m = err?.message || String(err);
    console.warn('[Messaging] sendMessage top-level error:', m);
    return { response: null, error: m };
  }
};

/**
 * Make an element draggable (mouse + touch). Stores handler refs for cleanup.
 */
function makeElementDraggable(el: HTMLElement): void {
  // Ensure element can be positioned via left/top when dragging starts
  el.style.position = 'fixed';
  el.style.touchAction = 'none';

  const onMouseDown = (e: MouseEvent) => {
    e.preventDefault();

    // Convert from right/top layout to left/top to allow free dragging
    const rect = el.getBoundingClientRect();
    el.style.left = `${rect.left}px`;
    el.style.top = `${rect.top}px`;
    el.style.right = 'auto';

    const startX = e.clientX;
    const startY = e.clientY;
    const origLeft = rect.left;
    const origTop = rect.top;

    _dragMouseMove = (evt: MouseEvent) => {
      const dx = evt.clientX - startX;
      const dy = evt.clientY - startY;
      el.style.left = `${Math.max(0, Math.min(window.innerWidth - el.clientWidth, origLeft + dx))}px`;
      el.style.top = `${Math.max(0, Math.min(window.innerHeight - el.clientHeight, origTop + dy))}px`;
    };

    _dragMouseUp = (_evt: MouseEvent) => {
      try {
        if (_dragMouseMove) document.removeEventListener('mousemove', _dragMouseMove as any);
        if (_dragMouseUp) document.removeEventListener('mouseup', _dragMouseUp as any);
      } catch (e) {
        console.warn('[Facial] Error removing mouse drag listeners:', e);
      }
      _dragMouseMove = null;
      _dragMouseUp = null;
      el.style.cursor = 'move';
    };

    document.addEventListener('mousemove', _dragMouseMove);
    document.addEventListener('mouseup', _dragMouseUp);
    el.style.cursor = 'grabbing';
  };

  const onTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;

    const rect = el.getBoundingClientRect();
    el.style.left = `${rect.left}px`;
    el.style.top = `${rect.top}px`;
    el.style.right = 'auto';

    const startX = touch.clientX;
    const startY = touch.clientY;
    const origLeft = rect.left;
    const origTop = rect.top;

    _dragTouchMove = (evt: TouchEvent) => {
      const t = evt.touches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      el.style.left = `${Math.max(0, Math.min(window.innerWidth - el.clientWidth, origLeft + dx))}px`;
      el.style.top = `${Math.max(0, Math.min(window.innerHeight - el.clientHeight, origTop + dy))}px`;
    };

    _dragTouchEnd = (_evt: TouchEvent) => {
      if (_dragTouchMove) document.removeEventListener('touchmove', _dragTouchMove as any);
      if (_dragTouchEnd) document.removeEventListener('touchend', _dragTouchEnd as any);
      _dragTouchMove = null;
      _dragTouchEnd = null;
      el.style.cursor = 'move';
    };

    document.addEventListener('touchmove', _dragTouchMove, { passive: false } as any);
    document.addEventListener('touchend', _dragTouchEnd as any);
    el.style.cursor = 'grabbing';
  };

  el.addEventListener('mousedown', onMouseDown);
  el.addEventListener('touchstart', onTouchStart, { passive: false } as any);
};

/**
 * Update status label with emotion breakdown
 */
const updateStatusLabel = (breakdown: Record<FacialEmotion, number> | undefined): void => {
  const label = document.getElementById('emotiflow-camera-label');
  if (!label) return;

  // If breakdown is not available, show an informative fallback
  if (!breakdown) {
    label.innerHTML = '👤 FACE:<br/>Analyzing...';
    return;
  }

  const emojiMap: Record<FacialEmotion, string> = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    fearful: '😨',
    disgusted: '🤢',
    surprised: '😲',
    neutral: '😐',
  };

  const sortedEmotions = Object.entries(breakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([emotion, pct]) => {
      const emoji = emojiMap[emotion as FacialEmotion] || '●';
      const shortName = emotion.substring(0, 3);
      return `${emoji}${shortName} ${pct.toFixed(0)}%`;
    })
    .join(' ');

  label.innerHTML = `👤 FACE:<br/>${sortedEmotions}`;
};

// ============================================================================
// CLEANUP & LIFECYCLE
// ============================================================================

/**
 * Setup cleanup event handlers
 */
const setupCleanupHandlers = (): void => {
  // Cleanup on page navigation
  window.addEventListener('beforeunload', stopFacialDetection, { once: true });
  window.addEventListener('pagehide', stopFacialDetection, { once: true });

  // Cleanup on extension context invalidation
  // Note: Do NOT stop detection on service worker connect/disconnect events.
  // MV3 service workers may restart frequently; stopping detection when the
  // service worker reloads would cause the camera overlay to vanish. Instead,
  // detection lifecycle is controlled explicitly by messages from the extension UI.
};

/**
 * Cleanup all resources
 */
const cleanupResources = async (): Promise<void> => {
  // Stop camera stream
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => {
      track.stop();
      console.log('[Facial] Stopped track:', track.kind);
    });
    cameraStream = null;
  }

  // Remove video element
  // Remove any global drag listeners that may be attached
  try {
    if (_dragMouseMove) {
      document.removeEventListener('mousemove', _dragMouseMove as any);
      _dragMouseMove = null;
    }
    if (_dragMouseUp) {
      document.removeEventListener('mouseup', _dragMouseUp as any);
      _dragMouseUp = null;
    }
    if (_dragTouchMove) {
      document.removeEventListener('touchmove', _dragTouchMove as any);
      _dragTouchMove = null;
    }
    if (_dragTouchEnd) {
      document.removeEventListener('touchend', _dragTouchEnd as any);
      _dragTouchEnd = null;
    }
  } catch (err) {
    console.warn('[Facial] Error removing drag listeners:', err);
  }

  if (videoElement) {
    if (videoElement.srcObject) {
      videoElement.srcObject = null;
    }
    videoElement.remove();
    videoElement = null;
  }

  // Remove canvas
  if (canvas) {
    canvas.remove();
    canvas = null;
  }

  canvasContext = null;

  // Remove label
  const label = document.getElementById('emotiflow-camera-label');
  if (label) {
    label.remove();
  }

  // Reset counters
  facialCaptureCount = 0;
};

// ============================================================================
// AUTO-INITIALIZATION (Optional - remove if you want manual start)
// ============================================================================

  // Auto-start detection when module loads (only in extension context)
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    // Wait for DOM to be ready
    const starter = () => {
      // Call and catch so we don't leave an unhandled rejection in console
      initializeFacialDetection().catch((err: any) => {
        console.warn('[Facial] Auto-init failed (caught):', err?.name || err?.message || err);
        try {
          // Create a status label so the user sees the camera is unavailable
          createStatusLabel();
          const lbl = document.getElementById('emotiflow-camera-label');
          if (lbl) lbl.textContent = `👤 Camera: unavailable (${err?.name || err?.message || 'error'})`;
        } catch (e) {
          /* ignore */
        }
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(starter, 1000);
      });
    } else {
      setTimeout(starter, 1000);
    }
  }
