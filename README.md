# Webseite: oualid.de

Persönliche Startseite: über mich, Interessen, Last Arrow, Projekte, Lebenslauf und Kontakt.
Look: Terminal mit interaktiver Konsole (`help` eintippen), tmux-Statusleiste als Navigation
und einem kleinen spielbaren Last-Arrow-Teaser im Browser.

Reines HTML/CSS/JS, kein Build-Schritt, keine externen Anfragen (Schriften liegen lokal unter `public/fonts/`).

## Aufbau

```
public/
├── index.html        Die Seite
├── impressum.html    Impressum & Datenschutz
├── css/style.css
├── js/main.js        Startsequenz, Konsole, Projektfilter, Navigation, E-Mail, YouTube-Klick
├── js/mini-game.js   Mini Last Arrow (Canvas)
├── js/holster-viewer.js  3D-Viewer fürs Holster
├── 3d/               3D-Modelle (GLB)
├── vendor/three/     Three.js (lokal)
├── fonts/            JetBrains Mono + Space Grotesk (OFL)
├── img/              Cosplay-Foto und Projekt-Screenshots (img/projekte/)
└── og.png            Vorschaubild für geteilte Links (WhatsApp, LinkedIn …)
```

`modelle/` enthält Quelldateien (z. B. 3MF), die nicht ausgeliefert werden.
Jeder Unterordner hat eine `LIESMICH.md`, was hineingehört.

## Lokal ansehen

```bash
cd public && python3 -m http.server 8000
# http://localhost:8000
```

## Auf dem Pi (Docker)

```bash
./deploy.sh
```

Der Container lauscht auf `127.0.0.1:8104`. Im Reverse Proxy die Hauptdomain (`oualid.de`) auf diesen Port zeigen lassen.

## Cosplay-Foto

Einfach als `public/img/cosplay.jpg` hochladen (Hochformat, ideal 3:4, etwa 960 × 1280, unter 500 KB).
Solange die Datei fehlt, zeigt die Seite einen Platzhalter.

## 3D-Viewer (Holster)

- Modell: `public/3d/holster.glb`, erzeugt aus der Bambu-Studio-Datei (Original liegt nicht im Repo)
  (Holster und Ringe in Originalauflösung, Rückteil auf 8 % vereinfacht, Charges zusammengesetzt).
- Code: `public/js/holster-viewer.js`, Three.js liegt lokal unter `public/vendor/three/` (MIT-Lizenz).
- Lädt erst nach Klick auf „In 3D ansehen“.

## Noch offen

- **Zertifikate:** im Lebenslauf ergänzen, sobald vorhanden.
