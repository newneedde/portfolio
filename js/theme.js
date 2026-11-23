/* Darstellungs-Schalter: Automatisch · Hell · Dunkel · Editorial (Wahl wird lokal gemerkt).
   Ersetzt den Knopf #theme-toggle durch eine Gruppe von Optionen (aria-pressed).
   Editorial gibt es vorerst nur auf den deutschen Seiten; die englischen Seiten
   bieten Automatisch · Hell · Dunkel und ignorieren eine gemerkte Editorial-Wahl.
   Bei jedem Wechsel feuert das Dokument das Ereignis „themechange“. */
(function () {
  var root = document.documentElement;
  var btn = document.getElementById("theme-toggle");
  if (!btn) return;
  var en = (root.lang || "de").slice(0, 2) === "en";
  var order = en ? ["auto", "light", "dark"] : ["auto", "light", "dark", "editorial"];
  var label = en ? "Theme" : "Darstellung";
  var names = en
    ? { auto: ["Auto", "Auto"], light: ["Light", "Light"], dark: ["Dark", "Dark"] }
    : { auto: ["Automatisch", "Auto"], light: ["Hell", "Hell"], dark: ["Dunkel", "Dunkel"], editorial: ["Editorial", "Editorial"] };

  function current() {
    var t = root.getAttribute("data-theme");
    return order.indexOf(t) > 0 ? t : "auto";
  }

  var group = document.createElement("div");
  group.className = "theme-switch";
  group.id = "theme-toggle";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", label);
  var caption = document.createElement("span");
  caption.className = "theme-switch__label";
  caption.setAttribute("aria-hidden", "true");
  caption.textContent = label;
  group.appendChild(caption);

  var buttons = {};
  order.forEach(function (key) {
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("data-theme-option", key);
    var long = document.createElement("span");
    long.className = "theme-switch__long";
    long.textContent = names[key][0];
    b.appendChild(long);
    if (names[key][1] !== names[key][0]) {
      var short = document.createElement("span");
      short.className = "theme-switch__short";
      short.textContent = names[key][1];
      b.appendChild(short);
    }
    b.addEventListener("click", function () { set(key); });
    buttons[key] = b;
    group.appendChild(b);
  });
  btn.replaceWith(group);

  function render() {
    var c = current();
    order.forEach(function (key) { buttons[key].setAttribute("aria-pressed", key === c ? "true" : "false"); });
  }

  function set(next) {
    if (next === current()) return;
    if (next === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", next);
    try { if (next === "auto") localStorage.removeItem("theme"); else localStorage.setItem("theme", next); } catch (e) {}
    render();
    var ev;
    try { ev = new CustomEvent("themechange", { detail: { theme: next } }); }
    catch (e) { ev = document.createEvent("CustomEvent"); ev.initCustomEvent("themechange", false, false, { theme: next }); }
    document.dispatchEvent(ev);
  }

  render();
})();
