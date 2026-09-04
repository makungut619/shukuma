import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Load all env vars (including non-VITE_ prefixed ones) from .env files.
  const env = loadEnv(mode, process.cwd(), "");

  // Build the IZG Solutions footer credit link from environment variables.
  // Falls back to sensible defaults if any variable is missing.
  const izgBaseUrl = env.IZG_BASE_URL || "https://izgsolutions.com/";
  const izgUtmSource = env.IZG_UTM_SOURCE || "unknown";
  const izgUtmMedium = env.IZG_UTM_MEDIUM || "referral";
  const izgUtmCampaign = env.IZG_UTM_CAMPAIGN || "footer_credit_unknown";

  const izgCreditUrl = `${izgBaseUrl}?utm_source=${izgUtmSource}&utm_medium=${izgUtmMedium}&utm_campaign=${izgUtmCampaign}`;

  // Coming Soon pre-launch mode. When enabled, the full site is replaced by a
  // single-screen placeholder and the page is marked noindex.
  const comingSoon = env.COMING_SOON === "true" || env.VITE_COMING_SOON === "true";

  const ynotUrl = env.VITE_YNOT_URL || "https://y-not.co.za";

  return {
    root: ".",
    build: {
      outDir: "dist",
    },
    define: {
      __IZG_CREDIT_URL__: JSON.stringify(izgCreditUrl),
    },
    plugins: [comingSoon ? comingSoonPlugin({ izgCreditUrl, ynotUrl }) : null],
  };
});

/**
 * Vite plugin that swaps the site for a static Coming Soon placeholder at build
 * time. Replaces the <body> and injects a noindex robots meta + coming-soon
 * title so no full-site content or scripts ship while in pre-launch mode.
 */
function comingSoonPlugin({ izgCreditUrl, ynotUrl }) {
  const year = new Date().getFullYear();
  const instagramUrl = "https://www.instagram.com/shukuma__";

  const body = `
<body class="bg-shukuma-cream text-shukuma-dark font-sans">
  <!-- Accent bars framing the viewport -->
  <div class="fixed top-0 left-0 right-0 h-1 bg-shukuma-gold z-50"></div>
  <div class="fixed bottom-0 left-0 right-0 h-1 bg-shukuma-gold z-50"></div>

  <main class="min-h-screen flex flex-col items-center justify-center text-center px-6 py-16">
    <!-- Logo -->
    <img src="/images/logo.jpg" alt="Shukuma" class="h-48 w-48 rounded-2xl object-contain mx-auto shadow-sm" />

    <!-- Accent divider -->
    <div class="mt-8 mb-8 h-0.5 w-16 bg-shukuma-gold mx-auto"></div>

    <!-- Headline -->
    <h1 class="text-2xl md:text-3xl font-black text-shukuma-dark" style="font-family: 'Eurostile Extended', sans-serif;">
      Our new website is launching soon.
    </h1>

    <!-- Body copy -->
    <p class="mt-3 text-shukuma-muted max-w-md mx-auto text-lg">
      Where fun meets fitness. 52 exercise cards. No gym, no equipment, no excuses.
      The full site is on its way. In the meantime, reach us below.
    </p>

    <!-- Contact card -->
    <div class="mt-10 w-full max-w-sm rounded-2xl border border-shukuma-dark/10 bg-white p-8 text-left shadow-sm">
      <p class="text-shukuma-gold text-xs uppercase tracking-[0.2em] font-semibold mb-5">Get in touch</p>
      <div class="space-y-3 text-sm">
        <div class="flex justify-between gap-4">
          <span class="text-shukuma-dark font-bold">Instagram</span>
          <a href="${instagramUrl}" target="_blank" rel="noopener noreferrer" class="text-shukuma-muted hover:text-shukuma-gold transition-colors">@shukuma__</a>
        </div>
        <div class="flex justify-between gap-4">
          <span class="text-shukuma-dark font-bold">Shop</span>
          <a href="${ynotUrl}" target="_blank" rel="noopener noreferrer" class="text-shukuma-muted hover:text-shukuma-gold transition-colors">Get Your Deck</a>
        </div>
      </div>
    </div>

    <!-- Footer credit -->
    <footer class="mt-10">
      <p class="text-shukuma-muted/50 text-xs">&copy; ${year} Shukuma. All rights reserved.</p>
      <p class="text-shukuma-muted/40 text-xs mt-1">
        Built by
        <a href="${izgCreditUrl}" target="_blank" rel="noopener noreferrer" class="text-shukuma-gold/80 hover:text-shukuma-gold transition-colors">IZG Solutions</a>
      </p>
    </footer>
  </main>
</body>`;

  return {
    name: "shukuma-coming-soon",
    // Run after Vite injects the bundled module script so we can strip it -
    // the placeholder is pure static and must not ship the full-site JS.
    enforce: "post",
    transformIndexHtml(html) {
      return (
        html
          // Replace the entire body with the coming-soon placeholder.
          .replace(/<body[\s\S]*<\/body>/, body.trim())
          // Remove the hoisted app bundle so no full-site JS (or analytics) runs.
          .replace(/<script\b[^>]*type="module"[^>]*><\/script>\s*/g, "")
          // Mark the placeholder noindex so search engines don't cache it.
          .replace(
            /<meta name="description"[^>]*>/,
            `<meta name="description" content="Shukuma - our new website is launching soon. Where fun meets fitness." />\n  <meta name="robots" content="noindex, nofollow" />`
          )
          // Coming-soon title.
          .replace(/<title>[\s\S]*?<\/title>/, "<title>Shukuma - Coming Soon</title>")
      );
    },
  };
}
