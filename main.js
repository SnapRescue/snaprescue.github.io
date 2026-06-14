/* SnapRescue site — config + interactions */

// ── Configure these at launch ────────────────────────────────
const CONFIG = {
  // Public URL of your licence server (the dedicated container).
  LICENSE_API: "https://snaprescue-license.tail28b3e2.ts.net",
  // Direct download link to the Windows build (e.g. a GitHub Release asset).
  DOWNLOAD_URL: "#", // TODO: paste the SnapRescue.exe release URL
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

// ── Download buttons ─────────────────────────────────────────
document.querySelectorAll('a[href="#download"], #download-btn').forEach((a) => {
  a.addEventListener("click", (e) => {
    if (CONFIG.DOWNLOAD_URL && CONFIG.DOWNLOAD_URL !== "#") {
      e.preventDefault();
      window.location.href = CONFIG.DOWNLOAD_URL;
    }
    // else: fall through to #download anchor (scrolls to pricing)
  });
});

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
