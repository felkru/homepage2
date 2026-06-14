// Generate FK-monogram favicons matching the site's nav brand mark.
// Run from repo root: node scripts/gen-favicon.mjs
import sharp from "sharp";
import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const pub = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#0a0e14"/>
  <rect x="20" y="20" width="472" height="472" rx="96" fill="#0f1520" stroke="#5eead4" stroke-width="16"/>
  <text x="256" y="256" font-family="'IBM Plex Mono','SFMono-Regular',Menlo,Consolas,monospace" font-weight="600"
        font-size="230" fill="#5eead4" text-anchor="middle" dominant-baseline="central" letter-spacing="-6">FK</text>
</svg>`;

const masterSvg = svg(512);
writeFileSync(path.join(pub, "favicon.svg"), masterSvg);

const png = (size) => sharp(Buffer.from(svg(size))).png().toBuffer();

function pngToIco(pngBuf, size) {
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2); // type: icon
    header.writeUInt16LE(1, 4); // count
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(pngBuf.length, 8);
    entry.writeUInt32LE(22, 12); // offset = 6 + 16
    return Buffer.concat([header, entry, pngBuf]);
}

const targets = [
    ["favicon-16x16.png", 16],
    ["favicon-32x32.png", 32],
    ["apple-touch-icon.png", 180],
    ["android-chrome-192x192.png", 192],
    ["android-chrome-512x512.png", 512],
    ["mstile-150x150.png", 150],
];

for (const [file, size] of targets) {
    const buf = await png(size);
    writeFileSync(path.join(pub, file), buf);
    console.log("✓", file);
}

writeFileSync(path.join(pub, "favicon.ico"), pngToIco(await png(32), 32));
console.log("✓ favicon.ico + favicon.svg");
