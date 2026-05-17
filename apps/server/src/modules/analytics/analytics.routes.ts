import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import * as controller from "./analytics.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/summary", controller.summary);

export default router;
