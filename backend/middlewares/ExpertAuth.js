
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import Expert from "../models/expert.js";

export const protectExpert = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token || null;

  if (!token) {
    return res.status(401).json({
      message: "Not authorized, you are not authorized expert"
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const expert = await Expert.findById(decoded.id).select("-password");
    if (!expert) {
      res.status(401);
      throw new Error("Not authorized - Expert not found");
    }
    req.expert = expert; // attach user to request
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized - token invalid/expired");
  }
});
