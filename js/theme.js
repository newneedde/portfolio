/* Theme-Schalter: Automatisch → Hell → Dunkel (Wahl wird lokal gemerkt) */
(function () {
  var root = document.documentElement;
  var btn = document.getElementById("theme-toggle");
  if (!btn) return;
  var order = ["auto", "light", "dark"];
  var names = { auto: "Automatisch", light: "Hell", dark: "Dunkel" };
  function current() {
    var t = root.getAttribute("data-theme");
    return t === "light" || t === "dark" ? t : "auto";
  }
  function render() { btn.textContent = "Darstellung: " + names[current()]; }
  btn.addEventListener("click", function () {
    var next = order[(order.indexOf(current()) + 1) % order.length];
    if (next === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", next);
    try { if (next === "auto") localStorage.removeItem("theme"); else localStorage.setItem("theme", next); } catch (e) {}
    render();
  });
  render();
})();
