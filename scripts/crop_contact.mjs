import sharp from "sharp";
const SRC = "/Users/felix-krueckel/Documents/branding/Fotos/profi.JPG";
await sharp(SRC).rotate().extract({ left: 0, top: 400, width: 2600, height: 3250 })
  .resize(900).jpeg({ quality: 85 }).toFile("src/assets/contact_new.jpeg");
console.log("done");
