import express from "express";
import asyncHandler from "express-async-handler";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { protect } from "../middleware/authMiddleware.js";
import { notifyAdminOnStockChange, reserveStockForItems } from "../utils/stockService.js";

const router = express.Router();

// POST /api/orders - place order from cart
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { shippingAddress, paymentMethod } = req.body;
    if (!shippingAddress?.fullName || !shippingAddress?.address1) {
      res.status(400);
      throw new Error("Shipping address is required");
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      res.status(400);
      throw new Error("Cart is empty");
    }

    const items = cart.items.map((i) => ({
      product: i.product,
      qty: i.qty,
      price: i.priceSnapshot,
      name: i.nameSnapshot,
      imageUrl: i.imageSnapshot,
    }));

    const itemsPrice = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const shippingPrice = itemsPrice > 1000 ? 0 : 50;
    const totalAmount = itemsPrice + shippingPrice;

    let updatedProducts;
    try {
      updatedProducts = await reserveStockForItems(items);
    } catch (err) {
      res.status(err.statusCode || 400);
      throw err;
    }

    const order = await Order.create({
      userId: req.user._id,
      products: items,
      shippingAddress,
      paymentMethod: paymentMethod || "COD",
      itemsPrice,
      shippingPrice,
      totalAmount,
    });

    notifyAdminOnStockChange(updatedProducts).catch((err) =>
      console.error("Failed to notify admin for stock change:", err)
    );

    // Clear cart after order
    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  })
);

// GET /api/orders/my - current user's orders
router.get(
  "/my",
  protect,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  })
);

// GET /api/orders/:id - get specific order
router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }
    res.json(order);
  })
);

export default router;

