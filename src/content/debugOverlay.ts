/**
 * Simple in-page debug overlay to show last tokens, negation flags, and classifier scores.
 * Injected by content script for interactive debugging only (dev/demo).
 */

type DebugState = {
  tokens: string[];
  negated: boolean[];
  scores?: Record<string, number>;
};

const OVERLAY_ID = 'emotiflow-debug-overlay';

export const initializeDebugOverlay = () => {
  if (document.getElementById(OVERLAY_ID)) return;

  const container = document.createElement('div');
  container.id = OVERLAY_ID;
  container.style.position = 'fixed';
  container.style.right = '12px';
  container.style.top = '12px';
  container.style.zIndex = '2147483647';
  container.style.background = 'rgba(0,0,0,0.6)';
  container.style.color = 'white';
  container.style.fontFamily = 'system-ui,Segoe UI,Roboto,Helvetica,Arial';
  container.style.fontSize = '12px';
  container.style.padding = '8px';
  container.style.borderRadius = '8px';
  container.style.maxWidth = '320px';
  container.style.boxShadow = '0 4px 14px rgba(2,6,23,0.6)';
  container.style.pointerEvents = 'none';

  const title = document.createElement('div');
  title.textContent = 'EmotiFlow Debug';
  title.style.fontWeight = '600';
  title.style.marginBottom = '6px';
  container.appendChild(title);

  const body = document.createElement('div');
  body.id = `${OVERLAY_ID}-body`;
  container.appendChild(body);

  document.body.appendChild(container);
};

export const updateDebugOverlay = (state: DebugState) => {
  const body = document.getElementById(`${OVERLAY_ID}-body`);
  if (!body) return;
  body.innerHTML = '';

  const toks = document.createElement('div');
  toks.style.marginBottom = '6px';
  toks.innerHTML = `<strong>Tokens:</strong> ${state.tokens.map((t, i) => `${state.negated[i] ? '<span style="text-decoration:underline">' + escapeHtml(t) + '</span>' : escapeHtml(t)}`).join(' ')}`;
  body.appendChild(toks);

  if (state.scores) {
    const scoresDiv = document.createElement('div');
    scoresDiv.innerHTML = `<strong>Scores:</strong>`;
    const list = document.createElement('ul');
    list.style.margin = '6px 0 0 12px';
    list.style.padding = '0';
    Object.entries(state.scores).sort((a,b)=> (b[1] as number) - (a[1] as number)).forEach(([k,v])=>{
      const li = document.createElement('li');
      li.style.listStyle = 'none';
      li.textContent = `${k}: ${Number(v).toFixed(1)}%`;
      list.appendChild(li);
    });
    scoresDiv.appendChild(list);
    body.appendChild(scoresDiv);
  }
};

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const removeDebugOverlay = () => {
  const el = document.getElementById(OVERLAY_ID);
  if (el) el.remove();
};

// Expose lightweight API on window for content scripts to call
(window as any).__emotiflow_debug = {
  initialize: initializeDebugOverlay,
  update: updateDebugOverlay,
  remove: removeDebugOverlay,
};

export default {};
