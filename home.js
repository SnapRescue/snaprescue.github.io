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

  // ── laptop walkthrough: plays muted while on screen, the steps follow it ─
  var film = document.getElementById("howFilm");
  var v = film && film.querySelector("video");
  if (v) {
    var grid = film.closest(".how-grid");
    var steps = [].slice.call(document.querySelectorAll("#guide li[data-at]"));
    var snd = film.querySelector(".film-sound");
    var now = document.getElementById("filmNow");
    var bar = film.querySelector(".film-bar i");
    var ev = function (name, p) { if (typeof track === "function") track(name, Object.assign({ video: "laptop-walkthrough" }, p || {})); };
    var mmss = function (t) { t = Math.floor(t || 0); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); };
    // no autoplay for reduced motion or data saver, they get the play button
    var still = (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) ||
                (navigator.connection && navigator.connection.saveData);
    var userPaused = false, heard = false, started = false, raf = 0;
    v.controls = false; // native controls are only the no-JS fallback

    var paint = function () {
      var t = v.currentTime, d = v.duration || 52.2, any = false;
      steps.forEach(function (li) {
        var a = +li.dataset.at, b = +li.dataset.end, on = t >= a && t < b;
        li.style.setProperty("--p", t <= a ? 0 : t >= b ? 1 : ((t - a) / (b - a)).toFixed(3));
        li.classList.toggle("on", on);
        any = any || on;
      });
      // only dim the other steps while one of them is actually on screen
      grid.classList.toggle("is-playing", any && !v.paused);
      now.textContent = mmss(t);
      bar.style.transform = "scaleX(" + Math.min(t / d, 1) + ")";
    };
    var loop = function () { paint(); raf = requestAnimationFrame(loop); };
    var setPlaying = function (on) {
      film.classList.toggle("playing", on);
      cancelAnimationFrame(raf);
      if (on) loop(); else paint();
    };
    v.addEventListener("play", function () {
      setPlaying(true);
      if (!started) { started = true; ev("walkthrough_play"); }
    });
    v.addEventListener("pause", function () { setPlaying(false); });
    v.addEventListener("seeked", paint);
    var play = function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); };

    film.querySelector(".film-frame").addEventListener("click", function (e) {
      if (snd.contains(e.target)) return;
      if (v.paused) { userPaused = false; play(); } else { userPaused = true; v.pause(); }
    });
    snd.addEventListener("click", function () {
      v.muted = !v.muted;
      snd.setAttribute("aria-pressed", String(!v.muted));
      snd.querySelector("span").textContent = v.muted ? "Sound on" : "Mute";
      // first unmute starts it over, the hook is in the first few seconds
      if (!v.muted && !heard) { heard = true; v.currentTime = 0; ev("walkthrough_sound"); }
      userPaused = false; play();
    });

    steps.forEach(function (li, i) {
      li.setAttribute("role", "button");
      li.tabIndex = 0;
      li.title = "Play this step";
      var at = document.createElement("span");
      at.className = "step-at";
      at.setAttribute("aria-hidden", "true");
      at.innerHTML = '<svg viewBox="0 0 10 10"><path d="M2 1v8l7-4z" fill="currentColor"/></svg>' + mmss(+li.dataset.at);
      li.appendChild(at);
      var jump = function () {
        v.currentTime = +li.dataset.at;
        userPaused = false; play();
        ev("walkthrough_step", { step: i + 1 });
        // on a phone the film sits above the list, bring it back into view
        var r = film.getBoundingClientRect();
        if (r.bottom < 80 || r.top > innerHeight - 80) film.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "center" });
      };
      li.addEventListener("click", jump);
      li.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); jump(); }
      });
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) { if (!v.paused) v.pause(); }
          else if (!still && !userPaused) play();
        });
      }, { threshold: 0.45 }).observe(film);
    }
    paint();
  }
})();
