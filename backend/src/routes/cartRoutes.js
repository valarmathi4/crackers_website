import express from "express";
import asyncHandler from "express-async-handler";
import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/cart - get current user's cart
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    res.json(cart);
  })
);

// POST /api/cart/add - add/update item
router.post(
  "/add",
  protect,
  asyncHandler(async (req, res) => {
    const { productId, qty } = req.body;
    if (!productId || !qty || qty < 1) {
      res.status(400);
      throw new Error("Invalid cart data");
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existing = cart.items.find((i) => i.product.toString() === productId);
    const snapshot = {
      product: product._id,
      qty,
      priceSnapshot: product.price,
      nameSnapshot: product.name,
      imageSnapshot: product.imageUrl,
    };

    if (existing) {
      existing.qty = qty;
      existing.priceSnapshot = snapshot.priceSnapshot;
      existing.nameSnapshot = snapshot.nameSnapshot;
      existing.imageSnapshot = snapshot.imageSnapshot;
    } else {
      cart.items.push(snapshot);
    }

    const saved = await cart.save();
    res.json(saved);
  })
);

// DELETE /api/cart/item/:productId - remove item
router.delete(
  "/item/:productId",
  protect,
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.json({ message: "Cart is empty", cart: null });
    }
    cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    const saved = await cart.save();
    res.json(saved);
  })
);

// DELETE /api/cart/clear - clear cart
router.delete(
  "/clear",
  protect,
  asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.json({ message: "Cart is already empty" });
    }
    cart.items = [];
    await cart.save();
    res.json({ message: "Cart cleared" });
  })
);

export default router;

