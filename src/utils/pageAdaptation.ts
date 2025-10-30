/**
 * Dynamic Page Adaptation
 * Modifies webpage appearance based on detected emotion state
 */

import { Emotion, ContentFilterMode } from '../types/index';

/**
 * Emotion-to-color mapping for UI adaptation
 */
export const emotionColorSchemes: Record<Emotion, {
  primary: string;
  secondary: string;
  accent: string;
  filter: string;
}> = {
  calm: {
    primary: '#06B6D4',      // Cyan
    secondary: '#E0F2FE',    // Light cyan
    accent: '#06B6D4',
    filter: 'hue-rotate(180deg) brightness(1.1) saturate(0.8)'
  },
  stressed: {
    primary: '#EF4444',      // Red
    secondary: '#FEE2E2',    // Light red
    accent: '#DC2626',       // Darker red
    filter: 'hue-rotate(0deg) brightness(0.9) saturate(1.2) invert(0.05)'
  },
  anxious: {
    primary: '#F59E0B',      // Amber
    secondary: '#FEF3C7',    // Light amber
    accent: '#D97706',       // Darker amber
    filter: 'hue-rotate(-20deg) brightness(0.95) saturate(1.1)'
  },
  sad: {
    primary: '#8B5CF6',      // Purple/Indigo
    secondary: '#F3E8FF',    // Light purple
    accent: '#7C3AED',       // Darker purple
    filter: 'hue-rotate(270deg) brightness(0.85) saturate(0.7) contrast(1.1)'
  },
  happy: {
    primary: '#FBBF24',      // Gold/Yellow
    secondary: '#FFFBEB',    // Light gold
    accent: '#F59E0B',       // Darker gold
    filter: 'brightness(1.2) saturate(1.3)'
  },
  energized: {
    primary: '#10B981',      // Green
    secondary: '#D1FAE5',    // Light green
    accent: '#059669',       // Darker green
    filter: 'hue-rotate(120deg) brightness(1.1) saturate(1.2) contrast(1.1)'
  },
  frustrated: {
    primary: '#EF4444',      // Red
    secondary: '#FEE2E2',    // Light red
    accent: '#991B1B',       // Dark red
    filter: 'hue-rotate(0deg) saturate(1.5) brightness(0.95)'
  },
  fatigued: {
    primary: '#9CA3AF',      // Gray
    secondary: '#F3F4F6',    // Light gray
    accent: '#6B7280',       // Darker gray
    filter: 'grayscale(0.5) brightness(1.05) contrast(0.95)'
  },
  neutral: {
    primary: '#6B7280',      // Gray
    secondary: '#F9FAFB',    // Light gray
    accent: '#4B5563',       // Dark gray
    filter: 'brightness(1) saturate(1) contrast(1)'
  }
};

/**
 * Content filter styles based on emotional state
 */
export const getFilterStyles = (mode: ContentFilterMode): string => {
  switch (mode) {
    case 'dim_negative':
      // Dim negative/harsh elements
      return `
        /* Dim dark colors and high contrast */
        img[src*="sad"], img[src*="angry"], img[src*="negative"] {
          filter: brightness(0.7) contrast(0.8);
          opacity: 0.85;
        }
        /* Soften red/orange text (often used for warnings/alerts) */
        span, p, div {
          color: revert;
        }
        a[href*="warning"], a[href*="alert"] {
          color: #8B5CF6 !important; /* Change to calmer purple */
        }
      `;
    
    case 'highlight_positive':
      // Emphasize positive/uplifting content
      return `
        /* Brighten positive elements */
        img[src*="happy"], img[src*="success"], img[src*="positive"] {
          filter: brightness(1.2) contrast(1.1);
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.3);
        }
        /* Highlight success messages */
        .success, [class*="success"], [class*="positive"] {
          background: rgba(34, 197, 94, 0.1) !important;
          border-left: 4px solid #22C55E !important;
          padding-left: 12px !important;
        }
      `;
    
    case 'reduce_stimulation':
      // Reduce visual intensity for fatigued users
      return `
        /* Reduce brightness and animations */
        * {
          animation-duration: 3s !important; /* Slow down animations */
          animation-iteration-count: 1 !important; /* Stop looping */
        }
        body {
          background: #FAFAFA !important; /* Softer background */
          filter: brightness(0.95) saturate(0.9);
        }
        /* Disable autoplay videos */
        video[autoplay] {
          display: none !important;
        }
        /* Reduce flashing ads */
        iframe[src*="ad"], [class*="ad-"] {
          opacity: 0.3 !important;
        }
      `;
    
    case 'none':
    default:
      return '';
  }
};

/**
 * Inject adaptive CSS into webpage
 */
export const injectAdaptiveCSS = (emotion: Emotion, filterMode: ContentFilterMode): void => {
  try {
    const styleId = 'emotiflow-adaptive-styles';
    
    // Remove existing styles
    const existing = document.getElementById(styleId);
    if (existing) {
      existing.remove();
    }

    // Create new style element
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* EmotiFlow Adaptive Styling */
      :root {
        --emotiflow-primary: ${emotionColorSchemes[emotion].primary};
        --emotiflow-secondary: ${emotionColorSchemes[emotion].secondary};
        --emotiflow-accent: ${emotionColorSchemes[emotion].accent};
      }

      /* Apply emotion-based filter to entire page */
      html {
        filter: ${emotionColorSchemes[emotion].filter};
      }

      /* Content-specific adaptations */
      ${getFilterStyles(filterMode)}

      /* Smooth transitions */
      * {
        transition: filter 0.5s ease, background 0.3s ease, color 0.3s ease;
      }

      /* Reduce eye strain for fatigued state */
      ${emotion === 'fatigued' ? `
        body {
          background-color: #F9F7F4 !important;
          font-size: 16px;
          line-height: 1.6;
        }
        p, span, div {
          letter-spacing: 0.5px;
        }
      ` : ''}

      /* Calm state - soften everything */
      ${emotion === 'calm' ? `
        body {
          background: linear-gradient(135deg, #E0F2FE 0%, #F0F9FF 100%);
        }
      ` : ''}

      /* Stressed state - reduce visual noise */
      ${emotion === 'stressed' ? `
        /* Hide potentially stressful elements */
        [class*="breaking"], [class*="alert"], [class*="warning"] {
          opacity: 0.5;
        }
        /* Reduce ad intensity */
        iframe, [class*="advertisement"] {
          opacity: 0.3 !important;
        }
      ` : ''}
    `;

    document.head.appendChild(style);
    console.log('✓ Adaptive CSS injected for emotion:', emotion, 'filter:', filterMode);
  } catch (error) {
    console.error('Error injecting adaptive CSS:', error);
  }
};

/**
 * Remove adaptive CSS
 */
export const removeAdaptiveCSS = (): void => {
  const style = document.getElementById('emotiflow-adaptive-styles');
  if (style) {
    style.remove();
    console.log('✓ Adaptive CSS removed');
  }
};

/**
 * Adjust page brightness and contrast
 */
export const adjustPageBrightness = (emotion: Emotion): void => {
  try {
    const html = document.documentElement;
    
    switch (emotion) {
      case 'fatigued':
        html.style.filter = 'brightness(0.9) contrast(1.1)';
        break;
      case 'stressed':
        html.style.filter = 'brightness(0.95) saturate(0.9)';
        break;
      case 'calm':
        html.style.filter = 'brightness(1.05) saturate(1.1)';
        break;
      default:
        html.style.filter = 'none';
    }
  } catch (error) {
    console.error('Error adjusting brightness:', error);
  }
};

/**
 * Apply text readability enhancement
 */
export const enhanceReadability = (emotion: Emotion): void => {
  try {
    const style = document.createElement('style');
    style.id = 'emotiflow-readability';
    
    if (emotion === 'fatigued' || emotion === 'stressed') {
      style.textContent = `
        body {
          font-size: 16px !important;
          line-height: 1.8 !important;
          letter-spacing: 0.5px !important;
          word-spacing: 2px !important;
        }
        p {
          max-width: 65ch !important;
          margin: 1.5em 0 !important;
        }
        h1, h2, h3, h4, h5, h6 {
          line-height: 1.3 !important;
          margin-bottom: 0.8em !important;
        }
        /* Reduce clutter */
        .sidebar, .ads, [class*="advertisement"] {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      const existing = document.getElementById('emotiflow-readability');
      if (existing) existing.remove();
    }
  } catch (error) {
    console.error('Error enhancing readability:', error);
  }
};

/**
 * Rewrite page title based on emotional context
 */
export const adaptPageTitle = (emotion: Emotion): void => {
  try {
    const originalTitle = document.title;
    
    const adaptations: Record<Emotion, string> = {
      calm: `[Calm] ${originalTitle}`,
      stressed: `[Take a breath] ${originalTitle}`,
      anxious: `[You got this] ${originalTitle}`,
      sad: `[Hoping for better] ${originalTitle}`,
      happy: `[Great mood!] ${originalTitle}`,
      energized: `[Keep going!] ${originalTitle}`,
      frustrated: `[Pause and reset] ${originalTitle}`,
      fatigued: `[Rest soon] ${originalTitle}`,
      neutral: originalTitle
    };

    document.title = adaptations[emotion];
  } catch (error) {
    console.error('Error adapting page title:', error);
  }
};
