// Replace CTA links with env variable
const ynotUrl = import.meta.env.VITE_YNOT_URL || "https://y-not.co.za";
document.querySelectorAll(".cta-link").forEach((link) => {
  link.href = ynotUrl;
});

// Build the IZG Solutions footer credit link from env variables at build time.
// __IZG_CREDIT_URL__ is injected by Vite's `define` (see vite.config.js).
document.querySelectorAll(".izg-credit-link").forEach((link) => {
  link.href = __IZG_CREDIT_URL__;
});

// Scroll reveal animation
const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }
);

revealElements.forEach((el) => revealObserver.observe(el));

// Stagger card animations
const cards = document.querySelectorAll(".card-container");
cards.forEach((card, index) => {
  card.style.transitionDelay = `${index * 0.1}s`;
});

// Mobile: flip cards back when tapping elsewhere
document.addEventListener("click", (e) => {
  if (!e.target.closest(".card-container")) {
    cards.forEach((card) => card.classList.remove("flipped"));
  }
});

// Autoplay videos when they scroll into view
const videos = document.querySelectorAll("#in-action video");

const playedVideos = new WeakSet();

const videoObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.play();
        // Track the first time each video plays into view.
        if (!playedVideos.has(entry.target)) {
          playedVideos.add(entry.target);
          const src = entry.target.getAttribute("src") || "";
          const name = src.split("/").pop() || "unknown";
          window.izg?.track("video_play", { video: name, location: "in_action" });
        }
      } else {
        entry.target.pause();
      }
    });
  },
  { threshold: 0.3 }
);

videos.forEach((video) => videoObserver.observe(video));

// Feedback widget (preview only)
if (import.meta.env.VITE_ENABLE_FEEDBACK === 'true') {
  const s = document.createElement('script');
  s.src = 'https://feedback-tool-theta.vercel.app/widget.js';
  s.setAttribute('data-token', import.meta.env.VITE_FEEDBACK_TOKEN);
  s.setAttribute('data-api', 'https://feedback-tool-theta.vercel.app');
  document.body.appendChild(s);
}

// ---------------------------------------------------------------------------
// IZG Analytics
// ---------------------------------------------------------------------------

// Load the tracking script from env config. The inline stub in index.html's
// <head> queues any early track() calls until this script initialises.
const analyticsUrl = import.meta.env.VITE_ANALYTICS_URL;
const analyticsToken = import.meta.env.VITE_ANALYTICS_TOKEN;
const analyticsFlush = import.meta.env.VITE_ANALYTICS_FLUSH_MS || "5000";

if (analyticsUrl && analyticsToken) {
  const scriptSrc = `${analyticsUrl.replace("/api/events/ingest", "")}/script.js`;
  const s = document.createElement("script");
  s.src = scriptSrc;
  s.defer = true;
  s.setAttribute("data-token", analyticsToken);
  s.setAttribute("data-endpoint", analyticsUrl);
  s.setAttribute("data-flush", analyticsFlush);
  document.head.appendChild(s);
}

// Safe tracking helper (no-op until the script loads; calls are queued).
function trackEvent(name, props) {
  window.izg?.track(name, props || {});
}

// CTA clicks - the "Get Your Deck" buttons (navbar, hero, final CTA).
document.querySelectorAll(".cta-link").forEach((link, index) => {
  // Derive a location label from the nearest section id, falling back to order.
  const section = link.closest("section")?.id || (index === 0 ? "navbar" : "cta");
  link.addEventListener("click", () => {
    trackEvent("cta_click", { button: "get_your_deck", location: section });
    trackEvent("outbound_click", { url: link.href, page: window.location.pathname });
  });
});

// Social clicks - Instagram link in the footer.
document
  .querySelectorAll('a[href*="instagram.com"]')
  .forEach((link) => {
    link.addEventListener("click", () => {
      trackEvent("social_click", { platform: "instagram", location: "footer" });
    });
  });

// Card flips - exercise card engagement.
cards.forEach((card, index) => {
  card.addEventListener("click", () => {
    // Only count the flip that reveals the card (front -> back).
    if (card.classList.contains("flipped")) {
      trackEvent("card_flip", { card_index: index + 1 });
    }
  });
});

// FAQ opens - track when a question is expanded.
document.querySelectorAll("#faq details").forEach((detail, index) => {
  detail.addEventListener("toggle", () => {
    if (detail.open) {
      const question = detail.querySelector("summary")?.textContent?.trim() || `faq_${index + 1}`;
      trackEvent("faq_open", { question });
    }
  });
});

// Section views - fire once when a key section scrolls into view.
const trackedSections = ["what", "cards", "in-action", "faq", "get-yours"];
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        trackEvent("section_view", { section: entry.target.id });
        sectionObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

trackedSections.forEach((id) => {
  const el = document.getElementById(id);
  if (el) sectionObserver.observe(el);
});
