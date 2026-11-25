/* Zugangsmaske: entschlüsselt den Referenzinhalt im Browser (PBKDF2-SHA256 → AES-256-GCM).
   Der Klartext liegt nirgends im Repo – ohne gültigen Code bleibt nur Chiffretext.
   Deutsch: referenzen/inhalt.enc · Englisch: en/references/content.enc (Datei steht in data-src).

   Mehrere Codes / Einladungslinks:
   Der Inhalt ist mit einem Hauptcode verschlüsselt. zugang.json (Repo-Root, data-keys) enthält
   je Zugangscode einen Eintrag, in dem der Hauptcode verschlüsselt liegt. Ein Code öffnet also
   entweder den Inhalt direkt (Hauptcode) oder über seinen Eintrag. Eintrag löschen = Code gesperrt.
   Einträge erzeugt quelle-privat/zugang-erstellen.mjs (liegt nicht im Repo).

   Einladungslink: …/referenzen/#show-me-more → öffnet ohne Eingabe; der Code wird danach
   aus der Adresszeile entfernt und im Browser gemerkt (gilt für beide Sprachen).

   Videos: <video data-media="media-05"> im Referenzinhalt. Die Datei liegt verschlüsselt in
   medien/media-05.bin (12 Byte IV + AES-GCM-Chiffretext, Schlüssel = derselbe wie für inhalt.enc).
   Sie wird erst geladen, wenn das Video in die Nähe des sichtbaren Bereichs kommt, und spielt nur,
   solange es sichtbar ist. Bei „Bewegung reduzieren“ bleibt das Poster stehen (Abspielen per Steuerung).
   Öffentliche Videos (<video data-src="…mp4">) werden genauso nachgeladen, nur ohne Entschlüsselung.

   Darstellung Editorial (Stand 11/2026): „Arbeiten“ 01–07 in neuer Reihenfolge.
   – #arbeit-01 (EN #work-01) ist öffentlich: <template id="arbeit-oeffentlich"> auf dieser Seite.
   – #arbeit-02 … 07 liegen verschlüsselt in data.works; ohne Code erscheint an ihrer Stelle die Zugangsmaske.
   Darstellung Bento: unverändert Referenz 01–07 aus data.pages hinter der Maske. */
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
  var MEDIA = form.getAttribute("data-media") || "medien/";

  var en = (document.documentElement.lang || "de").slice(0, 2) === "en";
  var T = en ? {
    checking: "Opening the work …",
    https: "This area needs a secure connection (https). Please open the page via its web address.",
    empty: "Please enter the access code.",
    load: "The content could not be loaded. Please try again later.",
    wrong: "That code doesn't match. Upper and lower case, spaces and hyphens don't matter.",
    link: "This link is no longer valid. Please request access – I'll gladly send you a new one.",
    nav: "References"
  } : {
    checking: "Arbeiten werden geöffnet …",
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
  var unlocked = null; // { secret, box } nach erfolgreichem Öffnen – Schlüssel auch für Videos
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

  var keyCache = {};
  async function deriveKey(secret, box) {
    var id = secret + "|" + box.salt + "|" + box.iter;
    if (!keyCache[id]) {
      var material = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), "PBKDF2", false, ["deriveKey"]);
      keyCache[id] = await crypto.subtle.deriveKey(
        { name: "PBKDF2", hash: "SHA-256", salt: b64(box.salt), iterations: box.iter },
        material, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
      );
    }
    return keyCache[id];
  }
  async function open(box, secret) {
    var key = await deriveKey(secret, box);
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
    var secret = master !== null ? master : n;
    var plain = await open(enc, secret); // wirft bei falschem Code
    unlocked = { secret: secret, box: enc };
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

  // Editorial-Fassung einer Referenz (pages[id].editorial) nutzt die Bilder der Bento-Fassung:
  // <img data-ref="3"> bekommt Quelle, Maße und Alternativtext des 4. Bildes aus pages[id].main.
  var bentoImgs = {};
  function imagesOf(id) {
    if (!bentoImgs[id]) {
      var t = document.createElement("template");
      t.innerHTML = data.pages[id].main;
      bentoImgs[id] = t.content.querySelectorAll("img");
    }
    return bentoImgs[id];
  }
  function useEditorial(pg) {
    return !!(pg.editorial && window.Editorial && window.Editorial.isEditorial());
  }


  /* ---------- Videos ---------- */
  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var mediaUrls = {};
  function mediaUrl(name) {
    if (!mediaUrls[name]) {
      mediaUrls[name] = fetch(MEDIA + name + ".bin", { cache: "no-cache" }).then(function (r) {
        if (!r.ok) throw new Error("load");
        return r.arrayBuffer();
      }).then(async function (buf) {
        var key = await deriveKey(unlocked.secret, unlocked.box);
        var bytes = new Uint8Array(buf);
        var plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(0, 12) }, key, bytes.slice(12));
        return URL.createObjectURL(new Blob([plain], { type: "video/mp4" }));
      }).catch(function (e) { delete mediaUrls[name]; throw e; });
    }
    return mediaUrls[name];
  }
  var videoObservers = [];
  function setupVideos(scope) {
    videoObservers.forEach(function (o) { o.disconnect(); });
    videoObservers = [];
    var videos = scope.querySelectorAll("video[data-media], video[data-src]");
    if (!videos.length) return;
    function play(v) {
      if (v.ended && !v.loop) return; // Einmal-Videos (aiba-Hero) bleiben auf dem Endbild
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }
    function load(v) {
      if (v.getAttribute("data-loaded")) return;
      v.setAttribute("data-loaded", "1");
      var direct = v.getAttribute("data-src");
      if (!direct && !unlocked) { v.removeAttribute("data-loaded"); return; }
      (direct ? Promise.resolve(direct) : mediaUrl(v.getAttribute("data-media"))).then(function (url) {
        v.src = url;
        if (v.getAttribute("data-visible") && !reduceMotion) play(v);
      }).catch(function () { v.removeAttribute("data-loaded"); });
    }
    Array.prototype.forEach.call(videos, function (v) {
      v.muted = true; // Voraussetzung für Autoplay in allen Browsern
      if (reduceMotion) v.setAttribute("controls", "");
      // Poster = erstes Bild (kein Sprung beim Start); bei „Bewegung reduzieren“ stattdessen das Endbild
      if (reduceMotion && v.getAttribute("data-still")) v.setAttribute("poster", v.getAttribute("data-still"));
    });
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(videos, function (v) { v.setAttribute("data-visible", "1"); load(v); });
      return;
    }
    // 1) Vorladen: sobald das Video 300 px vor dem sichtbaren Bereich ist
    var near = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { load(en.target); near.unobserve(en.target); } });
    }, { rootMargin: "300px 0px" });
    // 2) Abspielen nur, solange mindestens 40 % sichtbar sind
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target, visible = en.isIntersecting && en.intersectionRatio >= 0.4;
        if (visible) v.setAttribute("data-visible", "1"); else v.removeAttribute("data-visible");
        if (!v.src || reduceMotion) return;
        if (visible) play(v); else v.pause();
      });
    }, { threshold: [0, 0.4] });
    Array.prototype.forEach.call(videos, function (v) { near.observe(v); seen.observe(v); });
    videoObservers = [near, seen];
  }

  /* ---------- Arbeiten (Editorial) ---------- */
  var WORKS = en
    ? { prefix: "work", nav: "Work", names: ["Banking", "Design system", "Chat and video", "Basic alert", "Alerting", "Logistics", "Mini Figure Out"], suffix: " – Marc Schappach" }
    : { prefix: "arbeit", nav: "Arbeiten", names: ["Banking", "Design System", "Chat und Video", "Basisalarm", "Alarmierung", "Logistik", "Mini Figure Out"], suffix: " – Marc Schappach" };
  var BENTO_OF = [6, 1, 2, 3, 4, 5, 7]; // Arbeit n (1–7) → Bento-Referenz
  var BENTO = en ? "reference" : "referenz";
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function workNum(h) {
    var m = /^(arbeit|work)-0?(\d)$/.exec(h || ""); if (m) return +m[2];
    m = /^(referenz|reference)-0?(\d)$/.exec(h || ""); if (m) return BENTO_OF.indexOf(+m[2]) + 1 || 1;
    return 1;
  }
  function bentoNum(h) {
    var m = /^(referenz|reference)-0?(\d)$/.exec(h || ""); if (m) return +m[2];
    m = /^(arbeit|work)-0?(\d)$/.exec(h || ""); if (m) return BENTO_OF[+m[2] - 1];
    return null;
  }
  function workNav(active) {
    var nav = document.createElement("nav");
    nav.className = "ref-nav c-full";
    nav.setAttribute("aria-label", WORKS.nav);
    var list = document.createElement("ul");
    WORKS.names.forEach(function (name, i) {
      var li = document.createElement("li"), a = document.createElement("a");
      a.href = "#" + WORKS.prefix + "-" + pad(i + 1);
      var num = document.createElement("span");
      num.className = "ref-nav__num";
      num.textContent = pad(i + 1);
      a.appendChild(num);
      a.appendChild(document.createTextNode(name));
      if (i + 1 === active) a.setAttribute("aria-current", "page");
      li.appendChild(a); list.appendChild(li);
    });
    nav.appendChild(list);
    return nav;
  }

  var gateMain = document.getElementById("inhalt"); // Maske (wird bei Bedarf wieder eingesetzt)
  var gateTitle = document.title;
  var lastView = null;

  // Animierte Bilder (z. B. AVIF-Loops in Referenz 07): bei „Bewegung reduzieren“ das Standbild aus data-still zeigen
  function stillImages(scope) {
    if (!reduceMotion) return;
    Array.prototype.forEach.call(scope.querySelectorAll("img[data-still]"), function (img) {
      img.src = img.getAttribute("data-still");
    });
  }
  function place(next, keepPosition, title, editorial) {
    stillImages(next);
    var docEl = document.documentElement;
    var ratio = keepPosition ? window.scrollY / Math.max(1, docEl.scrollHeight - window.innerHeight) : 0;
    var current = document.getElementById("inhalt");
    if (current !== next) current.replaceWith(next);
    page.classList.toggle("page--gate", next === gateMain);
    if (title) document.title = title;
    // Gewählter Eintrag in der horizontalen Navigation sichtbar (mittig)
    var list = next.querySelector(".ref-nav ul");
    var active = list && list.querySelector('[aria-current="page"]');
    if (active) {
      var r = active.getBoundingClientRect(), lr = list.getBoundingClientRect();
      var left = list.scrollLeft + (r.left - lr.left) - (list.clientWidth - r.width) / 2;
      var smooth = editorial && !reduceMotion;
      if (list.scrollTo) list.scrollTo({ left: left, behavior: smooth ? "smooth" : "auto" }); else list.scrollLeft = left;
    }
    if (!keepPosition) {
      var h1 = next.querySelector("h1");
      if (h1 && next !== gateMain) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }
      window.scrollTo(0, 0);
    } else {
      window.scrollTo(0, Math.round(ratio * Math.max(0, docEl.scrollHeight - window.innerHeight)));
    }
    if (editorial && window.Editorial) window.Editorial.enhance(next);
    setupVideos(next);
  }

  function showGate(active, keepPosition) {
    var old = gateMain.querySelector(".ref-nav");
    if (old) old.remove();
    if (active) gateMain.insertBefore(workNav(active), gateMain.firstChild);
    place(gateMain, keepPosition, gateTitle, !!active);
  }

  function fromHtml(html) {
    var t = document.createElement("template");
    t.innerHTML = html;
    return t.content.firstElementChild;
  }

  function renderWork(n, keepPosition) {
    var next, title;
    if (n === 1) {
      var tpl = document.getElementById("arbeit-oeffentlich");
      next = tpl.content.firstElementChild.cloneNode(true);
      title = (en ? "Work 01 · " : "Arbeit 01 · ") + WORKS.names[0] + WORKS.suffix;
    } else {
      var w = data.works[WORKS.prefix + "-" + pad(n)];
      next = fromHtml(w.html);
      var imgs = imagesOf(w.ref);
      Array.prototype.forEach.call(next.querySelectorAll("img[data-ref]"), function (img) {
        var src = imgs[parseInt(img.getAttribute("data-ref"), 10)];
        if (!src) return;
        img.src = src.getAttribute("src");
        ["width", "height", "alt", "data-still"].forEach(function (a) {
          if (!img.hasAttribute(a) && src.hasAttribute(a)) img.setAttribute(a, src.getAttribute(a));
        });
      });
      title = w.title;
    }
    next.insertBefore(workNav(n), next.firstChild);
    place(next, keepPosition, title, true);
  }

  function renderBento(keepPosition) {
    var n = bentoNum((location.hash || "").slice(1));
    var id = n ? BENTO + "-" + pad(n) : data.default;
    if (!data.pages[id]) id = data.default;
    var pg = data.pages[id];
    var next = fromHtml(pg.main);
    next.insertBefore(refNav(id), next.firstChild);
    place(next, keepPosition, pg.title, false);
  }

  function editorialView() { return !!(window.Editorial && window.Editorial.isEditorial()); }

  function route(keepPosition) {
    keepPosition = keepPosition === true;
    lastView = editorialView();
    var h = (location.hash || "").slice(1);
    if (lastView) {
      var n = workNum(h);
      if (n === 1 || (data && data.works && data.works[WORKS.prefix + "-" + pad(n)])) renderWork(n, keepPosition);
      else showGate(n, keepPosition);
    } else if (data) {
      renderBento(keepPosition);
    } else {
      showGate(null, keepPosition);
    }
  }
  var render = route;

  function show(payload) {
    data = payload;
    route();
  }
  window.addEventListener("hashchange", function () { route(false); });
  // Darstellung gewechselt: dieselbe Arbeit in der anderen Fassung zeigen (Hell/Dunkel braucht keinen Neuaufbau)
  document.addEventListener("themechange", function () { if (editorialView() !== lastView) route(true); });

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
  var isPageAnchor = /^(referenz|reference|arbeit|work)-\d+$/.test(hash) || hash === "inhalt";
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
  route();
  if (s) {
    busy(true);
    unlock(s).then(function (payload) { busy(false); show(payload); })
      .catch(function () { busy(false); forget(); });
  }
})();
