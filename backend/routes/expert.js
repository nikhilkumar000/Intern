import express from "express";
import {
  registerExpert,
  loginExpert,
  updateVisibility,
  logoutExpert,
  expertProfileDelete,
  expertProfileUpdate,
  changePassword
} from "../controllers/expert_controller.js";
import multer from "multer";
import { protectExpert } from "../middlewares/ExpertAuth.js";

const ExpertRouter = express.Router();
const upload = multer({ dest: "uploads/" });

// AUTH
ExpertRouter.post("/register", registerExpert);
ExpertRouter.post("/login", loginExpert);
ExpertRouter.post("/logout",protectExpert, logoutExpert);
ExpertRouter.delete("/profile/delete", protectExpert, expertProfileDelete);

ExpertRouter.patch(
  "/profile/update",
  protectExpert,
  upload.fields([
    { name: "profilePic", maxCount: 1 },   // single profile picture
    { name: "certificates", maxCount: 5} // one or multiple certificate files
  ]),
  expertProfileUpdate
);
ExpertRouter.patch("/settings/visibility", protectExpert, updateVisibility);
ExpertRouter.patch("/profile/password/change", protectExpert, changePassword);
// ExpertRouter.get("/profile",protectExpert,getExpertProfile);
//Password Forgot

export default ExpertRouter;