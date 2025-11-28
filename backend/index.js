
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRouter from "./routes/user_auth.js";
// import adminRouter from "./routes/admin_auth.js";
import cookieParser from "cookie-parser";
// import scheduleRouter from "./routes/schedule.js";
// import dashboardRouter from "./routes/dashboard.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import ExpertRouter from "./routes/expert.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); 
    } else {
      callback(new Error("CORS blocked: Not allowed by server"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));


// ===== API routes =====
app.use("/user/auth", userRouter);
app.use("/expert",ExpertRouter);
// app.use("/admin", adminRouter);
// app.use("/admin/schedule", scheduleRouter);
// app.use("/user/schedule", scheduleRouter);
// app.use("/admin/dashboard", dashboardRouter);

// ===== Serve react build in production =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "../client/build"); // adjust if structure differs
  app.use(express.static(buildPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
}

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    process.exit(1);
  });






//   User Register                POST                       /user /auth/register
//   User Login                     POST                      /user /auth/login
//   User Logout                  POST                      /user /auth/logout
//  Forgot Password           POST                    /user /auth/password/forgot
//  Change Password          POST                   /user/auth/password/change
//  Get Profile                     GET                         /user/profile/:id
//  Update Profile               PUT                       /user/profile/update/:id
//  Delete Profile                 DELETE                /user/profile/delete/:id
//  Email and Phone OTP Verification    (Optional)
//  Social Login  ( with Google, Facebook )     
//  Upload/Update Profile Picture
//  2 Factor Authentication System (optional   for proving more security)
 

 





//  Expert API endpoints

// Same like USER Routes but instead of /user/   we use  /expert/ 
// Upload verification documents (ID , Certificates)                               POST               /expert/verification/:id/documents
// Update availability preferences  (working days, time window)        PATCH             /expert/:id/settings/availability
// Update visibility status  (online, busy, offline, accepting_new_clients )  PATCH           /experts/:id/settings/visibility

// Admin API endpoints

// Admin Login                     POST                      /admin /auth/login
// Admin Logout                  POST                       /admin /auth/logout
// Forgot Password             POST                      /admin/auth/password/forgot
// Change Password           POST                      /admin/auth/password/change
// Get Profile                        GET                       /admin/profile/:id
// Update Profile                 PATCH                   /admin/profile/update/:adminId

// List all users                    GET                         /admin/users
// Get user detail               GET                         /admin/users/:userId
// Block User                       POST                      /admin/users/:userId/block
// Unblock User                  POST                     /admin/users/:userId/unblock
// Delete User                     DELETE                 /admin/users/:userId

// List all experts                    GET                       /admin/experts
// Get expert detail               GET                       /admin/experts/:expertId
// Block User                           POST                    /admin/experts/:expertId/block
// Unblock User                     POST                     /admin/experts/:expertId/unblock
// Delete User                        DELETE                 /admin/experts/:expertId
// Approve / reject expert verification (status-approved, rejected)    POST      /admin/experts/:expertId/verify
// Change expert visibility ( de-list)                                    POST                             /admin/experts/:expertId/hide
//                                                                                 POST                             /admin/experts/:expertId/show
// Reset expert password (optional)                                  POST                           /admin/experts/:expertId/reset-password

