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
├── fonts/            JetBrains Mono + Space Grotesk (OFL)
└── img/              Bilder (z. B. cosplay.jpg)
entwuerfe/            Die ersten Designentwürfe (werden nicht ausgeliefert)
```

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

## Noch offen

- **Cosplay-Foto:** als `public/img/cosplay.jpg` ablegen, in `index.html` das `<img>` einkommentieren und den Platzhalter löschen.
- **Trailer:** YouTube-ID bei `data-youtube-id=""` in `index.html` eintragen. Das Video lädt erst nach Klick.
- **LinkedIn:** Profil-URL in `index.html` (Abschnitt Kontakt) eintragen und die Zeile einkommentieren.
- **Impressum:** Anschrift in `impressum.html` eintragen.
- **Zertifikate:** im Lebenslauf ergänzen, sobald vorhanden.
