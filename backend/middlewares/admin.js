// middleware/adminAuth.js
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import Admin from "../models/admin.js";

export const protectAdmin = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token || null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, you are not admin"
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) {
      res.status(401);
      throw new Error("Not authorized - admin not found");
    }
    req.admin = admin; // attach admin to request
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized - token invalid/expired");
  }
});
