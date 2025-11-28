import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, 
    },

    phoneNo: {
      type: String,
      trim: true,
      match: [
        /^[0-9]{10}$/,
        "Phone number must be exactly 10 digits",
      ],
    },

    twoFactorAuthentication: {
      enabled: { type: Boolean, default: false },
      secret: { type: String },
    },

    // PASSWORD RESET
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },

    razorpayId: {
      type: String,
      trim: true,
    },

    passwordLastChanged: { type: Date },
    passwordLastLogin: { type: Date },

    // For admin who manages tarot readers
    howManyExpertInYou: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      enum: ["admin", "superadmin"],
      default: "admin",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Admin", AdminSchema);