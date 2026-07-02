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

  // ════════════════════════════════════════════════════════
  // LEVEL 2: The Unskippable Academy (credit: Denis Acia)
  // Forced autoplay "video": cycling captions, a progress bar that rewinds once
  // and stalls at 88% forever, controls that flee the cursor, a Skip button that
  // ADDS time. Exit after 3 skips (or 10s stalled): Mark as watched -> title card.
  // ════════════════════════════════════════════════════════
  level2(container) {
    container.innerHTML = `
      <div class="l2-player">
        <div class="l2-screen">
          <div class="l2-badge">Mandatory Onboarding Academy</div>
          <div class="l2-video-title">Video 1 of 12: "What Is A Button"</div>
          <div class="l2-caption" id="l2-caption">Welcome to ProductApp Two.</div>
          <div class="l2-buffer hidden" id="l2-buffer"><span class="l2-spinner"></span> Buffering...</div>
        </div>
        <div class="l2-controls">
          <div class="l2-ctrl-left" id="l2-ctrl-left">
            <button class="l2-ctrl" id="l2-mute" data-valid-click aria-label="Mute">🔇</button>
            <button class="l2-ctrl" id="l2-pause" data-valid-click aria-label="Pause">❚❚</button>
          </div>
          <div class="l2-progress"><div class="l2-progress-fill" id="l2-progress-fill"></div></div>
          <button class="l2-skip" id="l2-skip" data-valid-click>Skip intro</button>
        </div>
        <a class="l2-watch-later hidden" id="l2-watch-later" data-valid-click>Having trouble? Mark as watched</a>
      </div>
    `;

    const CAPTIONS = [
      'Welcome to ProductApp Two.',
      'This video cannot be paused. This is for your own good.',
      'A button is a thing you click.',
      'Please do not attempt to use the product yet.',
      'Muting is disabled during mandatory training.',
      'Almost there. Definitely almost there.',
    ];
    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    const captionEl = container.querySelector('#l2-caption');
    const fill = container.querySelector('#l2-progress-fill');
    let capIdx = 0, pct = 0, skips = 0, rewound = false, stalled = false, watchShown = false, done = false;
    const timers = [];

    function showWatchLater() {
      if (watchShown || done) return;
      watchShown = true;
      container.querySelector('#l2-watch-later').classList.remove('hidden');
    }
    function stall() {
      if (stalled) return;
      stalled = true;
      container.querySelector('#l2-buffer').classList.remove('hidden');
      timers.push(setTimeout(showWatchLater, 10000)); // 10s stalled -> mercy exit
    }
    function finish() {
      if (done) return;
      done = true;
      timers.forEach(t => { clearTimeout(t); clearInterval(t); });
      Game.completeLevel();
    }

    timers.push(setInterval(() => {
      capIdx = (capIdx + 1) % CAPTIONS.length;
      captionEl.textContent = CAPTIONS[capIdx];
    }, 3000));

    timers.push(setInterval(() => {
      if (stalled || done) return;
      pct += 4;
      if (!rewound && pct >= 40) { rewound = true; pct -= 5; Levels.woeToast('Buffering... re-watching required section'); }
      if (pct >= 88) { pct = 88; stall(); }
      fill.style.width = pct + '%';
    }, 1000));

    const swap = () => { if (isMobile) return; const l = container.querySelector('#l2-ctrl-left'); l.appendChild(l.firstElementChild); };
    container.querySelector('#l2-mute').addEventListener('mouseenter', swap);
    container.querySelector('#l2-pause').addEventListener('mouseenter', swap);
    container.querySelector('#l2-mute').addEventListener('click', () => Levels.woeToast('Muting is disabled during mandatory training'));
    container.querySelector('#l2-pause').addEventListener('click', () => Levels.woeToast('Pausing is a premium feature'));

    container.querySelector('#l2-skip').addEventListener('click', () => {
      skips++;
      container.querySelector('#l2-skip').textContent = `Skip intro (+${skips * 10}s added)`;
      Levels.woeToast('Skipping detected. Penalty applied.');
      if (skips >= 3) showWatchLater();
    });

    container.querySelector('#l2-watch-later').addEventListener('click', () => {
      container.querySelector('.l2-player').innerHTML = `
        <div class="l2-done">
          <div class="l2-done-emoji">🎓</div>
          <h2>Video marked as watched. You learned nothing.</h2>
          <button class="l2-complete-btn" id="l2-complete" data-valid-click>Continue →</button>
        </div>
      `;
      container.querySelector('#l2-complete').addEventListener('click', finish);
    });
  },
};
