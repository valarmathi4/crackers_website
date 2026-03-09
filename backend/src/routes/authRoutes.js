import express from "express";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import { signToken } from "../utils/tokens.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400);
      throw new Error("Invalid data");
    }
    const { name, email, password } = parsed.data;

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400);
      throw new Error("User already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    const token = signToken({ id: user._id, isAdmin: user.isAdmin });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin },
    });
  })
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400);
      throw new Error("Invalid credentials");
    }
    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    const token = signToken({ id: user._id, isAdmin: user.isAdmin });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin },
    });
  })
);

router.get(
  "/me",
  protect,
  asyncHandler(async (req, res) => {
    const user = req.user;
    res.json({ id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin });
  })
);

export default router;

