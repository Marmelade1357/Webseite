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
  ? ['$ ./start-playground.sh', '[ OK ] castle online', '[ OK ] printer at 220°C', '[ OK ] 15 projects loaded', '[WARN] duck not found']
  : ['$ ./start-playground.sh', '[ OK ] Burg online', '[ OK ] Drucker: 220°C', '[ OK ] 15 Projekte geladen', '[WARN] Ente nicht gefunden'];
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
  const top = add(world, box(SIZE, 0.3, SIZE), M(0x3d7348), 0, -0.15, 0);
  top.castShadow = false;
  // Schwebender Felssockel: Pyramidenstumpf mit vier Seiten
  const rock = add(world, cyl(SIZE / Math.SQRT2, 2.4, 2.4, 4), M(0x5a4a6e), 0, -1.5, 0);
  rock.rotation.y = Math.PI / 4;
  rock.castShadow = false;
  // Raster und leuchtende Kante: Spielbrett-Gefühl
  const grid = new THREE.GridHelper(SIZE, 9, COL.mint, COL.mint);
  grid.material.transparent = true;
  grid.material.opacity = 0.05;
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

  // Eigene Burg aus Last Arrow: Sandstein, runde Ecktürme mit orangen Spitzdächern,
  // zwei Holztore, Häuser mit roten Dächern und die Schatztruhe im Hof
  (function castle() {
    const g = new THREE.Group();
    g.position.set(-1.9, 0, -1.75);
    const sand = M(0xd8b88a), sandDark = M(0xbf9a6c), wood = M(0x7a4a2c), timber = M(0x8a4b2e);
    const roof = glowMat(0xf08a4b), redRoof = glowMat(0xd9502f), win = glowMat(COL.gold), flagMat = glowMat(0xf07a3a);
    win.emissiveIntensity = 0.7;
    const W = 3.2, D = 2.4, T = 0.26, H = 0.78;
    add(g, box(W, 0.05, D), M(0x4f8a4a), 0, 0.025, 0);
    // Mauern mit Zinnen
    [[0, -D / 2, W, T], [0, D / 2, W, T], [-W / 2, 0, T, D], [W / 2, 0, T, D]].forEach(([x, z, w, d]) => {
      add(g, box(w, H, d), sand, x, H / 2, z);
      const along = w > d, len = along ? w : d, n = Math.round(len / 0.22);
      for (let i = 0; i < n; i += 2) {
        const o = -len / 2 + (i + 0.5) * len / n;
        add(g, box(along ? len / n : T, 0.16, along ? T : len / n), sand, along ? o : x, H + 0.08, along ? z : o);
      }
    });
    // Torhäuser mit Holztoren auf der Vorderseite
    [-0.62, 0.62].forEach(x => {
      add(g, box(0.62, 1.0, 0.4), sandDark, x, 0.5, D / 2);
      add(g, box(0.44, 0.58, 0.04), wood, x, 0.29, D / 2 + 0.21);
      add(g, box(0.48, 0.05, 0.05), M(0x4a2e1c), x, 0.42, D / 2 + 0.23);
      add(g, box(0.48, 0.05, 0.05), M(0x4a2e1c), x, 0.18, D / 2 + 0.23);
    });
    // Runde Ecktürme mit Türmchen, Spitzdach und Fahne
    let waving = null;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => {
      const x = sx * W / 2, z = sz * D / 2;
      add(g, cyl(0.46, 0.54, 1.1, 10), sand, x, 0.55, z);
      add(g, cyl(0.52, 0.52, 0.14, 10), sandDark, x, 1.17, z);
      add(g, cyl(0.22, 0.24, 0.5, 8), sand, x, 1.45, z);
      add(g, new THREE.ConeGeometry(0.32, 0.55, 8), roof, x, 1.97, z);
      const w = add(g, box(0.08, 0.2, 0.04), win, x + 0.36, 0.7, z + 0.36);
      w.rotation.y = Math.PI / 4;
      add(g, cyl(0.015, 0.015, 0.4, 4), M(0x5a4636), x, 2.35, z);
      const fg = box(0.24, 0.14, 0.015);
      fg.translate(0.12, 0, 0); // Drehpunkt am Mast, damit die Fahne weht
      const f = add(g, fg, flagMat, x + 0.01, 2.46, z);
      if (i === 3) waving = f;
    });
    // Häuser mit roten Dächern
    [[-0.75, -0.45, 0], [0.8, 0.2, Math.PI / 2]].forEach(([x, z, r]) => {
      const h = new THREE.Group();
      h.position.set(x, 0, z);
      h.rotation.y = r;
      add(h, box(0.95, 0.5, 0.62), timber, 0, 0.3, 0);
      const rf = add(h, new THREE.ConeGeometry(0.62, 0.45, 4), redRoof, 0, 0.77, 0);
      rf.rotation.y = Math.PI / 4;
      rf.scale.set(1.25, 1, 0.85);
      const hw = add(h, box(0.16, 0.14, 0.02), win, 0.22, 0.32, 0.32);
      hw.castShadow = false;
      g.add(h);
    });
    // Schatztruhe
    add(g, box(0.24, 0.14, 0.16), wood, 0.05, 0.12, 0.45);
    add(g, box(0.26, 0.05, 0.18), M(COL.gold, { emissive: COL.gold, emissiveIntensity: 0.4 }), 0.05, 0.21, 0.45);
    const light = new THREE.PointLight(COL.gold, 0, 6, 2);
    light.position.set(0, 1.8, 1.2);
    g.add(light);
    register('castle', g, {
      anchor: new THREE.Vector3(0, 2.7, 0), radius: 2.3,
      glow: k => {
        roof.emissiveIntensity = k * 0.55;
        redRoof.emissiveIntensity = k * 0.35;
        flagMat.emissiveIntensity = k * 0.6;
        win.emissiveIntensity = 0.7 + k * 2.2;
        light.intensity = k * 14;
      }
    });
    objects.castle.flag = waving;
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
    g.position.set(-4.1, 0, -2.55);
    const pond = add(world, cyl(0.38, 0.42, 0.06, 9), M(0x3f8fc4, { emissive: 0x2a6fa8, emissiveIntensity: 0.35, roughness: 0.25 }), -4.1, 0.03, -2.55);
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

  /* ---------- Deko aus Last Arrow: Bäume, Erdwege, Fluss, gegnerische Burg, Portal ---------- */
  // Tannen in Türkis und runde Laubbäume in Violett
  const pine = M(0x2f9a8a), pineDark = M(0x27806f), bark = M(0x5b4636);
  const blossom = [M(0x8a5cc4), M(0xa36fd6), M(0x7a4fb5)];
  function tree(x, z, s, kind) {
    const t = new THREE.Group();
    t.position.set(x, 0, z);
    t.scale.setScalar(s);
    add(t, cyl(0.07, 0.1, 0.4, 5), bark, 0, 0.2, 0);
    if (kind === 'pine') {
      add(t, new THREE.ConeGeometry(0.46, 0.85, 6), pineDark, 0, 0.75, 0);
      add(t, new THREE.ConeGeometry(0.34, 0.65, 6), pine, 0, 1.15, 0);
    } else {
      const m = blossom[Math.abs(Math.round(x * 7 + z * 3)) % 3];
      add(t, new THREE.IcosahedronGeometry(0.4, 0), m, 0, 0.72, 0);
      add(t, new THREE.IcosahedronGeometry(0.3, 0), m, 0.22, 0.88, 0.1);
      add(t, new THREE.IcosahedronGeometry(0.28, 0), m, -0.2, 0.86, -0.12);
    }
    world.add(t);
  }
  [[-3.6, -4.05, 0.85, 'pine'], [-2.9, -4.0, 0.75, 'round'], [-4.1, -1.6, 0.8, 'round'], [0.3, -3.9, 0.95, 'pine'],
   [1.1, -3.6, 0.7, 'round'], [3.8, -0.2, 0.85, 'pine'], [3.9, 3.8, 0.75, 'round'], [3.95, 2.6, 0.7, 'pine'],
   [-4.0, 1.9, 0.8, 'pine'], [-4.05, 4.0, 0.7, 'round'], [0.7, 4.05, 0.7, 'pine'], [-0.05, -3.2, 0.6, 'round']].forEach(([x, z, s, k]) => tree(x, z, s, k));

  // Erdwege vom Burgtor zur gegnerischen Burg
  const dirt = M(0x6b4a32), dirtDark = M(0x553a27);
  function road(x1, z1, x2, z2) {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const r = add(world, box(0.34, 0.03, len), dirt, (x1 + x2) / 2, 0.016, (z1 + z2) / 2);
    r.rotation.y = Math.atan2(x2 - x1, z2 - z1);
    r.castShadow = false;
    const groove = add(world, box(0.06, 0.035, len), dirtDark, (x1 + x2) / 2, 0.018, (z1 + z2) / 2);
    groove.rotation.y = r.rotation.y;
    groove.castShadow = false;
  }
  road(-2.52, -0.35, -2.75, 1.1);
  road(-1.28, -0.35, -1.6, 1.1);
  road(-2.75, 1.1, -2.6, 2.0);
  road(-1.6, 1.1, -2.1, 2.0);

  // Fluss zwischen den Burgen, mit Holzbrücke
  const water = M(0x3f8fc4, { emissive: 0x2a6fa8, emissiveIntensity: 0.35, roughness: 0.25 });
  const riverPts = [[-4.5, 1.15], [-2.9, 1.35], [-1.3, 1.55], [-0.6, 2.4], [-0.45, 3.4], [-0.6, 4.5]];
  for (let i = 0; i < riverPts.length - 1; i++) {
    const [x1, z1] = riverPts[i], [x2, z2] = riverPts[i + 1];
    const len = Math.hypot(x2 - x1, z2 - z1) + 0.12;
    const w = add(world, box(0.5, 0.04, len), water, (x1 + x2) / 2, 0.022, (z1 + z2) / 2);
    w.rotation.y = Math.atan2(x2 - x1, z2 - z1);
    w.castShadow = false;
  }
  add(world, box(1.3, 0.06, 0.62), M(0x8a5a36), -2.2, 0.07, 1.42).rotation.y = -0.12;

  // Gegnerische Burg: dunkler Stein, violette Dächer, unter einer Schutzkuppel
  const enemy = new THREE.Group();
  enemy.position.set(-2.4, 0, 3.15);
  const dark = M(0x44465a), roofV = M(0x6a4bb0);
  const ES = 1.3;
  [[0, -ES / 2, ES, 0.18], [0, ES / 2, ES, 0.18], [-ES / 2, 0, 0.18, ES], [ES / 2, 0, 0.18, ES]].forEach(([x, z, w, d]) => add(enemy, box(w, 0.55, d), dark, x, 0.275, z));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    add(enemy, box(0.3, 0.8, 0.3), dark, sx * ES / 2, 0.4, sz * ES / 2);
    add(enemy, new THREE.ConeGeometry(0.26, 0.5, 4), roofV, sx * ES / 2, 1.05, sz * ES / 2).rotation.y = Math.PI / 4;
  });
  add(enemy, box(0.5, 1.0, 0.5), dark, 0, 0.5, 0);
  add(enemy, new THREE.ConeGeometry(0.42, 0.6, 4), roofV, 0, 1.3, 0).rotation.y = Math.PI / 4;
  add(enemy, box(0.1, 0.1, 0.02), M(COL.mint, { emissive: COL.mint, emissiveIntensity: 1.2 }), 0.12, 0.62, 0.26);
  // Kuppel aus Längen- und Breitengraden, wie der Schild im Spiel
  const R = 1.25, domeLines = [];
  for (let m = 0; m < 12; m++) {
    const a = m / 12 * Math.PI * 2;
    for (let j = 0; j < 8; j++) {
      const t1 = j / 8 * Math.PI / 2, t2 = (j + 1) / 8 * Math.PI / 2;
      domeLines.push(Math.cos(a) * Math.cos(t1) * R, Math.sin(t1) * R, Math.sin(a) * Math.cos(t1) * R,
        Math.cos(a) * Math.cos(t2) * R, Math.sin(t2) * R, Math.sin(a) * Math.cos(t2) * R);
    }
  }
  for (let p = 0; p < 4; p++) {
    const t = p / 4 * Math.PI / 2, rr = Math.cos(t) * R, y = Math.sin(t) * R;
    for (let j = 0; j < 32; j++) {
      const a1 = j / 32 * Math.PI * 2, a2 = (j + 1) / 32 * Math.PI * 2;
      domeLines.push(Math.cos(a1) * rr, y, Math.sin(a1) * rr, Math.cos(a2) * rr, y, Math.sin(a2) * rr);
    }
  }
  const domeGeo = new THREE.BufferGeometry();
  domeGeo.setAttribute('position', new THREE.Float32BufferAttribute(domeLines, 3));
  const domeMat = new THREE.LineBasicMaterial({ color: COL.mint, transparent: true, opacity: 0.6, toneMapped: false });
  enemy.add(new THREE.LineSegments(domeGeo, domeMat));
  const shell = new THREE.Mesh(new THREE.SphereGeometry(R, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: COL.mint, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  enemy.add(shell);
  world.add(enemy);

  // Steinkreis mit leuchtendem Portal (hier kommen die Kobolde her)
  const portal = new THREE.Group();
  portal.position.set(0.55, 0, 3.55);
  const stoneM = M(0x4a4c5c);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2;
    const st = add(portal, box(0.16, 0.42 + (i % 3) * 0.08, 0.14), stoneM, Math.cos(a) * 0.5, 0.22, Math.sin(a) * 0.5);
    st.rotation.y = -a;
  }
  add(portal, cyl(0.3, 0.32, 0.06, 12), M(0x5a5c6c), 0, 0.03, 0);
  const portalGlow = add(portal, cyl(0.2, 0.2, 0.02, 16), new THREE.MeshBasicMaterial({ color: COL.mint, toneMapped: false }), 0, 0.07, 0);
  portalGlow.castShadow = false;
  world.add(portal);

  // Laterne am Weg
  add(world, cyl(0.04, 0.05, 1.1, 6), M(0x4b5478), -0.85, 0.55, 0.45);
  add(world, box(0.16, 0.18, 0.16), M(COL.gold, { emissive: COL.gold, emissiveIntensity: 1.6 }), -0.85, 1.18, 0.45);
  const lamp = new THREE.PointLight(COL.gold, 4, 4, 2);
  lamp.position.set(-0.85, 1.25, 0.45);
  world.add(lamp);

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
      domeMat.opacity = 0.5 + Math.sin(time * 1.6) * 0.15;
      portalGlow.scale.setScalar(1 + Math.sin(time * 3) * 0.12);
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
