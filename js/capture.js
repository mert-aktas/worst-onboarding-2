/**
 * WOE lead-capture — CANONICAL, config-driven module.
 *
 * This file is the single source of truth. It is copied BYTE-IDENTICAL into every
 * variant's js/ dir of every WOE game (worst-onboarding, worst-onboarding-2, …).
 * Do NOT edit the per-variant copies — edit THIS file and re-copy (see README.md).
 *
 * All per-page differences live in window.CAPTURE_CONFIG (set inline in each
 * index.html) and in the localized markup. This module carries zero copy and zero
 * variant-specific values.
 *
 * Flow: validate email -> POST to the HubSpot Forms API -> track('lead_submit')
 * (fans out to GA4 + LinkedIn via analytics.js) -> redirect to the current mode's
 * destination. The redirect lives HERE, not in HubSpot: a Forms API submit returns
 * JSON and never redirects the browser, so HubSpot's "redirect after submit" setting
 * does not apply.
 *
 * window.CAPTURE_CONFIG = {
 *   PORTAL_ID:  '8289649',
 *   FORM_GUID:  '…',                 // one HubSpot form per language
 *   PAGE_NAME:  'WOE2 EN',           // HubSpot submission context (game + variant)
 *   mode:       'demo',              // 'demo' | 'group' — picks the redirect
 *   redirects:  { demo: 'https://…', group: 'https://…' },
 *   REDIRECT_DELAY_SECONDS: 3
 * };
 */
const Capture = {
  cfg: null,
  ctx: null,

  init() {
    this.cfg = window.CAPTURE_CONFIG || null;
    if (!this.cfg || !document.getElementById('capture-form')) return;
    this.captureContext();
    this.bindForm();
  },

  bindForm() {
    const form = document.getElementById('capture-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  },

  async handleSubmit() {
    const emailInput = document.getElementById('capture-email');
    const submitBtn = document.getElementById('capture-submit');
    const errorEl = document.getElementById('capture-error');
    const email = emailInput.value.trim();

    if (!email || !emailInput.checkValidity()) {
      emailInput.reportValidity();
      return;
    }

    // Preserve the localized button label so we can restore it on error.
    const originalLabel = submitBtn.textContent;
    errorEl.hidden = true;
    submitBtn.disabled = true;
    if (submitBtn.dataset.sending) submitBtn.textContent = submitBtn.dataset.sending;

    try {
      await this.submitToHubspot(email);
      try { if (typeof track === 'function') track('lead_submit'); } catch (e) { /* ignore */ }
      this.showSuccessAndRedirect(email);
    } catch (err) {
      console.error('HubSpot submit failed:', err);
      errorEl.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  },

  async submitToHubspot(email) {
    const payload = {
      fields: [
        { objectTypeId: '0-1', name: 'email', value: email }
      ],
      context: {
        pageUri: window.location.href,
        pageName: this.cfg.PAGE_NAME || 'WOE'
      }
    };

    const url = `https://api.hsforms.com/submissions/v3/integration/submit/${this.cfg.PORTAL_ID}/${this.cfg.FORM_GUID}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HubSpot ${res.status}: ${text}`);
    }
    return res.json();
  },

  // Build the current mode's redirect URL with UTMs + email merged in. Uses the URL
  // API so it stays query-safe even when the base already has params (e.g. a
  // GetContrast group-demo link that ships with ?primaryColor=…&utm_source=…).
  buildRedirectUrl(email) {
    const base = (this.cfg.redirects && this.cfg.redirects[this.cfg.mode]) || '';
    if (!base) return '';
    const ctx = this.getContext();
    let url;
    try {
      url = new URL(base);
    } catch (e) {
      return base;
    }
    url.searchParams.set('email', email);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((k) => {
      if (ctx[k]) url.searchParams.set(k, ctx[k]);
    });
    return url.href;
  },

  showSuccessAndRedirect(email) {
    const formWrap = document.getElementById('capture-form-wrap');
    const successWrap = document.getElementById('capture-success-wrap');
    const countdownEl = document.getElementById('capture-countdown');
    const fallbackLink = document.getElementById('capture-fallback-link');

    const redirectUrl = this.buildRedirectUrl(email);
    if (fallbackLink && redirectUrl) fallbackLink.href = redirectUrl;

    if (formWrap) formWrap.hidden = true;
    if (successWrap) successWrap.hidden = false;

    // No destination configured (e.g. group mode not yet set) -> show success, stay put.
    if (!redirectUrl) return;

    let remaining = this.cfg.REDIRECT_DELAY_SECONDS || 3;
    if (countdownEl) countdownEl.textContent = remaining;

    const tick = () => {
      remaining -= 1;
      if (remaining <= 0) {
        window.location.href = redirectUrl;
        return;
      }
      if (countdownEl) countdownEl.textContent = remaining;
      setTimeout(tick, 1000);
    };
    setTimeout(tick, 1000);
  },

  captureContext() {
    const params = new URLSearchParams(window.location.search);
    this.ctx = {
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_content: params.get('utm_content') || '',
      utm_term: params.get('utm_term') || '',
      referrer_url: document.referrer || '',
      landing_ts: new Date().toISOString()
    };
    try {
      sessionStorage.setItem('wo_capture_ctx', JSON.stringify(this.ctx));
    } catch (e) {
      // sessionStorage unavailable (private browsing on some platforms). Keep ctx in memory only.
      console.warn('sessionStorage unavailable, capture context held in memory only.');
    }
  },

  getContext() {
    if (this.ctx) return this.ctx;
    try {
      const stored = sessionStorage.getItem('wo_capture_ctx');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      utm_source: '', utm_medium: '', utm_campaign: '',
      utm_content: '', utm_term: '', referrer_url: '', landing_ts: ''
    };
  }
};

document.addEventListener('DOMContentLoaded', () => Capture.init());
