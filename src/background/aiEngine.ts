/**
 * AI Engine - Chrome Prompt API Integration
 * Handles Gemini Nano and Firebase AI Logic fallback
 */

import { EMOTIFLOW_SYSTEM_PROMPT } from '../utils/prompts';

let promptSession: any = null;

/**
 * Initialize Chrome Prompt API (Gemini Nano)
 */
export const initializePromptAPI = async (): Promise<boolean> => {
  try {
    // In service worker, window object doesn't exist, so we skip Gemini Nano
    // The content script handles UI interactions that could access window.ai
    console.warn('Service Worker context: Chrome AI API initialization skipped (use content script for UI interactions)');
    return false;
  } catch (error) {
    console.error('Error initializing Chrome Prompt API:', error);
    return false;
  }
};

/**
 * Run prompt using Prompt API
 */
export const runPrompt = async (userPrompt: string): Promise<string> => {
  try {
    if (promptSession) {
      const result = await promptSession.prompt(userPrompt);
      return result;
    } else {
      throw new Error('Prompt session not initialized');
    }
  } catch (error) {
    console.error('Error running prompt:', error);
    return '';
  }
};

/**
 * Stream prompt response
 */
export const streamPrompt = async (
  userPrompt: string,
  onChunk: (chunk: string) => void
): Promise<void> => {
  try {
    if (promptSession) {
      const stream = await promptSession.promptStreaming(userPrompt);
      for await (const chunk of stream) {
        onChunk(chunk);
      }
    }
  } catch (error) {
    console.error('Error streaming prompt:', error);
  }
};

/**
 * Check if Prompt API is available
 */
export const isPromptAPIAvailable = async (): Promise<boolean> => {
  // Service worker context doesn't have window.ai
  // This would be checked in content script for UI
  return false;
};

/**
 * Get AI capability status
 */
export const getAICapabilityStatus = async (): Promise<string> => {
  // Service worker context doesn't have window.ai
  return 'not-supported';
};
