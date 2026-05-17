import { Router } from "express";
import { z } from "zod";
import {
  leadCreateSchema,
  leadListQuerySchema,
  leadUpdateSchema,
} from "@nexape/shared";
import { validate } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import * as controller from "./leads.controller.js";

const idParams = z.object({ id: z.string().min(1) });

const router = Router();
router.use(requireAuth);

router.get("/", validate({ query: leadListQuerySchema }), controller.list);
router.post("/", validate({ body: leadCreateSchema }), controller.create);
router.patch(
  "/:id",
  validate({ params: idParams, body: leadUpdateSchema }),
  controller.update,
);
router.delete("/:id", validate({ params: idParams }), controller.remove);

export default router;
