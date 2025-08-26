import { Router } from "express";
import * as blogController from "../controllers/blogController.js";
import { uploadMemory } from "../middleware/uploadMemory.js";

const router = Router();

/**
 * GET /api/blogs
 * List blogs - supports ?title= filter
 */
router.get("/", blogController.listBlogs);

/**
 * GET /api/blogs/:id
 * Get a single blog by ID
 */
router.get("/:id", blogController.getBlog);

/**
 * POST /api/blogs
 * Create blog - handles image uploads to Supabase Storage
 */
router.post(
  "/",
  uploadMemory.fields([
    { name: "featured_thumb", maxCount: 1 },
    { name: "featured_image", maxCount: 1 }
  ]),
  blogController.createBlog
);

/**
 * PUT /api/blogs/:id
 * Update blog - optionally updates images
 */
router.put(
  "/:id",
  uploadMemory.fields([
    { name: "featured_thumb", maxCount: 1 },
    { name: "featured_image", maxCount: 1 }
  ]),
  blogController.updateBlog
);

/**
 * PATCH /api/blogs/:id/status
 * Toggle is_publish (Active/Inactive)
 */
router.patch("/:id/status", blogController.updateBlogStatus);

/**
 * DELETE /api/blogs/:id
 * Delete a blog by ID
 */
router.delete("/:id", blogController.deleteBlog);

export default router;
