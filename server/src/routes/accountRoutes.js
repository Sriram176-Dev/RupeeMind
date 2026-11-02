import { Router } from "express";
import {
  deleteAccount,
  exportUserData,
  deleteAccountSchema,
} from "../controllers/accountController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.use(protect);

router.delete("/", validate(deleteAccountSchema), deleteAccount);
router.get("/export", exportUserData);

export default router;
