import mongoose from "mongoose";

const TarotReaderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    phoneNo: {
      type: String,
    },

    certificates: {
      type: [String], // Array of file URLs or certificate numbers
      default: []
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    bio: {
      type: String,
      maxlength: 500,
    },

    skills: {
      type: [String],
      default: ["Tarot Reading"],
    },

    profilePic: {
      type: String,
    },

    experience: {
      type: Number, // years of experience
      default: 0,
    },

    rating: {
      type: Number,
      default: 0,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    ratePerMinuteChat: {
      type: Number,
    },

    ratePerMinuteVideo: {
      type: Number,
    },

    availableSlots: [
      {
        date: String,
        startTime: String,
        endTime: String,
      },
    ],

    currentStatus: {
      type: String,
      enum: ["online", "offline", "busy"],
      default: "offline",
    },

    walletBalance: {
      type: Number,
      default: 0,
    },

    razorpayContactId: String,
    razorpayFundAccountId: String,

    isVerified: {
      type: Boolean,
      default: false,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    // ⚡ Additional fields you added
    preferredCardType: {
      type: String,
      enum: ["tarot", "oracle", "angel", "lenormand", "astrology", "other"],
      default: "tarot",
    },

    cardCount: {
      type: Number,
      default: 0,
    },

    expertise: {
      type: [String],
      enum: ["love", "career", "life", "finance", "general", "all"],
      default: ["general"],
    },

    preferredReadingTime: {
      type: String, // Example: "evening", "morning", "night"
    },

    totalReadingThisMonth: {
      type: Number,
      default: 0,
    },

    totalReadingThisYear: {
      type: Number,
      default: 0,
    },

    clientsServed: {
      type: Number,
      default: 0,
    },

    repeatedClients: {
      type: Number,
      default: 0,
    },

    avgReadingLength: {
      type: Number, // in minutes
      default: 0,
    },

    totalHoursReading: {
      type: Number, // hours
      default: 0,
    },

    lastReadingTime: {
      type: Date,
    },

    subscription: {
      type: String,
      enum: ["none", "silver", "gold", "premium"],
      default: "none",
    },

    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    passwordLastChanged: {
      type: Date,
    },

    lastLogin: {
      type: Date,
    },

    notificationPreference: {
      type: String,
      enum: ["email", "sms", "push", "all"],
      default: "all",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    language: {
      type: String,
      enum: ["english", "hindi", "marathi", "tamil", "telugu", "other"],
      default: "english",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Expert", TarotReaderSchema); 