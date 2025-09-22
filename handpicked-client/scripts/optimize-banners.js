#!/usr/bin/env node
/**
 * scripts/optimize-banner.js
 *
 * - Finds files named like: banner1-..., banner2-..., banner3.png etc in inputDir
 * - Removes any existing optimized files in outputDir that match banner<number>*
 * - Generates responsive WebP / AVIF as banner<number>-<width>.ext
 * - Prints a tiny blur placeholder (webp base64) to stdout per banner
 */

import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------- CLI parsing -----------------
const argv = Object.fromEntries(
  process.argv
    .slice(2)
    .map((arg) => arg.split("="))
    .map(([k, v]) => [k.replace(/^--/, ""), v ?? true])
);

const inputDir =
  argv.inputDir || path.join(__dirname, "..", "public", "images");
const outputDir =
  argv.outputDir || path.join(__dirname, "..", "public", "optimized");
const sizes = (argv.sizes || "320,480,768,1024,1600").split(",").map(Number);
const qualityWebp = Number(argv.qualityWebp ?? 75);
const qualityAvif = Number(argv.qualityAvif ?? 50);
const placeholderSize = Number(argv.placeholderSize ?? 20);

// regex matches files that start with "banner" followed by a number (banner1, banner2, banner10, etc)
const BANNER_RE = /^banner(\d+)/i;

// ----------------- helpers -----------------
async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function removeOldOptimizedFilesFor(bannerKey, outDir) {
  let existing = [];
  try {
    existing = await fs.readdir(outDir);
  } catch {
    return;
  }

  const toRemove = existing.filter((f) => f.startsWith(bannerKey + "-"));
  for (const fname of toRemove) {
    const p = path.join(outDir, fname);
    try {
      await fs.unlink(p);
      process.stdout.write(`removed ${fname} `);
    } catch (err) {
      console.warn(`failed to remove ${fname}: ${err.message}`);
    }
  }
}

// ----------------- main -----------------
async function optimize() {
  console.log("→ Banner optimizer starting");
  console.log(`  inputDir: ${inputDir}`);
  console.log(`  outputDir: ${outputDir}`);
  console.log(`  sizes: ${sizes.join(", ")}`);
  await ensureDir(outputDir);

  let files;
  try {
    files = await fs.readdir(inputDir);
  } catch (err) {
    console.error(`Error reading inputDir "${inputDir}":`, err.message);
    process.exit(1);
  }

  const bannerFiles = files.filter((f) => BANNER_RE.test(f));
  if (!bannerFiles.length) {
    console.log("No banner files found matching /^banner(\\d+)/ in", inputDir);
    return;
  }

  for (const file of bannerFiles) {
    const filePath = path.join(inputDir, file);
    let stat;
    try {
      stat = await fs.stat(filePath);
    } catch (err) {
      console.warn(`Skipping ${file} — stat failed: ${err.message}`);
      continue;
    }
    if (!stat.isFile()) continue;

    const match = file.match(BANNER_RE);
    if (!match) continue;
    const bannerKey = `banner${match[1]}`; // normalized name (e.g., banner3)

    console.log(`\nProcessing ${file} → ${bannerKey}`);

    // Remove old optimized files for this bannerKey
    await removeOldOptimizedFilesFor(bannerKey, outputDir);

    // produce multiple sizes
    for (const w of sizes) {
      const webpOut = path.join(outputDir, `${bannerKey}-${w}.webp`);
      const avifOut = path.join(outputDir, `${bannerKey}-${w}.avif`);

      try {
        await sharp(filePath)
          .resize({ width: w })
          .webp({ quality: qualityWebp })
          .toFile(webpOut);
        await sharp(filePath)
          .resize({ width: w })
          .avif({ quality: qualityAvif })
          .toFile(avifOut);
        process.stdout.write(".");
      } catch (err) {
        console.warn(
          `\n  failed to generate ${w}px for ${file}: ${err.message}`
        );
        continue;
      }
    }

    // generate small blur placeholder (webp base64)
    try {
      const buf = await sharp(filePath)
        .resize(placeholderSize)
        .webp({ quality: 30 })
        .toBuffer();
      const b64 = `data:image/webp;base64,${buf.toString("base64")}`;
      console.log(`\nplaceholder for ${bannerKey}: ${b64}`);
    } catch (err) {
      console.warn(
        `\n  failed to generate placeholder for ${file}: ${err.message}`
      );
    }
  }

  console.log(`\nDone. Optimized ${bannerFiles.length} banner(s).`);
}

optimize().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
