/**
 * Worst Onboarding Ever 2 — analytics instrumentation
 * Same architecture as WOE 1: track() fans out to GA4 + LinkedIn, every path fails safe.
 */
const WOE_VARIANT = (location.pathname.match(/worst-onboarding-2\/([a-z-]+)\//) || [])[1] || 'en';

const WOE_LI_ENABLED = true;
const LI_PARTNER_ID = '2295498';

// WOE 2 conversion IDs (Campaign Manager, partner 2295498, created 2026-07-07 —
// separate from WOE 1's set so the two games don't commingle).
const LI_CONVERSIONS = {
  game_start: 29344777,
  reached_l2: 29344785,
  reached_l3: 29344793,
  reached_l4: 29344801,
  reached_l5: 29344809,
  game_complete: 29344817,
  cta_click: 29344825,
  lead_submit: 29344849  // shared "WOE Lead" conversion (same ID in WOE1) — fired on capture-form submit
};

function liLoadTag() {
  if (!WOE_LI_ENABLED || window._woe_li_init) return;
  window._woe_li_init = true;
  window._linkedin_partner_id = LI_PARTNER_ID;
  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
  window._linkedin_data_partner_ids.push(LI_PARTNER_ID);
  if (typeof window.lintrk !== 'function') {
    window.lintrk = function (a, b) { window.lintrk.q.push([a, b]); };
    window.lintrk.q = [];
  }
  const first = document.getElementsByTagName('script')[0];
  const s = document.createElement('script');
  s.type = 'text/javascript'; s.async = true;
  s.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
  first.parentNode.insertBefore(s, first);
}

function liPageView() {
  try {
    new Image().src = 'https://px.ads.linkedin.com/collect?v=2&fmt=js&pid=' +
      LI_PARTNER_ID + '&time=' + Date.now() + '&url=' + encodeURIComponent(location.href);
  } catch (e) { /* ignore */ }
}

function liTrack(key) {
  if (!WOE_LI_ENABLED) return;
  const id = LI_CONVERSIONS[key];
  if (id && typeof window.lintrk === 'function') {
    window.lintrk('track', { conversion_id: id });
  }
}

function liStage(stage) {
  if (!WOE_LI_ENABLED) return;
  try {
    const url = new URL(location.href);
    url.searchParams.set('s', stage);
    history.replaceState(null, '', url);
  } catch (e) { /* ignore */ }
  liPageView();
}

function liDispatch(name, params) {
  if (!WOE_LI_ENABLED) return;
  if (name === 'game_start') {
    liStage('w2start'); liTrack('game_start');
  } else if (name === 'level_complete') {
    const lvl = params.level;
    if (lvl >= 1 && lvl <= 4) { liStage('w2l' + (lvl + 1)); liTrack('reached_l' + (lvl + 1)); }
  } else if (name === 'game_complete') {
    liStage('w2done'); liTrack('game_complete');
  } else if (name === 'cta_click') {
    liTrack('cta_click');
  } else if (name === 'lead_submit') {
    liTrack('lead_submit');  // email captured on the end-screen form (no virtual URL)
  }
}

function track(name, params = {}) {
  try {
    if (typeof gtag === 'function') {
      gtag('event', name, Object.assign({ variant: WOE_VARIANT, game: 'woe2' }, params));
    }
  } catch (e) { /* ignore */ }
  try { liDispatch(name, params); } catch (e) { /* ignore */ }
}

// Outbound CTA clicks to the marketing site. Excludes games.userguiding.com so the
// "Play WOE 1 ->" cross-link fires only its own event (woe1_click), not cta_click.
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href*="userguiding.com"]:not([href*="games.userguiding.com"])');
  // .capture-consent privacy-policy links are legal boilerplate, not CTA intent
  if (link && !link.closest('.capture-consent')) track('cta_click', { link_url: link.href });
});

try { liLoadTag(); } catch (e) { /* ignore */ }
