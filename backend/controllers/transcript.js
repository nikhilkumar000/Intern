import CallTranscript from "../models/CallTranscript.js";

export const addTranscriptChunk = async (req, res) => {
  try {
    const { callId, speaker, text, language, startedAt, endedAt } = req.body;
    console.log("callId:",callId);
    console.log(speaker);
    console.log(text);
    console.log(language);
    console.log(startedAt);
    console.log(endedAt);
    if (!callId || !speaker || !text) {
      return res.status(400).json({
        success: false,
        message: "callId, speaker and text are required",
      });
    }

    await CallTranscript.create({
      callId,
      speaker,
      text,
      language,
      startedAt,
      endedAt,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Error saving transcript chunk:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};




export const getCallTranscript = async (req, res) => {
    try {
      const { callId } = req.params;
  
      const chunks = await CallTranscript.find({ callId })
        .sort({ createdAt: 1 }) // in speaking order
        .lean();
  
      res.json({ success: true, data: chunks });
    } catch (err) {
      console.error("Error fetching transcript:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };
  