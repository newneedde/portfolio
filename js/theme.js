/* Schalterleiste rechts: Darstellung (Bento · Editorial) und Hell/Dunkel.
   Zwei unabhängige Einstellungen, beide im Browser gemerkt:
   – Darstellung: <html data-view="editorial"> (Standard) oder ohne Attribut = Bento   (localStorage „view“)
   – Modus:       <html data-theme="light|dark"> oder ohne Attribut = Systemeinstellung (localStorage „mode“)
   Der Hell/Dunkel-Knopf zeigt den aktuellen Modus (Sonne = hell, Mond = dunkel); ein Klick wechselt.
   Ersetzt den Platzhalter #theme-toggle. Bei jedem Wechsel feuert das Dokument „themechange“
   (detail.view, detail.mode) – editorial.js und gate.js tauschen darauf den Inhalt. */
(function () {
  var root = document.documentElement;
  var slot = document.getElementById("theme-toggle");
  if (!slot) return;
  var en = (root.lang || "de").slice(0, 2) === "en";
  var T = en ? {
    view: "Display", toDark: "Switch to dark mode", toLight: "Switch to light mode"
  } : {
    view: "Darstellung", toDark: "Zu dunkler Darstellung wechseln", toLight: "Zu heller Darstellung wechseln"
  };
  var SUN = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  var MOON = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false"><path d="M13.5 9.6A5.75 5.75 0 1 1 6.4 2.5a5.7 5.7 0 0 0 7.1 7.1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  var dark = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function view() { return root.getAttribute("data-view") === "editorial" ? "editorial" : "bento"; }
  function mode() {
    var m = root.getAttribute("data-theme");
    if (m === "light" || m === "dark") return m;
    return dark && dark.matches ? "dark" : "light";
  }

  var end = document.createElement("div");
  end.className = "topbar__end";
  var group = document.createElement("div");
  group.className = "theme-switch";
  group.id = "theme-toggle";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", T.view);
  var buttons = {};
  [["bento", "Bento"], ["editorial", "Editorial"]].forEach(function (o) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = o[1];
    b.addEventListener("click", function () { change(function () { setView(o[0]); }, o[0] !== view()); });
    buttons[o[0]] = b;
    group.appendChild(b);
  });
  var toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "mode-toggle";
  toggle.addEventListener("click", function () {
    change(function () { setMode(mode() === "dark" ? "light" : "dark"); }, true);
  });
  end.appendChild(group);
  end.appendChild(toggle);
  slot.replaceWith(end);

  function render() {
    var v = view(), m = mode();
    buttons.bento.setAttribute("aria-pressed", v === "bento" ? "true" : "false");
    buttons.editorial.setAttribute("aria-pressed", v === "editorial" ? "true" : "false");
    toggle.innerHTML = m === "dark" ? MOON : SUN;
    toggle.setAttribute("aria-label", m === "dark" ? T.toLight : T.toDark);
    toggle.setAttribute("title", m === "dark" ? T.toLight : T.toDark);
  }

  function store(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function setView(v) {
    if (v === "editorial") root.setAttribute("data-view", "editorial"); else root.removeAttribute("data-view");
    store("view", v);
    store("theme", null); // alte Einstellung (bis 11/2026) aufräumen
  }
  function setMode(m) {
    root.setAttribute("data-theme", m);
    store("mode", m);
    store("theme", null);
  }

  // Überblenden (View Transitions API, wo vorhanden)
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  function change(fn, really) {
    if (!really) return;
    function run() { fn(); render(); fire(); }
    if (document.startViewTransition && !reduce) document.startViewTransition(run); else run();
  }
  function fire() {
    var detail = { view: view(), mode: mode(), theme: view() === "editorial" ? "editorial" : mode() };
    var ev;
    try { ev = new CustomEvent("themechange", { detail: detail }); }
    catch (e) { ev = document.createEvent("CustomEvent"); ev.initCustomEvent("themechange", false, false, detail); }
    document.dispatchEvent(ev);
  }
  // Systemwechsel hell/dunkel ohne feste Wahl: nur das Symbol nachziehen
  if (dark) {
    var onSys = function () { if (!root.hasAttribute("data-theme")) render(); };
    if (dark.addEventListener) dark.addEventListener("change", onSys); else if (dark.addListener) dark.addListener(onSys);
  }
  render();
})();
