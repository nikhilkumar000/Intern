import express from "express"
import {registerUser,loginUser,logoutUser,getUserProfile,userProfileUpdate,userProfileDelete,resetPassword,changePassword,requestPasswordReset} from "../controllers/user_controller.js";
import { protectUser } from "../middlewares/user.js";



const userRouter = express.Router();

userRouter.post("/register", registerUser);

userRouter.post("/login",  loginUser);
userRouter.post("/logout",protectUser, logoutUser);
// userRouter.post("/password/forgot", forgotPassword);

//After login
userRouter.put("/password/change", protectUser, changePassword);     // when user knows password
userRouter.get("/profile/:id",protectUser, getUserProfile);
userRouter.put("/profile/update/:id", protectUser, userProfileUpdate);
userRouter.delete("/profile/delete/:id", protectUser, userProfileDelete);
// Route to request password reset
userRouter.post('/password/forgot', requestPasswordReset);

// Route to reset password
userRouter.post('/resetpassword/:id/:token',resetPassword );




// Email and Phone OTP Verification    (Optional)
// Social Login  ( with Google, Facebook )     
// Upload/Update Profile Picture
// 2 Factor Authentication System (optional   for proving more security)






export default userRouter;

