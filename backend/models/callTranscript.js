import mongoose from "mongoose";

const { Schema } = mongoose;

const callTranscriptSchema = new Schema(
  {
    callId: {
      type: Schema.Types.ObjectId,
      ref: "CallSession",       // 👈 your existing call model name
      required: true,
      index: true,
    },

    // Who spoke this chunk
    speaker: {
      type: String,
      enum: ["caller", "expert"],
      required: true,
      index: true,
    },

    // Final text chunk from SpeechRecognition
    text: {
      type: String,
      required: true,
      trim: true,
    },

    // (Optional) language of recognition ("en-US", "hi-IN", etc.)
    language: {
      type: String,
      default: "en-US",
    },

    // (Optional) client-side timestamps if you ever want them
    // e.g. Date.now() on frontend when chunk finalized
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },

    // (Optional) if you want ordering independent of createdAt
    chunkIndex: {
      type: Number,
    },

    
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

// Helpful index to query all chunks in order for one call
callTranscriptSchema.index({ callId: 1, createdAt: 1 });

const CallTranscript = mongoose.model("CallTranscript", callTranscriptSchema);

export default CallTranscript;
