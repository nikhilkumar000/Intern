// controllers/callController.js
import CallSession from "../models/session.js";

// POST /call/start
export const startCall = async (req, res) => {
  try {
    const { expertId, userId } = req.body;

    if (!expertId) {
      return res
        .status(400)
        .json({ success: false, message: "expertId is required" });
    }

    // If you have auth middleware, you can take user from req.user._id
    // For now, read from body as fallback
    // const userId = req.user?._id ;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const now = new Date();
    const call = await CallSession.create({
      user: userId,
      expert: expertId,
      initiatedBy: "user",
      status: "ringing",
      startedAt:now
    });

    // console.log(call);
    return res.status(201).json({
      success: true,
      call,
      message: "Call session created",
    });
  } catch (err) {
    console.error("Error starting call session:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to start call session",
    });
  }
};





// PUT /call/end
export const endCall = async (req, res) => {
    try {
      const { callId, endReason } = req.body;
  
      if (!callId) {
        return res
          .status(400)
          .json({ success: false, message: "callId is required" });
      }
  
      // Fetch current session to calculate duration
      const session = await CallSession.findById(callId);
      if (!session) {
        return res
          .status(404)
          .json({ success: false, message: "Call session not found" });
      }
  
      const now = new Date();
      let durationSeconds = undefined;
  
      if (session.startedAt) {
        durationSeconds = Math.floor(
          (now.getTime() - new Date(session.startedAt).getTime()) / 1000
        );
      }
  
      // Update session as ended
      const updated = await CallSession.findByIdAndUpdate(
        callId,
        {
          endedAt: now,
          status: "ended",
          endReason: endReason || "unknown",
          durationSeconds,
        },
        { new: true }
      );
  
      return res.json({
        success: true,
        call: updated,
        message: "Call session updated as ended",
      });
    } catch (err) {
      console.error("Error ending call session:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to end call session",
      });
    }
  };
  
