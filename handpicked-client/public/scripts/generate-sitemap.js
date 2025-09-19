// scripts/generate-sitemaps.js
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { SitemapStream, streamToPromise } = require("sitemap");

// CONFIG
const HOSTNAME = "https://handpickedclient.vercel.app.com";
const OUT_DIR = path.join(__dirname, "..", "public", "sitemaps");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------- Replace these with your real data fetches ----------

// Example: if you store content in DB, implement DB queries here.
// Return arrays of objects with: { url: '/stores/slug', lastmod: 'YYYY-MM-DD', images: [{loc:'/images/x', caption:''}] }
async function fetchStores() {
  // TODO: replace with DB query to your stores table
  return [
    { url: "/stores/store-slug-1", lastmod: "2025-09-16" },
    { url: "/stores/store-slug-2", lastmod: "2025-09-15" },
  ];
}

async function fetchCoupons() {
  // TODO: replace with DB query to active coupons only
  return [
    {
      url: "/coupons/coupon-slug-1",
      lastmod: "2025-09-17",
      images: [{ loc: "/images/coupons/coupon1.jpg", caption: "Coupon 1" }],
    },
    { url: "/coupons/coupon-slug-2", lastmod: "2025-09-14" },
  ];
}

// Example filesystem fetch for Astro MD/MDX or frontmatter-based posts
async function fetchBlogPostsFromFilesystem() {
  // if your blog posts are in content/blog/*.md or src/content/blog
  // use a real markdown parser and read frontmatter for lastmod/slugs
  // This is a placeholder; adapt to your file layout
  const posts = [
    { url: "/blog/how-to-get-best-coupons", lastmod: "2025-09-01" },
    { url: "/blog/using-coupons-smartly", lastmod: "2025-08-20" },
  ];
  return posts;
}

// If your blog is DB-backed, create fetchBlogPosts() analogously
async function fetchBlogPosts() {
  return fetchBlogPostsFromFilesystem();
}

// ----------------- helpers -----------------
async function writeGzippedSitemap(filename, items) {
  const filepath = path.join(OUT_DIR, filename);
  const smStream = new SitemapStream({ hostname: HOSTNAME });
  const gzipStream = smStream.pipe(zlib.createGzip());
  items.forEach((i) => {
    const entry = {
      url: i.url,
      lastmod: i.lastmod,
      changefreq: i.changefreq,
      priority: i.priority,
    };
    if (i.images) {
      // `sitemap` package expects `img` property for images
      entry.img = i.images.map((img) => ({
        url: HOSTNAME + img.loc,
        caption: img.caption || "",
      }));
    }
    smStream.write(entry);
  });
  smStream.end();
  const buffer = await streamToPromise(gzipStream);
  fs.writeFileSync(filepath, buffer);
  console.log("Wrote", filepath);
}

// chunk array for safety (sitemap limits)
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// --------------- main ---------------
(async function main() {
  try {
    // pages (static index pages)
    const pages = [
      {
        url: "/",
        lastmod: new Date().toISOString().slice(0, 10),
        changefreq: "daily",
        priority: 1.0,
      },
      {
        url: "/stores",
        lastmod: new Date().toISOString().slice(0, 10),
        changefreq: "daily",
        priority: 0.8,
      },
      {
        url: "/coupons",
        lastmod: new Date().toISOString().slice(0, 10),
        changefreq: "daily",
        priority: 0.8,
      },
      {
        url: "/blogs",
        lastmod: new Date().toISOString().slice(0, 10),
        changefreq: "daily",
        priority: 0.6,
      },
    ];
    await writeGzippedSitemap("sitemap-pages.xml.gz", pages);

    // stores
    const stores = await fetchStores();
    const storeChunks = chunk(stores, 40000);
    for (let i = 0; i < storeChunks.length; i++) {
      const name =
        storeChunks.length === 1
          ? "sitemap-stores.xml.gz"
          : `sitemap-stores-${i + 1}.xml.gz`;
      await writeGzippedSitemap(name, storeChunks[i]);
    }

    // coupons
    const coupons = await fetchCoupons();
    const couponChunks = chunk(coupons, 40000);
    for (let i = 0; i < couponChunks.length; i++) {
      const name =
        couponChunks.length === 1
          ? "sitemap-coupons.xml.gz"
          : `sitemap-coupons-${i + 1}.xml.gz`;
      await writeGzippedSitemap(name, couponChunks[i]);
    }

    // blog
    const posts = await fetchBlogPosts();
    const postChunks = chunk(posts, 40000);
    for (let i = 0; i < postChunks.length; i++) {
      const name =
        postChunks.length === 1
          ? "sitemap-blog.xml.gz"
          : `sitemap-blog-${i + 1}.xml.gz`;
      await writeGzippedSitemap(name, postChunks[i]);
    }

    // build sitemap-index.xml pointing at all .xml.gz files
    const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".xml.gz"));
    const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${files
  .map(
    (f) =>
      `  <sitemap>\n    <loc>${HOSTNAME}/sitemaps/${f}</loc>\n    <lastmod>${new Date()
        .toISOString()
        .slice(0, 10)}</lastmod>\n  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;
    fs.writeFileSync(
      path.join(__dirname, "..", "public", "sitemap-index.xml"),
      indexXml,
      "utf8"
    );
    console.log("Wrote public/sitemap-index.xml");
  } catch (err) {
    console.error("Error generating sitemaps:", err);
    process.exitCode = 1;
  }
})();
