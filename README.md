# Portfolio (Mobile first · Bento und Editorial · Hell und Dunkel · DE/EN)

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
│   ├── inhalt.enc    verschlüsselter Inhalt, Referenz 01–07 (nur Chiffretext)
│   └── medien/       verschlüsselte Loop-Videos (media-05.bin seaexplorer-Karte, media-06.bin Banking-Assistent)
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

## Darstellung, Hell/Dunkel, Sprache (Stand 24.11.2026)

Oben links: **Deutsch · English** (Links auf die Gegenseite, Anker werden mitübersetzt – `js/site.js`).
Oben rechts: **Bento · Editorial** und ein Knopf **Hell/Dunkel** (Sonne = hell, Mond = dunkel; Klick wechselt).

- Zwei unabhängige Einstellungen, im Browser gemerkt: `view` (Standard **Editorial**) und `mode` (ohne Wahl gilt die Systemeinstellung).
- HTML-Attribute: `<html data-view="editorial">` und `data-theme="light|dark"`. Die alte Einstellung `theme` wird beim ersten Besuch übernommen und aufgeräumt.
- Editorial gibt es jetzt auf Deutsch und Englisch, jeweils hell und dunkel (Figma-Modus „Editorial Dunkel“, Tokens in `css/editorial.css`, alle Kontraste WCAG AA).
- Bento ist unverändert (alte Texte, Referenz 01–07 hinter dem Code).

## Arbeiten (Editorial)

Neue Reihenfolge: **01 Banking (öffentlich)** · Zugang · 02 Design System · 03 Chat und Video · 04 Basisalarm · 05 Alarmierung · 06 Logistik · 07 Mini Figure Out.

- `referenzen/` (EN `en/references/`) zeigt ohne Code **Arbeit 01 aiba** aus `<template id="arbeit-oeffentlich">`; Bilder in `img/arbeiten/`, Video in `media/`.
- `#arbeit-02` … `#arbeit-07` (EN `#work-02` …) zeigen ohne Code die Zugangsmaske, mit Code den verschlüsselten Inhalt (`works` in `inhalt.enc` / `content.enc`).
- Erzeugt wird alles mit `quelle-privat/arbeiten_bauen.py <repo> <hauptcode>` (Texte in `quelle-privat/arbeiten_texte.py`). Der Hauptcode und die Klartexte liegen nie im Repo.
- Zweispalter (Bild links, nummerierte Erklärung rechts, ohne Fläche): Arbeit 01 Schritt 1, Arbeit 03 und 04 Titelbild. Beim Sichtbarwerden erst das Bild, dann die Punkte nacheinander; bei „Bewegung reduzieren“ ohne Animation.
- `referenzen/medien/media-06.bin` wird nicht mehr gebraucht (aiba-Video ist öffentlich).

## Darstellung „Editorial“ (Details aus 11/2026)


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

## Videos in den Referenzen (Editorial)

Referenz 05 (Schritt 2, seaexplorer-Karte) und Referenz 06 (Schritt 1, Banking-Assistent) zeigen statt Standbildern kurze Loop-Videos (MP4/H.264, 11,4 s bzw. 22 s, je ca. 0,5 MB).

- Die Videos liegen **verschlüsselt** in `referenzen/medien/*.bin` (12 Byte IV + AES-256-GCM, gleicher Schlüssel wie `inhalt.enc`) – ohne Code nur Chiffretext, genau wie der übrige Referenzinhalt.
- `js/gate.js` lädt ein Video erst, wenn es auf 300 px an den sichtbaren Bereich herankommt, entschlüsselt es im Browser und spielt es, solange mindestens 40 % sichtbar sind; beim Herausscrollen pausiert es.
- Bis dahin zeigt das Video sein Poster (erstes Bild des Loops, im Inhalt eingebettet).
- „Bewegung reduzieren“: kein Autoplay, das Poster bleibt stehen, Abspielen über die eingeblendete Steuerung.
- Banking: neben dem Video steht ab 900 px Breite die Ablaufleiste 01–04 (Figma „Bühne“ Schritt 1); auf Mobile nur das Video.
- **Wichtig für `quelle-privat`:** Wer `inhalt.enc` neu erzeugt, muss die Videos wieder einsetzen und `medien/*.bin` mit dem neuen Salz neu verschlüsseln – mit `videos_einbauen.py` aus dem Paket „quelle-privat-videos“.

## Farben Editorial

Akzent nach Figma-Primitives `azure/*` (vorher Moosgrün):

| Token | Wert | Einsatz |
|---|---|---|
| `--e-azure-700` | `#316cff` | große Serif-Akzente (Titelzeile, Kennzahlen, Zitat), Linien, Fokusring |
| `--e-azure-800` | `#2a5cd9` | Akzent in kleiner Schrift, Flächen mit weißer Schrift – erfüllt WCAG AA (5,13 : 1 auf Papier, 5,78 : 1 mit Weiß) |
| `--e-azure-100` | `#e0e4ed` | Fläche „Was ich mitnehme“ |

`#316cff` erreicht auf dem Papierton nur 3,95 : 1 und ist deshalb nur für große Schrift (AA Large) und Nicht-Text-Elemente eingesetzt.

## Cache

CSS- und JS-Links tragen einen Versionsparameter (`?v=20261123`). Bei jeder Änderung an `css/` oder `js/` den Wert in allen HTML-Dateien erhöhen, sonst zeigen Browser und GitHub Pages bis zu einigen Stunden noch die alte Fassung.
