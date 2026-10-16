/* Playground im Hero: Spiellogik der vier Objekte, Achievements, Toasts.
   Die 3D-Welt selbst steckt in playground-world.js (three.js) und wird erst
   nachgeladen, wenn WebGL verfügbar ist. Ohne WebGL bleiben die vier Objekte
   als Kacheln bedienbar (statischer Fallback). */
(function () {
  'use strict';

  var root = document.getElementById('playground');
  if (!root) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EN = document.documentElement.lang === 'en';
  var L = EN ? {
    ready: '[ OK ] world loaded', static: '[ OK ] static mode', quack1: 'Quack?', quack2: 'Quack! Quack!',
    quackMode: 'QUACK MODE ACTIVATED', achievement: 'Achievement unlocked: Quack Mode',
    quackAgain: 'Quack! 🦆', duckTitle: 'Quack Mode', duckSub: 'Achievement unlocked'
  } : {
    ready: '[ OK ] Welt geladen', static: '[ OK ] statischer Modus', quack1: 'Quack?', quack2: 'Quack! Quack!',
    quackMode: 'QUACK MODE ACTIVATED', achievement: 'Achievement freigeschaltet: Quack Mode',
    quackAgain: 'Quack! 🦆', duckTitle: 'Quack Mode', duckSub: 'Achievement freigeschaltet'
  };

  /* ---------- Achievements (localStorage, kann im privaten Modus fehlen) ---------- */
  var STORE = 'oualid.achievements';
  function loadAch() {
    try { var v = JSON.parse(localStorage.getItem(STORE) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }
  function hasAch(id) { return loadAch().indexOf(id) !== -1; }
  function addAch(id) {
    var list = loadAch();
    if (list.indexOf(id) === -1) list.push(id);
    try { localStorage.setItem(STORE, JSON.stringify(list)); } catch (e) {}
  }

  var countEl = root.querySelector('.pg-ach-count');
  var duckBtn = root.querySelector('.pg-spot-duck');
  function renderAch() {
    var on = hasAch('quack-mode');
    countEl.textContent = (on ? 1 : 0) + '/1';
    root.classList.toggle('is-quack', on);
    if (on) {
      duckBtn.querySelector('.pg-tip b').textContent = L.duckTitle;
      duckBtn.querySelector('.pg-tip small').textContent = L.duckSub;
      duckBtn.querySelector('.pg-pin').textContent = '🦆';
    }
  }
  renderAch();

  /* ---------- Toast ---------- */
  var toast = root.querySelector('.pg-toast'), toastTimer;
  function showToast(text, sub, variant, ms) {
    clearTimeout(toastTimer);
    toast.className = 'pg-toast' + (variant ? ' is-' + variant : '');
    toast.textContent = '';
    var b = document.createElement('b'); b.textContent = text; toast.appendChild(b);
    if (sub) { var s = document.createElement('small'); s.textContent = sub; toast.appendChild(s); }
    void toast.offsetWidth;
    toast.classList.add('is-on');
    toastTimer = setTimeout(function () { toast.classList.remove('is-on'); }, ms || 1800);
  }

  /* ---------- Aktionen der Objekte ---------- */
  var world = null; // Steuerung der 3D-Welt, sobald geladen
  function go(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  // Kurz warten, damit man den Effekt am Objekt noch sieht
  function later(fn) { setTimeout(fn, reduceMotion || !world ? 0 : 380); }

  var duckClicks = 0;
  var actions = {
    castle: function () { later(function () { go('last-arrow'); }); },
    pc: function () { later(function () { document.dispatchEvent(new CustomEvent('terminal:open')); }); },
    printer: function () {
      later(function () {
        var grep = document.getElementById('grep-input');
        if (grep) { grep.value = '3d-druck'; grep.dispatchEvent(new Event('input')); }
        go('projekte');
      });
    },
    duck: function () {
      if (hasAch('quack-mode')) { showToast(L.quackAgain, '', 'small'); return; }
      duckClicks++;
      if (duckClicks === 1) showToast(L.quack1, '', 'small');
      else if (duckClicks === 2) showToast(L.quack2, '', 'small');
      else {
        addAch('quack-mode');
        renderAch();
        showToast(L.quackMode, '🏆 ' + L.achievement, 'quack', 3600);
        if (world) world.quack();
      }
    }
  };

  root.querySelectorAll('.pg-spot').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.dataset.spot;
      if (world) world.poke(key);
      actions[key]();
    });
  });

  /* ---------- Terminal-Zeile: ./start-playground.sh tippt sich selbst ---------- */
  var cmdText = document.querySelector('.pg-cmd-text');
  var cmdStatus = document.querySelector('.pg-cmd-status');
  var typed = reduceMotion ? Promise.resolve() : new Promise(function (done) {
    var full = cmdText.textContent, i = 0;
    cmdText.textContent = '';
    (function step() {
      cmdText.textContent = full.slice(0, i++);
      if (i <= full.length) setTimeout(step, 600 / full.length + 25); else done();
    })();
  });
  function setStatus(text, ok) {
    typed.then(function () {
      cmdStatus.textContent = text;
      cmdStatus.classList.toggle('is-ok', !!ok);
    });
  }

  /* ---------- 3D-Welt nachladen ---------- */
  function hasWebGL() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
  }
  function goStatic() {
    root.classList.add('is-static');
    setStatus(L.static, true);
  }
  var started = false;
  function start() {
    if (started) return;
    started = true;
    root.classList.remove('is-waiting');
    root.classList.add('is-loading');
    startBtn.hidden = true;
    import('./playground-world.js')
      .then(function (mod) {
        return mod.mount(root, { reduceMotion: reduceMotion, quack: hasAch('quack-mode') });
      })
      .then(function (ctrl) {
        world = ctrl;
        root.classList.remove('is-loading');
        root.classList.add('is-ready');
        setStatus(L.ready, true);
      })
      .catch(function () { root.classList.remove('is-loading'); goStatic(); });
  }

  var startBtn = root.querySelector('.pg-start');
  startBtn.addEventListener('click', start);
  if (!hasWebGL()) { goStatic(); return; }
  // Im Datensparmodus erst nach Klick laden
  if (navigator.connection && navigator.connection.saveData) {
    root.classList.add('is-waiting');
    startBtn.hidden = false;
    return;
  }
  var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 200); };
  idle(start, { timeout: 1200 });
})();
