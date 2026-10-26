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
    quackAgain: 'Quack! 🦆', duckTitle: 'Quack Mode', duckSub: 'Achievement unlocked',
    unlocked: 'Achievement unlocked', kills: 'Goblins zapped: '
  } : {
    ready: '[ OK ] Welt geladen', static: '[ OK ] statischer Modus', quack1: 'Quack?', quack2: 'Quack! Quack!',
    quackMode: 'QUACK MODE ACTIVATED', achievement: 'Achievement freigeschaltet: Quack Mode',
    quackAgain: 'Quack! 🦆', duckTitle: 'Quack Mode', duckSub: 'Achievement freigeschaltet',
    unlocked: 'Achievement freigeschaltet', kills: 'Kobolde erwischt: '
  };

  /* ---------- Achievements (localStorage, kann im privaten Modus fehlen) ----------
     Alles bleibt im Browser, nichts wird übertragen. */
  var STORE = 'oualid.achievements', KILLS = 'oualid.kills', EXPLORED = 'oualid.explored';
  var ACH = [
    { id: 'quack-mode', de: ['Quack Mode', 'Die Ente dreimal angeklickt'], en: ['Quack Mode', 'Clicked the duck three times'] },
    { id: 'first-goblin', de: ['Erster Kobold', 'Einen Kobold selbst erwischt'], en: ['First goblin', 'Zapped a goblin yourself'] },
    { id: 'goblin-hunter', de: ['Koboldjäger', '10 Kobolde erwischt'], en: ['Goblin hunter', 'Zapped 10 goblins'] },
    { id: 'boss', de: ['Bossbezwinger', 'Beim Sieg über einen Boss-Kobold mitgeholfen'], en: ['Boss slayer', 'Helped defeat a boss goblin'] },
    { id: 'explorer', de: ['Entdecker', 'Burg, PC und 3D-Drucker angeklickt'], en: ['Explorer', 'Clicked the castle, the PC and the 3D printer'] }
  ];
  function readJSON(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function writeJSON(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }
  function loadAch() { var v = readJSON(STORE, []); return Array.isArray(v) ? v : []; }
  function hasAch(id) { return loadAch().indexOf(id) !== -1; }
  function achName(id) { var a = ACH.filter(function (x) { return x.id === id; })[0]; return a ? a[EN ? 'en' : 'de'][0] : id; }
  // Gibt true zurück, wenn das Achievement neu ist
  function unlock(id, silent) {
    var list = loadAch();
    if (list.indexOf(id) !== -1) return false;
    list.push(id);
    writeJSON(STORE, list);
    renderAch();
    if (!silent) achToast(achName(id));
    return true;
  }
  function kills() { return +readJSON(KILLS, 0) || 0; }
  // Für die Konsole in main.js (Befehle achievements und kobolde)
  window.PG_ACH = { list: ACH, has: hasAch, kills: kills, lang: EN ? 'en' : 'de' };

  var countEl = root.querySelector('.pg-ach-count');
  var achChip = root.querySelector('.pg-ach');
  var hint = root.querySelector('.pg-hint');
  var duckBtn = root.querySelector('.pg-spot-duck');
  function renderAch() {
    var n = ACH.filter(function (a) { return hasAch(a.id); }).length;
    countEl.textContent = n + '/' + ACH.length;
    achChip.classList.toggle('is-on', n > 0);
    achChip.classList.toggle('is-complete', n === ACH.length);
    var quack = hasAch('quack-mode');
    root.classList.toggle('is-quack', quack);
    if (quack) {
      duckBtn.querySelector('.pg-tip b').textContent = L.duckTitle;
      duckBtn.querySelector('.pg-tip small').textContent = L.duckSub;
      duckBtn.querySelector('.pg-pin').textContent = '🦆';
    }
  }
  function renderKills() {
    var k = kills();
    if (k > 0 && hint) hint.textContent = L.kills + k;
  }
  renderAch();
  renderKills();

  /* ---------- Achievement-Meldung unten im Bild (sichtbar, egal wohin gescrollt wurde) ---------- */
  var achBox = document.createElement('div');
  achBox.className = 'ach-toast';
  achBox.setAttribute('role', 'status');
  achBox.setAttribute('aria-live', 'polite');
  document.body.appendChild(achBox);
  var achTimer;
  function achToast(name) {
    clearTimeout(achTimer);
    achBox.textContent = '';
    var i = document.createElement('span'); i.className = 'ach-toast-icon'; i.textContent = '🏆'; i.setAttribute('aria-hidden', 'true');
    var t = document.createElement('span');
    var sm = document.createElement('small'); sm.textContent = L.unlocked;
    var nb = document.createElement('b'); nb.textContent = name;
    t.appendChild(sm); t.appendChild(nb);
    var c = document.createElement('span'); c.className = 'ach-toast-count'; c.textContent = countEl.textContent;
    achBox.appendChild(i); achBox.appendChild(t); achBox.appendChild(c);
    achBox.classList.remove('is-on'); void achBox.offsetWidth; achBox.classList.add('is-on');
    achTimer = setTimeout(function () { achBox.classList.remove('is-on'); }, 3800);
  }

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

  // Projektliste filtern (leer = alle Projekte), nutzt den bestehenden grep-Filter
  function filterProjects(q) {
    var grep = document.getElementById('grep-input');
    if (grep) { grep.value = q; grep.dispatchEvent(new Event('input')); }
  }

  var duckClicks = 0;
  var actions = {
    castle: function () { later(function () { go('last-arrow'); }); },
    pc: function () { later(function () { filterProjects(''); go('projekte'); }); },
    printer: function () { later(function () { filterProjects('3d-druck'); go('projekte'); }); },
    duck: function () {
      if (hasAch('quack-mode')) { showToast(L.quackAgain, '', 'small'); return; }
      duckClicks++;
      if (duckClicks === 1) showToast(L.quack1, '', 'small');
      else if (duckClicks === 2) showToast(L.quack2, '', 'small');
      else {
        unlock('quack-mode', true); // eigene große Meldung in der Szene
        showToast(L.quackMode, '🏆 ' + L.achievement, 'quack', 3600);
        if (world) world.quack();
      }
    }
  };

  function explore(key) {
    if (key === 'duck') return;
    var seen = readJSON(EXPLORED, []);
    if (!Array.isArray(seen)) seen = [];
    if (seen.indexOf(key) === -1) { seen.push(key); writeJSON(EXPLORED, seen); }
    if (['castle', 'pc', 'printer'].every(function (k) { return seen.indexOf(k) !== -1; })) unlock('explorer');
  }

  root.querySelectorAll('.pg-spot').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.dataset.spot;
      explore(key);
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
        return mod.mount(root, {
          reduceMotion: reduceMotion, quack: hasAch('quack-mode'),
          onGoblin: function () {
            var k = kills() + 1;
            writeJSON(KILLS, k);
            renderKills();
            unlock('first-goblin');
            if (k >= 10) unlock('goblin-hunter');
          },
          onBoss: function (e) { if (e.helped) unlock('boss'); }
        });
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
