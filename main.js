/* SnapRescue site — config + interactions */

// ── Configure these at launch ────────────────────────────────
const CONFIG = {
  // Public URL of your licence server (the dedicated container).
  LICENSE_API: "https://snaprescue-license.tail28b3e2.ts.net",
  // Direct download link to the Windows build (e.g. a GitHub Release asset).
  DOWNLOAD_URL: "https://github.com/SnapRescue/snaprescue.github.io/releases/download/v1.0.0/SnapRescue-Setup.exe",
  // macOS builds: Apple Silicon (arm64) and Intel (x86_64).
  DOWNLOAD_URL_MAC: "https://github.com/SnapRescue/snaprescue.github.io/releases/download/v1.0.0/SnapRescue-mac-arm64.dmg",
  DOWNLOAD_URL_MAC_INTEL: "https://github.com/SnapRescue/snaprescue.github.io/releases/download/v1.0.0/SnapRescue-mac-intel.dmg",
  // Android: sideloaded APK served from this site (not the Play Store).
  // Cache-bust token: bump on every new APK so phones don't re-serve a stale (cached) build.
  DOWNLOAD_URL_ANDROID: "https://snaprescue.app/download/SnapRescue-android.apk?v=20260628b",
};

// ── Nav shadow on scroll ─────────────────────────────────────
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 12);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ── Reveal on scroll ─────────────────────────────────────────
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
// Hero reveals fire immediately on load
window.addEventListener("load", () => {
  document.querySelectorAll(".hero .reveal").forEach((el) => el.classList.add("in"));
});

// ── FAQ accordion ────────────────────────────────────────────
document.querySelectorAll(".faq-q").forEach((btn) => {
  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    const panel = btn.nextElementSibling;
    btn.setAttribute("aria-expanded", String(!open));
    panel.style.maxHeight = open ? null : panel.scrollHeight + "px";
  });
});

// ── Download buttons → reassurance modal → download ──────────
// Clicking any download button opens a short modal explaining the harmless
// Windows SmartScreen notice, so first-time users are not scared off. The
// modal's own button performs the actual download.
const dlModal = document.getElementById("dl-modal");
const openDlModal = () => { if (dlModal) { dlModal.classList.add("open"); dlModal.setAttribute("aria-hidden", "false"); } };
const closeDlModal = () => { if (dlModal) { dlModal.classList.remove("open"); dlModal.setAttribute("aria-hidden", "true"); } };

document.querySelectorAll('a[href="#download"], #download-btn').forEach((a) => {
  a.addEventListener("click", (e) => {
    if (dlModal) { e.preventDefault(); openDlModal(); }
    else if (CONFIG.DOWNLOAD_URL && CONFIG.DOWNLOAD_URL !== "#") { e.preventDefault(); window.location.href = CONFIG.DOWNLOAD_URL; }
  });
});

// Point each download button at its asset.
const setHref = (id, url) => { const el = document.getElementById(id); if (el && url && url !== "#") el.setAttribute("href", url); };
setHref("dl-go", CONFIG.DOWNLOAD_URL);
setHref("dl-go-mac", CONFIG.DOWNLOAD_URL_MAC);
setHref("dl-go-mac-intel", CONFIG.DOWNLOAD_URL_MAC_INTEL);
setHref("dl-go-android", CONFIG.DOWNLOAD_URL_ANDROID);

// Show the block for the visitor's platform (Windows / Mac / Android / iPhone),
// and let them switch with the pill row at the bottom of the modal.
const PLATFORMS = ["win", "mac", "android", "ios"];
const ua = navigator.userAgent || "";
const detectPlatform = () => {
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Mac/i.test(navigator.platform || "") || /Mac OS X/i.test(ua)) return "mac";
  return "win";
};
const showPlatform = (p) => {
  if (!PLATFORMS.includes(p)) p = "win";
  PLATFORMS.forEach((name) => {
    const block = document.getElementById("dl-" + name);
    if (block) block.hidden = name !== p;
  });
  document.querySelectorAll("#dl-switch button").forEach((b) => b.classList.toggle("on", b.dataset.plat === p));
};
showPlatform(detectPlatform());
document.querySelectorAll("#dl-switch button").forEach((b) =>
  b.addEventListener("click", () => showPlatform(b.dataset.plat)));

// iPhone waitlist: capture an email for the launch + discount code.
// Messages are localized by the page's <html lang> (set by build_i18n.py).
const IOS_MSG = {
  en: { invalid: "Please enter a valid email address.", saving: "Saving…", ok: "You're on the list. We'll email you at launch with your discount code.", err: "Something went wrong. Please try again in a moment." },
  fr: { invalid: "Veuillez saisir une adresse e-mail valide.", saving: "Enregistrement…", ok: "Vous êtes sur la liste. Nous vous écrirons au lancement avec votre code de réduction.", err: "Une erreur s'est produite. Veuillez réessayer dans un instant." },
  de: { invalid: "Bitte gib eine gültige E-Mail-Adresse ein.", saving: "Wird gespeichert…", ok: "Du bist auf der Liste. Wir melden uns zum Start mit deinem Rabattcode.", err: "Etwas ist schiefgelaufen. Bitte versuche es gleich noch einmal." },
  es: { invalid: "Introduce una dirección de correo válida.", saving: "Guardando…", ok: "Estás en la lista. Te escribiremos en el lanzamiento con tu código de descuento.", err: "Algo salió mal. Inténtalo de nuevo en un momento." },
  nl: { invalid: "Voer een geldig e-mailadres in.", saving: "Opslaan…", ok: "Je staat op de lijst. We mailen je bij de lancering met je kortingscode.", err: "Er ging iets mis. Probeer het zo nog eens." },
};
const iosMsg = IOS_MSG[(document.documentElement.lang || "en").slice(0, 2)] || IOS_MSG.en;
const iosForm = document.getElementById("ios-form");
if (iosForm) {
  iosForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("ios-email");
    const msg = document.getElementById("ios-msg");
    const btn = document.getElementById("ios-submit");
    const email = (input.value || "").trim();
    msg.className = "ss-cap";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      input.classList.add("err"); msg.textContent = iosMsg.invalid; msg.classList.add("err");
      return;
    }
    input.classList.remove("err");
    const original = btn.textContent;
    btn.textContent = iosMsg.saving; btn.style.pointerEvents = "none";
    try {
      const res = await fetch(`${CONFIG.LICENSE_API}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, platform: "ios" }),
      });
      const data = await res.json();
      if (data.ok) {
        iosForm.hidden = true;
        msg.textContent = iosMsg.ok;
        msg.classList.add("ok");
      } else { throw new Error(data.error || "failed"); }
    } catch (err) {
      btn.textContent = original; btn.style.pointerEvents = "";
      msg.textContent = iosMsg.err; msg.classList.add("err");
    }
  });
}

document.getElementById("dl-x")?.addEventListener("click", closeDlModal);
document.getElementById("dl-why")?.addEventListener("click", closeDlModal);
dlModal?.addEventListener("click", (e) => { if (e.target === dlModal) closeDlModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDlModal(); });

// ── Deadline countdown (bar + big timer) ─────────────────────
// Snapchat begins deleting Memories over the free 5GB limit on Sept 1, 2026.
const DEADLINE = new Date("2026-09-01T00:00:00");
function tickCountdown() {
  let diff = Math.max(0, DEADLINE - new Date());
  const day = Math.floor(diff / 86400000); diff -= day * 86400000;
  const hr = Math.floor(diff / 3600000); diff -= hr * 3600000;
  const min = Math.floor(diff / 60000); diff -= min * 60000;
  const sec = Math.floor(diff / 1000);
  const pad = (n) => String(n).padStart(2, "0");
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const barNums = document.getElementById("cd-bar-nums");
  if (barNums) barNums.textContent = `${day}d ${pad(hr)}h ${pad(min)}m ${pad(sec)}s`;
  set("cd-d", day); set("cd-h", pad(hr)); set("cd-m", pad(min)); set("cd-s", pad(sec));
}
tickCountdown();
setInterval(tickCountdown, 1000);

// ── Buy button → Stripe Checkout (via licence server) ────────
const buyBtn = document.getElementById("buy-btn");
if (buyBtn) {
  buyBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const original = buyBtn.textContent;
    buyBtn.textContent = "Opening secure checkout…";
    buyBtn.style.pointerEvents = "none";
    try {
      const res = await fetch(`${CONFIG.LICENSE_API}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("no url");
      }
    } catch (err) {
      buyBtn.textContent = original;
      buyBtn.style.pointerEvents = "";
      alert("Checkout isn't available yet — the store is still being set up. Please try again soon!");
    }
  });
}
