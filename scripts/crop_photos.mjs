import sharp from "sharp";
const SRC = "/Users/felix-krueckel/Documents/branding/Fotos/profi.JPG";
const base = sharp(SRC).rotate();
await base.clone().extract({ left: 0, top: 250, width: 2580, height: 4300 })
  .resize(900).jpeg({ quality: 85 }).toFile("src/assets/felix_pro.jpg");
await base.clone().extract({ left: 280, top: 900, width: 2100, height: 2100 })
  .resize(600).jpeg({ quality: 85 }).toFile("src/assets/profile_new.jpg");
console.log("done");
