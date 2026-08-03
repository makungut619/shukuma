// Replace CTA links with env variable
const ynotUrl = import.meta.env.VITE_YNOT_URL || "https://y-not.co.za";
document.querySelectorAll(".cta-link").forEach((link) => {
  link.href = ynotUrl;
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

const videoObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.play();
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
