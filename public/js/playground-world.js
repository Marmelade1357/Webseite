/* Playground: isometrisches Low-Poly-Diorama für den Hero (three.js).
   Wird von playground.js dynamisch geladen. Alles besteht aus einfachen
   Grundformen, es gibt keine externen Modelle oder Texturen.

   Aufbau: Insel → Burg, Retro-PC, 3D-Drucker, Gummiente → Deko → Effekte
           → Kamera/Interaktion → Animationsschleife */
import * as THREE from 'three';

const COL = {
  bg: 0x0b1020, surface: 0x151d32, mint: 0x62f5d2, violet: 0xa78bfa, gold: 0xffbf69,
  stone: 0x5b6590, stoneDark: 0x454f7a, beige: 0xd9d1bf, duck: 0xffd447, beak: 0xff9f43
};
const EN = document.documentElement.lang === 'en';
const SCREEN_LINES = EN
  ? ['$ ./start-playground.sh', '[ OK ] castle online', '[ OK ] printer at 220°C', '[ OK ] 14 projects loaded', '[WARN] duck not found']
  : ['$ ./start-playground.sh', '[ OK ] Burg online', '[ OK ] Drucker: 220°C', '[ OK ] 14 Projekte geladen', '[WARN] Ente nicht gefunden'];
const SCREEN_QUACK = EN
  ? ['$ ./start-playground.sh', '[ OK ] castle online', '[ OK ] duck found', '', '>> QUACK MODE ACTIVATED']
  : ['$ ./start-playground.sh', '[ OK ] Burg online', '[ OK ] Ente gefunden', '', '>> QUACK MODE ACTIVATED'];

const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeOutBack = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const clamp01 = t => Math.min(1, Math.max(0, t));

export function mount(root, { reduceMotion = false, quack = false } = {}) {
  const stage = root.querySelector('.pg-stage');
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const shadows = !coarse;

  /* ---------- Renderer, Szene, Licht ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0x8e9ad8, 0x0b1020, 1.05));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.9);
  key.position.set(7, 12, 5);
  if (shadows) {
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.02;
  }
  scene.add(key);
  const rim = new THREE.DirectionalLight(COL.violet, 1.6);
  rim.position.set(-8, 5, -7);
  scene.add(rim);

  const world = new THREE.Group();
  scene.add(world);

  /* ---------- Bausteine ---------- */
  const M = (color, o) => new THREE.MeshStandardMaterial(Object.assign({ color, flatShading: true, roughness: 0.85, metalness: 0 }, o));
  const glowMat = color => M(color, { emissive: color, emissiveIntensity: 0 });
  function add(parent, geo, mat, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = shadows;
    m.receiveShadow = shadows;
    parent.add(m);
    return m;
  }
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const cyl = (rt, rb, h, s = 8) => new THREE.CylinderGeometry(rt, rb, h, s);

  /* ---------- Insel ---------- */
  const SIZE = 9;
  const top = add(world, box(SIZE, 0.3, SIZE), M(0x1b2238), 0, -0.15, 0);
  top.castShadow = false;
  // Schwebender Felssockel: Pyramidenstumpf mit vier Seiten
  const rock = add(world, cyl(SIZE / Math.SQRT2, 2.4, 2.4, 4), M(0x1a2140), 0, -1.5, 0);
  rock.rotation.y = Math.PI / 4;
  rock.castShadow = false;
  // Raster und leuchtende Kante: Spielbrett-Gefühl
  const grid = new THREE.GridHelper(SIZE, 9, COL.mint, COL.mint);
  grid.material.transparent = true;
  grid.material.opacity = 0.07;
  grid.position.y = 0.005;
  world.add(grid);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(box(SIZE, 0.3, SIZE)),
    new THREE.LineBasicMaterial({ color: COL.mint, transparent: true, opacity: 0.28 }));
  edge.position.y = -0.15;
  world.add(edge);

  /* ---------- Interaktive Objekte ---------- */
  const objects = {}; // key → { group, base, glow(k), anchor, k, target, radius, poke }

  function register(keyName, group, { anchor, radius, glow }) {
    world.add(group);
    objects[keyName] = { group, base: group.position.clone(), glow, anchor, radius, k: 0, target: 0, pokeT: -1 };
  }

  // Burg im Tower-Defense-Stil
  (function castle() {
    const g = new THREE.Group();
    g.position.set(-1.9, 0, -1.75);
    const stone = M(COL.stone), stoneDark = M(COL.stoneDark);
    const roof = glowMat(COL.violet), band = glowMat(COL.gold), win = glowMat(COL.gold);
    win.emissiveIntensity = 0.7;
    const S = 3, T = 0.28, H = 0.95;
    add(g, box(S, 0.05, S), M(0x252e50), 0, 0.025, 0);
    [[0, -S / 2, S, T], [0, S / 2, S, T], [-S / 2, 0, T, S], [S / 2, 0, T, S]].forEach(([x, z, w, d]) => {
      add(g, box(w, H, d), stone, x, H / 2, z);
      const along = w > d, n = 7;
      for (let i = 0; i < n; i += 2) {
        const o = -S / 2 + (i + 0.5) * S / n;
        add(g, box(along ? S / n : T, 0.2, along ? T : S / n), stone, along ? o : x, H + 0.1, along ? z : o);
      }
    });
    // Tor auf der Vorderseite
    add(g, box(0.62, 0.6, 0.05), M(0x5a3d33), 0, 0.3, S / 2 + T / 2 + 0.005);
    add(g, box(0.78, 0.1, 0.07), band, 0, 0.66, S / 2 + T / 2 + 0.01);
    // Ecktürme: Fenster, Lichtband und Dach leuchten bei Hover
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const x = sx * S / 2, z = sz * S / 2;
      add(g, cyl(0.42, 0.5, 1.6), stone, x, 0.8, z);
      add(g, cyl(0.47, 0.47, 0.12), band, x, 1.5, z);
      add(g, new THREE.ConeGeometry(0.6, 0.85, 8), roof, x, 2.0, z);
      const w = add(g, box(0.12, 0.22, 0.04), win, x + 0.31, 1.05, z + 0.31);
      w.rotation.y = Math.PI / 4;
    });
    // Bergfried mit Fahne
    add(g, box(1.1, 1.8, 1.1), stoneDark, 0, 0.9, 0);
    const keepRoof = add(g, new THREE.ConeGeometry(0.95, 0.9, 4), roof, 0, 2.25, 0);
    keepRoof.rotation.y = Math.PI / 4;
    const kw = add(g, box(0.16, 0.26, 0.04), win, 0.3, 1.3, 0.56);
    kw.castShadow = false;
    add(g, cyl(0.025, 0.025, 0.8, 5), M(0x9aa3c7), 0, 3.0, 0);
    const flagGeo = box(0.42, 0.24, 0.02);
    flagGeo.translate(0.21, 0, 0); // Drehpunkt am Mast, damit die Fahne weht
    const flag = add(g, flagGeo, M(COL.mint, { emissive: COL.mint, emissiveIntensity: 0.25 }), 0.01, 3.25, 0);
    const light = new THREE.PointLight(COL.gold, 0, 6, 2);
    light.position.set(0, 2.4, 0.8);
    g.add(light);
    register('castle', g, {
      anchor: new THREE.Vector3(0, 3.5, 0), radius: 2.4,
      glow: k => {
        band.emissiveIntensity = 0.15 + k * 2.6;
        win.emissiveIntensity = 0.7 + k * 2.2;
        roof.emissiveIntensity = k * 0.45;
        light.intensity = k * 14;
      }
    });
    objects.castle.flag = flag;
  })();

  // Retro-PC mit animiertem Terminal
  const screen = (function pc() {
    const g = new THREE.Group();
    g.position.set(2.15, 0, -2.05);
    g.rotation.y = Math.PI / 4;
    const desk = M(0x3a3157), beige = M(COL.beige), dark = M(0x23232b);
    add(g, box(2.1, 0.1, 1.05), desk, 0, 0.8, 0);
    [[-0.95, -0.42], [0.95, -0.42], [-0.95, 0.42], [0.95, 0.42]].forEach(([x, z]) => add(g, box(0.08, 0.75, 0.08), desk, x, 0.375, z));
    add(g, box(0.94, 0.76, 0.74), beige, 0, 1.23, -0.1);
    add(g, box(0.7, 0.56, 0.36), beige, 0, 1.2, -0.6);
    add(g, box(0.82, 0.64, 0.03), dark, 0, 1.24, 0.27);
    add(g, box(0.5, 0.05, 0.4), beige, 0, 0.87, -0.1);
    add(g, box(0.84, 0.05, 0.28), M(0xc8c0ad), 0, 0.875, 0.32);
    add(g, box(0.12, 0.04, 0.18), M(0xc8c0ad), 0.6, 0.87, 0.32);
    add(g, cyl(0.08, 0.07, 0.17), M(COL.gold), -0.75, 0.94, 0.2);
    add(g, box(0.4, 0.9, 0.8), beige, 1.35, 0.45, -0.05);
    const led = add(g, box(0.06, 0.06, 0.02), glowMat(COL.mint), 1.45, 0.75, 0.36);
    led.material.emissiveIntensity = 1.5;

    // Bildschirm: Canvas-Textur mit Terminal-Zeilen
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 384;
    const ctx = cv.getContext('2d');
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const screenMat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.54), screenMat);
    scr.position.set(0, 1.24, 0.29);
    g.add(scr);
    const light = new THREE.PointLight(COL.mint, 3, 3.5, 2);
    light.position.set(0, 1.3, 0.9);
    g.add(light);

    register('pc', g, {
      anchor: new THREE.Vector3(0, 2.0, -0.1), radius: 1.6,
      glow: k => {
        light.intensity = 3 + k * 9;
        led.material.emissiveIntensity = 1.5 + k * 3;
        screenMat.color.setScalar(0.82 + k * 0.18);
      }
    });

    let lines = quack ? SCREEN_QUACK : SCREEN_LINES;
    function draw(time) {
      ctx.fillStyle = '#061411';
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.font = '600 26px "JetBrains Mono", ui-monospace, monospace';
      ctx.textBaseline = 'top';
      // Zeichen nacheinander tippen, dann kurz stehen lassen und von vorn
      const total = lines.reduce((n, l) => n + l.length, 0);
      let budget = reduceMotion ? total : Math.floor(((time * 22) % (total + 70)));
      lines.forEach((l, i) => {
        const shown = l.slice(0, Math.max(0, Math.min(l.length, budget)));
        budget -= l.length;
        const warn = l.startsWith('[WARN]'), q = l.startsWith('>>');
        ctx.fillStyle = q ? '#ffbf69' : warn ? '#ffbf69' : i === 0 ? '#a9b5cc' : '#62f5d2';
        ctx.fillText(shown, 28, 30 + i * 50);
      });
      // Blinkender Cursor in der letzten Zeile
      if (reduceMotion || Math.floor(time * 2) % 2 === 0) { ctx.fillStyle = '#62f5d2'; ctx.fillRect(28, 30 + lines.length * 50, 15, 26); }
      // Scanlines und Vignette für den Röhrenlook
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let y = 0; y < cv.height; y += 4) ctx.fillRect(0, y, cv.width, 1);
      const v = ctx.createRadialGradient(256, 192, 120, 256, 192, 330);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, cv.width, cv.height);
      tex.needsUpdate = true;
    }
    return { draw, setQuack() { lines = SCREEN_QUACK; } };
  })();

  // 3D-Drucker mit fahrendem Druckkopf
  const printer = (function printer() {
    const g = new THREE.Group();
    g.position.set(2.05, 0, 1.95);
    g.rotation.y = Math.PI / 4;
    const frame = M(0x8792b8, { metalness: 0.3, roughness: 0.5 }), body = M(0x2a3352);
    add(g, box(1.5, 0.32, 1.5), body, 0, 0.16, 0);
    [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach(([x, z]) => add(g, box(0.08, 1.7, 0.08), frame, x, 1.0, z));
    add(g, box(1.48, 0.08, 0.08), frame, 0, 1.85, -0.7);
    add(g, box(1.48, 0.08, 0.08), frame, 0, 1.85, 0.7);
    add(g, box(0.08, 0.08, 1.48), frame, -0.7, 1.85, 0);
    add(g, box(0.08, 0.08, 1.48), frame, 0.7, 1.85, 0);
    add(g, box(1.15, 0.05, 1.15), M(0x1a2140), 0, 0.36, 0);
    const led = add(g, box(0.5, 0.05, 0.02), glowMat(COL.mint), 0, 0.2, 0.76);
    led.material.emissiveIntensity = 1.2;
    // Filamentrolle an der Seite
    const spool = add(g, new THREE.TorusGeometry(0.26, 0.11, 6, 12), M(COL.violet), -0.9, 1.25, 0);
    spool.rotation.y = Math.PI / 2;
    // Druckteil wächst Schicht für Schicht (ein kleiner Turm)
    const partGeo = cyl(0.24, 0.28, 0.6, 8);
    partGeo.translate(0, 0.3, 0);
    const part = add(g, partGeo, M(COL.gold, { emissive: COL.gold, emissiveIntensity: 0.08 }), 0, 0.385, 0);
    const gantry = add(g, box(1.36, 0.07, 0.07), frame, 0, 1.2, 0);
    const head = new THREE.Group();
    add(head, box(0.22, 0.2, 0.22), M(0xe7e9f2), 0, 0.1, 0);
    add(head, new THREE.ConeGeometry(0.05, 0.1, 6), M(COL.gold), 0, -0.05, 0).rotation.x = Math.PI;
    const nozzleLed = add(head, box(0.08, 0.04, 0.02), glowMat(COL.mint), 0, 0.12, 0.115);
    nozzleLed.material.emissiveIntensity = 1;
    g.add(head);

    register('printer', g, {
      anchor: new THREE.Vector3(0, 2.3, 0), radius: 1.5,
      glow: k => {
        led.material.emissiveIntensity = 1.2 + k * 3;
        nozzleLed.material.emissiveIntensity = 1 + k * 4;
        part.material.emissiveIntensity = 0.08 + k * 0.5;
      }
    });

    const BED = 0.385, H = 0.6, CYCLE = 10;
    function update(time) {
      const p = reduceMotion ? 1 : clamp01((time % CYCLE) / (CYCLE - 2.5));
      part.scale.y = Math.max(0.02, p);
      const a = time * 5.5;
      const r = 0.26 - p * 0.03;
      const x = p < 1 ? Math.cos(a) * r : 0.45, z = p < 1 ? Math.sin(a) * r : -0.4;
      const y = BED + p * H + 0.1;
      head.position.set(x, y, z);
      gantry.position.set(0, y + 0.2, z);
      spool.rotation.x = reduceMotion ? 0 : time * 0.6;
    }
    update(0);
    return { update };
  })();

  // Gummiente am Teich hinter der Burg
  const duck = (function duck() {
    const g = new THREE.Group();
    g.position.set(-3.8, 0, -0.15);
    const pond = add(world, cyl(0.62, 0.66, 0.06, 9), M(0x2b3a78, { emissive: COL.violet, emissiveIntensity: 0.12, roughness: 0.3 }), -3.8, 0.03, -0.15);
    pond.castShadow = false;
    const body = new THREE.Group();
    body.rotation.y = -Math.PI / 4;
    g.add(body);
    const yellow = M(COL.duck, { emissive: COL.duck, emissiveIntensity: 0.05 });
    add(body, new THREE.IcosahedronGeometry(0.3, 1), yellow, 0, 0.27, 0).scale.set(1.3, 0.85, 1);
    add(body, new THREE.IcosahedronGeometry(0.19, 1), yellow, 0.24, 0.55, 0);
    add(body, new THREE.ConeGeometry(0.1, 0.22, 5), yellow, -0.4, 0.38, 0).rotation.z = Math.PI / 2.6;
    add(body, new THREE.ConeGeometry(0.07, 0.2, 5), M(COL.beak), 0.46, 0.52, 0).rotation.z = -Math.PI / 2;
    const eyeMat = M(0x111111, { roughness: 0.3 });
    add(body, new THREE.SphereGeometry(0.035, 6, 4), eyeMat, 0.36, 0.62, 0.1);
    add(body, new THREE.SphereGeometry(0.035, 6, 4), eyeMat, 0.36, 0.62, -0.1);
    // Krone für den Quack Mode
    const crown = new THREE.Group();
    const gold = M(COL.gold, { emissive: COL.gold, emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.4 });
    add(crown, cyl(0.12, 0.12, 0.08, 8), gold, 0, 0, 0);
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2;
      add(crown, new THREE.ConeGeometry(0.035, 0.1, 4), gold, Math.cos(a) * 0.1, 0.08, Math.sin(a) * 0.1);
    }
    crown.position.set(0.22, 0.76, 0);
    crown.scale.setScalar(quack ? 1 : 0.001);
    body.add(crown);
    register('duck', g, {
      anchor: new THREE.Vector3(0, 1.0, 0), radius: 0.9,
      glow: k => { yellow.emissiveIntensity = 0.05 + k * 0.35; }
    });
    return { body, crown, spinT: -1, crownT: quack ? 1 : 0 };
  })();

  /* ---------- Deko: Bäume, Steine, Pfad, Laterne, Zielscheibe ---------- */
  const foliage = [M(0x2f8f7e), M(0x3a6fa0), M(0x5b4fa8)];
  [[-3.75, 1.35, 0.9], [-3.5, 3.0, 0.75], [3.75, -0.2, 0.85], [0.3, -3.8, 1], [-0.4, 3.85, 0.65], [3.8, 3.7, 0.7], [1.1, -3.5, 0.65], [-3.6, -3.7, 0.9]].forEach(([x, z, s], i) => {
    const t = new THREE.Group();
    t.position.set(x, 0, z);
    t.scale.setScalar(s);
    add(t, cyl(0.08, 0.11, 0.45, 5), M(0x5b4636), 0, 0.22, 0);
    add(t, new THREE.ConeGeometry(0.48, 0.9, 6), foliage[i % 3], 0, 0.85, 0);
    add(t, new THREE.ConeGeometry(0.36, 0.65, 6), foliage[i % 3], 0, 1.25, 0);
    world.add(t);
  });
  const rockMat = M(0x3a4466);
  [[-0.9, 3.0, 0.2], [3.2, 0.7, 0.24], [0.4, 0.6, 0.14], [-2.4, 3.9, 0.2], [1.3, -0.5, 0.16]].forEach(([x, z, r]) => {
    add(world, new THREE.DodecahedronGeometry(r, 0), rockMat, x, r * 0.6, z).rotation.set(x, z, 0);
  });
  // Pfad vom Burgtor nach vorne
  const stoneMat = M(0x2a3459);
  for (let i = 0; i < 6; i++) {
    const s = add(world, box(0.46, 0.05, 0.4), stoneMat, -1.9 + Math.sin(i * 1.7) * 0.1, 0.025, 0.1 + i * 0.62);
    s.rotation.y = Math.sin(i * 2.3) * 0.25;
    s.castShadow = false;
  }
  // Laterne
  add(world, cyl(0.04, 0.05, 1.2, 6), M(0x4b5478), -1.05, 0.6, 0.95);
  add(world, box(0.18, 0.2, 0.18), M(COL.gold, { emissive: COL.gold, emissiveIntensity: 1.6 }), -1.05, 1.28, 0.95);
  const lamp = new THREE.PointLight(COL.gold, 4, 4, 2);
  lamp.position.set(-1.05, 1.35, 0.95);
  world.add(lamp);
  // Zielscheibe mit Pfeil (Last Arrow)
  const target = new THREE.Group();
  target.position.set(-3.0, 0, 2.05);
  target.rotation.y = Math.PI / 4;
  add(target, box(0.07, 0.9, 0.07), M(0x5b4636), -0.25, 0.45, -0.1).rotation.z = 0.2;
  add(target, box(0.07, 0.9, 0.07), M(0x5b4636), 0.25, 0.45, -0.1).rotation.z = -0.2;
  [[0.42, 0xe9e4f5], [0.3, COL.violet], [0.18, 0xe9e4f5], [0.08, COL.gold]].forEach(([r, c], i) => {
    add(target, cyl(r, r, 0.06, 12), M(c), 0, 0.85, i * 0.012).rotation.x = Math.PI / 2;
  });
  const arrow = new THREE.Group();
  add(arrow, cyl(0.015, 0.015, 0.6, 5), M(0xc9b28a), 0, 0, 0);
  add(arrow, box(0.1, 0.12, 0.01), M(COL.mint), 0, 0.28, 0);
  arrow.position.set(0.05, 0.88, 0.32);
  arrow.rotation.set(Math.PI / 2 - 0.2, 0, 0.15);
  target.add(arrow);
  world.add(target);

  /* ---------- Trefferboxen und Hover-Ringe ---------- */
  world.updateMatrixWorld(true);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hits = [];
  Object.keys(objects).forEach(k => {
    const o = objects[k];
    const b = new THREE.Box3().setFromObject(o.group);
    if (k === 'duck') b.expandByScalar(0.25);
    const size = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
    const hit = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), hitMat);
    hit.position.copy(c);
    hit.userData.key = k;
    world.add(hit);
    hits.push(hit);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 40),
      new THREE.MeshBasicMaterial({ color: k === 'duck' ? COL.gold : COL.mint, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(o.base.x, 0.02, o.base.z);
    ring.scale.setScalar(o.radius);
    world.add(ring);
    o.ring = ring;
  });

  /* ---------- Partikel: Staub in der Luft und kleine Explosionen ---------- */
  const DUST = coarse ? 30 : 60;
  const dustPos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 10;
    dustPos[i * 3 + 1] = Math.random() * 5;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: COL.mint, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.35, depthWrite: false }));
  world.add(dust);

  const MAXP = 140;
  const burst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), new THREE.MeshBasicMaterial({ toneMapped: false }), MAXP);
  burst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  burst.frustumCulled = false;
  burst.count = 0;
  world.add(burst);
  const parts = [];
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpE = new THREE.Euler();
  const tmpColor = new THREE.Color();
  function spawn(pos, colors, n, power) {
    if (reduceMotion) return;
    for (let i = 0; i < n && parts.length < MAXP; i++) {
      const a = Math.random() * Math.PI * 2, up = 0.6 + Math.random() * 0.8;
      parts.push({
        p: pos.clone(), v: new THREE.Vector3(Math.cos(a) * power * Math.random(), up * power * 1.4, Math.sin(a) * power * Math.random()),
        life: 0, max: 0.7 + Math.random() * 0.6, rot: Math.random() * 6, color: colors[i % colors.length]
      });
    }
  }
  function updateParticles(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const q = parts[i];
      q.life += dt;
      if (q.life >= q.max) { parts.splice(i, 1); continue; }
      q.v.y -= 9 * dt;
      q.p.addScaledVector(q.v, dt);
      if (q.p.y < 0.05) { q.p.y = 0.05; q.v.y *= -0.35; q.v.x *= 0.7; q.v.z *= 0.7; }
      q.rot += dt * 6;
    }
    parts.forEach((q, i) => {
      const s = 1 - q.life / q.max;
      tmpQ.setFromEuler(tmpE.set(q.rot, q.rot * 0.7, 0));
      tmpM.compose(q.p, tmpQ, tmpS.setScalar(s));
      burst.setMatrixAt(i, tmpM);
      burst.setColorAt(i, tmpColor.setHex(q.color));
    });
    burst.count = parts.length;
    burst.instanceMatrix.needsUpdate = true;
    if (burst.instanceColor) burst.instanceColor.needsUpdate = true;
  }
  const BURST_COLORS = { castle: [COL.gold, COL.violet], pc: [COL.mint, 0xffffff], printer: [COL.gold, COL.mint], duck: [COL.duck, COL.gold] };
  function anchorWorld(k, out = new THREE.Vector3()) {
    const o = objects[k];
    return o.group.localToWorld(out.copy(o.anchor));
  }

  /* ---------- Kamera: isometrisch, Parallaxe per Maus ---------- */
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  const LOOK = new THREE.Vector3(0, 0.3, 0);
  const AZ = Math.PI / 4, EL = 0.6;
  let az = AZ, el = EL, tAz = AZ, tEl = EL;
  let W = 1, Hh = 1;
  function placeCamera() {
    const r = 40;
    camera.position.set(LOOK.x + r * Math.cos(el) * Math.sin(az), LOOK.y + r * Math.sin(el), LOOK.z + r * Math.cos(el) * Math.cos(az));
    camera.lookAt(LOOK);
  }
  function resize() {
    W = Math.max(1, stage.clientWidth); Hh = Math.max(1, stage.clientHeight);
    renderer.setSize(W, Hh, false);
    const aspect = W / Hh;
    const half = Math.max(5.1, 6.9 / aspect);
    Object.assign(camera, { left: -half * aspect, right: half * aspect, top: half, bottom: -half });
    camera.updateProjectionMatrix();
    dirty = true;
  }

  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('pointermove', e => {
      const nx = e.clientX / window.innerWidth * 2 - 1, ny = e.clientY / window.innerHeight * 2 - 1;
      tAz = AZ + nx * 0.12;
      tEl = EL + ny * 0.05;
    }, { passive: true });
  }

  /* ---------- Hover, Fokus und Klick ---------- */
  const spots = {};
  root.querySelectorAll('.pg-spot-item').forEach(li => { spots[li.dataset.spot] = li; });
  const src = { canvas: null, focus: null, pin: null };
  let active = null;
  function refreshActive() {
    const next = src.pin || src.focus || src.canvas;
    if (next === active) return;
    if (active && spots[active]) spots[active].classList.remove('is-hot');
    active = next;
    if (active && spots[active]) spots[active].classList.add('is-hot');
    Object.keys(objects).forEach(k => { objects[k].target = k === active ? 1 : 0; });
    renderer.domElement.style.cursor = src.canvas ? 'pointer' : '';
    dirty = true;
  }
  Object.keys(spots).forEach(k => {
    const btn = spots[k].querySelector('button');
    btn.addEventListener('focus', () => { src.focus = k; refreshActive(); });
    btn.addEventListener('blur', () => { if (src.focus === k) src.focus = null; refreshActive(); });
    btn.addEventListener('pointerenter', () => { src.pin = k; refreshActive(); });
    btn.addEventListener('pointerleave', () => { if (src.pin === k) src.pin = null; refreshActive(); });
  });

  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let pickPending = false;
  function pick(clientX, clientY) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set((clientX - r.left) / r.width * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(hits, false)[0];
    return hit ? hit.object.userData.key : null;
  }
  let lastPointer = null;
  renderer.domElement.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    lastPointer = e; pickPending = true; dirty = true;
  });
  renderer.domElement.addEventListener('pointerleave', () => { lastPointer = null; src.canvas = null; refreshActive(); });
  renderer.domElement.addEventListener('click', e => {
    const k = pick(e.clientX, e.clientY);
    if (k && spots[k]) spots[k].querySelector('button').click();
  });

  /* ---------- Intro: Objekte fallen nacheinander auf die Insel ---------- */
  const drops = [objects.castle, objects.pc, objects.printer, objects.duck].map((o, i) => ({ o, delay: 0.25 + i * 0.18 }));
  let introT = reduceMotion ? 10 : 0;
  const introStart = performance.now();

  /* ---------- Schleife ---------- */
  let visible = true, dirty = true, last = performance.now(), time = 0, lastScreen = -1;
  new IntersectionObserver(en => { visible = en[0].isIntersecting; if (visible) last = performance.now(); }).observe(stage);
  new ResizeObserver(resize).observe(stage);
  resize();
  placeCamera();
  screen.draw(0);

  const tmpV = new THREE.Vector3();
  const spotPos = {};
  function placeSpots() {
    Object.keys(spots).forEach(k => {
      anchorWorld(k, tmpV).project(camera);
      const x = Math.round((tmpV.x + 1) / 2 * W), y = Math.round((1 - tmpV.y) / 2 * Hh);
      const key = x + ',' + y;
      if (spotPos[k] === key) return;
      spotPos[k] = key;
      spots[k].style.transform = 'translate(' + x + 'px,' + y + 'px)';
    });
  }

  function frame(now) {
    if (!visible) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const moving = !reduceMotion;
    if (!moving && !dirty && !parts.length && duck.spinT < 0) return;
    time += dt;
    dirty = false;

    if (pickPending && lastPointer) {
      pickPending = false;
      const k = pick(lastPointer.clientX, lastPointer.clientY);
      if (k !== src.canvas) { src.canvas = k; refreshActive(); }
    }

    // Intro
    if (introT < 3) {
      // Echte Zeit statt Bildrate: auf langsamen Geräten dauert das Intro nicht länger
      introT = (now - introStart) / 1000;
      const e = easeOut(clamp01(introT / 1.6));
      camera.zoom = 0.8 + 0.2 * e;
      camera.updateProjectionMatrix();
      az = AZ - 0.5 * (1 - e);
    }

    // Kamera-Parallaxe und Schweben
    if (moving) {
      const f = 1 - Math.exp(-dt * 3);
      if (introT >= 1.6) { az += (tAz - az) * f; }
      el += (tEl - el) * f;
      world.position.y = Math.sin(time * 0.9) * 0.12;
      world.rotation.y = Math.sin(time * 0.25) * 0.025;
    }
    placeCamera();

    // Objekte: Einfallen, Anheben bei Hover, Stauchen bei Klick
    Object.keys(objects).forEach(k => {
      const o = objects[k];
      const f = reduceMotion ? 1 : 1 - Math.exp(-dt * 10);
      o.k += (o.target - o.k) * f;
      if (Math.abs(o.target - o.k) > 0.001) dirty = true;
      o.glow(o.k);
      o.ring.material.opacity = o.k * 0.75;
      let y = o.base.y + o.k * 0.12, s = 1;
      const d = drops.find(x => x.o === o);
      if (d && introT < 3) {
        const t = clamp01((introT - d.delay) / 0.7);
        y += (1 - easeOutBack(t)) * 3.2;
        s = Math.max(0.001, easeOut(clamp01(t * 1.6)));
      }
      let sy = s;
      if (o.pokeT >= 0) {
        o.pokeT += dt;
        const p = o.pokeT / 0.35;
        if (p >= 1) o.pokeT = -1; else sy = s * (1 - 0.14 * Math.sin(p * Math.PI));
      }
      o.group.position.y = y;
      o.group.scale.set(s, sy, s);
    });

    if (moving) {
      objects.castle.flag.rotation.y = Math.sin(time * 3) * 0.25;
      printer.update(time);
      // Ente schaukelt auf dem Teich
      duck.body.position.y = Math.sin(time * 2.1) * 0.03;
      duck.body.rotation.z = Math.sin(time * 1.6) * 0.06;
      // Staub steigt langsam auf
      const arr = dustGeo.attributes.position.array;
      for (let i = 0; i < DUST; i++) {
        arr[i * 3 + 1] += dt * (0.15 + (i % 5) * 0.04);
        if (arr[i * 3 + 1] > 5) arr[i * 3 + 1] = 0;
      }
      dustGeo.attributes.position.needsUpdate = true;
      // Bildschirm ca. 15-mal pro Sekunde neu zeichnen
      if (time - lastScreen > 0.066) { lastScreen = time; screen.draw(time); }
    }

    // Quack: Ente springt und dreht sich, Krone erscheint
    if (duck.spinT >= 0) {
      duck.spinT += dt;
      const p = clamp01(duck.spinT / 1.1);
      duck.body.rotation.y = -Math.PI / 4 + easeOut(p) * Math.PI * 4;
      duck.body.position.y = Math.sin(p * Math.PI) * 0.9;
      duck.crownT = clamp01((duck.spinT - 0.6) / 0.5);
      if (p >= 1 && duck.crownT >= 1) duck.spinT = -1;
      dirty = true;
    }
    duck.crown.scale.setScalar(Math.max(0.001, easeOutBack(duck.crownT)));

    if (parts.length) updateParticles(dt);
    else if (burst.count) burst.count = 0;

    renderer.render(scene, camera);
    placeSpots();
  }
  renderer.setAnimationLoop(frame);

  return {
    poke(k) {
      const o = objects[k];
      if (!o) return;
      if (!reduceMotion) o.pokeT = 0;
      const p = anchorWorld(k);
      p.y *= 0.75;
      spawn(p, BURST_COLORS[k], k === 'duck' ? 14 : 22, 2.2);
      dirty = true;
    },
    quack() {
      screen.setQuack();
      screen.draw(time);
      if (reduceMotion) { duck.crownT = 1; dirty = true; return; }
      duck.spinT = 0;
      const p = anchorWorld('duck');
      spawn(p, [COL.duck, COL.gold, 0xffffff], 70, 3.4);
      spawn(anchorWorld('castle'), [COL.gold], 18, 2);
      dirty = true;
    }
  };
}
