/* Zugangsmaske: entschlüsselt den Referenzinhalt im Browser (PBKDF2-SHA256 → AES-256-GCM).
   Der Klartext liegt nirgends im Repo – ohne den Code bleibt nur Chiffretext.
   Deutsch: referenzen/inhalt.enc · Englisch: en/references/content.enc (Datei steht in data-src).
   Gleicher Code für beide Sprachen; einmal entsperrt, gilt er in der Browser-Sitzung für beide. */
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
  var KEY = "zc";

  var en = (document.documentElement.lang || "de").slice(0, 2) === "en";
  var T = en ? {
    checking: "Checking code …",
    https: "This area needs a secure connection (https). Please open the page via its web address.",
    empty: "Please enter the access code.",
    load: "The content could not be loaded. Please try again later.",
    wrong: "That code doesn't match. Upper and lower case, spaces and hyphens don't matter.",
    nav: "References"
  } : {
    checking: "Code wird geprüft …",
    https: "Dieser Bereich braucht eine sichere Verbindung (https). Bitte die Seite über die Webadresse öffnen.",
    empty: "Bitte den Zugangscode eingeben.",
    load: "Der Inhalt konnte nicht geladen werden. Bitte später erneut versuchen.",
    wrong: "Der Code passt nicht. Groß- und Kleinschreibung sowie Bindestriche spielen keine Rolle.",
    nav: "Referenzen"
  };

  // Muss exakt zu quelle-privat/build-gate.mjs passen
  function normalize(s) {
    return s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  function b64(s) {
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function decrypt(code) {
    var res = await fetch(SRC, { cache: "no-cache" });
    if (!res.ok) throw new Error("load");
    var j = await res.json();
    var material = await crypto.subtle.importKey("raw", new TextEncoder().encode(normalize(code)), "PBKDF2", false, ["deriveKey"]);
    var key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", hash: "SHA-256", salt: b64(j.salt), iterations: j.iter },
      material, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
    );
    var plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(j.iv) }, key, b64(j.ct));
    return JSON.parse(new TextDecoder().decode(plain));
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
      var payload = await decrypt(input.value);
      try { sessionStorage.setItem(KEY, normalize(input.value)); } catch (x) {}
      show(payload);
    } catch (err) {
      busy(false);
      fail(err && err.message === "load" ? T.load : T.wrong);
    }
  });

  // Gleiche Browser-Sitzung (auch nach Sprachwechsel): nicht erneut fragen
  try {
    var saved = sessionStorage.getItem(KEY);
    if (saved) { busy(true); decrypt(saved).then(show).catch(function () { busy(false); try { sessionStorage.removeItem(KEY); } catch (x) {} }); }
  } catch (e) {}
})();
