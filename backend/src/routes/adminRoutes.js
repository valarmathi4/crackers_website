import express from "express";
import asyncHandler from "express-async-handler";
import { Order } from "../models/Order.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/admin/orders - list all orders
router.get(
  "/orders",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(orders);
  })
);

// PUT /api/admin/orders/:id/status - update order status
router.put(
  "/orders/:id/status",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const allowed = ["Placed", "Packed", "Shipped", "Delivered", "Cancelled"];
    if (!allowed.includes(status)) {
      res.status(400);
      throw new Error("Invalid status");
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }
    order.status = status;
    const updated = await order.save();
    res.json(updated);
  })
);

export default router;

