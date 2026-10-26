# Webseite: oualid.de

Persönliche Startseite: über mich, Interessen, Last Arrow, Projekte, Lebenslauf und Kontakt.
Look: dunkles Editorial-Design mit Bento-Grids. Der Hero „Welcome to my Playground“ zeigt ein interaktives
Low-Poly-Diorama im Stil von Last Arrow (Burg → Last Arrow, Retro-PC → alle Projekte, 3D-Drucker → Druckprojekte,
Gummiente am Teich → Achievement). Kobolde laufen von der Gegnerburg zu den Toren, die Türme schießen Pfeile,
Kobolde lassen sich auch anklicken. Das Terminal mit Konsole öffnet sich als Dialog (`help` eintippen). Dazu ein kleiner spielbarer
Last-Arrow-Teaser im Browser.

Reines HTML/CSS/JS, kein Build-Schritt, keine externen Anfragen (Schriften liegen lokal unter `public/fonts/`).

Design-Tokens (Farben, Typografie, Abstände, Radien, Bewegung) stehen gesammelt am Anfang von
`public/css/style.css`. Animationen respektieren `prefers-reduced-motion`.

## Aufbau

```
public/
├── index.html        Die Seite
├── impressum.html    Impressum & Datenschutz
├── css/style.css
├── js/main.js        Terminal-Dialog, Konsole, Projektfilter, Navigation, E-Mail, YouTube-Klick
├── js/playground.js  Hero-Playground: Aktionen der Objekte, Achievements, Fallback ohne WebGL
├── js/playground-world.js  3D-Diorama (three.js, nur Grundformen), wird dynamisch nachgeladen
├── js/mini-game.js   Mini Last Arrow (Canvas)
├── js/holster-viewer.js  3D-Viewer fürs Holster
├── 3d/               3D-Modelle (GLB)
├── vendor/three/     Three.js (lokal)
├── fonts/            Inter + Space Grotesk (Variable) + JetBrains Mono (OFL)
├── icons/            App-Icons (Startbildschirm, Manifest)
├── img/              Cosplay-Foto und Projekt-Screenshots (img/projekte/)
└── og.jpg            Vorschaubild für geteilte Links (WhatsApp, LinkedIn …)
```

`modelle/` enthält Quelldateien (z. B. 3MF), die nicht ausgeliefert werden.
Jeder Unterordner hat eine `LIESMICH.md`, was hineingehört.

## Hero-Playground

- Farben (Navy, Mint, Violett, Gold) und Schriften (Space Grotesk, Inter, JetBrains Mono) gelten auf der
  ganzen Seite, Tokens am Anfang von `style.css`.
- Die 3D-Welt drosselt sich selbst (Schatten, Auflösung, Kobolde), wenn ein Gerät unter ca. 40 fps fällt.
- Die 3D-Welt lädt nach dem ersten Rendern (ca. 170 KB three.js, gzip). Im Datensparmodus erst nach Klick,
  ohne WebGL erscheinen die vier Objekte als Kacheln. Bei `prefers-reduced-motion` steht die Szene still.
- Alle Objekte sind auch per Tastatur erreichbar (Tab auf die Hotspots, Enter).
- Achievements (5): Quack Mode, Erster Kobold, Koboldjäger (10 Kobolde), Bossbezwinger, Entdecker.
  Jeder sechste Kobold ist ein Boss (4 Treffer); nach seinem Sieg wächst die Burg um einen Turm.
  Gespeichert nur im Browser (`localStorage`: `oualid.achievements`, `oualid.kills`, `oualid.explored`).
  Zurücksetzen: diese drei Schlüssel in der Browser-Konsole mit `localStorage.removeItem(...)` löschen.
  In der Konsole der Seite zeigen `achievements` und `kobolde` den Stand.

## Sicherheit (CSP)

`nginx.conf` erlaubt Inline-Skripte nur per SHA-256-Hash (Import-Map und `js`-Klasse in `index.html`
und `en/index.html`, Mail-Skript in `impressum.html`). Wird eines davon geändert, Hashes neu berechnen und in `nginx.conf` eintragen:

```bash
python3 -c "import re,hashlib,base64;[print(f,\"'sha256-\"+base64.b64encode(hashlib.sha256(m.encode()).digest()).decode()+\"'\") for f in ['public/index.html','public/en/index.html','public/impressum.html'] for m in re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>',open(f,encoding='utf-8').read(),re.S)]"
```

## Englische Version

`public/en/index.html` ist die englische Fassung von `public/index.html`. Textänderungen bitte in **beiden**
Dateien machen. Oberflächentexte in den Skripten (Konsole, Kopieren, Minispiel, 3D-Viewer) stehen in
`js/main.js`, `js/mini-game.js` und `js/holster-viewer.js` und richten sich nach `<html lang>`.

## Devlog

Zurzeit ausgeblendet. Einträge für Last Arrow liegen in `public/devlog/eintraege.json`; wie man den
Devlog wieder einschaltet, steht in `public/devlog/LIESMICH.md`.

## Lebenslauf als PDF

`public/lebenslauf.pdf` und `public/en/cv.pdf` werden aus `lebenslauf/` erzeugt
(Anleitung: `lebenslauf/LIESMICH.md`).

## Betrieb

- Eigene 404-Seiten: `public/404.html` und `public/en/404.html`
- Health-Check: `/healthz`, Docker prüft ihn jede Minute (`docker compose ps` zeigt `healthy`)
- `robots.txt` und `sitemap.xml` liegen in `public/`

## Lokal ansehen

```bash
cd public && python3 -m http.server 8000
# http://localhost:8000
```

## Auf dem Pi (Docker)

```bash
./deploy.sh
```

Der Container lauscht nur lokal auf `127.0.0.1:8104`. Davor sitzt **Caddy** als Reverse Proxy mit HTTPS.

Einmalig auf dem Pi:

```bash
git clone https://github.com/Marmelade1357/Webseite.git ~/webseite
cd ~/webseite && chmod +x deploy.sh && ./deploy.sh
curl -I http://127.0.0.1:8104/          # muss "200 OK" liefern
```

Dann den Eintrag aus `caddy/oualid.de.caddy` in die Caddyfile übernehmen (meist `/etc/caddy/Caddyfile`):

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Im Caddy-Eintrag steht bewusst keine `log`-Anweisung, weil die Datenschutzerklärung zusagt, dass keine
Zugriffsprotokolle geschrieben werden. Beim DNS-Anbieter müssen `oualid.de` und `www.oualid.de` auf die
öffentliche IP des Pi zeigen (Router: Ports 80 und 443 an den Pi weiterleiten), wie bei den Subdomains.

Updates danach nur noch: `cd ~/webseite && ./deploy.sh`

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
