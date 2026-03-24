import { Product } from "../models/Product.js";
import { sendLowStockEmail, sendOutOfStockEmail } from "./emailService.js";

const getItemKey = (item) => item.product?.toString();

export const reserveStockForItems = async (items = []) => {
  if (!Array.isArray(items) || items.length === 0) return [];

  // Merge duplicate products in the same order payload.
  const requiredByProduct = new Map();
  for (const item of items) {
    const key = getItemKey(item);
    if (!key) continue;
    requiredByProduct.set(key, (requiredByProduct.get(key) || 0) + Number(item.qty || 0));
  }

  const touchedProducts = [];

  // Validate stock before we start mutating values.
  for (const [productId, requiredQty] of requiredByProduct.entries()) {
    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error(`Product not found for stock update: ${productId}`);
      err.statusCode = 404;
      throw err;
    }

    if (requiredQty <= 0) {
      const err = new Error(`Invalid quantity for ${product.name}`);
      err.statusCode = 400;
      throw err;
    }

    if (product.stock < requiredQty) {
      const err = new Error(
        `${product.name} is out of stock or has insufficient quantity. Available: ${product.stock}, requested: ${requiredQty}`
      );
      err.statusCode = 400;
      throw err;
    }

    touchedProducts.push({ product, requiredQty });
  }

  // Apply stock deduction and sold counter updates.
  for (const entry of touchedProducts) {
    entry.product.stock -= entry.requiredQty;
    entry.product.soldCount = (entry.product.soldCount || 0) + entry.requiredQty;
    await entry.product.save();
  }

  return touchedProducts.map((entry) => entry.product);
};

export const notifyAdminOnStockChange = async (products = []) => {
  for (const product of products) {
    if (product.stock <= 0) {
      sendOutOfStockEmail(product.name).catch((err) =>
        console.error("Failed to send out-of-stock email:", err)
      );
      continue;
    }

    if (product.stock < (product.lowStockThreshold || 5)) {
      sendLowStockEmail(product.name, product.stock).catch((err) =>
        console.error("Failed to send low stock email:", err)
      );
    }
  }
};
