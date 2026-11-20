/* Zugangsmaske: entschlüsselt den Referenzinhalt im Browser (PBKDF2-SHA256 → AES-256-GCM).
   Der Klartext liegt nirgends im Repo – ohne gültigen Code bleibt nur Chiffretext.
   Deutsch: referenzen/inhalt.enc · Englisch: en/references/content.enc (Datei steht in data-src).

   Mehrere Codes / Einladungslinks:
   Der Inhalt ist mit einem Hauptcode verschlüsselt. zugang.json (Repo-Root, data-keys) enthält
   je Zugangscode einen Eintrag, in dem der Hauptcode verschlüsselt liegt. Ein Code öffnet also
   entweder den Inhalt direkt (Hauptcode) oder über seinen Eintrag. Eintrag löschen = Code gesperrt.
   Einträge erzeugt quelle-privat/zugang-erstellen.mjs (liegt nicht im Repo).

   Einladungslink: …/referenzen/#show-me-more → öffnet ohne Eingabe; der Code wird danach
   aus der Adresszeile entfernt und im Browser gemerkt (gilt für beide Sprachen). */
(function () {
  var form = document.getElementById("gate-form");
  var input = document.getElementById("code");
  var errorBox = document.getElementById("code-error");
  var errorText = document.getElementById("code-error-text");
  var button = document.getElementById("gate-submit");
  var gate = document.getElementById("gate");
  var page = document.querySelector(".page");
  var live = document.getElementById("gate-status");
  var SRC = form.getAttribute("data-src") || "inhalt.enc";
  var KEYS = form.getAttribute("data-keys") || "../zugang.json";
  var STORE = "zc";

  var en = (document.documentElement.lang || "de").slice(0, 2) === "en";
  var T = en ? {
    checking: "Opening references …",
    https: "This area needs a secure connection (https). Please open the page via its web address.",
    empty: "Please enter the access code.",
    load: "The content could not be loaded. Please try again later.",
    wrong: "That code doesn't match. Upper and lower case, spaces and hyphens don't matter.",
    link: "This link is no longer valid. Please request access – I'll gladly send you a new one.",
    nav: "References"
  } : {
    checking: "Referenzen werden geöffnet …",
    https: "Dieser Bereich braucht eine sichere Verbindung (https). Bitte die Seite über die Webadresse öffnen.",
    empty: "Bitte den Zugangscode eingeben.",
    load: "Der Inhalt konnte nicht geladen werden. Bitte später erneut versuchen.",
    wrong: "Der Code passt nicht. Groß- und Kleinschreibung, Leerzeichen und Bindestriche spielen keine Rolle.",
    link: "Dieser Link ist nicht mehr gültig. Fragen Sie gern den Zugang an – ich sende Ihnen einen neuen.",
    nav: "Referenzen"
  };

  // Muss exakt zu quelle-privat/zugang-erstellen.mjs passen
  function normalize(s) {
    return s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  function b64(s) {
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  var encPromise = null, keysPromise = null;
  function loadEnc() {
    if (!encPromise) encPromise = fetch(SRC, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("load");
      return r.json();
    }).catch(function (e) { encPromise = null; throw new Error("load"); });
    return encPromise;
  }
  function loadKeys() {
    if (!keysPromise) keysPromise = fetch(KEYS, { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : { keys: [] }; })
      .then(function (j) { return (j && j.keys) || []; })
      .catch(function () { return []; });
    return keysPromise;
  }

  async function open(box, secret) {
    var material = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), "PBKDF2", false, ["deriveKey"]);
    var key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", hash: "SHA-256", salt: b64(box.salt), iterations: box.iter },
      material, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
    );
    return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(box.iv) }, key, b64(box.ct)));
  }

  async function unlock(code) {
    var n = normalize(code);
    var enc = await loadEnc();
    var keys = await loadKeys();
    var master = null;
    for (var i = 0; i < keys.length && master === null; i++) {
      try { master = new TextDecoder().decode(await open(keys[i], n)); } catch (e) {}
    }
    var plain = await open(enc, master !== null ? master : n); // wirft bei falschem Code
    return JSON.parse(new TextDecoder().decode(plain));
  }

  function remember(code) {
    try { localStorage.setItem(STORE, normalize(code)); } catch (x) {}
  }
  function forget() {
    try { localStorage.removeItem(STORE); sessionStorage.removeItem(STORE); } catch (x) {}
  }
  function saved() {
    try { return localStorage.getItem(STORE) || sessionStorage.getItem(STORE); } catch (x) { return null; }
  }

  var data = null; // entschlüsselte Seiten

  function pageId() {
    var id = (location.hash || "").replace("#", "");
    return data && data.pages[id] ? id : data.default;
  }

  // Navigation zu allen Referenzseiten (oben auf jeder Referenz)
  function refNav(activeId) {
    var nav = document.createElement("nav");
    nav.className = "ref-nav c-full";
    nav.setAttribute("aria-label", T.nav);
    var list = document.createElement("ul");
    (data.order || Object.keys(data.pages)).forEach(function (id) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + id;
      var num = document.createElement("span");
      num.className = "ref-nav__num";
      num.textContent = data.pages[id].num || "";
      a.appendChild(num);
      a.appendChild(document.createTextNode(data.pages[id].nav || id));
      if (id === activeId) a.setAttribute("aria-current", "page");
      li.appendChild(a);
      list.appendChild(li);
    });
    nav.appendChild(list);
    return nav;
  }

  function render() {
    var id = pageId();
    var pg = data.pages[id];
    var tpl = document.createElement("template");
    tpl.innerHTML = pg.main;
    var next = tpl.content.firstElementChild;
    next.insertBefore(refNav(id), next.firstChild);
    var current = document.getElementById("inhalt") || gate.closest("main");
    current.replaceWith(next);
    page.classList.remove("page--gate");
    if (pg.title) document.title = pg.title;
    // Gewählte Referenz in der horizontalen Navigation sichtbar machen (mittig)
    var list = next.querySelector(".ref-nav ul");
    var active = list && list.querySelector('[aria-current="page"]');
    if (active) {
      var r = active.getBoundingClientRect(), lr = list.getBoundingClientRect();
      list.scrollLeft += (r.left - lr.left) - (list.clientWidth - r.width) / 2;
    }
    var h1 = next.querySelector("h1");
    if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }
    window.scrollTo(0, 0);
  }

  function show(payload) {
    data = payload;
    render();
    window.addEventListener("hashchange", render);
  }

  function fail(msg) {
    errorText.textContent = msg;
    errorBox.hidden = false;
    input.setAttribute("aria-invalid", "true");
    input.focus();
  }

  function busy(on) {
    button.setAttribute("aria-disabled", on ? "true" : "false");
    live.textContent = on ? T.checking : "";
  }

  if (!window.crypto || !window.crypto.subtle) {
    fail(T.https);
    button.setAttribute("aria-disabled", "true");
    return;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (button.getAttribute("aria-disabled") === "true") return;
    errorBox.hidden = true;
    input.removeAttribute("aria-invalid");
    if (!normalize(input.value)) { fail(T.empty); return; }
    busy(true);
    try {
      var payload = await unlock(input.value);
      remember(input.value);
      show(payload);
    } catch (err) {
      busy(false);
      fail(err && err.message === "load" ? T.load : T.wrong);
    }
  });

  // 1) Einladungslink: Code steht im Anker (#show-me-more). Seitenanker (#referenz-02) sind keine Codes.
  var hash = "";
  try { hash = decodeURIComponent((location.hash || "").slice(1)); } catch (e) {}
  var isPageAnchor = /^(referenz|reference)-\d+$/.test(hash) || hash === "inhalt";
  if (hash && !isPageAnchor) {
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    busy(true);
    unlock(hash).then(function (payload) { remember(hash); show(payload); })
      .catch(function (err) {
        busy(false);
        // Ein früher gemerkter, noch gültiger Code darf trotzdem öffnen
        var s = saved();
        if (s) return unlock(s).then(show).catch(function () { forget(); fail(err && err.message === "load" ? T.load : T.link); });
        fail(err && err.message === "load" ? T.load : T.link);
      });
    return;
  }

  // 2) Schon einmal geöffnet (auch in der anderen Sprache): nicht erneut fragen
  var s = saved();
  if (s) {
    busy(true);
    unlock(s).then(function (payload) { busy(false); show(payload); })
      .catch(function () { busy(false); forget(); });
  }
})();
