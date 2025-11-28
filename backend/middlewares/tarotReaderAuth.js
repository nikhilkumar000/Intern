
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import TarotReader from "../models/expert";

export const protectExpert = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token || null;

  if (!token) {
    return res.status(401).json({
      message: "Not authorized, you are not authorized expert"
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await TarotReader.findById(decoded.id).select("-password");
    if (!user) {
      res.status(401);
      throw new Error("Not authorized - Expert not found");
    }
    req.user = user; // attach user to request
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized - token invalid/expired");
  }
});
