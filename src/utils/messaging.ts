/**
 * Lightweight safe messaging helper for content/popup/sidepanel to avoid
 * uncaught "Receiving end does not exist" errors when the background
 * service worker is not available. Returns { response, error }.
 */
export const sendMessageSafe = async (msg: any): Promise<{ response: any | null; error: string | null }> => {
  try {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
      return { response: null, error: 'chrome.runtime.sendMessage not available' };
    }

    return await new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(msg, (resp: any) => {
          const last = (chrome.runtime && (chrome.runtime as any).lastError) || (chrome && (chrome as any).lastError);
          if (last) {
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

export default sendMessageSafe;
