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

  /* Scroll-Bühne (Arbeit 02): Die Sektion scrollt ganz normal mit. Sobald der Laptop
     gut sichtbar ist, läuft der Screenshot von selbst langsam nach unten und zeigt so den
     Umfang der Seite. Verlässt er den Blick, pausiert er; ist er fertig und kommt man
     später zurück, läuft er wieder nach oben. Mit der Maus darüber hält er an. */
  var scAll = [], scResizeT = 0;
  function scMake(st) {
    var over = Math.max(0, st.shot.offsetHeight - st.screen.clientHeight);
    var old = st.anim, frac = 0, rate = 1, playing = false;
    if (old) {
      frac = (old.currentTime || 0) / st.dur; rate = old.playbackRate;
      playing = old.playState === "running"; old.cancel();
    }
    st.anim = null;
    if (over < 8) return;
    st.dur = Math.min(24000, Math.max(8000, over / st.screen.clientHeight * 3200));
    st.anim = st.shot.animate(
      [{ transform: "translate3d(0,0,0)" }, { transform: "translate3d(0," + (-over) + "px,0)" }],
      { duration: st.dur, easing: "cubic-bezier(.45,0,.55,1)", fill: "both" });
    st.anim.pause();
    st.anim.currentTime = Math.min(1, Math.max(0, frac)) * st.dur;
    st.anim.playbackRate = rate;
    if (playing) st.anim.play();
  }
  function scStart(st) {
    var a = st.anim;
    if (!a || a.playState === "running") return;
    if (a.playState === "finished") { if (st.left) a.reverse(); }
    else a.play();
    st.left = false;
  }
  function scrolly(scope) {
    if (reduce || !("IntersectionObserver" in window) || !Element.prototype.animate) return;
    Array.prototype.forEach.call((scope || document).querySelectorAll(".e-scrolly"), function (el) {
      if (el.classList.contains("is-active")) return;
      var screen = el.querySelector(".e-laptop__screen"), shot = el.querySelector(".e-scrolly__shot");
      if (!screen || !shot) return;
      el.classList.add("is-active");
      var st = { el: el, screen: screen, shot: shot, anim: null, dur: 1, left: false, timer: 0, hover: false };
      scAll.push(st);
      shot.addEventListener("load", function () { scMake(st); });
      if (shot.complete && shot.naturalHeight) scMake(st);
      new IntersectionObserver(function (entries) {
        var r = entries[0].intersectionRatio;
        if (r >= 0.55) {
          if (!st.timer && !st.hover) st.timer = setTimeout(function () { st.timer = 0; scStart(st); }, 500);
        } else if (r < 0.2) {
          clearTimeout(st.timer); st.timer = 0;
          if (st.anim && st.anim.playState === "running") st.anim.pause();
          if (r === 0) st.left = true;
        }
      }, { threshold: [0, 0.2, 0.55] }).observe(screen);
      screen.addEventListener("pointerenter", function (e) {
        if (e.pointerType !== "mouse") return;
        st.hover = true;
        if (st.anim && st.anim.playState === "running") { st.anim.pause(); st.hoverPaused = true; }
      });
      screen.addEventListener("pointerleave", function (e) {
        if (e.pointerType !== "mouse") return;
        st.hover = false;
        if (st.hoverPaused) { st.hoverPaused = false; st.anim && st.anim.play(); }
      });
    });
  }
  window.addEventListener("resize", function () {
    clearTimeout(scResizeT);
    scResizeT = setTimeout(function () {
      scAll = scAll.filter(function (st) { return st.el.isConnected; });
      scAll.forEach(scMake);
    }, 200);
  });

  function enhance(scope) {
    reveal(scope || document);
    scrolly(scope || document);
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
