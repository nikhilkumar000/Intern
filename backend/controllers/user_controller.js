import User from "../models/user.js";
import { streamUpload } from "../config/cloudinary.js";

export const registerUser = async (req, res) => {
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
      url // optional external URL
    } = req.body;

    // parse/normalize sports (works for sports[], JSON string, CSV, single)
    let { sports } = req.body;
    if (sports === undefined) {
      sports = null;
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
    if (!firstName || !lastName || !email || !year || !branch || !rollNumber || !whatsappNumber || !contactNumber || !gender || !sports) {
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

    // external URL validation if provided
    if (url) {
      const urlRegex = /^(https?:\/\/)?([\w\-])+\.{1}[a-zA-Z]{2,63}([\/\w\-.]*)*\/?$/;
      if (!urlRegex.test(url)) return res.status(400).json({ message: "Invalid URL format." });
    }

    // check duplicates
    const userExists = await User.findOne({ $or: [{ email }, { rollNumber }] });
    if (userExists) return res.status(400).json({ message: "User with this email or roll number already exists." });

    // handle optional image upload -> upload to Cloudinary and wait for result
    let imageUrl = null;
    let imagePublicId = null;

    if (req.file && req.file.buffer) {
      if (!req.file.mimetype.startsWith("image/")) return res.status(400).json({ message: "Uploaded file is not an image." });

      try {
        const result = await streamUpload(req.file.buffer, { folder: "users/images", resource_type: "image" });
        imageUrl = result.secure_url || result.url;
        imagePublicId = result.public_id;
      } catch (uploadErr) {
        console.error("Cloudinary upload failed:", uploadErr);
        return res.status(500).json({ message: "Image upload failed. Try again." });
      }
    }

    // if user is not admin and no image provided and you require an ID -> enforce
    if (!req.admin && !url && !imageUrl) {
      return res.status(400).json({ message: "Please upload ID ." });
    }

    // prepare user data and create user (create BEFORE sending response)
    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      year: year.toLowerCase(),
      branch: "CSE",
      rollNumber: rollNumber.trim().toUpperCase(),
      whatsappNumber,
      contactNumber,
      sports,
      gender: gender.toLowerCase(),
    };

    if (url) userData.url = url;
    else if (imageUrl) userData.url = imageUrl;

    if (imagePublicId) userData.imagePublicId = imagePublicId;

    const user = await User.create(userData); // <-- awaited

    // respond with created user including the Cloudinary URL (if any)
    return res.status(201).json({
      _id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      rollNumber: user.rollNumber,
      url: user.url || null,
      imagePublicId: user.imagePublicId || null,
      message: "Submission successful. Admin will approve later on.",
    });

  } catch (error) {
    console.error("Error registering user:", error);
    if (error && error.code === "LIMIT_FILE_SIZE") return res.status(400).json({ message: "File is too large. Max 2MB." });
    return res.status(500).json({ message: "Server error, please try again later." });
  }
};

export default registerUser;
