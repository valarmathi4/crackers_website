import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["Sparklers", "Rockets", "Flower Pots", "Bombs", "Gift Boxes"],
    },
    price: { type: Number, required: true, min: 0 },
    countInStock: { type: Number, required: true, min: 0, default: 0 },
    imageUrl: { type: String, default: "" }, // can be absolute URL or /uploads/filename
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text" });

export const Product = mongoose.model("Product", productSchema);

