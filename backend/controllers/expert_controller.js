


import TarotReader from "../models/expert.js";
import Expert from "../models/expert.js" 
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";





// ---------------------- REGISTER ----------------------

export const registerExpert = async (req, res) => {
  //address country state
  //name   phone No   email password bio skills profilepic experience preffered_card_type  card_count language
  try {
    const { name, email, password, phoneNo, language, gender } = req.body;

    if (!name || !email || !password || !phoneNo || !language || !gender) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const expertExists = await Expert.findOne({ email });
    if (expertExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const expertData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      phoneNo,
      gender: gender.toLowerCase(),
    };

    const expert = await Expert.create(expertData);

    // const Expert = await Expert.create(req.body);

    const token = generateToken({ id: expert._id, role: "tarot_reader" });
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge:
        1000 *
        60 *
        60 *
        24 *
        (process.env.JWT_EXPIRES_DAYS
          ? Number(process.env.JWT_EXPIRES_DAYS)
          : 7),
    };
    res.cookie("token", token, cookieOptions);

    res.status(201).json({
      message: "Tarot Reader Registered Successfully",
      name: expert.name,
      email: expert.email,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- LOGIN ----------------------
export const loginExpert = async (req, res) => {
  try {
    const { email, password } = req.body;

    const expert = await Expert.findOne({ email }).select(
      "+password +name +email"
    );
    if (!expert)
      return res
        .status(404)
        .json({ message: "Tarot Reader or Expert not found" });

    const match = await bcrypt.compare(password, expert.password);
    if (!match)
      return res.status(401).json({ message: "Invalid email or password" });

    expert.lastLogin = new Date(); //Last login recorded
    await expert.save();

    const token = generateToken({ id: expert._id, role: "tarot_reader" });
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 1000 * 60 * 60 * 24 * (process.env.JWT_EXPIRES_DAYS ? Number(process.env.JWT_EXPIRES_DAYS) : 7),
    };
    res.cookie("token", token, cookieOptions);


    res.status(200).json({
      message: "Login successfully",
      name: expert.name,
      email: expert.email,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const logoutExpert = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({
      message: "Logged out successfully",
      name:req.expert.firstName,
      email:req.expert.email
    });
  } catch (error) {
   
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ---------------------- UPLOAD DOCUMENTS ----------------------
export const uploadExpertDocuments = async (req, res) => {
  try {
    const reader = await Expert.findById(req.reader._id);

    if (req.files.certificate) {
      reader.certificate = req.files.certificate[0].path;
    }

    await reader.save();

    res.status(200).json({
      message: "Documents uploaded successfully",
      certificate: reader.certificate,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};






// ---------------------- UPDATE VISIBILITY ----------------------
export const updateVisibility = async (req, res) => {
  try {
    const { currentStatus } = req.body;

    const allowed = ["online", "offline", "busy"];

    if (!allowed.includes(currentStatus)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const expert = await Expert.findById(req.expert._id);

    expert.currentStatus = currentStatus;
    await expert.save();

    res.status(200).json({
      message: "Visibility updated",
      currentStatus,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const expertProfileDelete = async (req, res) => {
  try {
    const id = req.expert.id;

    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ message: "Invalid expert id" });
    }

    const deletedExpert = await Expert.findByIdAndDelete(id);

    if (!deletedExpert) {
      return res
        .status(404)
        .json({
           message: "Expert not found" });
    }

    // Optionally also clear auth cookie if user is deleting own account
    res.clearCookie("token");

    return res.status(200).json({
      name:deletedExpert.name,
      email:deletedExpert.email,
      message: "Expert Profile deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const expertProfileUpdate = async (req, res) => {
  try {
    // 🔐 Get current expert id from auth middleware
    const expertId = req.expert?.id 

    if (!expertId) {
      return res.status(401).json({ message: "Unauthorized or Expert not find" });
    }



    // Allowed fields from body (non-file)
    const {
      name,
      phoneNo,
      email,
      bio,
      skills,
      experience,
      // availableSlots,
      language,
      gender,
      expertise,
      preferredCardType,
    } = req.body;

    const updateData = {};

    if (name) updateData.name = name.trim();
    if (phoneNo) updateData.phoneNo = phoneNo.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (bio) updateData.bio = bio.trim();
    if (experience !== undefined) updateData.experience = Number(experience);

    if (language) updateData.language = language.toLowerCase();
    if (gender) updateData.gender = gender.toLowerCase();
    if (preferredCardType) updateData.preferredCardType = preferredCardType.toLowerCase();

    // skills: can be comma-separated or array
    if (skills) {
      if (Array.isArray(skills)) {
        updateData.skills = skills;
      } else {
        updateData.skills = skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    // expertise can be an array or comma separated
    if (expertise) {
      const allowedValues = ["love", "career", "life", "finance", "general", "all"];
    
      let expertiseArray;
    
      if (Array.isArray(expertise)) {
        expertiseArray = expertise;
      } else {
        expertiseArray = expertise.split(",").map((item) => item.trim());
      }
    
      // filter only allowed items, convert lowercase
      expertiseArray = expertiseArray
        .map((e) => e.toLowerCase())
        .filter((e) => allowedValues.includes(e));
    

        // If the client sends invalid expertise values, example: { "expertise": "xyz,abc" }
        // After filtering against allowed values:  expertiseArray = []; 
        // that's why we use a check
      if (expertiseArray.length > 0) {
        updateData.expertise = expertiseArray;
      }
    }
    


 // Handle profilePic upload (single file)
if (req.files && req.files.profilePic && req.files.profilePic[0]) {
  try {
    const file = req.files.profilePic[0];

    // Allowed image types
    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif"
    ];

    if (!allowedImageTypes.includes(file.mimetype)) {
      return res.status(400).json({
        message: "Invalid profile picture format. Allowed: JPG, PNG, WEBP, GIF"
      });
    }

    // Upload to Cloudinary
    const uploadRes = await cloudinary.uploader.upload(file.path, {
      folder: "experts/profile_pics",
      resource_type: "image",
    });

    updateData.profilePic = uploadRes.secure_url;

  } catch (err) {
    console.error("Profile picture upload failed:", err);
    return res.status(500).json({
      message: "Failed to upload profile picture",
      error: err.message
    });
  }
}







    // 🔹 Handle certificate upload (one or multiple)
    // Schema field: `certificate: [String]`
    let newCertificateUrls = [];

   if (req.files && req.files.certificates && req.files.certificates.length > 0) {
  const certFiles = req.files.certificates;

  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  for (const file of certFiles) {

    if (!allowedMimeTypes.includes(file.mimetype)) {
      console.log("❌ Rejected file type:", file.mimetype);
      // If you want to reject immediately:
      // return res.status(400).json({ message: "Only image or PDF files allowed" });
      continue;
    }

    try {
      const uploadRes = await cloudinary.uploader.upload(file.path, {
        folder: "experts/certificates",
        resource_type: "auto",
      });

      newCertificateUrls.push(uploadRes.secure_url);

    } catch (uploadErr) {
      console.error("Cloudinary upload error:", uploadErr);
    }
  }

  // After loop: if no valid file was uploaded
  if (newCertificateUrls.length === 0) {
    return res
      .status(400)
      .json({ message: "Invalid file format. Upload images or PDF only." });
  }
}






    // Merge certificates with existing ones (append)
    let updatedExpert;

    if (newCertificateUrls.length > 0) {
      // Use $push to append to existing array
      updatedExpert = await Expert.findByIdAndUpdate(
        expertId,
        {
          $set: updateData,
          $push: { certificates: { $each: newCertificateUrls } },
        },
        { new: true ,runValidators:true}
      ).select("-password");
    } else {
      updatedExpert = await Expert.findByIdAndUpdate(
        expertId,
        { $set: updateData },
        { new: true , runValidators:true}
      ).select("-password");
    }

    if (!updatedExpert) {
      return res.status(404).json({ message: "Expert not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      expert: updatedExpert,
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { expertId, oldPassword, newPassword } = req.body;

    if (!expertId || !oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "expertId, oldPassword and newPassword are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    const expert = await Expert.findById(expertId).select("+password");
    if (!expert) {
      return res
        .status(404)
        .json({ success: false, message: "Expert not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, expert.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Old password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    expert.password = await bcrypt.hash(newPassword, salt);

    await expert.save();

    return res.status(200).json({
      message: "Password updated successfully",
    });

  } catch (error) {
    return res.status(500).json({
      errorType: "Internal server error",
      message: error.message 
    });
  }
};










// // Helpers
// const isValidTime = (timeStr) => {
//   // HH:MM in 24-hour format
//   const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
//   return regex.test(timeStr);
// };

// const timeToMinutes = (timeStr) => {
//   const [h, m] = timeStr.split(":").map(Number);
//   return h * 60 + m;
// };

// const isValidDateString = (dateStr) => {
//   // Expecting something like "2025-11-28" or "2025-11-28T..." etc
//   const d = new Date(dateStr);
//   return !isNaN(d.getTime());
// };

// // Check for overlaps per date
// const hasOverlappingSlots = (slots) => {
//   // Group by date
//   const byDate = {};
//   for (const slot of slots) {
//     if (!byDate[slot.date]) byDate[slot.date] = [];
//     byDate[slot.date].push(slot);
//   }

//   for (const date in byDate) {
//     const daySlots = byDate[date]
//       .map((s) => ({
//         ...s,
//         startMinutes: timeToMinutes(s.startTime),
//         endMinutes: timeToMinutes(s.endTime),
//       }))
//       .sort((a, b) => a.startMinutes - b.startMinutes);

//     for (let i = 1; i < daySlots.length; i++) {
//       const prev = daySlots[i - 1];
//       const curr = daySlots[i];
//       // Overlap if current starts before previous ends
//       if (curr.startMinutes < prev.endMinutes) {
//         return {
//           overlap: true,
//           message: `Overlapping slots on ${date} between ${prev.startTime}-${prev.endTime} and ${curr.startTime}-${curr.endTime}`,
//         };
//       }
//     }
//   }

//   return { overlap: false };
// };

// export const updateAvailability = async (req, res) => {
//   try {
//     // 1. Auth check – ensure middleware set req.reader
//     if (!req.reader || !req.reader._id) {
//       return res
//         .status(401)
//         .json({ message: "Unauthorized – reader info not found on request" });
//     }

//     const { availableSlots } = req.body;

//     // 2. Validate presence & type
//     if (!availableSlots) {
//       return res
//         .status(400)
//         .json({ message: "availableSlots is required in request body" });
//     }

//     if (!Array.isArray(availableSlots)) {
//       return res
//         .status(400)
//         .json({ message: "availableSlots must be an array" });
//     }

//     // Optional: allow empty array to mean "no availability"
//     // if (availableSlots.length === 0) { ... } // up to your business logic

//     // 3. Validate each slot structure & values
//     for (let i = 0; i < availableSlots.length; i++) {
//       const slot = availableSlots[i];
//       const idx = i + 1; // human-readable index

//       if (!slot || typeof slot !== "object") {
//         return res.status(400).json({
//           message: `Slot at index ${idx} must be an object with date, startTime, and endTime`,
//         });
//       }

//       const { date, startTime, endTime } = slot;

//       // All fields required
//       if (!date || !startTime || !endTime) {
//         return res.status(400).json({
//           message: `Slot at index ${idx} must have date, startTime and endTime`,
//         });
//       }

//       // Date validation
//       if (typeof date !== "string" || !isValidDateString(date)) {
//         return res.status(400).json({
//           message: `Invalid date format at slot ${idx}. Got: "${date}"`,
//         });
//       }

//       // Time format validation
//       if (!isValidTime(startTime)) {
//         return res.status(400).json({
//           message: `Invalid startTime format at slot ${idx}. Expected HH:MM (24h). Got: "${startTime}"`,
//         });
//       }

//       if (!isValidTime(endTime)) {
//         return res.status(400).json({
//           message: `Invalid endTime format at slot ${idx}. Expected HH:MM (24h). Got: "${endTime}"`,
//         });
//       }

//       // Logical: start < end
//       const startMinutes = timeToMinutes(startTime);
//       const endMinutes = timeToMinutes(endTime);

//       if (startMinutes >= endMinutes) {
//         return res.status(400).json({
//           message: `At slot ${idx}, startTime must be before endTime`,
//         });
//       }

//       // Optional: Prevent past dates (business rule)
//       // const today = new Date();
//       // const slotDate = new Date(date);
//       // if (slotDate < new Date(today.toDateString())) {
//       //   return res.status(400).json({
//       //     message: `Slot ${idx} has a past date. Only future dates are allowed.`,
//       //   });
//       // }
//     }

//     // 4. Check overlapping slots
//     const overlapCheck = hasOverlappingSlots(availableSlots);
//     if (overlapCheck.overlap) {
//       return res.status(400).json({
//         message: overlapCheck.message,
//       });
//     }

//     // 5. Fetch reader
//     const reader = await Expert.findById(req.reader._id);

//     if (!reader) {
//       return res.status(404).json({ message: "Tarot reader not found" });
//     }

//     if (reader.isBlocked) {
//       return res
//         .status(403)
//         .json({ message: "Blocked readers cannot update availability" });
//     }

//     // 6. Update and save
//     reader.availableSlots = availableSlots;
//     await reader.save();

//     return res.status(200).json({
//       message: "Availability updated successfully",
//       availableSlots: reader.availableSlots,
//     });
//   } catch (err) {
//     console.error("updateAvailability error:", err);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };



