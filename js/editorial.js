/* Darstellung „Editorial“
   – Startseite: tauscht den Bento-Inhalt gegen die Editorial-Fassung aus <template id="editorial-start">
   – Navigation: steht im Editorial-Modus als Zeile unter der Schalterleiste (statt schwebender Pille)
   – Kennzahlen: Plus- und Normalwerte zählen beim ersten Sichtbarwerden kurz hoch,
     Minuswerte (−68 %, −70 %) bleiben stehen. Bei „Bewegung reduzieren“ keine Animation.
   Wird von gate.js aufgerufen (Editorial.enhance), sobald eine Referenz gerendert ist. */
(function () {
  var root = document.documentElement;
  var en = (root.lang || "de").slice(0, 2) === "en";
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function isEditorial() { return !en && root.getAttribute("data-theme") === "editorial"; }

  /* ---------- Hochzählen ---------- */
  var DURATION = 900;
  function isNegative(s) { return /^\s*[−\-–]/.test(s); }
  function run(el) {
    var final = el.getAttribute("data-final");
    var parts = final.split(/(\d+)/);
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var k = Math.min(1, (ts - start) / DURATION);
      var e = 1 - Math.pow(1 - k, 3); // ease-out
      el.textContent = parts.map(function (p, i) { return i % 2 ? String(Math.round(parseInt(p, 10) * e)) : p; }).join("");
      if (k < 1) requestAnimationFrame(frame);
      else el.textContent = final;
    }
    requestAnimationFrame(frame);
  }
  function enhance(scope) {
    var els = (scope || document).querySelectorAll("[data-count]:not([data-final])");
    if (!els.length) return;
    var canAnimate = !reduce && "IntersectionObserver" in window && "requestAnimationFrame" in window;
    var io = canAnimate ? new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        run(en.target);
      });
    }, { threshold: 0.6 }) : null;
    Array.prototype.forEach.call(els, function (el) {
      var final = el.textContent;
      el.setAttribute("data-final", final);
      if (!io || isNegative(final) || !/\d/.test(final)) return;
      el.textContent = final.replace(/\d+/g, "0");
      io.observe(el);
    });
  }

  /* ---------- Navigation verschieben ---------- */
  var nav = document.querySelector(".nav");
  var topbar = document.querySelector(".topbar");
  var navHome = nav ? { parent: nav.parentNode, next: nav.nextSibling } : null;
  var brand = null;
  function placeNav() {
    if (!nav || !topbar) return;
    if (isEditorial()) {
      if (!brand) {
        brand = document.createElement("span");
        brand.className = "nav__brand";
        brand.textContent = "Marc Schappach · Portfolio";
      }
      if (brand.parentNode !== nav) nav.insertBefore(brand, nav.firstChild);
      if (nav.previousElementSibling !== topbar) topbar.insertAdjacentElement("afterend", nav);
    } else {
      if (brand && brand.parentNode) brand.parentNode.removeChild(brand);
      if (nav.parentNode !== navHome.parent) navHome.parent.insertBefore(nav, navHome.next);
    }
  }

  /* ---------- Startseite: Inhalt tauschen ---------- */
  var tpl = document.getElementById("editorial-start");
  var bentoMain = null, editorialMain = null;
  function swapStart() {
    if (!tpl) return;
    var cur = document.getElementById("inhalt");
    if (!cur) return;
    if (isEditorial()) {
      if (!editorialMain) {
        editorialMain = tpl.content.firstElementChild.cloneNode(true);
        // E-Mail-Links wie in site.js zusammensetzen (Vorlage war beim ersten Durchlauf noch nicht im Dokument)
        Array.prototype.forEach.call(editorialMain.querySelectorAll("a.js-mail"), function (a) {
          a.setAttribute("href", "mailto:" + a.getAttribute("data-u") + "@" + a.getAttribute("data-d"));
        });
      }
      if (cur !== editorialMain) { bentoMain = cur; cur.replaceWith(editorialMain); enhance(editorialMain); }
    } else if (bentoMain && cur !== bentoMain) {
      cur.replaceWith(bentoMain);
    }
  }

  function apply() { placeNav(); swapStart(); }

  window.Editorial = { enhance: enhance, isEditorial: isEditorial };
  document.addEventListener("themechange", apply);
  apply();
  // Anker der Startseite (#ansatz …) nach dem Tausch erneut anspringen
  if (tpl && isEditorial() && location.hash) {
    var target = document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView();
  }
})();
