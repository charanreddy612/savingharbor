// src/routes/offers.js
import express from "express";
import { click } from "../controllers/offers.js"; // path to the controller we added

const router = express.Router();

/**
 * POST /api/offers/:offerId/click
 * Records a click, returns coupon code (if any) and redirect_url.
 */
router.post("/:offerId/click", click);

export default router;
