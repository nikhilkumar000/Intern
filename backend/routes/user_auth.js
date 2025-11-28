import express from "express"
import registerUser from "../controllers/user_controller.js";

import { upload } from "../config/cloudinary.js";


const userRouter = express.Router();

userRouter.post("/register", upload.single("image"), registerUser);


export default userRouter;