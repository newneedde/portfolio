/* Symbole: ausschließlich Lucide (lucide.dev, ISC-Lizenz, v1.79.0) – sun, moon, layout-dashboard (Bento), newspaper (Editorial).
   Schalterleiste rechts: zwei Symbol-Knöpfe, Darstellung (Bento ↔ Editorial) und Hell/Dunkel.
   Beide zeigen den aktuellen Zustand als Symbol, ein Klick wechselt; Ziel steht im aria-label/title.
   Zwei unabhängige Einstellungen, beide im Browser gemerkt:
   – Darstellung: <html data-view="editorial"> (Standard) oder ohne Attribut = Bento   (localStorage „view“)
   – Modus:       <html data-theme="light|dark"> oder ohne Attribut = Systemeinstellung (localStorage „mode“)
   Ersetzt den Platzhalter #theme-toggle. Bei jedem Wechsel feuert das Dokument „themechange“
   (detail.view, detail.mode) – editorial.js und gate.js tauschen darauf den Inhalt. */
(function () {
  var root = document.documentElement;
  var slot = document.getElementById("theme-toggle");
  if (!slot) return;
  var en = (root.lang || "de").slice(0, 2) === "en";
  var T = en ? {
    toDark: "Switch to dark mode", toLight: "Switch to light mode",
    toBento: "Display: Editorial – switch to Bento", toEditorial: "Display: Bento – switch to Editorial"
  } : {
    toDark: "Zu dunkler Darstellung wechseln", toLight: "Zu heller Darstellung wechseln",
    toBento: "Darstellung: Editorial – zu Bento wechseln", toEditorial: "Darstellung: Bento – zu Editorial wechseln"
  };
  var SUN = '<svg class="lucide lucide-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
  var MOON = '<svg class="lucide lucide-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>';
  var BENTO = '<svg class="lucide lucide-layout-dashboard" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>';
  var EDITORIAL = '<svg class="lucide lucide-newspaper" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M15 18h-5"/><path d="M18 14h-8"/><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="10" y="6" rx="1"/></svg>';
  var dark = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function view() { return root.getAttribute("data-view") === "editorial" ? "editorial" : "bento"; }
  function mode() {
    var m = root.getAttribute("data-theme");
    if (m === "light" || m === "dark") return m;
    return dark && dark.matches ? "dark" : "light";
  }

  var end = document.createElement("div");
  end.className = "topbar__end";
  var viewBtn = document.createElement("button");
  viewBtn.type = "button";
  viewBtn.className = "bar-btn bar-btn--view";
  viewBtn.id = "theme-toggle";
  viewBtn.addEventListener("click", function () {
    change(function () { setView(view() === "editorial" ? "bento" : "editorial"); }, true);
  });
  var toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "bar-btn bar-btn--mode";
  toggle.addEventListener("click", function () {
    change(function () { setMode(mode() === "dark" ? "light" : "dark"); }, true);
  });
  end.appendChild(viewBtn);
  end.appendChild(toggle);
  slot.replaceWith(end);

  function render() {
    var v = view(), m = mode();
    viewBtn.innerHTML = v === "editorial" ? EDITORIAL : BENTO;
    viewBtn.setAttribute("aria-label", v === "editorial" ? T.toBento : T.toEditorial);
    viewBtn.setAttribute("title", v === "editorial" ? T.toBento : T.toEditorial);
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
