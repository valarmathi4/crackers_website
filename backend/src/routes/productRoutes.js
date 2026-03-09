import express from "express";
import asyncHandler from "express-async-handler";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { Product } from "../models/Product.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Multer storage for product images
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, "..", "..", "uploads"));
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// Public: GET /api/products
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { category, search, featured } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (featured === "true") filter.featured = true;
    if (search) {
      filter.$text = { $search: search };
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  })
);

// Public: GET /api/products/:id
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    res.json(product);
  })
);

// Admin: POST /api/products (with optional image)
router.post(
  "/",
  protect,
  adminOnly,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const { name, description, category, price, countInStock, featured } = req.body;
    let imageUrl = req.body.imageUrl || "";
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }
    const product = await Product.create({
      name,
      description,
      category,
      price,
      countInStock,
      featured: featured === "true" || featured === true,
      imageUrl,
    });
    res.status(201).json(product);
  })
);

// Admin: PUT /api/products/:id
router.put(
  "/:id",
  protect,
  adminOnly,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const { name, description, category, price, countInStock, featured } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (price !== undefined) product.price = price;
    if (countInStock !== undefined) product.countInStock = countInStock;
    if (featured !== undefined) product.featured = featured === "true" || featured === true;

    if (req.file) {
      product.imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.imageUrl) {
      product.imageUrl = req.body.imageUrl;
    }

    const updated = await product.save();
    res.json(updated);
  })
);

// Admin: DELETE /api/products/:id
router.delete(
  "/:id",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    await product.deleteOne();
    res.json({ message: "Product removed" });
  })
);

export default router;

