/* Mini Last Arrow: kleiner Browser-Teaser, nicht das echte Spiel.
   Kobolde laufen von rechts zur Schatztruhe, Klick/Tippen schießt einen Pfeil.
   Jede 5. Welle kommt ein Boss, danach wächst die Burg. */
(function () {
  'use strict';
  var canvas = document.getElementById('mini-game');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var W = 640, H = 300, GROUND = 250, GATE_X = 150;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  var S, last = 0, running = false, visible = true;
  var BOW = { x: 70, y: 112 };

  function reset() {
    S = {
      state: 'idle', wave: 0, gold: 0, kills: 0, chest: 10, level: 0,
      kobolds: [], arrows: [], toSpawn: 0, spawnT: 0, banner: '', bannerT: 0, t: 0
    };
  }

  function startWave() {
    S.wave++;
    var boss = S.wave % 5 === 0;
    S.toSpawn = boss ? 1 : 3 + S.wave * 2;
    S.spawnT = 0.6;
    S.boss = boss;
    S.banner = boss ? 'BOSS!' : 'Welle ' + S.wave;
    S.bannerT = 1.4;
  }

  function spawn() {
    var r = Math.random(), k;
    var speedUp = 1 + S.wave * 0.06;
    if (S.boss) k = { type: 'boss', hp: 10 + S.wave, r: 22, v: 26, dmg: 4, gold: 25 };
    else if (S.wave > 2 && r < 0.15) k = { type: 'ram', hp: 3, r: 15, v: 22, dmg: 2, gold: 4 };
    else if (r < 0.45) k = { type: 'runner', hp: 1, r: 9, v: 70, dmg: 1, gold: 2 };
    else k = { type: 'kobold', hp: 1, r: 11, v: 42, dmg: 1, gold: 1 };
    k.maxHp = k.hp; k.v *= speedUp;
    k.x = W + 20; k.y = GROUND - k.r - Math.random() * 18;
    k.phase = Math.random() * 6; k.hit = 0; k.dead = 0;
    S.kobolds.push(k);
  }

  function shoot(tx, ty) {
    var dx = tx - BOW.x, dy = ty - BOW.y, len = Math.hypot(dx, dy) || 1;
    S.arrows.push({ x: BOW.x, y: BOW.y, vx: dx / len * 900, vy: dy / len * 900, life: 0.9 });
  }

  function update(dt) {
    S.t += dt;
    if (S.bannerT > 0) S.bannerT -= dt;
    if (S.state !== 'play') return;

    if (S.toSpawn > 0) {
      S.spawnT -= dt;
      if (S.spawnT <= 0) { spawn(); S.toSpawn--; S.spawnT = Math.max(0.35, 1.3 - S.wave * 0.07) * (0.6 + Math.random() * 0.8); }
    } else if (S.kobolds.every(function (k) { return k.dead; })) {
      if (S.boss) { S.level = Math.min(S.level + 1, 4); S.chest = Math.min(10, S.chest + 3); S.banner = 'Die Burg wächst!'; S.bannerT = 1.6; }
      startWave();
    }

    S.arrows.forEach(function (a) {
      a.x += a.vx * dt; a.y += a.vy * dt; a.life -= dt;
      S.kobolds.forEach(function (k) {
        if (a.life <= 0 || k.dead) return;
        if (Math.hypot(a.x - k.x, a.y - k.y) < k.r + 10) {
          a.life = 0; k.hp--; k.hit = 0.15; k.x += k.type === 'boss' ? 4 : 14;
          if (k.hp <= 0) { k.dead = 0.001; S.gold += k.gold; S.kills++; }
        }
      });
    });
    S.arrows = S.arrows.filter(function (a) { return a.life > 0 && a.y < H && a.x < W + 20; });

    S.kobolds.forEach(function (k) {
      if (k.hit > 0) k.hit -= dt;
      if (k.dead) { k.dead += dt; return; }
      k.x -= k.v * dt; k.phase += dt * (k.v / 8);
      if (k.x - k.r <= GATE_X) {
        S.chest -= k.dmg; k.dead = 0.001; k.stole = true;
        if (S.chest <= 0) { S.chest = 0; S.state = 'over'; }
      }
    });
    S.kobolds = S.kobolds.filter(function (k) { return !k.dead || k.dead < 0.6; });
  }

  /* ---------- Zeichnen ---------- */
  function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  function crenel(x, y, w, c) { for (var i = 0; i < w; i += 12) rect(x + i, y - 8, 7, 8, c); }

  function drawWorld() {
    var g = ctx.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, '#f6c66b'); g.addColorStop(1, '#f39a5a');
    rect(0, 0, W, GROUND, g);
    ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.arc(520, 70, 26, 0, 7); ctx.fill();
    ctx.fillStyle = '#b5785a';
    ctx.beginPath(); ctx.moveTo(180, GROUND); ctx.lineTo(300, 120); ctx.lineTo(420, GROUND); ctx.fill();
    ctx.fillStyle = '#9a6650';
    ctx.beginPath(); ctx.moveTo(360, GROUND); ctx.lineTo(500, 140); ctx.lineTo(660, GROUND); ctx.fill();
    for (var i = 0; i < 14; i++) {
      var tx = 170 + i * 36, th = 26 + (i * 37 % 17);
      ctx.fillStyle = i % 2 ? '#3f6b2f' : '#4f7d3b';
      ctx.beginPath(); ctx.moveTo(tx, GROUND - 4); ctx.lineTo(tx + 12, GROUND - 4 - th); ctx.lineTo(tx + 24, GROUND - 4); ctx.fill();
    }
    rect(0, GROUND, W, H - GROUND, '#6d9a4f');
    rect(0, GROUND, W, 4, '#86b35f');
  }

  function drawCastle() {
    var L = S.level, stone = '#8a7a6a', dark = '#6b5d50';
    var wallH = 70 + L * 8;
    rect(0, GROUND - wallH, GATE_X, wallH, stone);
    crenel(0, GROUND - wallH, GATE_X, stone);
    rect(GATE_X - 30, GROUND - 40, 22, 40, '#3b2a1a');
    var towerH = 130 + L * 14;
    rect(50, GROUND - towerH, 44, towerH, dark);
    crenel(50, GROUND - towerH, 44, dark);
    if (L >= 1) { var h2 = 100 + L * 10; rect(110, GROUND - h2, 38, h2, dark); crenel(110, GROUND - h2, 38, dark); }
    if (L >= 2) { rect(4, GROUND - 110 - L * 8, 34, 110 + L * 8, dark); crenel(4, GROUND - 110 - L * 8, 34, dark); }
    var flags = L >= 3 ? [72, 129, 21] : L >= 1 ? [72, 129] : [72];
    flags.forEach(function (fx, i) {
      var top = [GROUND - towerH, GROUND - (100 + L * 10), GROUND - 110 - L * 8][i] - 8;
      rect(fx, top - 26, 2, 26, '#3b2a1a');
      var wave = Math.sin(S.t * 4 + i) * 3;
      ctx.fillStyle = '#c0392b'; ctx.beginPath();
      ctx.moveTo(fx + 2, top - 26); ctx.lineTo(fx + 22, top - 20 + wave); ctx.lineTo(fx + 2, top - 14); ctx.fill();
    });
    BOW.y = GROUND - towerH - 14;
    // Schatztruhe
    var cx = 108, cy = GROUND - 22;
    rect(cx, cy, 30, 20, '#8b5a2b'); rect(cx, cy, 30, 6, '#a86b32'); rect(cx + 13, cy + 5, 4, 6, '#f2b84b');
    if (S.chest > 0) { ctx.fillStyle = 'rgba(242,184,75,' + (0.5 + Math.sin(S.t * 3) * 0.2) + ')'; ctx.fillRect(cx + 4, cy - 3, 22, 3); }
    // Schütze
    rect(BOW.x - 5, BOW.y - 4, 10, 18, '#2f5d8a');
    ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(BOW.x, BOW.y - 9, 6, 0, 7); ctx.fill();
    ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(BOW.x + 6, BOW.y + 3, 11, -1.2, 1.2); ctx.stroke();
  }

  function drawKobold(k) {
    ctx.save();
    ctx.translate(k.x, k.y);
    if (k.dead) { ctx.globalAlpha = Math.max(0, 1 - k.dead / 0.6); ctx.rotate(k.stole ? 0 : Math.min(1.5, k.dead * 6)); }
    var bob = k.dead ? 0 : Math.abs(Math.sin(k.phase)) * 3;
    var body = k.hit > 0 ? '#ffffff' : k.type === 'boss' ? '#7a3fa0' : k.type === 'ram' ? '#5f7a3a' : k.type === 'runner' ? '#8bc34a' : '#6fa83f';
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.ellipse(0, -bob, k.r, k.r * 1.1, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-k.r * 0.8, -bob - k.r * 0.5); ctx.lineTo(-k.r * 1.5, -bob - k.r * 1.1); ctx.lineTo(-k.r * 0.4, -bob - k.r * 0.9); ctx.fill();
    ctx.beginPath(); ctx.moveTo(k.r * 0.8, -bob - k.r * 0.5); ctx.lineTo(k.r * 1.5, -bob - k.r * 1.1); ctx.lineTo(k.r * 0.4, -bob - k.r * 0.9); ctx.fill();
    ctx.fillStyle = '#fff59d';
    ctx.beginPath(); ctx.arc(-k.r * 0.35, -bob - k.r * 0.2, k.r * 0.2, 0, 7); ctx.arc(k.r * 0.15, -bob - k.r * 0.2, k.r * 0.2, 0, 7); ctx.fill();
    if (k.type === 'ram') { rect(-k.r - 18, -bob - 3, 22, 7, '#6b4a2e'); rect(-k.r - 22, -bob - 5, 6, 11, '#4a3320'); }
    if (k.type === 'boss') { ctx.fillStyle = '#f2b84b'; ctx.fillRect(-10, -bob - k.r * 1.25, 20, 6); }
    ctx.restore();
    if (k.maxHp > 1 && !k.dead) {
      rect(k.x - k.r, k.y - k.r * 1.6 - 8, k.r * 2, 4, 'rgba(0,0,0,.35)');
      rect(k.x - k.r, k.y - k.r * 1.6 - 8, k.r * 2 * (k.hp / k.maxHp), 4, '#ff7b72');
    }
  }

  function drawArrows() {
    ctx.strokeStyle = '#3b2a1a'; ctx.lineWidth = 2;
    S.arrows.forEach(function (a) {
      var l = Math.hypot(a.vx, a.vy) || 1;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x - a.vx / l * 14, a.y - a.vy / l * 14); ctx.stroke();
    });
  }

  function text(s, x, y, size, color, align) {
    ctx.font = '700 ' + size + 'px "JetBrains Mono", monospace';
    ctx.textAlign = align || 'left';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(11,15,20,.75)'; ctx.strokeText(s, x, y);
    ctx.fillStyle = color; ctx.fillText(s, x, y);
  }

  function drawHud() {
    text('Welle ' + Math.max(1, S.wave), 170, 24, 14, '#fff');
    text('Gold ' + S.gold, 280, 24, 14, '#f2b84b');
    text('Truhe ' + '■'.repeat(S.chest) + '□'.repeat(10 - S.chest), W - 12, 24, 13, '#fff', 'right');
    if (S.bannerT > 0) text(S.banner, W / 2 + 70, 120, 28, '#fff', 'center');
  }

  function overlay(title, sub) {
    rect(0, 0, W, H, 'rgba(11,15,20,.55)');
    text(title, W / 2, H / 2 - 8, 28, '#f2b84b', 'center');
    text(sub, W / 2, H / 2 + 24, 14, '#fff', 'center');
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawWorld(); drawCastle();
    S.kobolds.forEach(drawKobold);
    drawArrows();
    if (S.state === 'play') drawHud();
    if (S.state === 'idle') overlay('MINI LAST ARROW', 'Klicken oder tippen zum Starten');
    if (S.state === 'over') overlay('Die Truhe ist gefallen', 'Welle ' + S.wave + ' · ' + S.kills + ' Kobolde · klicken für neuen Run');
  }

  function loop(ts) {
    if (!running) return;
    var dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    update(dt); draw();
    if (S.state !== 'play') { running = false; return; }
    requestAnimationFrame(loop);
  }
  function setRunning(on) {
    if (on === running) return;
    running = on;
    if (on) { last = performance.now(); requestAnimationFrame(loop); }
  }
  function shouldRun() { return visible && !document.hidden && S.state === 'play'; }

  canvas.addEventListener('pointerdown', function (e) {
    var r = canvas.getBoundingClientRect();
    var x = (e.clientX - r.left) * (W / r.width), y = (e.clientY - r.top) * (H / r.height);
    if (S.state === 'idle' || S.state === 'over') { reset(); S.state = 'play'; startWave(); setRunning(true); return; }
    shoot(x, y);
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; setRunning(shouldRun()); }).observe(canvas);
  }
  document.addEventListener('visibilitychange', function () { setRunning(shouldRun()); });

  reset();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  draw();
})();
