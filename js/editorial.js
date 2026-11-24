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

  function isEditorial() { return root.getAttribute("data-view") === "editorial"; }

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
  /* ---------- Überschriften wortweise einfärben, Abbildungen gestaffelt ---------- */
  var WORD_STAGGER = 45, WORD_MAX = 16, IMG_STAGGER = 80;
  function splitWords(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/);
          if (parts.length < 2 && !n.textContent.trim()) return;
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var w = document.createElement("span");
            w.className = "e-w";
            w.style.setProperty("--i", Math.min(i++, WORD_MAX));
            w.textContent = p;
            frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") {
          walk(n);
        }
      });
    })(el);
  }
  function reveal(scope) {
    if (reduce || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        en.target.classList.add("is-in");
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    Array.prototype.forEach.call(scope.querySelectorAll(".e-display, .e-heading, .e-quote, .e-step__title"), function (el) {
      if (el.classList.contains("e-words")) return;
      splitWords(el);
      el.classList.add("e-words");
      io.observe(el);
    });
    Array.prototype.forEach.call(scope.querySelectorAll(".e-fig"), function (fig) {
      if (fig.classList.contains("e-rise")) return;
      Array.prototype.forEach.call(fig.querySelectorAll(".e-stage img"), function (img, k) {
        img.style.setProperty("--i", k);
      });
      Array.prototype.forEach.call(fig.querySelectorAll(".e-sequence li"), function (li, k) {
        li.style.setProperty("--i", k);
      });
      fig.classList.add("e-rise");
      io.observe(fig);
    });
  }

  function enhance(scope) {
    reveal(scope || document);
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
  function placeNav() {
    if (!nav || !topbar) return;
    if (isEditorial()) {
      if (nav.previousElementSibling !== topbar) topbar.insertAdjacentElement("afterend", nav);
    } else {
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

  function apply() {
    var docEl = document.documentElement;
    var ratio = window.scrollY / Math.max(1, docEl.scrollHeight - window.innerHeight);
    placeNav(); swapStart();
    if (tpl && window.scrollY > 0) window.scrollTo(0, Math.round(ratio * Math.max(0, docEl.scrollHeight - window.innerHeight)));
  }

  window.Editorial = { enhance: enhance, isEditorial: isEditorial };
  var lastView = isEditorial();
  document.addEventListener("themechange", function () {
    if (isEditorial() === lastView) return; // nur Hell/Dunkel gewechselt
    lastView = isEditorial();
    apply();
  });
  apply();
  // Anker der Startseite (#ansatz …) nach dem Tausch erneut anspringen
  if (tpl && isEditorial() && location.hash) {
    var target = document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView();
  }
})();
