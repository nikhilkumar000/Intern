import User from "../models/user.js";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken.js";
import mongoose from "mongoose";



const sendTokenCookie = (res, user) => {
  const token = generateToken({ id: user._id, role:"user" });
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 1000 * 60 * 60 * 24 * (process.env.JWT_EXPIRES_DAYS ? Number(process.env.JWT_EXPIRES_DAYS) : 7),
  };
  res.cookie("token", token, cookieOptions);
};


 export const registerUser = async (req, res) => {
  try {
 
    const {
      firstName,
      lastName,
      email,
      password,
      phoneNo,
      gender,
      dob,
      birthTime,
      birthPlace,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !phoneNo || !gender || !dob || !birthPlace || !birthTime) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ message: "Invalid email format." });

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNo)) return res.status(400).json({ message: "Invalid contact number (must be 10 digits)." });


    const validGenders = ["male","female","other"];
    if (!validGenders.includes(gender.toLowerCase())) return res.status(400).json({ message: "Gender must be one of: male, female, other." });


    // check duplicates
    const userExists = await User.findOne({ email});
    if (userExists) return res.status(400).json({ message: "User with this email already exists." });


    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);


    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password:hashedPassword,
      dob,
      birthTime,
      birthPlace,
      phoneNo,
      gender: gender.toLowerCase(),
    };

      const user = await User.create(userData);

      if(!user){
        return res.status(500).json({ message: error.message || "Registration failed, please try again later." });
      }

    
       // SEND TOKEN COOKIE JUST LIKE LOGIN
      const token = sendTokenCookie(res, user);

      return res.status(201).json({
      _id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      message: "Registration Successful",
    });

  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: error.message || "Server error, please try again later." });
  }
};

export const loginUser = async (req,res) => {
  try {
    //loginProvider is optionl , it can we used when we login with mobile number or login with google
    const { email, password, loginProvider = "email" } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        res.status(401).json( {message: "User not exist with this email"});
   
      }
    
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({message:"Invalid email or password"});
      }
     
    if (user.isBlocked) {
      return res
        .status(403)
        .json({ message: "Your account is blocked" });
    }
    sendTokenCookie(res, user);

     res.json({
       _id: user._id,
       name: user.firstName,
       email: user.email,
     });
    
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
}

export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({
      message: "Logged out successfully",
      name:req.user.firstName,
      email:req.user.email
    });
  } catch (error) {
   
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
      const id = req.user._id;

    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user id" });
    }
   

    const user = await User.findById(id).select("-password");
    
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    
    return res.status(200).json({
      user,
    });

  } catch (error) {
      return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Body: any updatable fields (name, phoneNo, gender, dob, birthTime, birthPlace, etc.)
export const userProfileUpdate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user id" });
    }

    const allowedFields = [
      "firstName",
      "lastName",
      "phoneNo",
      "email",
      "gender",
      "dob",
      "birthTime",
      "birthPlace",
    ];


    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
    }).select("-password");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (error) {
     return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const userProfileDelete = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user id" });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res
        .status(404)
        .json({
           message: "User not found" });
    }

    // Optionally also clear auth cookie if user is deleting own account
    res.clearCookie("token");

    return res.status(200).json({
      name:deletedUser.firstName,
      email:deletedUser.email,
      message: "User deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const {  oldPassword, newPassword } = req.body;

    if (  !oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "userId, oldPassword and newPassword are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Old password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    return res.status(200).json({
      message: "Password updated successfully",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


export const requestPasswordReset = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User doesn't exist" });

    const secret = process.env.JWT + user.password;
    const token = jwt.sign({ id: user._id, email: user.email }, secret, { expiresIn: '1h' });

     const resetURL = `https://localhost:3000/user/auth/resetpassword?id=${user._id}&token=${token}`;
   

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 't1129172@gmail.com',
        pass: 'password',
      },
    });

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL,
      subject: 'Password Reset Request',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
      Please click on the following link, or paste this into your browser to complete the process:\n\n
      ${resetURL}\n\n
      If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset link sent' });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
}; 


export const resetPassword = async (req, res, next) => {
  const { id, token } = req.query;
  const { password } = req.body;

  try {
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(400).json({ message: "User not exists!" });
    }

    const secret = process.env.JWT + user.password;



    const verify = jwt.verify(token, secret);
    const encryptedPassword = await bcrypt.hash(password, 10);
    await User.updateOne(
      {
        _id: id,
      },
      {
        $set: {
          password: encryptedPassword,
        },
      }
    );


    await user.save();

    res.status(200).json({ message: 'Password has been reset' });
  } catch (error) {

    res.status(500).json({ message: 'Something went wrong' });
  }
};





