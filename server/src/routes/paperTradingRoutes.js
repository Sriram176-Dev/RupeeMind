import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  getSummary,
  getOrders,
  submitOrder,
  cancelOrder,
  resetWallet,
  estimateCharges,
} from "../controllers/paperTradingController.js";

const router = Router();

// All paper trading endpoints require authenticated user session
router.use(protect);

router.get("/wallet", getSummary);
router.get("/wallet/summary", getSummary);
router.get("/summary", getSummary);
router.get("/orders", getOrders);
router.post("/orders", submitOrder);
router.post("/order", submitOrder);
router.post("/wallet/reset", resetWallet);
router.post("/reset", resetWallet);
router.delete("/orders/:orderId", cancelOrder);
router.post("/order/:orderId/cancel", cancelOrder);
router.post("/estimate-charges", estimateCharges);

router.get("/summary", getSummary);
router.get("/orders", getOrders);
router.post("/order", submitOrder);
router.post("/order/:orderId/cancel", cancelOrder);
router.post("/reset", resetWallet);
router.post("/estimate-charges", estimateCharges);

export default router;
