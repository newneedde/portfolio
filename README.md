# Portfolio (Mobile first, Light & Dark)

Statische Seite ohne Build-Schritt für GitHub Pages: HTML, CSS und etwas JavaScript.
Schriften (Inter, IBM Plex Mono) liegen lokal in `fonts/` – keine Verbindung zu Drittanbietern.

```
.
├── css/        tokens.css (Figma-Variablen, Light/Dark) · site.css (Layout, Kacheln, Maske)
├── js/         theme.js (Hell/Dunkel-Schalter) · gate.js (Zugangsmaske)
├── fonts/      Inter, IBM Plex Mono (woff2) + Lizenzen
├── referenzen/
│   ├── index.html    Zugangsmaske
│   └── inhalt.enc    verschlüsselter Inhalt (nur Chiffretext)
├── robots.txt
└── .nojekyll
```

## Veröffentlichen (GitHub Pages)

```bash
git clone https://github.com/newneedde/portfolio.git   # einmalig
cd portfolio
# Inhalt dieses Ordners hineinkopieren, dann:
git add .
git commit -m "Referenzbereich mit Zugangscode"
git push origin main
```

**Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save.**
Danach erreichbar unter `https://newneedde.github.io/portfolio/referenzen/` (Referenz 02 direkt: `…/referenzen/#referenz-02`).

Später mit eigener Domain: Datei `CNAME` im Repo-Root mit `www.newneed.de` anlegen, beim Provider `www → newneedde.github.io` als CNAME setzen, in den Pages-Einstellungen „Enforce HTTPS“ aktivieren.

## Link von der Startseite

```html
<a href="referenzen/">Referenzen ansehen</a>
```

Aus Unterseiten entsprechend relativ, zum Beispiel `../referenzen/`. Die Navigation der Referenzseite verweist auf `../`, `../#referenzen` und `../#kontakt`; die Anker müssen auf der Startseite als `id` existieren.

## So funktioniert der Zugangsschutz

Der Inhalt liegt nur verschlüsselt in `referenzen/inhalt.enc` (AES-256-GCM, Schlüssel per PBKDF2 aus dem Code). Die Maske lädt die Datei, entschlüsselt sie im Browser und zeigt den Inhalt an. Ohne Code sieht man im Repo und im Netz nur Chiffretext.

- Der Code wird nicht im Repo gespeichert.
- Neuer Inhalt oder neuer Code: Datei `inhalt.enc` im privaten Ordner `quelle-privat` neu erzeugen (siehe dort) und pushen.
- Die Maske braucht https (GitHub Pages bietet das) und funktioniert nicht über `file://`; lokal testen mit `python3 -m http.server`.
