
import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import Admin from "../models/admin.js";
import generateToken from "../utils/generateToken.js";
import sendEmailOtp from "../utils/sendOtp.js";
import { generateSecureOtp } from "../utils/generateOtp.js";


const sendTokenCookie = (res, admin) => {
  const token = generateToken({ id: admin._id, role: admin.role });
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email & password are required" });

    const admin = await Admin.findOne({ email });

    if (!admin)
      return res.status(404).json({ message: "Admin does not exist" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    // GENERATE OTP 
    const otp = generateSecureOtp();

    admin.otpCode = otp;
    admin.otpExpire = Date.now() + 5 * 60 * 1000; // 5 minutes
    await admin.save();
    
    //SEND OTP TO EMAIL 
    // await sendEmailOtp(admin.email, otp);
    
    console.log(admin)
    return res.status(200).json({
      message: "OTP sent to your email. Please verify OTP.",
      step: "verify-otp",
    });

  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
};



export const verifyAdminOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: "Email & OTP are required" });

    const admin = await Admin.findOne({ email })

    if (!admin)
      return res.status(404).json({ message: "Admin not found" });

    if (!admin.otpCode)
      return res.status(400).json({ message: "OTP not generated" });

    if (admin.otpCode !== otp)
      return res.status(401).json({ message: "Invalid OTP" });

    if (admin.otpExpire < Date.now())
      return res.status(401).json({ message: "OTP expired" });

    // CLEAR OTP 
    admin.otpCode = null;
    admin.otpExpire = null;
    await admin.save();

    // SEND TOKEN 
    sendTokenCookie(res, admin);

    return res.status(200).json({
      message: "OTP Verified. Login Successful.",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

  } catch (error) {
    return res.status(500).json({ message: "OTP verification failed", error: error.message });
  }
};

export const resendAdminOtp = async (req, res) => {
  try {
    const { email } = req.body;



    const admin = await Admin.findOne({ email });
    if(!admin.otp) res.status(404).json({ message: "First Login with Password" });

    if (!admin)
      return res.status(404).json({ message: "Admin not found" });

    const otp = generateSecureOtp()

    admin.otpCode = otp;
    admin.otpExpire = Date.now() + 5 * 60 * 1000;
    await admin.save();

    // await sendEmailOtp(email, otp);

    return res.status(200).json({
      message: "OTP resent successfully.",
    });

  } catch (error) {
    return res.status(500).json({ message: "Failed to resend OTP", error: error.message });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Generate plain token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token for DB storage
    admin.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    admin.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await admin.save();

    // Frontend reset link
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      to: admin.email,
      from: process.env.SMTP_EMAIL,
      subject: "Password Reset Link",
      html: `
        <p>You requested a password reset.</p>
        <p><a href="${resetURL}">Click here to reset password</a></p>
        <p>This link expires in 10 minutes.</p>
      `,
    });

    res.status(200).json({
      message: "Password reset link sent to email",
    });

  } catch (error) {
    res.status(500).json({ message: "Reset request failed", error: error.message });
  }
};

export const resetPasswordFromLink = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const admin = await Admin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+password");

    if (!admin)
      return res.status(400).json({ message: "Invalid or expired token" });

    // Update password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(password, salt);

    // Remove token from DB
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpire = undefined;

    await admin.save();

    res.status(200).json({ message: "Password reset successful" });

  } catch (error) {
    res.status(500).json({ message: "Reset failed", error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    const admin = await Admin.findById(userId).select("+password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch)
      return res.status(401).json({ message: "Old password incorrect" });

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.status(200).json({ message: "Password updated successfully" });

  } catch (error) {
    res.status(500).json({ message: "Reset failed", error: error.message });
  }
};

export const logoutAdmin = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
};

export const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("+name +email +phoneNo +role +passwordLastChanged +passwordLastLogin +howManyExpertInYou");
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.status(200).json({ admin });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phoneNo,email } = req.body;

    const admin = await Admin.findById(req.admin.id);

    if (name) admin.name = name;
    if (phoneNo) admin.phoneNo = phoneNo;
    if (email) admin.email = email;

    if(!admin) res.status(201).json({ message: "Admin profile not updated" });

    await admin.save();

    res.status(200).json({ message: "Profile updated successfully", admin });

  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};

export const listAllExperts = async (req, res) => {
  try {
    const experts = await TarotReader.find().select("-password");

    res.status(200).json({
      count: experts.length,
      experts,
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch experts" });
  }
};

// super admin things
export const registerAdmin = async (req, res) => {
  try {
    const loggedInAdmin = req.admin;

    //  Only superadmin can create admin
    if (loggedInAdmin.role !== "superadmin") {
      return res.status(403).json({
        message: "Only Super Admin can create new Admin accounts",
      });
    }

    const { name, email, password, phoneNo, role } = req.body;

    //  Required fields check
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, Email & Password are required",
      });
    }

    //  Check for valid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    //  Check password length
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    //  Validate phone number only if provided
    if (phoneNo && !/^[0-9]{10}$/.test(phoneNo)) {
      return res.status(400).json({
        message: "Phone number must be exactly 10 digits",
      });
    }

    //  Check if email exists
    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    //  Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    //  Create admin
    const newAdmin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      phoneNo,
      role: role || "admin", // superadmin can create admin or superadmin
    });

    // SEND TOKEN COOKIE JUST LIKE LOGIN
    const token = sendTokenCookie(res, newAdmin);

    return res.status(201).json({
      message: "Admin account created successfully",
      token,
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to create admin",
      error: error.message,
    });
  }
};