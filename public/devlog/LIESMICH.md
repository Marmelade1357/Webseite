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
