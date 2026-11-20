# Portfolio (Mobile first, Light & Dark)

Statische Seite ohne Build-Schritt für GitHub Pages: HTML, CSS und etwas JavaScript.
Schriften (Inter, IBM Plex Mono) liegen lokal in `fonts/` – keine Verbindung zu Drittanbietern.

```
.
├── css/        tokens.css (Figma-Variablen, Light/Dark) · site.css (Layout, Kacheln, Maske)
├── js/         theme.js (Hell/Dunkel) · site.js (Sprachschalter DE/EN, E-Mail) · gate.js (Zugangsmaske)
├── fonts/      Inter, IBM Plex Mono (woff2) + Lizenzen
├── index.html · impressum.html · datenschutz.html        Deutsch
├── referenzen/
│   ├── index.html    Zugangsmaske
│   └── inhalt.enc    verschlüsselter Inhalt, Referenz 01–03 (nur Chiffretext)
├── en/                                                   Englisch
│   ├── index.html · imprint.html · privacy.html
│   └── references/
│       ├── index.html    Zugangsmaske (englisch)
│       └── content.enc   verschlüsselter Inhalt, englisch
├── zugang.json      Zugangscodes / Einladungslinks (nur verschlüsselt)
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

## Sprachen

Jede Seite hat oben links den Schalter „Sprache: DE“ / „Language: EN“ (gleiche Form wie „Darstellung“ oben rechts). Er führt auf die entsprechende Seite der anderen Sprache und übernimmt den Anker, z. B. `#ansatz` ↔ `#approach`, `#referenz-02` ↔ `#reference-02` (Zuordnung in `js/site.js`). Ein einmal eingegebener Zugangscode gilt in derselben Browser-Sitzung für beide Sprachen.

Paare: `/` ↔ `/en/` · `impressum.html` ↔ `en/imprint.html` · `datenschutz.html` ↔ `en/privacy.html` · `referenzen/` ↔ `en/references/`

## Link von der Startseite

```html
<a href="referenzen/">Referenzen ansehen</a>
```

Aus Unterseiten entsprechend relativ, zum Beispiel `../referenzen/`. Die Navigation der Referenzseite verweist auf `../`, `../#referenzen` und `../#kontakt`; die Anker müssen auf der Startseite als `id` existieren.

## So funktioniert der Zugangsschutz

Der Inhalt liegt nur verschlüsselt in `referenzen/inhalt.enc` (AES-256-GCM, Schlüssel per PBKDF2 aus dem Code). Die Maske lädt die Datei, entschlüsselt sie im Browser und zeigt den Inhalt an. Ohne Code sieht man im Repo und im Netz nur Chiffretext.

- Der Code wird nicht im Repo gespeichert.
- **Einladungslink:** `https://www.newneed.de/referenzen/#show-me-more` (englisch: `…/en/references/#show-me-more`) öffnet den Bereich ohne Eingabe. Der Code verschwindet danach aus der Adresszeile; der Browser merkt ihn sich für beide Sprachen.
- **Mehrere Codes:** `zugang.json` enthält je Zugangscode einen Eintrag mit dem verschlüsselten Hauptcode. Ein Eintrag weniger = dieser Code/Link gesperrt, alle anderen gelten weiter. Erzeugt wird die Datei mit `quelle-privat/zugang-erstellen.mjs`.
- Ohne Link: „Zugang per E-Mail anfragen“ oder Code eingeben (Groß-/Kleinschreibung, Leer- und Satzzeichen egal).
- Neuer Inhalt oder neuer Code: `inhalt.enc` und `en/references/content.enc` im privaten Ordner `quelle-privat` neu erzeugen (siehe dort) und pushen.
- Oben auf jeder Referenz erscheint eine Navigation zu allen Referenzen (01 · 02 · 03).
- Die Maske braucht https (GitHub Pages bietet das) und funktioniert nicht über `file://`; lokal testen mit `python3 -m http.server`.
