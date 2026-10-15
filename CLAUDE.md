# Hinweise für Claude

- Wenn der Nutzer Dateien liefern soll (Bilder, Modelle, Videos …), immer zuerst die
  passende Ordnerstruktur im Repo anlegen (mit `.gitkeep` und einer kurzen `LIESMICH.md`,
  was wohin gehört), sodass er die Dateien nur noch hineinlegen muss.
- Seiteninhalte und Kommentare auf Deutsch.
- Reines HTML/CSS/JS ohne Build-Schritt, keine externen CDNs (CSP erlaubt nur `'self'`
  und YouTube-nocookie im iframe). Bilder vor dem Einbinden verkleinern (WebP/JPG).
- Deployment auf dem Raspberry Pi per Docker (`./deploy.sh`), Container auf `127.0.0.1:8104`.
