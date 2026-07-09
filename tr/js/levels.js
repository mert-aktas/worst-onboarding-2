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
      1: { name: "Banner Çığı", tagline: "Uygulamayı bir göreyim yeter." },
      2: { name: "Atlanamaz Akademi", tagline: "Otur yerine. Eğitim videosu opsiyonel değil.",
           credit: "Seviye fikri: Denis Acia. Bu acıyı bizzat yaşadı.",
           creditName: "Denis Acia", creditUrl: "https://www.linkedin.com/in/denis-acia/" },
      3: { name: "Kıyamet Checklist'i", tagline: "Sadece üç hızlı adım. Aşağı yukarı.",
           credit: "Tomasz Drybala'nın atlattığı gerçek bir olay.",
           creditName: "Tomasz Drybala", creditUrl: "https://www.linkedin.com/in/tomasz-drybala-a45049176/" },
      4: { name: "NPS Pususu", tagline: "Daha hiçbir şeye dokunamadan: kendini nasıl hissediyorsun?" },
      5: { name: "Cehennemden Gelen Copilot", tagline: "AI copilot'un geldi. Yardım etmekte ısrarcı." },
    };
    return info[num];
  },

  load(num) {
    const container = document.getElementById(`level-${num}`);
    container.classList.remove('hidden');
    const fn = this[`level${num}`];
    if (typeof fn === 'function') fn.call(this, container); // guarded: levels land incrementally
    this.addCreditBadge(num, container);
  },

  // Topluluğun önerdiği seviyeler için kalıcı teşekkür rozeti (L2 Denis, L3 Tomasz).
  // Seviye container'ının içinde durur; game.js bir sonraki geçişte otomatik siler.
  // data-valid-click, LinkedIn tıklamasının rage click sayılmamasını sağlar.
  addCreditBadge(num, container) {
    const info = this.getInfo(num);
    if (!container || !info || !info.creditUrl) return;
    const badge = document.createElement('a');
    badge.className = 'woe-credit-badge';
    badge.href = info.creditUrl;
    badge.target = '_blank';
    badge.rel = 'noopener';
    badge.setAttribute('data-valid-click', '');
    badge.setAttribute('aria-label', `Seviye fikri: ${info.creditName} — LinkedIn'i yeni sekmede açar`);
    const prefix = document.createElement('span');
    prefix.textContent = '💡 Seviye fikri: ';
    const name = document.createElement('strong');
    name.textContent = info.creditName;
    const arrow = document.createElement('span');
    arrow.className = 'woe-credit-arrow';
    arrow.textContent = '↗';
    badge.append(prefix, name, arrow);
    container.appendChild(badge);
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
          <span class="l1-logo">ÜrünApp 2</span>
          <nav class="l1-appnav"><a>Ana Sayfa</a><a>Projeler</a><a>Raporlar</a><a>Ayarlar</a></nav>
        </header>
        <div class="l1-appbody">
          <h2>Günaydın.</h2>
          <p>Çalışma alanında olan biten her şey burada. Bunların altında bir yerde.</p>
        </div>
      </div>
      <div class="l1-banners" id="l1-banners"></div>
      <div class="l1-prefs-panel hidden" id="l1-prefs-panel">
        <h3>Bildirim tercihleri</h3>
        <label class="l1-toggle-row">
          <input type="checkbox" id="l1-mute-toggle" data-valid-click>
          <span>Tüm duyuruları sustur (nihayet)</span>
        </label>
      </div>
      <button class="l1-complete-btn hidden" id="l1-complete" data-valid-click>Seviye 2'ye Geç →</button>
      <a class="l1-dismiss-ghost hidden" id="l1-dismiss-all" data-valid-click>hepsini kapat (önerilmez)</a>
    `;

    const POOL = [
      "🎉 Yeni: Ayarlar menüsünün yerini değiştirdik! Yine!",
      "⚡ v2.4.7 %0,2 daha hızlı. Rica ederiz.",
      "📢 Webinar: Profesyonel gibi banner kapatma teknikleri",
      "🚀 Karşınızda: Banner'lar için Banner'lar",
      "🔔 0 okunmamış bildirimin var. Okumak için tıkla.",
      "💡 Biliyor muydun? Bu banner'ı kapatabilirsin.",
      "🎯 Yeni özellik: Banner'ının üstüne banner koyduk.",
      "📈 Bunlar olmasa verimliliğin %400 daha yüksek olabilirdi.",
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
      b.innerHTML = '<span class="l1-banner-text"></span><button class="l1-banner-close" data-valid-click aria-label="Kapat">×</button>';
      b.querySelector('.l1-banner-text').textContent = text;
      bannersEl.appendChild(b);
    }

    function spawnSpecial() {
      if (specialShown || done) return;
      specialShown = true;
      const b = document.createElement('div');
      b.className = 'l1-banner l1-banner-special l1-banner-in';
      b.innerHTML = `<span class="l1-banner-text">Duyurulardan yoruldun mu? <a id="l1-prefs-link" data-valid-click>Bildirim tercihlerini</a> yönet.</span>`;
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
          <div class="l2-badge">Zorunlu Onboarding Akademisi</div>
          <div class="l2-video-title">Video 1/12: "Buton Nedir?"</div>
          <div class="l2-caption" id="l2-caption">ÜrünApp 2'ye hoş geldin.</div>
          <div class="l2-buffer hidden" id="l2-buffer"><span class="l2-spinner"></span> Arabelleğe alınıyor...</div>
        </div>
        <div class="l2-controls">
          <div class="l2-ctrl-left" id="l2-ctrl-left">
            <button class="l2-ctrl" id="l2-mute" data-valid-click aria-label="Mute">🔇</button>
            <button class="l2-ctrl" id="l2-pause" data-valid-click aria-label="Pause">❚❚</button>
          </div>
          <div class="l2-progress"><div class="l2-progress-fill" id="l2-progress-fill"></div></div>
          <button class="l2-skip" id="l2-skip" data-valid-click>İntroyu atla</button>
        </div>
        <a class="l2-watch-later hidden" id="l2-watch-later" data-valid-click>Sorun mu yaşıyorsun? İzlendi olarak işaretle</a>
      </div>
    `;

    const CAPTIONS = [
      "ÜrünApp 2'ye hoş geldin.",
      "Bu video duraklatılamaz. Kendi iyiliğin için.",
      "Buton, tıkladığın şeydir.",
      "Lütfen henüz ürünü kullanmaya çalışma.",
      "Zorunlu eğitim sırasında ses kapatma devre dışıdır.",
      "Az kaldı. Kesinlikle az kaldı.",
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
      if (!rewound && pct >= 40) { rewound = true; pct -= 5; Levels.woeToast("Arabelleğe alınıyor... zorunlu bölüm yeniden izleniyor"); }
      if (pct >= 88) { pct = 88; stall(); }
      fill.style.width = pct + '%';
    }, 1000));

    const swap = () => { if (isMobile) return; const l = container.querySelector('#l2-ctrl-left'); l.appendChild(l.firstElementChild); };
    container.querySelector('#l2-mute').addEventListener('mouseenter', swap);
    container.querySelector('#l2-pause').addEventListener('mouseenter', swap);
    container.querySelector('#l2-mute').addEventListener('click', () => Levels.woeToast("Zorunlu eğitim sırasında ses kapatma devre dışıdır"));
    container.querySelector('#l2-pause').addEventListener('click', () => Levels.woeToast("Duraklatma premium bir özelliktir"));

    container.querySelector('#l2-skip').addEventListener('click', () => {
      skips++;
      container.querySelector('#l2-skip').textContent = `İntroyu atla (+${skips * 10}sn eklendi)`;
      Levels.woeToast("Atlama tespit edildi. Ceza uygulandı.");
      if (skips >= 3) showWatchLater();
    });

    container.querySelector('#l2-watch-later').addEventListener('click', () => {
      container.querySelector('.l2-player').innerHTML = `
        <div class="l2-done">
          <div class="l2-done-emoji">🎓</div>
          <h2>Video izlendi olarak işaretlendi. Hiçbir şey öğrenmedin.</h2>
          <button class="l2-complete-btn" id="l2-complete" data-valid-click>Devam →</button>
        </div>
      `;
      container.querySelector('#l2-complete').addEventListener('click', finish);
    });
  },

  // ════════════════════════════════════════════════════════
  // LEVEL 3: The Checklist of Doom (credit: Tomasz Drybala)
  // Checking an item adds two more (cap 9); the denominator never resolves.
  // A 20s "Session" ring wipes all progress on idle (max 2 resets, then it gives
  // up and a skip link appears). Exit via the ... menu or that skip link. 20s is
  // deliberate: an ACTIVE player never triggers it — it only punishes hesitating.
  // ════════════════════════════════════════════════════════
  level3(container) {
    container.innerHTML = `
      <div class="l3-screen">
        <header class="l3-appbar"><span class="l3-logo">ÜrünApp 2</span></header>
        <div class="l3-widget">
          <div class="l3-widget-head">
            <div class="l3-widget-title">
              <h3>3 hızlı adımda hazır ol!</h3>
              <p class="l3-progress" id="l3-progress">0 / 3</p>
            </div>
            <div class="l3-head-right">
              <div class="l3-ring-wrap" id="l3-ring-wrap" title="Session timeout">
                <span class="l3-ring-label">Oturum</span>
                <span class="l3-ring" id="l3-ring">20</span>
              </div>
              <button class="l3-menu-btn" id="l3-menu" data-valid-click aria-label="Diğer seçenekler">⋯</button>
              <div class="l3-menu-pop hidden" id="l3-menu-pop">
                <button id="l3-dismiss" data-valid-click>Bu listeyi sonsuza dek kapat</button>
              </div>
            </div>
          </div>
          <ul class="l3-list" id="l3-list"></ul>
        </div>
        <a class="l3-skip-setup hidden" id="l3-skip-setup" data-valid-click>Kurulumu atla (ne yaptığımı biliyorum)</a>
      </div>
    `;

    const INITIAL = ["İlk projeni oluştur", "Paneli keşfet", "ÜrünBot'a merhaba de"];
    const POOL = ["Ekibini davet et (en az 25 kişi)", "SSO'yu yapılandır", "CSM'inle başlangıç toplantısı ayarla",
      "Onboarding videosunu bir daha izle", "Ödeme yöntemi ekle (ne olur ne olmaz)", "Uyum eğitimini tamamla"];
    const listEl = container.querySelector('#l3-list');
    const ringEl = container.querySelector('#l3-ring');
    let poolIdx = 0, checked = 0, sessionTime = 20, resetCount = 0, ringActive = true, done = false;
    const timers = [];

    function updateProgress() {
      const den = checked <= 3 ? 3 : checked - 1; // "4 of 3", "6 of 5" — never resolves
      container.querySelector('#l3-progress').textContent = `${checked} / ${den}`;
    }
    function addItemEl(text, isNew) {
      const li = document.createElement('li');
      li.className = 'l3-check-item' + (isNew ? ' l3-item-in' : '');
      li.setAttribute('data-valid-click', '');
      li.innerHTML = '<span class="l3-check-box"></span><span class="l3-check-label"></span>';
      li.querySelector('.l3-check-label').textContent = text;
      listEl.appendChild(li);
    }
    function rebuild() {
      listEl.innerHTML = '';
      INITIAL.forEach(t => addItemEl(t, false));
      poolIdx = 0; checked = 0; updateProgress();
    }

    const resetSession = () => { if (ringActive && !done) sessionTime = 20; };
    function doReset() {
      resetCount++;
      Levels.woeToast("👋 Tekrar hoş geldin! Biraz uzaklaşmışsın gibi görünüyor, biz de ilerlemeni sıfırladık. Rica ederiz.");
      try { track('l3_idle_reset', { reset_count: resetCount }); } catch (e) {}
      rebuild();
      sessionTime = 20;
      if (resetCount === 1) {
        const m = container.querySelector('#l3-menu');
        m.classList.add('l3-pulse');
        setTimeout(() => m.classList.remove('l3-pulse'), 2000);
      }
      if (resetCount >= 2) { // mercy cap: stop the ring, reveal the skip link
        ringActive = false;
        container.querySelector('#l3-ring-wrap').classList.add('hidden');
        container.querySelector('#l3-skip-setup').classList.remove('hidden');
      }
    }
    function finish() {
      if (done) return;
      done = true;
      document.removeEventListener('pointerdown', resetSession);
      document.removeEventListener('keydown', resetSession);
      timers.forEach(t => clearInterval(t));
      Game.completeLevel();
    }

    listEl.addEventListener('click', (e) => {
      const li = e.target.closest('.l3-check-item');
      if (!li || li.classList.contains('l3-checked')) return;
      li.classList.add('l3-checked');
      li.querySelector('.l3-check-box').textContent = '✓';
      checked++; updateProgress();
      for (let k = 0; k < 2 && listEl.children.length < 9 && poolIdx < POOL.length; k++) addItemEl(POOL[poolIdx++], true);
    });
    container.querySelector('#l3-menu').addEventListener('click', () => {
      container.querySelector('#l3-menu-pop').classList.toggle('hidden');
    });
    container.querySelector('#l3-dismiss').addEventListener('click', finish);
    container.querySelector('#l3-skip-setup').addEventListener('click', finish);

    document.addEventListener('pointerdown', resetSession);
    document.addEventListener('keydown', resetSession);
    timers.push(setInterval(() => {
      if (!ringActive || done) return;
      sessionTime--;
      ringEl.textContent = Math.max(0, sessionTime);
      if (sessionTime <= 0) doReset();
    }, 1000));

    rebuild(); // initial 3 items
  },

  // ════════════════════════════════════════════════════════
  // LEVEL 4: The NPS Ambush
  // A real form you want to use — hijacked on the first keystroke by an NPS modal
  // (shuffling 0-10 buttons, a 140-char "why" with a backwards counter and blocked
  // paste). Dismiss it and it returns every 5s with escalating guilt. The 3rd
  // return (and the Survey 2 of 7 state) offer "remind me never" -> the form works.
  // ════════════════════════════════════════════════════════
  level4(container) {
    container.innerHTML = `
      <div class="l4-app">
        <header class="l4-appbar"><span class="l4-logo">ÜrünApp 2</span></header>
        <div class="l4-form-area">
          <h2>İlk projene bir isim ver</h2>
          <p class="l4-form-sub">Sonunda girdin. Hadi bir şeyler inşa edelim.</p>
          <input type="text" id="l4-project-name" class="l4-input" placeholder="örn. Q3 Lansmanı" data-valid-click autocomplete="off">
          <button class="l4-create-btn" id="l4-create" data-valid-click>Oluştur</button>
        </div>
        <div class="l4-modal-overlay hidden" id="l4-overlay">
          <div class="l4-modal">
            <button class="l4-modal-close" data-valid-click aria-label="Kapat">×</button>
            <div class="l4-modal-body" id="l4-modal-body"></div>
            <a class="l4-never hidden" id="l4-never" data-valid-click>bana asla hatırlatma</a>
          </div>
        </div>
      </div>
    `;

    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    const ESCALATION = [
      "Duygularını paylaşmayı yarıda bıraktığını fark ettik 😢",
      "Geri bildirimin kelimenin tam anlamıyla sunucularımızı ayakta tutuyor.",
      "Bu son soruşumuz. (Değil.)",
    ];
    const QUESTION = "Hızlı bir soru! ÜrünApp 2'yi bir arkadaşına veya iş arkadaşına tavsiye etme olasılığın nedir?";
    const overlay = container.querySelector('#l4-overlay');
    const body = container.querySelector('#l4-modal-body');
    const neverLink = container.querySelector('#l4-never');
    let ambushTriggered = false, dismissCount = 0, modalDead = false, done = false;
    const timers = [];

    const show = () => overlay.classList.remove('hidden');
    const hide = () => overlay.classList.add('hidden');
    const revealNever = () => neverLink.classList.remove('hidden');

    function shuffleNps(nps) { [...nps.children].sort(() => Math.random() - 0.5).forEach(c => nps.appendChild(c)); }
    function renderScore(header) {
      body.innerHTML = '<h3 class="l4-modal-title"></h3><div class="l4-nps" id="l4-nps"></div>';
      body.querySelector('.l4-modal-title').textContent = header;
      const nps = body.querySelector('#l4-nps');
      for (let n = 0; n <= 10; n++) {
        const b = document.createElement('button');
        b.className = 'l4-nps-btn'; b.setAttribute('data-valid-click', ''); b.textContent = n;
        b.addEventListener('mouseenter', () => { if (!isMobile) shuffleNps(nps); });
        b.addEventListener('click', renderWhy);
        nps.appendChild(b);
      }
    }
    function renderWhy() {
      body.innerHTML = `
        <h3 class="l4-modal-title">Nedenini anlat (zorunlu, en az 140 karakter)</h3>
        <textarea class="l4-why" id="l4-why" placeholder="Dürüst ol. Detaylı ol. Kapana kısıl."></textarea>
        <div class="l4-why-foot"><span class="l4-counter" id="l4-counter">140</span>
          <button class="l4-why-submit" id="l4-why-submit" data-valid-click disabled>Gönder</button></div>
      `;
      const ta = body.querySelector('#l4-why');
      const counter = body.querySelector('#l4-counter');
      const submit = body.querySelector('#l4-why-submit');
      ta.addEventListener('paste', (e) => { e.preventDefault(); Levels.woeToast("Duygularını kopyala-yapıştır yapamazsın."); });
      ta.addEventListener('input', () => {
        counter.textContent = Math.max(0, 140 - ta.value.length); // starts at 140, counts down
        submit.disabled = ta.value.length < 140;
      });
      submit.addEventListener('click', () => { if (ta.value.length >= 140) renderSurvey2(); });
    }
    function renderSurvey2() {
      body.innerHTML = '<h3 class="l4-modal-title">Teşekkürler! Anket 2/7 birazdan başlıyor.</h3>' +
        '<div class="l4-loading"><span class="l2-spinner"></span> Anket 2/7 yükleniyor...</div>';
      revealNever(); // even compliance offers the out
    }
    function returnModal() {
      if (modalDead || done) return;
      renderScore(ESCALATION[Math.min(dismissCount - 1, ESCALATION.length - 1)]);
      if (dismissCount >= 3) revealNever();
      show();
    }
    function finish() {
      if (done) return;
      done = true;
      timers.forEach(t => clearTimeout(t));
      Game.completeLevel();
    }

    container.querySelector('#l4-project-name').addEventListener('input', () => {
      if (ambushTriggered || modalDead) return;
      ambushTriggered = true; renderScore(QUESTION); show();
    });
    container.querySelector('.l4-modal-close').addEventListener('click', () => {
      hide(); dismissCount++; timers.push(setTimeout(returnModal, 5000));
    });
    neverLink.addEventListener('click', () => {
      modalDead = true; hide(); timers.forEach(t => clearTimeout(t));
    });
    container.querySelector('#l4-create').addEventListener('click', () => {
      if (modalDead) { finish(); return; }
      if (!ambushTriggered) ambushTriggered = true;
      renderScore(QUESTION); show();
    });
  },

  // ════════════════════════════════════════════════════════
  // LEVEL 5: The Copilot From Hell (finale)
  // A fake cursor "helpfully" spawns callbacks to L1-L4 (banner, PiP video,
  // checklist, NPS), each dismissible in one click (cap 4). Astra answers every
  // message with a canned non-answer. After 2 dismissals, quick-reply chips
  // appear; "Just let me use the app" (or a message with "myself"/"let me") makes
  // Astra sulk and reveal "Disable copilot". Escape: 60s or 12 rage clicks.
  // ════════════════════════════════════════════════════════
  level5(container) {
    container.innerHTML = `
      <div class="l5-dash">
        <header class="l5-appbar"><span class="l5-logo">ÜrünApp 2</span><span class="l5-dash-sub">Panel</span></header>
        <div class="l5-dash-body">
          <div class="l5-card"><h4>Aktif Projeler</h4><p>3</p></div>
          <div class="l5-card"><h4>Biten Görevler</h4><p>12</p></div>
          <div class="l5-card"><h4>Ekip Üyeleri</h4><p>5</p></div>
        </div>
        <div class="l5-artifacts" id="l5-artifacts"></div>
        <div class="l5-cursor" id="l5-cursor"><span class="l5-cursor-tag">Astra</span></div>
        <div class="l5-chat" id="l5-chat">
          <div class="l5-chat-head">
            <span class="l5-chat-title">✨ Astra — onboarding copilot'un</span>
            <button class="l5-disable hidden" id="l5-disable" data-valid-click>Copilot'u devre dışı bırak</button>
          </div>
          <div class="l5-chat-log" id="l5-chat-log">
            <div class="l5-msg l5-msg-bot">Selam, ben Astra. Onboarding'inde sana yardım edeceğim. İstesen de istemesen de.</div>
          </div>
          <div class="l5-chips hidden" id="l5-chips">
            <button class="l5-chip" data-valid-click id="l5-chip-around">Etrafı gezdir</button>
            <button class="l5-chip" data-valid-click id="l5-chip-features">Daha fazla özellik aç</button>
            <button class="l5-chip" data-valid-click id="l5-chip-stop">Bırak da uygulamayı kullanayım</button>
          </div>
          <form class="l5-chat-input" id="l5-chat-form">
            <input type="text" id="l5-chat-text" placeholder="Astra'ya bir şey sor..." data-valid-click autocomplete="off">
            <button type="submit" class="l5-send" data-valid-click>Gönder</button>
          </form>
        </div>
      </div>
    `;

    const ARTIFACTS = [
      { cls: 'l5-art-banner', label: "🎉 Ürünü kullandığını fark ettik. Lütfen bekle." },
      { cls: 'l5-art-video', label: `▶ Video 2/12: "İmleç Nedir?"` },
      { cls: 'l5-art-checklist', label: "☑ 3 hızlı adımda hazır ol! (yine)" },
      { cls: 'l5-art-modal', label: "★ Hızlı bir soru! Onboarding'in nasıl gidiyor?" },
    ];
    const CANNED = [
      "Harika soru! Al sana Q3 yol haritamız hakkında bir makale.",
      "Senin adına bir demo planladım. Rica ederim.",
      "Sinirlenmiş gibisin. Webinarımızı denedin mi?",
      "Bunu anlamadım ama yine de bildirimleri açtım.",
    ];
    const artEl = container.querySelector('#l5-artifacts');
    const cursor = container.querySelector('#l5-cursor');
    const log = container.querySelector('#l5-chat-log');
    let spawned = 0, dismissed = 0, cannedIdx = 0, chipsShown = false, disableShown = false, done = false;
    const timers = [];

    function addMsg(text, who) {
      const m = document.createElement('div');
      m.className = 'l5-msg ' + (who === 'user' ? 'l5-msg-user' : 'l5-msg-bot');
      m.textContent = text;
      log.appendChild(m); log.scrollTop = log.scrollHeight;
    }
    function spawnArtifact() {
      if (spawned >= 4 || done) return;
      const a = ARTIFACTS[spawned]; spawned++;
      const el = document.createElement('div');
      el.className = 'l5-artifact ' + a.cls;
      el.style.left = (Math.random() * 40 + 8) + '%';
      el.style.top = (Math.random() * 42 + 12) + '%';
      el.innerHTML = '<span class="l5-art-text"></span><button class="l5-artifact-close" data-valid-click aria-label="Kapat">×</button>';
      el.querySelector('.l5-art-text').textContent = a.label;
      artEl.appendChild(el);
    }
    function moveCursor() {
      if (done) return;
      cursor.style.left = (Math.random() * 78 + 8) + '%';
      cursor.style.top = (Math.random() * 66 + 10) + '%';
    }
    function showChips() { if (chipsShown || done) return; chipsShown = true; container.querySelector('#l5-chips').classList.remove('hidden'); }
    function showDisable() { if (disableShown || done) return; disableShown = true; container.querySelector('#l5-disable').classList.remove('hidden'); }
    function sulk() { addMsg("İyi. İnsanlar işte. 🙄 Yardım modu kapatılıyor.", 'bot'); showDisable(); }
    function finish() { if (done) return; done = true; timers.forEach(t => { clearTimeout(t); clearInterval(t); }); Game.completeLevel(); }

    artEl.addEventListener('click', (e) => {
      if (!e.target.closest('.l5-artifact-close')) return;
      const art = e.target.closest('.l5-artifact'); if (art) art.remove();
      dismissed++;
      if (dismissed >= 2) showChips();
    });
    container.querySelector('#l5-chip-around').addEventListener('click', () => { addMsg("Etrafı gezdirmek demek, kapatman gereken daha çok şey göstermek demek.", 'bot'); spawnArtifact(); });
    container.querySelector('#l5-chip-features').addEventListener('click', () => { addMsg("İstemediğin özellikleri açıyorum. Rica ederim.", 'bot'); spawnArtifact(); });
    container.querySelector('#l5-chip-stop').addEventListener('click', sulk);
    container.querySelector('#l5-chat-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = container.querySelector('#l5-chat-text');
      const val = input.value.trim(); if (!val) return;
      addMsg(val, 'user'); input.value = '';
      if (/kendim|b[ıi]rak|rahat|kullanay[ıi]m|kar[ıi]şma/i.test(val)) { sulk(); return; }
      addMsg(CANNED[cannedIdx % CANNED.length], 'bot'); cannedIdx++;
    });
    container.querySelector('#l5-disable').addEventListener('click', finish);

    moveCursor();
    timers.push(setTimeout(() => { moveCursor(); spawnArtifact(); }, 1500));
    timers.push(setInterval(() => { moveCursor(); spawnArtifact(); }, 4000));
    timers.push(setTimeout(showDisable, 60000)); // escape hatch: 60s
    timers.push(setInterval(() => { if (Game.levelRageClicks >= 12) showDisable(); }, 800)); // escape hatch: 12 rage clicks
  },
};
