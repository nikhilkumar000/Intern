// routes/scheduleRoutes.js
import express from "express";
import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedules,
  getScheduleById,
} from "../controllers/schedule_controller.js";

import { protectAdmin } from "../middlewares/admin.js"; // optional - require existing admin
const scheduleRouter = express.Router();

// Public reads
scheduleRouter.get("/getallschedules", getSchedules);
scheduleRouter.get("/getschedulebyid/:id", getScheduleById);

// Protected writes (use protectAdmin if you want admin-only access)
scheduleRouter.post("/create", protectAdmin, createSchedule);
scheduleRouter.put("/update/:id", protectAdmin, updateSchedule);
scheduleRouter.delete("/delete/:id", protectAdmin, deleteSchedule);

export default scheduleRouter;
