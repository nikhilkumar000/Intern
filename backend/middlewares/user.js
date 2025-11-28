// middleware/adminAuth.js
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/admin.js";

export const protectUser = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token || null;

  if (!token) {
    return res.status(401).json({
      message: "Not authorized, you are not authorized user"
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      res.status(401);
      throw new Error("Not authorized - user not found");
    }
    req.user = user; // attach user to request
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized - token invalid/expired");
  }
});
