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
      1: { name: "A Avalanche de Banners", tagline: "Só quero ver o app." },
      2: { name: "A Academia Obrigatória", tagline: "Senta. O tutorial não é opcional.",
           credit: "Ideia do nível: Denis Acia, via LinkedIn. A culpa é dele." },
      3: { name: "O Checklist da Perdição", tagline: "Só três passos rápidos. Mais ou menos.",
           credit: "Inspirado em uma história real de Tomasz Drybala. Nossos pêsames." },
      4: { name: "A Emboscada do NPS", tagline: "Antes de tocar em qualquer coisa: como você se sente?" },
      5: { name: "O Copilot do Inferno", tagline: "Seu copiloto de IA chegou. Ele insiste em ajudar." },
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
          <span class="l1-logo">ProductApp 2</span>
          <nav class="l1-appnav"><a>Início</a><a>Projetos</a><a>Relatórios</a><a>Configurações</a></nav>
        </header>
        <div class="l1-appbody">
          <h2>Bom dia.</h2>
          <p>Tudo o que está acontecendo no seu workspace está aqui. Em algum lugar embaixo disso tudo.</p>
        </div>
      </div>
      <div class="l1-banners" id="l1-banners"></div>
      <div class="l1-prefs-panel hidden" id="l1-prefs-panel">
        <h3>Preferências de notificação</h3>
        <label class="l1-toggle-row">
          <input type="checkbox" id="l1-mute-toggle" data-valid-click>
          <span>Silenciar todos os anúncios (finalmente)</span>
        </label>
      </div>
      <button class="l1-complete-btn hidden" id="l1-complete" data-valid-click>Continuar para o Nível 2 →</button>
      <a class="l1-dismiss-ghost hidden" id="l1-dismiss-all" data-valid-click>dispensar tudo (não recomendado)</a>
    `;

    const POOL = [
      "🎉 Novidade: mudamos o menu de Configurações de lugar! De novo!",
      "⚡ A v2.4.7 está 0,2% mais rápida. De nada.",
      "📢 Webinar: como fechar banners como um profissional",
      "🚀 Apresentando: Banners para Banners",
      "🔔 Você tem 0 notificações não lidas. Clique para ler.",
      "💡 Você sabia? Você pode dispensar este banner.",
      "🎯 Novo recurso: colocamos um banner no seu banner.",
      "📈 Sua produtividade poderia ser 400% maior sem isso tudo.",
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
      b.innerHTML = '<span class="l1-banner-text"></span><button class="l1-banner-close" data-valid-click aria-label="Dispensar">×</button>';
      b.querySelector('.l1-banner-text').textContent = text;
      bannersEl.appendChild(b);
    }

    function spawnSpecial() {
      if (specialShown || done) return;
      specialShown = true;
      const b = document.createElement('div');
      b.className = 'l1-banner l1-banner-special l1-banner-in';
      b.innerHTML = `<span class="l1-banner-text">Cansado dos anúncios? Gerencie suas <a id="l1-prefs-link" data-valid-click>preferências de notificação</a>.</span>`;
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
          <div class="l2-badge">Academia de Onboarding Obrigatória</div>
          <div class="l2-video-title">Vídeo 1 de 12: "O Que É Um Botão"</div>
          <div class="l2-caption" id="l2-caption">Bem-vindo ao ProductApp 2.</div>
          <div class="l2-buffer hidden" id="l2-buffer"><span class="l2-spinner"></span> Fazendo buffer...</div>
        </div>
        <div class="l2-controls">
          <div class="l2-ctrl-left" id="l2-ctrl-left">
            <button class="l2-ctrl" id="l2-mute" data-valid-click aria-label="Mute">🔇</button>
            <button class="l2-ctrl" id="l2-pause" data-valid-click aria-label="Pause">❚❚</button>
          </div>
          <div class="l2-progress"><div class="l2-progress-fill" id="l2-progress-fill"></div></div>
          <button class="l2-skip" id="l2-skip" data-valid-click>Pular intro</button>
        </div>
        <a class="l2-watch-later hidden" id="l2-watch-later" data-valid-click>Problemas? Marcar como assistido</a>
      </div>
    `;

    const CAPTIONS = [
      "Bem-vindo ao ProductApp 2.",
      "Este vídeo não pode ser pausado. É para o seu próprio bem.",
      "Um botão é uma coisa que você clica.",
      "Por favor, não tente usar o produto ainda.",
      "O mudo fica desativado durante o treinamento obrigatório.",
      "Quase lá. Definitivamente quase lá.",
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
      if (!rewound && pct >= 40) { rewound = true; pct -= 5; Levels.woeToast("Fazendo buffer... reassistindo a parte obrigatória"); }
      if (pct >= 88) { pct = 88; stall(); }
      fill.style.width = pct + '%';
    }, 1000));

    const swap = () => { if (isMobile) return; const l = container.querySelector('#l2-ctrl-left'); l.appendChild(l.firstElementChild); };
    container.querySelector('#l2-mute').addEventListener('mouseenter', swap);
    container.querySelector('#l2-pause').addEventListener('mouseenter', swap);
    container.querySelector('#l2-mute').addEventListener('click', () => Levels.woeToast("O mudo fica desativado durante o treinamento obrigatório"));
    container.querySelector('#l2-pause').addEventListener('click', () => Levels.woeToast("Pausar é um recurso premium"));

    container.querySelector('#l2-skip').addEventListener('click', () => {
      skips++;
      container.querySelector('#l2-skip').textContent = `Pular intro (+${skips * 10}s adicionados)`;
      Levels.woeToast("Tentativa de pular detectada. Penalidade aplicada.");
      if (skips >= 3) showWatchLater();
    });

    container.querySelector('#l2-watch-later').addEventListener('click', () => {
      container.querySelector('.l2-player').innerHTML = `
        <div class="l2-done">
          <div class="l2-done-emoji">🎓</div>
          <h2>Vídeo marcado como assistido. Você não aprendeu nada.</h2>
          <button class="l2-complete-btn" id="l2-complete" data-valid-click>Continuar →</button>
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
        <header class="l3-appbar"><span class="l3-logo">ProductApp 2</span></header>
        <div class="l3-widget">
          <div class="l3-widget-head">
            <div class="l3-widget-title">
              <h3>Prepare-se em 3 passos rápidos!</h3>
              <p class="l3-progress" id="l3-progress">0 de 3</p>
            </div>
            <div class="l3-head-right">
              <div class="l3-ring-wrap" id="l3-ring-wrap" title="Session timeout">
                <span class="l3-ring-label">Sessão</span>
                <span class="l3-ring" id="l3-ring">20</span>
              </div>
              <button class="l3-menu-btn" id="l3-menu" data-valid-click aria-label="Mais opções">⋯</button>
              <div class="l3-menu-pop hidden" id="l3-menu-pop">
                <button id="l3-dismiss" data-valid-click>Dispensar checklist para sempre</button>
              </div>
            </div>
          </div>
          <ul class="l3-list" id="l3-list"></ul>
        </div>
        <a class="l3-skip-setup hidden" id="l3-skip-setup" data-valid-click>Pular configuração (eu sei o que estou fazendo)</a>
      </div>
    `;

    const INITIAL = ["Crie seu primeiro projeto", "Explore o dashboard", "Diga oi para o ProductBot"];
    const POOL = ["Convide seu time (mínimo de 25 assentos)", "Configure o SSO", "Agende o kickoff com seu CSM",
      "Assista ao vídeo de onboarding de novo", "Adicione um método de pagamento (só por garantia)", "Complete seu treinamento de compliance"];
    const listEl = container.querySelector('#l3-list');
    const ringEl = container.querySelector('#l3-ring');
    let poolIdx = 0, checked = 0, sessionTime = 20, resetCount = 0, ringActive = true, done = false;
    const timers = [];

    function updateProgress() {
      const den = checked <= 3 ? 3 : checked - 1; // "4 of 3", "6 of 5" — never resolves
      container.querySelector('#l3-progress').textContent = `${checked} de ${den}`;
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
      Levels.woeToast("👋 Bem-vindo de volta! Parece que você se afastou, então resetamos seu progresso. De nada.");
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
        <header class="l4-appbar"><span class="l4-logo">ProductApp 2</span></header>
        <div class="l4-form-area">
          <h2>Dê um nome ao seu primeiro projeto</h2>
          <p class="l4-form-sub">Você finalmente entrou. Vamos construir algo.</p>
          <input type="text" id="l4-project-name" class="l4-input" placeholder="ex.: Lançamento Q3" data-valid-click autocomplete="off">
          <button class="l4-create-btn" id="l4-create" data-valid-click>Criar</button>
        </div>
        <div class="l4-modal-overlay hidden" id="l4-overlay">
          <div class="l4-modal">
            <button class="l4-modal-close" data-valid-click aria-label="Fechar">×</button>
            <div class="l4-modal-body" id="l4-modal-body"></div>
            <a class="l4-never hidden" id="l4-never" data-valid-click>me lembre nunca</a>
          </div>
        </div>
      </div>
    `;

    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    const ESCALATION = [
      "Percebemos que você não terminou de compartilhar seus sentimentos 😢",
      "Seu feedback literalmente mantém nossos servidores no ar.",
      "Esta é a última vez que perguntamos. (Não é.)",
    ];
    const QUESTION = "Pergunta rápida! Qual a probabilidade de você recomendar o ProductApp 2 para um amigo ou colega?";
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
        <h3 class="l4-modal-title">Conte por quê (obrigatório, mínimo de 140 caracteres)</h3>
        <textarea class="l4-why" id="l4-why" placeholder="Seja honesto. Seja detalhado. Seja refém."></textarea>
        <div class="l4-why-foot"><span class="l4-counter" id="l4-counter">140</span>
          <button class="l4-why-submit" id="l4-why-submit" data-valid-click disabled>Enviar</button></div>
      `;
      const ta = body.querySelector('#l4-why');
      const counter = body.querySelector('#l4-counter');
      const submit = body.querySelector('#l4-why-submit');
      ta.addEventListener('paste', (e) => { e.preventDefault(); Levels.woeToast("Nada de copiar e colar seus sentimentos."); });
      ta.addEventListener('input', () => {
        counter.textContent = Math.max(0, 140 - ta.value.length); // starts at 140, counts down
        submit.disabled = ta.value.length < 140;
      });
      submit.addEventListener('click', () => { if (ta.value.length >= 140) renderSurvey2(); });
    }
    function renderSurvey2() {
      body.innerHTML = '<h3 class="l4-modal-title">Obrigado! A pesquisa 2 de 7 vai começar em instantes.</h3>' +
        '<div class="l4-loading"><span class="l2-spinner"></span> Carregando pesquisa 2 de 7...</div>';
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
        <header class="l5-appbar"><span class="l5-logo">ProductApp 2</span><span class="l5-dash-sub">Dashboard</span></header>
        <div class="l5-dash-body">
          <div class="l5-card"><h4>Projetos Ativos</h4><p>3</p></div>
          <div class="l5-card"><h4>Tarefas Concluídas</h4><p>12</p></div>
          <div class="l5-card"><h4>Membros do Time</h4><p>5</p></div>
        </div>
        <div class="l5-artifacts" id="l5-artifacts"></div>
        <div class="l5-cursor" id="l5-cursor"><span class="l5-cursor-tag">Astra</span></div>
        <div class="l5-chat" id="l5-chat">
          <div class="l5-chat-head">
            <span class="l5-chat-title">✨ Astra — seu copiloto de onboarding</span>
            <button class="l5-disable hidden" id="l5-disable" data-valid-click>Desativar copiloto</button>
          </div>
          <div class="l5-chat-log" id="l5-chat-log">
            <div class="l5-msg l5-msg-bot">Oi, eu sou a Astra. Vou te ajudar no onboarding, querendo você ou não.</div>
          </div>
          <div class="l5-chips hidden" id="l5-chips">
            <button class="l5-chip" data-valid-click id="l5-chip-around">Me mostre o app</button>
            <button class="l5-chip" data-valid-click id="l5-chip-features">Ativar mais recursos</button>
            <button class="l5-chip" data-valid-click id="l5-chip-stop">Só me deixa usar o app</button>
          </div>
          <form class="l5-chat-input" id="l5-chat-form">
            <input type="text" id="l5-chat-text" placeholder="Pergunte qualquer coisa à Astra..." data-valid-click autocomplete="off">
            <button type="submit" class="l5-send" data-valid-click>Enviar</button>
          </form>
        </div>
      </div>
    `;

    const ARTIFACTS = [
      { cls: 'l5-art-banner', label: "🎉 Percebemos que você está usando o produto. Aguarde." },
      { cls: 'l5-art-video', label: `▶ Vídeo 2 de 12: "O Que É Um Cursor"` },
      { cls: 'l5-art-checklist', label: "☑ Prepare-se em 3 passos rápidos! (de novo)" },
      { cls: 'l5-art-modal', label: "★ Pergunta rápida! Como está indo seu onboarding?" },
    ];
    const CANNED = [
      "Ótima pergunta! Aqui está um artigo sobre nosso roadmap do Q3.",
      "Agendei uma demo em seu nome. De nada.",
      "Parece que você está frustrado. Já tentou nosso webinar?",
      "Não entendi, mas fui em frente e ativei as notificações.",
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
      el.innerHTML = '<span class="l5-art-text"></span><button class="l5-artifact-close" data-valid-click aria-label="Dispensar">×</button>';
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
    function sulk() { addMsg("Tá bom. Humanos. 🙄 Desativando o modo de assistência.", 'bot'); showDisable(); }
    function finish() { if (done) return; done = true; timers.forEach(t => { clearTimeout(t); clearInterval(t); }); Game.completeLevel(); }

    artEl.addEventListener('click', (e) => {
      if (!e.target.closest('.l5-artifact-close')) return;
      const art = e.target.closest('.l5-artifact'); if (art) art.remove();
      dismissed++;
      if (dismissed >= 2) showChips();
    });
    container.querySelector('#l5-chip-around').addEventListener('click', () => { addMsg("Mostrar o app significa mostrar mais coisas para você fechar.", 'bot'); spawnArtifact(); });
    container.querySelector('#l5-chip-features').addEventListener('click', () => { addMsg("Ativando recursos que você não pediu. De nada.", 'bot'); spawnArtifact(); });
    container.querySelector('#l5-chip-stop').addEventListener('click', sulk);
    container.querySelector('#l5-chat-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = container.querySelector('#l5-chat-text');
      const val = input.value.trim(); if (!val) return;
      addMsg(val, 'user'); input.value = '';
      if (/sozinho|sozinha|me deixa|deixa eu|em paz|eu mesm/i.test(val)) { sulk(); return; }
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
