(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel) { return document.querySelector(sel); };

  /* ---------- Sprache: Texte der Oberfläche (die englische Seite liegt unter /en/) ---------- */
  var LANG = document.documentElement.lang === 'en' ? 'en' : 'de';
  var T = {
    de: {
      copy: 'Kopieren', copied: 'Kopiert', hits: ' Treffer', entries: ' Einträge',
      viewerFail: 'Der 3D-Viewer konnte nicht geladen werden.',
      trailer: 'Trailer abspielen', trailerNote: 'Beim Abspielen wird ein Video von YouTube geladen.',
      locale: 'de-DE',
      help: 'Verfügbare Befehle:\n  about        Wer ich bin\n  interessen   Woran ich mich festbeiße\n  ./last-arrow Mein aktuelles Spiel\n  ls projekte  Alles, was ich gebaut habe\n  cv           Lebenslauf als git log\n  kontakt      So erreichst du mich\n  makerworld   Meine 3D-Druck-Modelle\n  neofetch, whoami, date, uptime, achievements, clear',
      whoami: 'oualid: Einzelhandel bei Tag, Spiele, KI und 3D-Druck bei Nacht.',
      about: 'Öffne about.md …', projects: '14 Einträge. Tipp: oben in der Liste mit grep filtern.', contact: 'Öffne kontakt.json …',
      lastArrow: 'Starte Last Arrow …\n[WARN] Kobolde nähern sich der Schatztruhe. Unten gibt es eine Mini-Demo.',
      makerworld: 'Öffne MakerWorld: Grav-Charge Mandalorian-Holster …', iphone: 'Öffne iphone.oualid.de …',
      neofetch: 'Der steht doch schon oben. ;)', uptime: 'duckpi: läuft, 13 Container, 0 Kobolde in der Schatzkammer.',
      exit: 'Hier gibt es keinen Ausgang. Nur noch mehr Projekte.', sudo: 'oualid ist nicht in der sudoers-Datei. Dieser Vorfall wird gemeldet. 🦆',
      rm: 'Nö.', vim: 'Du kommst hier nicht mehr raus. Versuch es mit :q!', quit: 'Gerettet.',
      notFound: ': Befehl nicht gefunden. Tippe help.',
      achYes: '🏆 1/1  Quack Mode: Du hast die Ente gefunden.', achNo: '🏆 0/1  ???  Irgendwo im Playground versteckt sich etwas.',
      quack: 'Quack. 🦆'
    },
    en: {
      copy: 'Copy', copied: 'Copied', hits: ' matches', entries: ' entries',
      viewerFail: 'The 3D viewer could not be loaded.',
      trailer: 'Play trailer', trailerNote: 'Playing loads a video from YouTube.',
      locale: 'en-GB',
      help: 'Available commands:\n  about        Who I am\n  interests    What I sink my teeth into\n  ./last-arrow My current game\n  ls projects  Everything I have built\n  cv           CV as git log\n  contact      How to reach me\n  makerworld   My 3D printing models\n  neofetch, whoami, date, uptime, achievements, clear',
      whoami: 'oualid: retail by day, games, AI and 3D printing by night.',
      about: 'Opening about.md …', projects: '14 entries. Tip: filter the list with grep.', contact: 'Opening contact.json …',
      lastArrow: 'Starting Last Arrow …\n[WARN] Goblins are approaching the treasure chest. There is a mini demo below.',
      makerworld: 'Opening MakerWorld: Grav Charge Mandalorian holster …', iphone: 'Opening iphone.oualid.de …',
      neofetch: "It's right up there already. ;)", uptime: 'duckpi: up, 13 containers, 0 goblins in the vault.',
      exit: 'There is no exit here. Only more projects.', sudo: 'oualid is not in the sudoers file. This incident will be reported. 🦆',
      rm: 'Nope.', vim: "You can't get out of here. Try :q!", quit: 'Saved.',
      notFound: ': command not found. Type help.',
      achYes: '🏆 1/1  Quack Mode: you found the duck.', achNo: '🏆 0/1  ???  Something is hiding in the playground.',
      quack: 'Quack. 🦆'
    }
  }[LANG];

  /* ---------- Startsequenz im Terminal (läuft beim ersten Öffnen) ---------- */
  var booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    document.querySelectorAll('.boot li').forEach(function (li, i) {
      if (reduceMotion) { li.classList.add('on'); return; }
      setTimeout(function () { li.classList.add('on'); }, 150 + i * 180);
    });
  }

  /* ---------- Terminal als Dialog: „Terminal öffnen“, Retro-PC im Playground ---------- */
  var termDialog = $('#terminal-dialog'), termOpener = null;
  function openTerminal() {
    if (!termDialog || termDialog.open) return;
    termOpener = document.activeElement;
    if (termDialog.showModal) termDialog.showModal(); else termDialog.setAttribute('open', '');
    document.documentElement.classList.add('term-open');
    boot();
    var inp = $('#console-input');
    // Auf Touch-Geräten nicht gleich die Tastatur aufklappen
    if (inp && window.matchMedia('(pointer: fine)').matches) setTimeout(function () { inp.focus(); }, 30);
  }
  function closeTerminal() {
    if (!termDialog || !termDialog.open) return;
    if (termDialog.close) termDialog.close(); else { termDialog.removeAttribute('open'); onTermClose(); }
  }
  function onTermClose() {
    document.documentElement.classList.remove('term-open');
    if (termOpener && termOpener.focus && document.contains(termOpener)) termOpener.focus();
    termOpener = null;
  }
  if (termDialog) {
    termDialog.addEventListener('close', onTermClose);
    // Klick auf den abgedunkelten Hintergrund schließt
    termDialog.addEventListener('click', function (e) { if (e.target === termDialog) closeTerminal(); });
    document.querySelectorAll('[data-open-terminal]').forEach(function (b) { b.addEventListener('click', openTerminal); });
    document.querySelectorAll('[data-close-terminal]').forEach(function (b) { b.addEventListener('click', closeTerminal); });
    document.addEventListener('terminal:open', openTerminal);
  } else {
    boot();
  }

  /* ---------- Hero: „fest.“ beißt einmal zu (erneut bei Hover/Antippen) ---------- */
  var bite = $('.hero .bite'), caret = $('.hero .bite-caret');
  if (bite) {
    if (reduceMotion) { bite.classList.add('is-done'); }
    else {
      var chomp = function (withCaret) {
        bite.classList.remove('is-biting'); void bite.offsetWidth; bite.classList.add('is-biting');
        if (withCaret && caret) { caret.classList.remove('is-blinking'); void caret.offsetWidth; caret.classList.add('is-blinking'); }
      };
      bite.addEventListener('animationend', function (e) { if (e.animationName === 'bite-line') bite.classList.add('is-done'); });
      setTimeout(function () { chomp(true); }, 1000);
      bite.addEventListener('mouseenter', function () { chomp(false); });
      bite.addEventListener('click', function () { chomp(false); });
    }
  }

  /* ---------- E-Mail-Adressen erst im Browser zusammensetzen (gegen Spam-Bots) ---------- */
  document.querySelectorAll('a.mail').forEach(function (a) {
    var addr = a.dataset.u + '@' + a.dataset.d;
    a.href = 'mailto:' + addr;
    a.textContent = addr;
  });

  /* ---------- E-Mail-Adresse kopieren ---------- */
  document.querySelectorAll('.copy').forEach(function (btn) {
    var link = btn.previousElementSibling;
    btn.addEventListener('click', function () {
      var addr = (link.getAttribute('href') || '').replace(/^mailto:/, '');
      if (!addr || addr.charAt(0) === '#') return;
      var done = function () {
        btn.classList.add('is-done'); btn.textContent = T.copied;
        setTimeout(function () { btn.classList.remove('is-done'); btn.textContent = T.copy; }, 1800);
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(addr).then(done, function () {});
      else { var t = document.createElement('textarea'); t.value = addr; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) {} t.remove(); }
    });
  });

  /* ---------- Cosplay-Foto: Platzhalter zeigen, solange img/cosplay.jpg fehlt ---------- */
  document.querySelectorAll('.photo-frame img').forEach(function (img) {
    function missing() { img.parentNode.classList.add('missing'); }
    if (img.complete && img.naturalWidth === 0) missing();
    else img.addEventListener('error', missing);
  });

  /* ---------- Projekt-Screenshots ausblenden, wenn die Datei (noch) fehlt ---------- */
  document.querySelectorAll('img.shot').forEach(function (img) {
    function hide() { img.hidden = true; }
    if (img.complete && img.naturalWidth === 0) hide();
    else img.addEventListener('error', hide);
  });

  /* ---------- 3D-Viewer (Holster): lädt, sobald er ins Bild scrollt ---------- */
  document.querySelectorAll('.viewer').forEach(function (v) {
    var status = v.querySelector('.viewer-status');
    var btn = v.querySelector('.viewer-start');
    var started = false;
    function start() {
      if (started) return;
      started = true; btn.hidden = true; status.hidden = false;
      import('./holster-viewer.js').then(function (mod) { mod.mount(v); }).catch(function () {
        status.textContent = T.viewerFail;
      });
    }
    btn.addEventListener('click', start);
    // Auf Handys/Tablets, im Datensparmodus oder ohne IntersectionObserver erst nach Antippen laden (ca. 1,2 MB)
    var saveData = navigator.connection && navigator.connection.saveData;
    var touch = window.matchMedia('(pointer: coarse), (max-width: 860px)').matches;
    if (saveData || touch || !('IntersectionObserver' in window)) { status.hidden = true; btn.hidden = false; return; }
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { io.disconnect(); start(); }
    }, { rootMargin: '300px 0px' });
    io.observe(v);
  });

  /* ---------- YouTube erst nach Klick laden ---------- */
  document.querySelectorAll('.video[data-youtube-id]').forEach(function (box) {
    var id = (box.dataset.youtubeId || '').trim();
    if (!/^[\w-]{6,20}$/.test(id)) return;
    box.innerHTML = '';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'video-play';
    btn.innerHTML = '<span><b>▶</b>' + T.trailer + '<small>' + T.trailerNote + '</small></span>';
    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      f.title = 'Last Arrow Trailer';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      box.innerHTML = '';
      box.appendChild(f);
    });
    box.appendChild(btn);
  });

  /* ---------- Projekte filtern (ls | grep) ---------- */
  var grepInput = $('#grep-input');
  var items = Array.prototype.slice.call(document.querySelectorAll('#projects > li'));
  function grep() {
    var q = grepInput.value.trim().toLowerCase();
    var n = 0;
    items.forEach(function (li) {
      var hay = (li.textContent + ' ' + (li.dataset.tags || '')).toLowerCase();
      var hit = !q || hay.indexOf(q) !== -1;
      li.hidden = !hit;
      if (hit) li.classList.add('is-in');
      if (hit) n++;
    });
    $('#grep-count').textContent = q ? n + T.hits : items.length + T.entries;
    $('#grep-empty').hidden = n !== 0;
  }
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip[data-filter]'));
  function syncChips() {
    var q = grepInput.value.trim().toLowerCase();
    chips.forEach(function (c) { c.classList.toggle('is-active', c.dataset.filter === q); });
  }
  if (grepInput) grepInput.addEventListener('input', function () { grep(); syncChips(); });
  chips.forEach(function (c) {
    c.addEventListener('click', function () { grepInput.value = c.dataset.filter; grep(); syncChips(); });
  });
  if (grepInput) grep();
  var grepForm = $('.grep');
  if (grepForm) grepForm.addEventListener('submit', function (e) { e.preventDefault(); });

  /* ---------- Devlog (Einträge aus devlog/eintraege.json) ---------- */
  var devlog = $('#devlog');
  if (devlog && window.fetch) {
    var pick = function (v) { return v && typeof v === 'object' ? (v[LANG] || v.de || v.en || '') : (v || ''); };
    fetch(devlog.dataset.src || 'devlog/eintraege.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (list) {
        if (!Array.isArray(list) || !list.length) return;
        list.sort(function (a, b) { return String(b.datum).localeCompare(String(a.datum)); });
        var ol = $('#devlog-list');
        list.forEach(function (e) {
          var li = document.createElement('li'); li.className = 'devlog-item';
          var t = document.createElement('time'); t.className = 'devlog-date'; t.dateTime = e.datum;
          var d = new Date(e.datum + 'T12:00:00');
          t.textContent = isNaN(d) ? e.datum : d.toLocaleDateString(T.locale, { day: 'numeric', month: 'long', year: 'numeric' });
          var h = document.createElement('h4'); h.className = 'devlog-head'; h.textContent = pick(e.titel);
          var p = document.createElement('p'); p.className = 'devlog-text'; p.textContent = pick(e.text);
          li.appendChild(t); li.appendChild(h); li.appendChild(p); ol.appendChild(li);
        });
        devlog.hidden = false;
      })
      .catch(function () {});
  }

  /* ---------- Systeminfo im Terminal: auf kleinen Bildschirmen eingeklappt starten ---------- */
  var sysinfo = $('.sysinfo');
  if (sysinfo && window.matchMedia('(max-width: 640px)').matches) sysinfo.open = false;

  /* ---------- Navigation: aktiver Abschnitt ---------- */
  var navLinks = {};
  document.querySelectorAll('.site-nav a[href^="#"]').forEach(function (a) { navLinks[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        Object.keys(navLinks).forEach(function (k) {
          var on = k === e.target.id;
          navLinks[k].classList.toggle('active', on);
          if (on) navLinks[k].setAttribute('aria-current', 'true'); else navLinks[k].removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(navLinks).forEach(function (id) { var sec = document.getElementById(id); if (sec) navIo.observe(sec); });
  }

  /* ---------- Mobiles Menü ---------- */
  var toggle = $('.nav-toggle'), nav = $('#site-nav');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });
  }

  /* ---------- Header-Zustand + Scroll-Fortschritt ---------- */
  var header = $('.site-header'), bar = $('#progress-bar'), ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('is-scrolled', y > 8);
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    // Ganz unten erreicht der letzte Abschnitt nie die Bildschirmmitte: dann Kontakt markieren
    if (max > 0 && y >= max - 4 && navLinks.kontakt) {
      Object.keys(navLinks).forEach(function (k) { navLinks[k].classList.toggle('active', k === 'kontakt'); });
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Einblenden beim Scrollen ---------- */
  var reveals = document.querySelectorAll('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); revIo.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { revIo.observe(el); });
  }

  /* ---------- Lichtreflex auf Karten (nur Maus, nicht bei reduzierter Bewegung) ---------- */
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.addEventListener('pointermove', function (e) {
      var card = e.target.closest && e.target.closest('.card');
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* ---------- Interaktive Konsole ---------- */
  var con = $('#console'), out = $('#console-out'), form = $('#console-form'), input = $('#console-input');
  if (!con) return;
  con.hidden = false;

  function print(text, cls) {
    var p = document.createElement('p');
    if (cls) p.className = cls;
    p.textContent = text;
    out.appendChild(p);
    out.scrollTop = out.scrollHeight;
  }
  function go(id) {
    closeTerminal();
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  var commands = {
    help: function () {
      print(T.help);
    },
    whoami: function () { print(T.whoami); },
    about: function () { print(T.about); go('about'); },
    interessen: function () { print('spieleentwicklung/  ki/  3d-druck/  cosplay/  tinkering/  brettspiele/'); go('interessen'); },
    projekte: function () { print(T.projects); go('projekte'); },
    cv: function () { print('git log --graph lebenslauf'); go('cv'); },
    kontakt: function () { print(T.contact); go('kontakt'); },
    'last-arrow': function () {
      print(T.lastArrow);
      go('last-arrow');
    },
    makerworld: function () {
      print(T.makerworld);
      window.open('https://makerworld.com/de/models/2300726-grav-charge-mandalorian-holster', '_blank', 'noopener');
    },
    iphone: function () {
      print(T.iphone);
      window.open('https://iphone.oualid.de/', '_blank', 'noopener');
    },
    neofetch: function () { print(T.neofetch); },
    achievements: function () {
      var list = [];
      try { list = JSON.parse(localStorage.getItem('oualid.achievements') || '[]'); } catch (e) {}
      print(list.indexOf('quack-mode') !== -1 ? T.achYes : T.achNo);
    },
    quack: function () { print(T.quack); },
    date: function () { print(new Date().toLocaleString(T.locale, { dateStyle: 'full', timeStyle: 'short' })); },
    uptime: function () { print(T.uptime); },
    clear: function () { out.innerHTML = ''; },
    exit: function () { print(T.exit); },
    sudo: function () { print(T.sudo, 'err'); },
    rm: function () { print(T.rm, 'err'); },
    vim: function () { print(T.vim); },
    ':q!': function () { print(T.quit); }
  };
  var aliases = {
    'ls': 'projekte', 'ls projekte': 'projekte', 'ls ~/projekte': 'projekte', 'ls -la': 'projekte',
    'ls interessen': 'interessen', 'ls ~/interessen': 'interessen',
    'cat about.md': 'about', 'cat kontakt.json': 'kontakt', 'git log': 'cv', 'lebenslauf': 'cv',
    './last-arrow': 'last-arrow', 'man last-arrow': 'last-arrow', 'play': 'last-arrow',
    '?': 'help', 'hilfe': 'help', 'contact': 'kontakt', 'projects': 'projekte', 'ls projects': 'projekte',
    'interests': 'interessen', 'ls interests': 'interessen', 'resume': 'cv', 'cat contact.json': 'kontakt'
  };

  var history = [], hIdx = 0;
  function run(raw) {
    var cmd = raw.trim().replace(/\s+/g, ' ');
    if (!cmd) return;
    history.push(cmd); hIdx = history.length;
    print('oualid@duckpi:~$ ' + cmd, 'echo');
    var key = cmd.toLowerCase();
    var name = aliases[key] || key;
    if (name.indexOf('sudo') === 0) name = 'sudo';
    if (name.indexOf('rm ') === 0) name = 'rm';
    if (name.indexOf('echo ') === 0) { print(cmd.slice(5)); return; }
    if (commands[name]) commands[name]();
    else print('bash: ' + cmd.split(' ')[0] + T.notFound, 'err');
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); run(input.value); input.value = ''; });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp' && hIdx > 0) { hIdx--; input.value = history[hIdx]; e.preventDefault(); }
    if (e.key === 'ArrowDown') { hIdx = Math.min(history.length, hIdx + 1); input.value = history[hIdx] || ''; e.preventDefault(); }
  });
  con.querySelectorAll('[data-cmd]').forEach(function (b) {
    b.addEventListener('click', function () { run(b.dataset.cmd); });
  });
})();
