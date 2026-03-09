import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { User } from "../models/User.js";

function getTokenFromReq(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const [scheme, token] = auth.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

export const protect = asyncHandler(async (req, res, next) => {
  const token = getTokenFromReq(req);
  if (!token) {
    res.status(401);
    throw new Error("Not authorized, missing token");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-passwordHash");
    if (!req.user) {
      res.status(401);
      throw new Error("Not authorized, user not found");
    }
    next();
  } catch (e) {
    res.status(401);
    throw new Error("Not authorized, token invalid");
  }
});

export function adminOnly(req, res, next) {
  if (!req.user?.isAdmin) {
    res.status(403);
    throw new Error("Admin access required");
  }
  next();
}

