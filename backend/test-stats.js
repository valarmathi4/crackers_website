import mongoose from "mongoose";
import "dotenv/config";
import { Product } from "./src/models/Product.js";
import { Order } from "./src/models/Order.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const prods = await Product.find({
      $expr: { $lt: ["$stock", "$lowStockThreshold"] }
    });
    console.log("Product Find OK. Count:", prods.length);
    
    const revenueResult = await Order.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
    ]);
    console.log("Order Aggregate OK. Result:", revenueResult);

  } catch (err) {
    console.error("Test failed with error:", err);
  }
  process.exit(0);
}
run();
