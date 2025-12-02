// routes/call.js
import express from "express";
import { startCall, endCall } from "../controllers/callController.js";
// import auth middleware if you have it, e.g. protect

const CallRouter = express.Router();

// If you have auth middleware:
// router.post("/start", protect, startCall);
// router.post("/end", protect, endCall);

CallRouter.post("/start", startCall);
CallRouter.put("/end", endCall);

export default CallRouter;
