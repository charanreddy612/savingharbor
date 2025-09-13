import * as BlogsRepo from "../dbhelper/BlogsRepoPublic.js";
import { ok, fail, notFound } from "../utils/http.js";
import { withCache } from "../utils/cache.js";
import { buildCanonical } from "../utils/seo.js";
import {
  valPage,
  valLimit,
  valEnum,
  valLocale,
  deriveLocale,
} from "../utils/validation.js";
import { badRequest } from "../utils/errors.js";
import { buildArticleJsonLd } from "../utils/jsonld.js";
import { getOrigin, getPath } from "../utils/request-helper.js";

// Build prev/next/total_pages navigation URLs
function buildPrevNext({ origin, path, page, limit, total, extraParams = {} }) {
  const totalPages = Math.max(Math.ceil((total || 0) / (limit || 1)), 1);
  const makeUrl = (p) => {
    try {
      const url = new URL(`${origin}${path}`);
      Object.entries({ ...extraParams, page: p, limit }).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== "")
          url.searchParams.set(k, String(v));
      });
      return url.toString();
    } catch (err) {
      console.error("Failed to build URL:", err);
      return null;
    }
  };
  return {
    prev: page > 1 ? makeUrl(page - 1) : null,
    next: page < totalPages ? makeUrl(page + 1) : null,
    totalPages,
  };
}

export async function list(req, res) {
  try {
    const page = valPage(req.query.page);
    const limit = valLimit(req.query.limit);
    const sort = valEnum(req.query.sort, ["latest", "featured"], "latest");
    const locale = valLocale(req.query.locale) || deriveLocale(req);
    const categoryId = req.query.category_id
      ? Number(req.query.category_id)
      : null;
    if (req.query.category_id && !Number.isFinite(categoryId))
      return badRequest(res, "Invalid category_id");

    const qRaw = String(req.query.q || "");
    const q = qRaw.length > 200 ? qRaw.slice(0, 200) : qRaw;

    // Resolve origin/path safely (getOrigin/getPath might be sync or async)
    const origin = await Promise.resolve(getOrigin(req, { trustProxy: false }));
    const path = await Promise.resolve(getPath(req));

    const params = {
      q: q.trim(),
      categoryId,
      sort,
      locale,
      page,
      limit,
      origin,
      path,
    };

    const result = await withCache(
      req,
      async () => {
        try {
          const { rows, total } = await BlogsRepo.list(params);
          const nav = buildPrevNext({
            origin: params.origin,
            path: params.path,
            page,
            limit,
            total,
            extraParams: {
              q: params.q || undefined,
              category_id: params.categoryId || undefined,
              sort: params.sort,
              locale: params.locale || undefined,
            },
          });
          // Await buildCanonical because it is async and may resolve Promises internally
          const canonical = await buildCanonical({
            origin: params.origin,
            path: params.path,
            page,
            limit,
            q: params.q,
            categorySlug: params.categorySlug,
            sort: params.sort,
          });
          return {
            data: rows,
            meta: {
              page,
              limit,
              total,
              canonical,
              prev: nav.prev,
              next: nav.next,
              total_pages: nav.totalPages,
            },
          };
        } catch (err) {
          console.error("Failed to fetch blogs list:", err);
          throw err;
        }
      },
      { ttlSeconds: 60, keyExtra: "blogs" }
    );

    return ok(res, result);
  } catch (e) {
    console.error("Error in blogs.list:", e);
    return fail(res, "Failed to list blogs", e);
  }
}

export async function detail(req, res) {
  try {
    const slug = String(req.params.slug || "")
      .trim()
      .toLowerCase();
    if (!slug) return badRequest(res, "Invalid blog slug");
    // Opt-in for trusting proxy headers only if you know the provider is trusted
    const origin = await Promise.resolve(getOrigin(req, { trustProxy: false }));
    const path = await Promise.resolve(getPath(req));

    const locale = valLocale(req.query.locale) || deriveLocale(req);
    const params = { slug, locale, origin, path };

    const result = await withCache(
      req,
      async () => {
        try {
          const blog = await BlogsRepo.getBySlug(slug);
          if (!blog) return { data: null, meta: { status: 404 } };

          const canonical = await buildCanonical({
            origin: params.origin,
            path: params.path,
            page,
            limit,
            q: params.q,
            categorySlug: params.categorySlug,
            sort: params.sort,
          });

          const seo = BlogsRepo.buildSeo(blog, { canonical, locale: params.locale });
          const breadcrumbs = BlogsRepo.buildBreadcrumbs(blog, params);

          const articleJsonLd = buildArticleJsonLd(blog, params.origin);
          const breadcrumbJsonLd = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: breadcrumbs.map((b, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: b.name,
              item: b.url,
            })),
          };

          const related = await BlogsRepo.related(blog, 6);
          return {
            data: {
              id: blog.id,
              slug: blog.slug,
              title: blog.title,
              hero_image_url: blog.hero_image_url,
              category: blog.category || null,
              author: blog.author || {},
              created_at: blog.created_at,
              updated_at: blog.updated_at,
              seo,
              breadcrumbs,
              content_html: blog.content_html,
              related,
            },
            meta: {
              canonical,
              jsonld: { article: articleJsonLd, breadcrumb: breadcrumbJsonLd },
            },
          };
        } catch (err) {
          console.error("Failed to fetch blog detail:", err);
          throw err;
        }
      },
      { ttlSeconds: 300, keyExtra: "blogs" }
    );

    if (!result?.data) return notFound(res, "Blog not found");

    return ok(res, result);
  } catch (e) {
    console.error("Error in blogs.detail:", e);
    return fail(res, "Failed to get blog detail", e);
  }
}
