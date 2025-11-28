import express from "express";
import {
  registerTarotReader,
  loginTarotReader,
  uploadTarotReaderDocuments,
  updateAvailability,
  updateVisibility,
} from "../controllers/expert_controller.js";
import { upload } from "../middlewares/upload.js";
import { protectExpert } from "../middlewares/tarotReaderAuth.js";

const ExpertRouter = express.Router();

// AUTH
ExpertRouter.post("/register", registerTarotReader);
ExpertRouter.post("/login", loginTarotReader);

// UPLOAD DOCUMENTS
ExpertRouter.post(
  "/verification/documents",
  upload.fields([{ name: "certificate", maxCount: 1 }]),
  uploadTarotReaderDocuments
);

// UPDATE AVAILABILITY
ExpertRouter.patch("/settings/availability", protectExpert, updateAvailability);

// UPDATE VISIBILITY
ExpertRouter.patch("/settings/visibility", protectExpert, updateVisibility);

export default ExpertRouter;