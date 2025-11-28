// tarot_reader_controller.js👇👇👇👇👇👇👇

import TarotReader from "../models/TarotReader.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

// ---------------------- REGISTER ----------------------
export const registerTarotReader = async (req, res) => {
  //address country state
  //name   phone No   email password bio skills profilepic experience preffered_card_type  card_count language
  try {
    const { name, email, password, phoneNo, language, gender } = req.body;

    if (!name || !email || !password || phoneNo || language || gender) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const expertExists = await TarotReader.findOne({ email });
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

    const expert = await TarotReader.create(expertData);

    // const Expert = await TarotReader.create(req.body);

    const token = generateToken({ id: reader._id, role: "tarot_reader" });
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
export const loginTarotReader = async (req, res) => {
  try {
    const { email, password } = req.body;

    const expert = await TarotReader.findOne({ email }).select(
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

    const token = generateToken({ id: reader._id, role: "tarot_reader" });

    res.status(200).json({
      message: "Login successfully",
      name: expert.name,
      email: expert.email,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- UPLOAD DOCUMENTS ----------------------
export const uploadTarotReaderDocuments = async (req, res) => {
  try {
    const reader = await TarotReader.findById(req.reader._id);

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



// ---------------------- UPDATE AVAILABILITY ----------------------
export const updateAvailability = async (req, res) => {
  try {
    const reader = await TarotReader.findById(req.reader._id);
    
    reader.availableSlots = req.body.availableSlots || reader.availableSlots;

    await reader.save();

    res.status(200).json({
      message: "Availability updated",
      availableSlots: reader.availableSlots,
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

    const reader = await TarotReader.findById(req.reader._id);

    reader.currentStatus = currentStatus;
    await reader.save();

    res.status(200).json({
      message: "Visibility updated",
      currentStatus,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
//     const reader = await TarotReader.findById(req.reader._id);

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



