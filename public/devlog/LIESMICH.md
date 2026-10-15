# Devlog zu Last Arrow

Die Einträge stehen in `eintraege.json` und erscheinen automatisch im Abschnitt „Last Arrow“
(neueste zuerst). Neuen Eintrag einfach oben in die Liste kopieren:

```json
{
  "datum": "2026-11-02",
  "titel": { "de": "Neuer Boss", "en": "New boss" },
  "text":  { "de": "Was sich geändert hat …", "en": "What changed …" }
}
```

- `datum` im Format JJJJ-MM-TT.
- Statt `{ "de": …, "en": … }` geht auch nur ein Text (`"titel": "Neuer Boss"`), der dann auf beiden Sprachen erscheint.
- Einträge durch Komma trennen. Ist die Datei leer (`[]`), wird der Devlog ausgeblendet.

## Devlog wieder einschalten

Der Devlog ist im Moment ausgeblendet. Zum Einschalten in `public/index.html` (und genauso in
`public/en/index.html`, dort mit `data-src="../devlog/eintraege.json"`) den Kommentar
`<!-- Devlog ausgeblendet … -->` im Abschnitt „Last Arrow“ durch diesen Block ersetzen:

```html
    <div class="devlog" id="devlog" hidden>
      <h3 class="devlog-title"><span class="mono-label">tail -f devlog.md</span> Devlog</h3>
      <ol class="devlog-list" id="devlog-list"></ol>
    </div>
```

Oder einfach Claude bitten, den Devlog wieder einzuschalten.
