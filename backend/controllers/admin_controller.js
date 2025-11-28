



import asyncHandler from "express-async-handler";
import Admin from "../models/admin.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";
import User from "../models/user.js";

const sendTokenCookie = (res, admin) => {
  const token = generateToken({ id: admin._id });
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 1000 * 60 * 60 * 24 * (process.env.JWT_EXPIRES_DAYS ? Number(process.env.JWT_EXPIRES_DAYS) : 7),
  };
  res.cookie("token", token, cookieOptions);
};


export const registerAdmin = asyncHandler(async (req, res) => {
  
  if (!req.admin) {
    res.status(403);
    throw new Error("Not authorized to create admins");
  }

  const { name, email, password, coordinatorOf } = req.body;

  // Basic validation
  if (!name || !email || !password || !coordinatorOf) {
    res.status(400);
    throw new Error("All fields (name, email, password, coordinatorOf) are required");
  }

  const data = await Admin.findOne({ coordinatorOf });

  if (data) {
    return res.status(400).json({
      message: "Coordinator already exists for this game",
    });
  }
  

  // Email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error("Invalid email format");
  }

  // Password length
  if (password.length < 6 || password.length > 20) {
    res.status(400);
    throw new Error("Password must be between 6 and 20 characters");
  }

  // coordinatorOf validation (must match Admin schema enum)
  const allowedGames = [
    "cricket",
    "football",
    "basketball",
    "volleyball",
    "badminton",
    "table tennis",
    "hockey",
    "athletics",
    "kabaddi",
    "chess",
    "others",
  ];
  if (!allowedGames.includes(coordinatorOf.toLowerCase())) {
    res.status(400);
    throw new Error(`coordinatorOf must be one of: ${allowedGames.join(", ")}`);
  }

  // Prevent duplicate email
  const exists = await Admin.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(400);
    throw new Error("Admin with this email already exists");
  }

  // create admin (pre-save hook will hash password)
  const admin = await Admin.create({
    name: name.trim(),
    email: email.toLowerCase(),
    password,
    coordinatorOf: coordinatorOf.toLowerCase(),
  });

  if (!admin) {
    res.status(500);
    throw new Error("Failed to create admin");
  }

  // Optionally: return created admin without password
  const adminSafe = {
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    coordinatorOf: admin.coordinatorOf,
    createdAt: admin.createdAt,
  };

  return res.status(201).json({ message: "Admin created", admin: adminSafe });
});


export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // send JWT in cookie
  sendTokenCookie(res, admin);

  // also return admin basic info
  res.json({
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    coordinatorOf: admin.coordinatorOf,
  });
});


export const logoutAdmin = asyncHandler(async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  });
  res.json({ message: "Logged out" });
});


export const getAdminProfile = asyncHandler(async (req, res) => {
  // req.admin set by middleware
  if (!req.admin) {
    res.status(401);
    throw new Error("Not authorized");
  }
  res.json(req.admin);
});

export const adminRegisterUser = asyncHandler(async (req,res)=>{
  try {
    // text fields (from multipart/form-data)
    const {
      firstName,
      lastName,
      email,
      year,
      branch,
      rollNumber,
      whatsappNumber,
      contactNumber,
      gender,
    
    } = req.body;
    console.log(firstName)

    // parse/normalize sports (works for sports[], JSON string, CSV, single)
    let { sports } = req.body;
    if (sports === undefined) {
      sports = [];
    } else if (typeof sports === "string") {
      try {
        const parsed = JSON.parse(sports);
        sports = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        sports = sports.includes(",") ? sports.split(",").map(s => s.trim()).filter(Boolean) : [sports.trim()];
      }
    } else if (!Array.isArray(sports)) {
      sports = [String(sports)];
    }
    sports = sports.map(s => s.toLowerCase());

    // basic validations (same as before)
    if (!firstName || !lastName || !email || !year || !branch || !rollNumber || !whatsappNumber || !contactNumber || !gender) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ message: "Invalid email format." });

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(whatsappNumber)) return res.status(400).json({ message: "Invalid WhatsApp number (must be 10 digits)." });
    if (!phoneRegex.test(contactNumber)) return res.status(400).json({ message: "Invalid contact number (must be 10 digits)." });

    const validYears = ["first","second","third","fourth"];
    if (!validYears.includes(year.toLowerCase())) return res.status(400).json({ message: "Year must be one of: first, second, third, fourth." });

    const validGenders = ["male","female","other"];
    if (!validGenders.includes(gender.toLowerCase())) return res.status(400).json({ message: "Gender must be one of: male, female, other." });

    // sports validation
    const allowedSports = ["cricket","football","basketball","volleyball","badminton","table tennis","hockey","athletics","kabaddi","chess","others"];
    const invalidSports = sports.filter(s => !allowedSports.includes(s.toLowerCase()));
    if (invalidSports.length > 0) return res.status(400).json({ message: `Invalid sports selected: ${invalidSports.join(", ")}` });



    // check duplicates
    const userExists = await User.findOne({ $or: [{ email }, { rollNumber }] });
    if (userExists) return res.status(400).json({ message: "User with this email or roll number already exists." });


   

    

    // prepare user data and create user (create BEFORE sending response)
    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      year: year.toLowerCase(),
      branch: branch.trim(),
      rollNumber: rollNumber.trim().toUpperCase(),
      whatsappNumber,
      contactNumber,
      sports,
      gender: gender.toLowerCase(),
    };

  


    const user = await User.create(userData); // <-- awaited

    // respond with created user including the Cloudinary URL (if any)
    return res.status(201).json({
      _id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      rollNumber: user.rollNumber,
     
      message: "Submission successful. Admin will approve later on.",
    });

  } catch (error) {
    console.error("Error registering user:", error);
   
  }

})
