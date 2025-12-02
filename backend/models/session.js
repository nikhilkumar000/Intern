// models/CallSession.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const CallSessionSchema = new Schema(
  {
    // Who is involved
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    //   required: true,
    },
    expert: {
      type: Schema.Types.ObjectId,
      ref: "Expert",
    //   required: true,
    },

    // Optional: who initiated the call (right now it's user, but future-proof)
    initiatedBy: {
      type: String,
      enum: ["user", "expert"],
      default: "user",
    },

    // A unique ID for this call (can be shared with frontend if needed)
    // callId: {
    //   type: String,
    // },

    // Call lifecycle status
    status: {
      type: String,
      enum: [
        "ringing",    // user called, expert not accepted yet
        "accepted",   // expert accepted, connecting/connected
        "ongoing",    // both peers connected
        "ended",      // call finished normally
        "rejected",   // expert rejected
        "missed",     // no response / timeout
        "failed",     // technical error
      ],
      default: "ringing",
   
    },

    // Timestamps for key call events
    startedAt: {
      type: Date, // when both sides are connected (WebRTC "connect")
    },
    endedAt: {
      type: Date, // when call ended (hangup/disconnect)
    },

    // Optional: quick numeric duration to query easily
    durationSeconds: {
      type: Number, // you can compute: (endedAt - startedAt) / 1000
    },

    // Why the call ended
    endReason: {
      type: String,
      enum: [
        "user-ended",
        "expert-ended",
        "network-error",
        "timeout",
        "unknown",
      ],
      default: "unknown",
    },
    transcriptId: {
      type: Schema.Types.ObjectId,
      ref: "Transcript", // if you store transcripts in another collection
    },

  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Useful indexes for querying history
// CallSessionSchema.index({ user: 1, createdAt: -1 });
// CallSessionSchema.index({ expert: 1, createdAt: -1 });

const CallSession = mongoose.model("CallSession", CallSessionSchema);

export default CallSession;
