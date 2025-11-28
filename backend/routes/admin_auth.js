import express from "express"
import { adminRegisterUser, registerAdmin,loginAdmin, getAdminProfile } from "../controllers/admin_controller.js";
import { protectAdmin } from "../middlewares/admin.js";


const adminRouter = express.Router();

adminRouter.post("/register/user",protectAdmin, adminRegisterUser);
adminRouter.post("/register",protectAdmin,registerAdmin); 
adminRouter.post("/login", loginAdmin);
adminRouter.get("/profile",protectAdmin, getAdminProfile);

// logout button



export default adminRouter;