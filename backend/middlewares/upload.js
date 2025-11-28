

import multer from "multer";
import path from "path";

// Storage settings
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/tarot_readers/"); 
    // Make sure this folder exists
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "_" + file.fieldname + ext;
    cb(null, uniqueName);
  },
});

// Multer instance
export const upload = multer({ storage });