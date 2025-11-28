import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Invalid email address"],
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 20
    },

    coordinatorOf: {
      type: String,
      enum: [
        "cricket",
        "football",
        "basketball",
        "volleyball",
        "badminton",
        "table tennis",
        "hockey",
        "athletics",
        "kabaddi",
        "chess",
        "others",
      ],
      required: true,
      unique : true
    },
  },
  { timestamps: true }
);

//
// 🔐 Hash password before saving
// //
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// //
// // 🔑 Method to compare passwords during login
// //
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
