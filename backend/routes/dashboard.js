import express from "express"
import { protectAdmin } from "../middlewares/admin.js";
import { deleteStatus, getallusers, getalluserspublic, updateStatus } from "../controllers/dashboard.js";


const dashboardRouter = express.Router();

dashboardRouter.get("/getallusers",protectAdmin, getallusers);
dashboardRouter.get("/public/getallusers", getalluserspublic);
dashboardRouter.put("/updatestatus/:id",protectAdmin,updateStatus);
dashboardRouter.delete("/deletestatus/:id",protectAdmin,deleteStatus);


export default dashboardRouter;