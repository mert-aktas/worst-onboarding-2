/**
 * Worst Onboarding Ever 2 — Level Logic
 * Five community-and-UG-feature-themed onboarding anti-patterns.
 * Each level injects its own DOM into #level-N, wires listeners, and calls
 * Game.completeLevel() on the win. data-valid-click marks every intentional
 * target; anything else counts as a rage click (see game.js).
 */

const Levels = {

  getInfo(num) {
    const info = {
      1: { name: 'The Banner Avalanche', tagline: 'Just let me see the app.' },
      2: { name: 'The Unskippable Academy', tagline: 'Sit down. The tutorial is not optional.',
           credit: 'Level idea: Denis Acia, via LinkedIn. Blame him.' },
      3: { name: 'The Checklist of Doom', tagline: 'Just three quick steps. Give or take.',
           credit: 'Inspired by a true story from Tomasz Drybala. Our condolences.' },
      4: { name: 'The NPS Ambush', tagline: 'Before you touch anything: how do you feel?' },
      5: { name: 'The Copilot From Hell', tagline: 'Your AI copilot is here. It insists on helping.' },
    };
    return info[num];
  },

  load(num) {
    const container = document.getElementById(`level-${num}`);
    container.classList.remove('hidden');
    const fn = this[`level${num}`];
    if (typeof fn === 'function') fn.call(this, container); // guarded: levels land incrementally
  },

  // Shared toast, reused by every level. Deadpan, auto-dismisses.
  woeToast(msg) {
    const t = document.createElement('div');
    t.className = 'woe-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('woe-toast-out'), 2200);
    setTimeout(() => { if (t.parentNode) t.remove(); }, 2700);
  },

  // ════════════════════════════════════════════════════════
  // LEVEL 1: The Banner Avalanche
  // Closing a banner spawns two more (cap 9). After 5 closes (or 30s) a special
  // banner offers notification preferences -> mute toggle -> exit. The stack
  // reshuffles every 4s on desktop. Escape hatch after 8 rage clicks or 45s.
  // ════════════════════════════════════════════════════════
  level1(container) {
    container.innerHTML = `
      <div class="l1-app">
        <header class="l1-appbar">
          <span class="l1-logo">ProductApp Two</span>
          <nav class="l1-appnav"><a>Home</a><a>Projects</a><a>Reports</a><a>Settings</a></nav>
        </header>
        <div class="l1-appbody">
          <h2>Good morning.</h2>
          <p>Here is everything happening in your workspace. Somewhere under all this.</p>
        </div>
      </div>
      <div class="l1-banners" id="l1-banners"></div>
      <div class="l1-prefs-panel hidden" id="l1-prefs-panel">
        <h3>Notification preferences</h3>
        <label class="l1-toggle-row">
          <input type="checkbox" id="l1-mute-toggle" data-valid-click>
          <span>Mute all announcements (finally)</span>
        </label>
      </div>
      <button class="l1-complete-btn hidden" id="l1-complete" data-valid-click>Continue to Level 2 →</button>
      <a class="l1-dismiss-ghost hidden" id="l1-dismiss-all" data-valid-click>dismiss all (not recommended)</a>
    `;

    const POOL = [
      '🎉 New: We moved the Settings menu! Again!',
      '⚡ v2.4.7 is 0.2% faster. You are welcome.',
      '📢 Webinar: How to close banners like a pro',
      '🚀 Introducing Banners for Banners',
      '🔔 You have 0 unread notifications. Click to read them.',
      '💡 Did you know? You can dismiss this banner.',
      '🎯 New feature: We put a banner on your banner.',
      '📈 Your productivity could be 400% higher without these.',
    ];
    const bannersEl = container.querySelector('#l1-banners');
    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    let spawned = 0;   // regular banners EVER spawned (mercy cap 9)
    let closed = 0;    // banners the player has closed
    let poolIdx = 0;
    let specialShown = false, escapeShown = false, done = false;
    const timers = [];

    function addBanner() {
      if (spawned >= 9) return;
      spawned++;
      const text = POOL[poolIdx % POOL.length]; poolIdx++;
      const b = document.createElement('div');
      b.className = 'l1-banner l1-banner-in';
      b.innerHTML = '<span class="l1-banner-text"></span><button class="l1-banner-close" data-valid-click aria-label="Dismiss">×</button>';
      b.querySelector('.l1-banner-text').textContent = text;
      bannersEl.appendChild(b);
    }

    function spawnSpecial() {
      if (specialShown || done) return;
      specialShown = true;
      const b = document.createElement('div');
      b.className = 'l1-banner l1-banner-special l1-banner-in';
      b.innerHTML = '<span class="l1-banner-text">Tired of announcements? Manage your <a id="l1-prefs-link" data-valid-click>notification preferences</a>.</span>';
      bannersEl.appendChild(b);
      b.querySelector('#l1-prefs-link').addEventListener('click', () => {
        container.querySelector('#l1-prefs-panel').classList.remove('hidden');
      });
    }

    function reshuffle() {
      if (done || isMobile) return;
      [...bannersEl.children].sort(() => Math.random() - 0.5).forEach(k => {
        k.style.transform = `translateY(${(Math.random() * 8 - 4).toFixed(1)}px)`;
        bannersEl.appendChild(k);
      });
    }

    function showEscape() {
      if (escapeShown || done) return;
      escapeShown = true;
      container.querySelector('#l1-dismiss-all').classList.remove('hidden');
    }

    function finish() {
      if (done) return;
      done = true;
      timers.forEach(t => { clearTimeout(t); clearInterval(t); });
      Game.completeLevel();
    }

    // Close a banner -> spawn 2 more (up to cap) + maybe reveal the special banner
    bannersEl.addEventListener('click', (e) => {
      if (!e.target.closest('.l1-banner-close')) return;
      const banner = e.target.closest('.l1-banner');
      if (banner) { banner.classList.add('l1-banner-out'); setTimeout(() => banner.remove(), 250); }
      closed++;
      addBanner(); addBanner();
      if (closed >= 5) spawnSpecial();
    });

    container.querySelector('#l1-mute-toggle').addEventListener('change', () => {
      bannersEl.querySelectorAll('.l1-banner').forEach(b => b.classList.add('l1-banner-out'));
      setTimeout(() => { bannersEl.innerHTML = ''; }, 300);
      container.querySelector('#l1-prefs-panel').classList.add('hidden');
      container.querySelector('#l1-complete').classList.remove('hidden');
    });

    container.querySelector('#l1-complete').addEventListener('click', finish);
    container.querySelector('#l1-dismiss-all').addEventListener('click', finish);

    addBanner(); addBanner(); addBanner(); // initial 3
    if (!isMobile) timers.push(setInterval(reshuffle, 4000));
    timers.push(setTimeout(spawnSpecial, 30000));
    timers.push(setTimeout(showEscape, 45000));
    timers.push(setInterval(() => { if (Game.levelRageClicks >= 8) showEscape(); }, 600));
  },
};
