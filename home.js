/* Homepage interactions: the camera roll before/after, and the caption slider.
   Both start in a complete, visible state; JS only adds the movement. */
(function () {
  // ── camera roll: one "Today" pile -> sorted into years ──────────────────
  var body = document.getElementById("rollBody");
  var roll = document.getElementById("roll");
  if (body && roll) {
    var lang = (document.documentElement.lang || "en").slice(0, 2);
    var TODAY = { en: "Today", fr: "Aujourd'hui", de: "Heute", es: "Hoy", nl: "Vandaag" }[lang] || "Today";
    var years = [2025, 2025, 2024, 2025, 2023, 2024, 2022, 2024, 2021, 2023, 2022, 2025,
                 2024, 2021, 2023, 2022, 2024, 2020, 2021, 2023, 2022, 2020, 2021, 2024];
    var imgs = years.map(function (y, i) {
      var im = new Image();
      im.src = "/assets/photos/p" + String(i).padStart(2, "0") + ".jpg";
      im.alt = ""; im.loading = "lazy"; im.decoding = "async";
      im.dataset.year = y;
      return im;
    });
    var sec = function (title, count, list) {
      var s = document.createElement("div"); s.className = "roll-sec";
      var h = document.createElement("h5");
      h.innerHTML = "<b></b><span></span>";
      h.firstChild.textContent = title; h.lastChild.textContent = count;
      var g = document.createElement("div"); g.className = "roll-grid";
      list.forEach(function (im) { g.appendChild(im); });
      s.appendChild(h); s.appendChild(g);
      return s;
    };
    var render = function (state) {
      body.innerHTML = "";
      if (state === "before") {
        body.appendChild(sec(TODAY, "2,000+", imgs));
      } else {
        [2025, 2024, 2023, 2022, 2021, 2020].forEach(function (y) {
          var list = imgs.filter(function (im) { return +im.dataset.year === y; });
          if (list.length) body.appendChild(sec(String(y), "", list));
        });
      }
      roll.dataset.state = state;
    };
    render("before");

    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var go = function (state) {
      if (roll.dataset.state === state) return;
      var first = imgs.map(function (im) { return im.getBoundingClientRect(); });
      render(state);
      if (reduce || !imgs[0].animate) return;
      imgs.forEach(function (im, i) {
        var last = im.getBoundingClientRect();
        var dx = first[i].left - last.left, dy = first[i].top - last.top;
        if (!dx && !dy) return;
        im.animate([{ transform: "translate(" + dx + "px," + dy + "px)" }, { transform: "none" }],
          { duration: 700, delay: i * 14, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" });
      });
    };
    var buttons = document.querySelectorAll("[data-roll]");
    var pick = function (state) {
      buttons.forEach(function (b) { b.classList.toggle("on", b.dataset.roll === state); });
      go(state);
    };
    buttons.forEach(function (b) { b.addEventListener("click", function () { auto = false; pick(b.dataset.roll); }); });
    // play it once when it scrolls into view, unless someone already clicked
    var auto = true;
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && auto) { io.disconnect(); setTimeout(function () { if (auto) pick("after"); }, 1400); }
        });
      }, { threshold: 0.6 });
      io.observe(roll);
    }
  }

  // ── caption before/after slider ─────────────────────────────────────────
  var cmp = document.getElementById("capCompare");
  if (cmp) {
    var range = cmp.querySelector("input[type=range]");
    var set = function () { cmp.style.setProperty("--pos", range.value + "%"); };
    range.addEventListener("input", set);
    set();
  }
})();
