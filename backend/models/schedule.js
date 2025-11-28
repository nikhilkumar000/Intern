import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    gameName: {
      type: String,
      required: true,
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
      trim: true,
    },

    teamA: {
      type: String,
      required: true,
      trim: true,

      // Example: "CSE"
    },

    teamB: {
      type: String,
      required: true,
      trim: true,
      // Example: "ECE"
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },

    startTime: {
      type: Date,
      required: true,
    },

    endTime: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.startTime;
        },
        message: "End time must be after start time.",
      },
    },

    match_live_url: {
      type: String,
      match: [
        /^(https?:\/\/)?([\w\-])+\.{1}[a-zA-Z]{2,63}([\/\w\-.]*)*\/?$/,
        "Invalid URL format",
      ],
    },
  },
  { timestamps: true }
);

const Schedule = mongoose.model("Schedule", scheduleSchema);

export default Schedule;
