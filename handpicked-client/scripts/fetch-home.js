// scripts/fetch-home.js
import fs from "fs";
import fetch from "node-fetch";

const OUT_DIR = "public/_data";
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const BACKEND = process.env.MY_BACKEND || "https://your-render-backend.example";

async function fetchAndWrite(path, outFile) {
  try {
    const res = await fetch(`${BACKEND}${path}`, { timeout: 8000 });
    if (!res.ok) {
      console.error("Upstream non-200 for", path, res.status);
      fs.writeFileSync(
        outFile,
        JSON.stringify({ data: [], meta: {}, errorStatus: res.status })
      );
      return;
    }
    const json = await res.json();
    fs.writeFileSync(outFile, JSON.stringify(json));
    console.log(`Wrote ${outFile}`);
  } catch (err) {
    console.error("Fetch error for", path, err && err.message);
    fs.writeFileSync(
      outFile,
      JSON.stringify({ data: [], meta: {}, error: "fetch_failed" })
    );
  }
}

(async () => {
  await Promise.all([
    fetchAndWrite("/stores?limit=8&mode=homepage", `${OUT_DIR}/home.json`),
    fetchAndWrite("/coupons?limit=8&mode=homepage", `${OUT_DIR}/coupons.json`),
  ]);
})();
