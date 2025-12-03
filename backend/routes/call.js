// routes/call.js
import express from "express";
import { startCall, endCall } from "../controllers/callController.js";
import { addTranscriptChunk, getCallTranscript } from "../controllers/transcript.js";
// import auth middleware if you have it, e.g. protect

const CallRouter = express.Router();

// If you have auth middleware:
// router.post("/start", protect, startCall);
// router.post("/end", protect, endCall);

CallRouter.post("/start", startCall);
CallRouter.put("/end", endCall);
CallRouter.post("/transcript/add-chunk",addTranscriptChunk);
CallRouter.get("/fulltranscript",getCallTranscript);

export default CallRouter;
