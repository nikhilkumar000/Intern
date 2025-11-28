import express from "express";
import {
  loginAdmin,
  verifyAdminOtp,
  resendAdminOtp,
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



// Step 1: Login → generates OTP & sends email
adminRouter.post("/login", loginAdmin);

// Step 2: Verify OTP → logs admin in
adminRouter.post("/verify-otp", verifyAdminOtp);

// Resend OTP
adminRouter.post("/resend-otp", resendAdminOtp);

// Logout
adminRouter.post("/logout", protectAdmin, logoutAdmin);

/* ---------------------- PASSWORD RESET ROUTES ---------------------- */

// Request password reset email
adminRouter.post("/password/forgot", requestPasswordReset);

// Reset password using email link
adminRouter.post("/password/reset/:token", resetPasswordFromLink);

// Update password after login
adminRouter.post("/password/update", protectAdmin, resetPassword);

/* ---------------------- PROFILE ROUTES ---------------------- */

// Get logged-in admin profile
adminRouter.get("/getProfile", protectAdmin, getProfile);

// Update profile
adminRouter.put("/update/profile", protectAdmin, updateProfile);

/* ---------------------- SUPERADMIN ONLY ---------------------- */

// Create Admin / SuperAdmin
adminRouter.post("/register", protectAdmin, registerAdmin);

/* ---------------------- EXPERT LIST ---------------------- */

// List all experts
adminRouter.get("/experts", protectAdmin, listAllExperts);

export default adminRouter;
