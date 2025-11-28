import jwt from "jsonwebtoken";
import Admin from "../models/admin.js";

export const protectAdmin = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    req.admin = admin; 

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized access",
      error: error.message,
    });
  }
};