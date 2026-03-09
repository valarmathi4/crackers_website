import mongoose from "mongoose";

export async function connectDb() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("Missing MONGO_URI");

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
}

