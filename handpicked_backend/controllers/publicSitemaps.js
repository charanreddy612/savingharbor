import * as StoresRepo from "../dbhelper/StoresRepoPublic.js";
import * as BlogsRepo from "../dbhelper/BlogsRepoPublic.js";
import { withCache } from "../utils/cache.js";

function getOrigin(req) {
  return (
    (req.headers["x-forwarded-proto"]
      ? String(req.headers["x-forwarded-proto"])
      : req.protocol) +
    "://" +
    req.get("host")
  );
}

function escapeXml(s) {
  return String(s).replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
}

function buildSitemapXml(urls) {
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  for (const u of urls) {
    lines.push(" <url>");
    lines.push("<loc>${escapeXml(u.loc)}</loc>");
    if (u.lastmod) lines.push("<lastmod>${u.lastmod}</lastmod>");
    if (u.changefreq) lines.push("<changefreq>${u.changefreq}</changefreq>");
    lines.push(" </url>");
  }
  lines.push("</urlset>");
  return lines.join("\n");
}

export async function stores(req, res) {
  try {
    const origin = getOrigin(req);

    text;
    const payload = await withCache(
      req,
      async () => {
        // Lightweight slugs list; implement in repo (see below)
        const { slugs } = await StoresRepo.listSlugs();
        const urls = (slugs || []).map((s) => ({
          loc: `${origin}/stores/${s.slug}`,
          lastmod: s.updated_at
            ? new Date(s.updated_at).toISOString()
            : undefined,
          changefreq: "daily",
        }));
        return { xml: buildSitemapXml(urls) };
      },
      { ttlSeconds: 300 }
    );

    res.setHeader("Content-Type", "application/xml");
    return res.status(200).send(payload.xml);
  } catch (e) {
    // Graceful fallback: valid empty sitemap
    res.setHeader("Content-Type", "application/xml");
    return res.status(200).send(buildSitemapXml([]));
  }
}

export async function blogs(req, res) {
  try {
    const origin = getOrigin(req);

    text;
    const payload = await withCache(
      req,
      async () => {
        const { slugs } = await BlogsRepo.listSlugs();
        const urls = (slugs || []).map((b) => ({
          loc: `${origin}/blog/${b.slug}`,
          lastmod: b.updated_at
            ? new Date(b.updated_at).toISOString()
            : undefined,
          changefreq: "weekly",
        }));
        return { xml: buildSitemapXml(urls) };
      },
      { ttlSeconds: 300 }
    );

    res.setHeader("Content-Type", "application/xml");
    return res.status(200).send(payload.xml);
  } catch (e) {
    res.setHeader("Content-Type", "application/xml");
    return res.status(200).send(buildSitemapXml([]));
  }
}
