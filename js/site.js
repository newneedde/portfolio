/* Sprachschalter DE ↔ EN und E-Mail-Adresse (vor einfachen Crawlern geschützt).
   Der Schalter ist ein normaler Link auf die Gegenseite (funktioniert auch ohne JS);
   beim Klick wird der aktuelle Anker (#arbeitsweise, #referenz-02 …) mitübersetzt. */
(function () {
  var toggle = document.getElementById("lang-toggle");
  if (toggle) {
    // Anker-Paare: deutsch ↔ englisch
    var pairs = [
      ["arbeitsweise", "how-i-work"],
      ["ansatz", "approach"],
      ["wirkung", "impact"],
      ["kontakt", "contact"],
      ["inhalt", "inhalt"],
      ["referenz-01", "reference-01"],
      ["referenz-02", "reference-02"],
      ["referenz-03", "reference-03"],
      ["referenz-04", "reference-04"],
      ["referenz-05", "reference-05"]
    ];
    var toEn = (toggle.getAttribute("hreflang") || "") === "en";
    toggle.addEventListener("click", function () {
      var h = (location.hash || "").replace("#", "");
      if (!h) return;
      for (var i = 0; i < pairs.length; i++) {
        var from = toEn ? pairs[i][0] : pairs[i][1];
        var to = toEn ? pairs[i][1] : pairs[i][0];
        if (h === from) {
          toggle.setAttribute("href", toggle.getAttribute("href").split("#")[0] + "#" + to);
          return;
        }
      }
    });
  }

  // <a class="js-mail" data-u="marc" data-d="newneed.de">…</a>
  var mails = document.querySelectorAll(".js-mail");
  for (var i = 0; i < mails.length; i++) {
    var el = mails[i];
    var addr = el.getAttribute("data-u") + "@" + el.getAttribute("data-d");
    if (el.tagName === "A") {
      el.setAttribute("href", "mailto:" + addr);
    } else {
      var a = document.createElement("a");
      a.href = "mailto:" + addr;
      a.textContent = addr;
      el.replaceWith(a);
    }
    if (el.hasAttribute("data-show")) el.textContent = addr;
  }
})();
