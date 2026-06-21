/* SnapRescue site — config + interactions */

// ── Configure these at launch ────────────────────────────────
const CONFIG = {
  // Public URL of your licence server (the dedicated container).
  LICENSE_API: "https://snaprescue-license.tail28b3e2.ts.net",
  // Direct download link to the Windows build (e.g. a GitHub Release asset).
  DOWNLOAD_URL: "https://github.com/SnapRescue/snaprescue.github.io/releases/download/v1.0.0/SnapRescue-Setup.exe",
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

const dlGo = document.getElementById("dl-go");
if (dlGo && CONFIG.DOWNLOAD_URL && CONFIG.DOWNLOAD_URL !== "#") dlGo.setAttribute("href", CONFIG.DOWNLOAD_URL);
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
