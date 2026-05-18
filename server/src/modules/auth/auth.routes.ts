import { Router } from "express";
import { loginSchema, registerSchema } from "../../shared/index.js";
import { validate } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import * as controller from "./auth.controller.js";

const router = Router();

router.post("/register", validate({ body: registerSchema }), controller.register);
router.post("/login", validate({ body: loginSchema }), controller.login);
router.get("/me", requireAuth, controller.me);

export default router;
