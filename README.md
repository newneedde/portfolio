# Portfolio (Mobile first, Hell · Dunkel · Editorial)

Statische Seite ohne Build-Schritt für GitHub Pages: HTML, CSS und etwas JavaScript.
Schriften (Inter, IBM Plex Mono) liegen lokal in `fonts/` – keine Verbindung zu Drittanbietern.

```
.
├── css/        tokens.css (Figma-Variablen, Light/Dark) · site.css (Layout, Kacheln, Maske) · editorial.css (Darstellung Editorial)
├── js/         theme.js (Automatisch/Hell/Dunkel/Editorial) · site.js (Sprachschalter DE/EN, E-Mail) · editorial.js (Editorial, Hochzählen) · gate.js (Zugangsmaske)
├── fonts/      Inter, IBM Plex Mono, Instrument Serif, Geist (woff2) + Lizenzen
├── index.html · impressum.html · datenschutz.html        Deutsch
├── referenzen/
│   ├── index.html    Zugangsmaske
│   └── inhalt.enc    verschlüsselter Inhalt, Referenz 01–07 (nur Chiffretext)
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
- Oben auf jeder Referenz erscheint eine Navigation zu allen Referenzen (01–07; 05 Logistik/Kuehne+Nagel, 06 Banking-Studie, 07 Mini Figure Out).
- Die Maske braucht https (GitHub Pages bietet das) und funktioniert nicht über `file://`; lokal testen mit `python3 -m http.server`.

## Darstellung „Editorial“

Der Schalter oben rechts bietet **Automatisch · Hell · Dunkel · Editorial** (Wahl wird im Browser gemerkt). Editorial gibt es vorerst nur auf den deutschen Seiten; die englischen Seiten bieten Auto · Light · Dark.

- Gestaltung 1:1 aus Figma „CV 2026“, Seite „Website editorial“ (Theme-Modus Editorial, Responsive 390/1280). Schriften Instrument Serif und Geist liegen lokal in `fonts/` (SIL OFL).
- Startseite: Die Editorial-Fassung steht in `index.html` als `<template id="editorial-start">` und wird von `js/editorial.js` eingesetzt.
- Referenzen: `inhalt.enc` enthält je Referenz zusätzlich `editorial` (HTML). Bilder werden nicht doppelt gespeichert – `<img data-ref="N">` übernimmt das N-te Bild der Bento-Fassung.
- Bewegung (nur Editorial, jeweils einmal beim Sichtbarwerden, bei „Bewegung reduzieren“ aus):
  - Kennzahlen mit Plus- und Normalwerten zählen kurz hoch (0,9 s); Minuswerte bleiben stehen. Screenreader lesen nur den Endwert.
  - Serif-Überschriften (Titel, Abschnittssätze, Schritt-Titel, Erkenntnis) färben sich Wort für Wort von Hellgrau zur Endfarbe (45 ms Versatz, 0,5 s).
  - Abbildungen blenden ein, Screens folgen gestaffelt (80 ms) und rücken 12 px nach oben.
  - Hover: Unterstreichung in Navigation, Index und Schalter wächst von links; Pfeil bei Zurück/Weiter rückt 4 px; der Index scrollt sanft zur aktiven Referenz.
  - Wechsel der Darstellung blendet über (View Transitions, 0,35 s) und hält die Scrollposition ungefähr.
- **Wichtig für `quelle-privat`:** Wer `inhalt.enc` neu erzeugt, muss die Editorial-Fassung mit hinein nehmen (`build_editorial.py` aus dem Paket „quelle-privat-editorial“), sonst fällt die Referenz im Editorial-Modus auf Bento zurück.
