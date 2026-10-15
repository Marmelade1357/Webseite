(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel) { return document.querySelector(sel); };

  /* ---------- Startsequenz ---------- */
  var bootLines = document.querySelectorAll('.boot li');
  bootLines.forEach(function (li, i) {
    if (reduceMotion) { li.classList.add('on'); return; }
    setTimeout(function () { li.classList.add('on'); }, 150 + i * 180);
  });

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
        btn.classList.add('is-done'); btn.textContent = 'Kopiert';
        setTimeout(function () { btn.classList.remove('is-done'); btn.textContent = 'Kopieren'; }, 1800);
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
        status.textContent = 'Der 3D-Viewer konnte nicht geladen werden.';
      });
    }
    btn.addEventListener('click', start);
    // Im Datensparmodus oder ohne IntersectionObserver erst nach Klick laden
    var saveData = navigator.connection && navigator.connection.saveData;
    if (saveData || !('IntersectionObserver' in window)) { status.hidden = true; btn.hidden = false; return; }
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
    btn.innerHTML = '<span><b>▶</b>Trailer abspielen<small>Beim Abspielen wird ein Video von YouTube geladen.</small></span>';
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
    $('#grep-count').textContent = q ? n + ' Treffer' : items.length + ' Einträge';
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
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  var commands = {
    help: function () {
      print('Verfügbare Befehle:\n' +
        '  about        Wer ich bin\n' +
        '  interessen   Woran ich mich festbeiße\n' +
        '  ./last-arrow Mein aktuelles Spiel\n' +
        '  ls projekte  Alles, was ich gebaut habe\n' +
        '  cv           Lebenslauf als git log\n' +
        '  kontakt      So erreichst du mich\n' +
        '  makerworld   Meine 3D-Druck-Modelle\n' +
        '  neofetch, whoami, date, uptime, clear');
    },
    whoami: function () { print('oualid: Einzelhandel bei Tag, Spiele, KI und 3D-Druck bei Nacht.'); },
    about: function () { print('Öffne about.md …'); go('about'); },
    interessen: function () { print('spieleentwicklung/  ki/  3d-druck/  cosplay/  tinkering/  brettspiele/'); go('interessen'); },
    projekte: function () { print('14 Einträge. Tipp: oben in der Liste mit grep filtern.'); go('projekte'); },
    cv: function () { print('git log --graph lebenslauf'); go('cv'); },
    kontakt: function () { print('Öffne kontakt.json …'); go('kontakt'); },
    'last-arrow': function () {
      print('Starte Last Arrow …\n[WARN] Kobolde nähern sich der Schatztruhe. Unten gibt es eine Mini-Demo.');
      go('last-arrow');
    },
    makerworld: function () {
      print('Öffne MakerWorld: Grav-Charge Mandalorian-Holster …');
      window.open('https://makerworld.com/de/models/2300726-grav-charge-mandalorian-holster', '_blank', 'noopener');
    },
    iphone: function () {
      print('Öffne iphone.oualid.de …');
      window.open('https://iphone.oualid.de/', '_blank', 'noopener');
    },
    neofetch: function () { print('Der steht doch schon oben. ;)'); },
    date: function () { print(new Date().toLocaleString('de-DE', { dateStyle: 'full', timeStyle: 'short' })); },
    uptime: function () { print('duckpi: läuft, 13 Container, 0 Kobolde in der Schatzkammer.'); },
    clear: function () { out.innerHTML = ''; },
    exit: function () { print('Hier gibt es keinen Ausgang. Nur noch mehr Projekte.'); },
    sudo: function () { print('oualid ist nicht in der sudoers-Datei. Dieser Vorfall wird gemeldet. 🦆', 'err'); },
    rm: function () { print('Nö.', 'err'); },
    vim: function () { print('Du kommst hier nicht mehr raus. Versuch es mit :q!'); },
    ':q!': function () { print('Gerettet.'); }
  };
  var aliases = {
    'ls': 'projekte', 'ls projekte': 'projekte', 'ls ~/projekte': 'projekte', 'ls -la': 'projekte',
    'ls interessen': 'interessen', 'ls ~/interessen': 'interessen',
    'cat about.md': 'about', 'cat kontakt.json': 'kontakt', 'git log': 'cv', 'lebenslauf': 'cv',
    './last-arrow': 'last-arrow', 'man last-arrow': 'last-arrow', 'play': 'last-arrow',
    '?': 'help', 'hilfe': 'help', 'contact': 'kontakt', 'projects': 'projekte'
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
    else print('bash: ' + cmd.split(' ')[0] + ': Befehl nicht gefunden. Tippe help.', 'err');
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
