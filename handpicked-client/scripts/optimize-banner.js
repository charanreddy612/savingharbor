// scripts/optimize-banner.js
import sharp from "sharp";
// const sharp = require("sharp");
const input = "public/images/banner3-1600x500.png";
const output = "public/optimized/banner3";
const sizes = [320, 480, 768, 1024, 1600];
(async () => {
  for (const w of sizes) {
    await sharp(input)
      .resize({ width: w })
      .webp({ quality: 75 })
      .toFile(`${output}-${w}.webp`);
    await sharp(input)
      .resize({ width: w })
      .avif({ quality: 50 })
      .toFile(`${output}-${w}.avif`);
  }
  // tiny blur placeholder (20px webp)
  const buf = await sharp(input).resize(20).webp({ quality: 30 }).toBuffer();
  console.log("done", "blur:data:image/webp;base64," + buf.toString("base64"));
})();
