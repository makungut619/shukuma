/**
 * One-off asset generator for the Coming Soon page (Shukuma).
 *
 * Generates the icons/OG images required by the coming-soon standard from the
 * Shukuma logo. sharp is resolved from a sibling project's node_modules if it
 * isn't installed locally (pass the path via SHARP_PATH env var if needed).
 *
 * Run: node scripts/generate-icons.mjs
 * Palette: cream background (#FAF5EF), gold accent (#E8A800).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Resolve sharp from this project, or fall back to the yanga-ngcayisa install.
const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require("sharp");
} catch {
  const fallback =
    process.env.SHARP_PATH ||
    join(root, "..", "yanga-ngcayisa", "node_modules", "sharp");
  sharp = require(fallback);
}

const logoPath = join(root, "public", "images", "logo.jpg");
const publicDir = join(root, "public");
mkdirSync(publicDir, { recursive: true });

const CREAM = "#FAF5EF";
const GOLD = "#E8A800";
const DARK = "#1A1A1A";

async function squareIcon(size) {
  const pad = Math.round(size * 0.1);
  const inner = size - pad * 2;
  const logo = await sharp(logoPath)
    .resize(inner, inner, { fit: "contain", background: CREAM })
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: CREAM },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toBuffer();
}

function pngToIco(pngBuffer, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(6 + 16, 12);
  return Buffer.concat([header, entry, pngBuffer]);
}

async function main() {
  // Keep existing favicon.ico + apple-touch-icon.png, but (re)generate the
  // modern set for completeness per the coming-soon standard.
  writeFileSync(join(publicDir, "favicon.ico"), pngToIco(await squareIcon(48), 48));
  writeFileSync(join(publicDir, "apple-touch-icon.png"), await squareIcon(180));
  writeFileSync(join(publicDir, "icon-192.png"), await squareIcon(192));
  writeFileSync(join(publicDir, "icon-512.png"), await squareIcon(512));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="${CREAM}"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-family="Arial, sans-serif" font-weight="900" font-size="40" fill="${DARK}">S</text>
</svg>`;
  writeFileSync(join(publicDir, "icon.svg"), svg);

  // OG / Twitter image (1200x630): logo + wordmark on cream background.
  const ogLogo = await sharp(logoPath)
    .resize(300, 300, { fit: "contain", background: CREAM })
    .toBuffer();
  const ogText = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="180">
      <text x="600" y="70" text-anchor="middle" font-family="Arial, sans-serif"
        font-weight="900" font-size="60" fill="${DARK}" letter-spacing="8">SHUKUMA</text>
      <text x="600" y="130" text-anchor="middle" font-family="Arial, sans-serif"
        font-weight="600" font-size="28" fill="${GOLD}" letter-spacing="4">WHERE FUN MEETS FITNESS</text>
    </svg>`
  );
  const og = await sharp({
    create: { width: 1200, height: 630, channels: 4, background: CREAM },
  })
    .composite([
      { input: ogLogo, top: 110, left: 450 },
      { input: ogText, top: 420, left: 0 },
    ])
    .png()
    .toBuffer();
  writeFileSync(join(publicDir, "opengraph-image.png"), og);
  writeFileSync(join(publicDir, "twitter-image.png"), og);

  console.log("Generated shukuma icons + OG images in /public");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
