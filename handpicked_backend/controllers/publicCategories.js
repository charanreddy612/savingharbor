// controllers/publicCategories.js
import * as CategoriesRepo from "../dbhelper/CategoriesRepoPublic.js";
import { ok, fail, notFound } from "../utils/http.js";
import { withCache } from "../utils/cache.js";
import {
  valLimit,
  valEnum,
  valLocale,
  deriveLocale,
} from "../utils/validation.js";
import { badRequest } from "../utils/errors.js";
import { CATEGORY_SORTS } from "../constants/publicEnums.js"; // Add this enum
import { getOrigin, getPath } from "../utils/request-helper.js";
import { makeListCacheKey } from "../utils/cacheKey.js";

/**
 * GET /public/v1/categories
 * Cursor-based pagination, root categories only (parent_id IS NULL)
 */
export async function list(req, res) {
  try {
    const limit = valLimit(req.query.limit);
    const sort = valEnum(req.query.sort, CATEGORY_SORTS, "name");
    const locale = valLocale(req.query.locale) || deriveLocale(req);
    const qRaw = String(req.query.q || "");
    const q = qRaw.length > 200 ? qRaw.slice(0, 200) : qRaw;
    const letter = String(req.query.letter || "All").trim();
    const cursor = String(req.query.cursor || null);

    const origin = await Promise.resolve(getOrigin(req, { trustProxy: false }));
    const path = await Promise.resolve(getPath(req));

    const params = {
      q: q.trim(),
      sort,
      locale,
      limit,
      origin,
      path,
      letter,
      cursor,
    };

    const cacheKey = makeListCacheKey("categories", {
      limit,
      q: params.q || "",
      sort: params.sort || "",
      locale: params.locale || "",
      letter: params.letter || "",
      cursor: params.cursor || "",
    });

    const result = await withCache(
      req,
      async () => {
        const { rows, total, nextCursor } = await CategoriesRepo.list(params);

        const canonical = null;

        return {
          data: rows,
          meta: {
            limit,
            total,
            canonical,
            nextCursor,
          },
        };
      },
      { ttlSeconds: 60, keyExtra: cacheKey },
    );

    return ok(res, result);
  } catch (e) {
    console.error("Categories list controller error:", e);
    return fail(res, "Failed to list categories", e);
  }
}

/**
 * GET /public/v1/categories/:slug - Category detail
 */
export async function detail(req, res) {
  try {
    const slug = String(req.params.slug || "")
      .trim()
      .toLowerCase();
    if (!slug) return badRequest(res, "Invalid category slug");

    const origin = await Promise.resolve(getOrigin(req, { trustProxy: false }));
    const path = await Promise.resolve(getPath(req));

    const page = valLimit(req.query.page);
    const limit = valLimit(req.query.limit);

    const params = { slug, page, limit, origin, path };

    const cacheKey = makeListCacheKey("categories", {
      slug,
      page,
      limit,
    });

    const result = await withCache(
      req,
      async () => {
        const category = await CategoriesRepo.getBySlug(params.slug);
        if (!category) return { data: null, meta: { status: 404 } };

        return {
          data: category,
          meta: {
            generated_at: new Date().toISOString(),
            canonical: null,
          },
        };
      },
      { ttlSeconds: 60, keyExtra: cacheKey },
    );

    if (!result?.data) return notFound(res, "Category not found");
    return ok(res, result);
  } catch (e) {
    console.error("Category detail controller error:", e);
    return fail(res, "Failed to get category detail", e);
  }
}
