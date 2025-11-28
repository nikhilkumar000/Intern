import express from "express";
import {
  loginAdmin,
  logoutAdmin,
  getProfile,
  updateProfile,
  resetPassword,
  requestPasswordReset,
  resetPasswordFromLink,
  listAllExperts,
  registerAdmin,
} from "../controllers/admin_controller.js";
import { protectAdmin } from "../middlewares/admin.js";
const adminRouter = express.Router();

// Admin login
adminRouter.post("/login", loginAdmin);

// Logout
adminRouter.post("/logout", protectAdmin, logoutAdmin);

// Request password reset email
adminRouter.post("/password/forgot", requestPasswordReset);

// Reset password using email link
adminRouter.post("/password/reset/:token", resetPasswordFromLink);

// Update password when logged in
adminRouter.post("/password/update", protectAdmin, resetPassword);

// Get logged-in admin profile
adminRouter.get("/getProfile", protectAdmin, getProfile);

// Update profile
adminRouter.put("/update/profile", protectAdmin, updateProfile);

// Create a new Admin / SuperAdmin
adminRouter.post("/register", protectAdmin, registerAdmin);

// List all tarot experts
adminRouter.get("/experts", protectAdmin, listAllExperts);

export default adminRouter;