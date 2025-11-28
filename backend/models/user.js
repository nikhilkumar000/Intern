import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 10
    },

    lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 10
      },

    year: {
      type: String,
      enum: ["first", "second", "third", "fourth"],
      required: true,
    },

    branch: {
      type: String,
      required: true,
      trim: true,
    },

    sports: {
      type: [String], 
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
      default: [],
    },

    whatsappNumber: {
      type: String,
      required: true,
      match: [/^\d{10}$/, "Invalid WhatsApp number"], // ensures 10-digit number
    },

    contactNumber: {
      type: String,
      required: true,
      match: [/^\d{10}$/, "Invalid contact number"],
    },

    rollNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },

    status: {
        type: String,
        enum: ["pending","accepted"],
        required: true,
        default:"pending"
      },

    url: {
      type: String,
      match: [
        /^(https?:\/\/)?([\w\-])+\.{1}[a-zA-Z]{2,63}([\/\w\-.]*)*\/?$/,
        "Invalid URL format",
      ],
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
