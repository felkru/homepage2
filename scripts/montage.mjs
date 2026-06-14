import sharp from "sharp";
const files = process.argv.slice(3);
const out = process.argv[2];
const TW = 420, TH = 262;
const imgs = await Promise.all(files.map(f => sharp(`src/assets/thumbs/${f}`).resize(TW, TH).toBuffer()));
const cols = 2, rows = Math.ceil(files.length / cols);
await sharp({ create: { width: cols * (TW + 8) + 8, height: rows * (TH + 8) + 8, channels: 3, background: "#222" } })
  .composite(imgs.map((input, i) => ({ input, left: 8 + (i % cols) * (TW + 8), top: 8 + Math.floor(i / cols) * (TH + 8) })))
  .png().toFile(out);
console.log("OK");
