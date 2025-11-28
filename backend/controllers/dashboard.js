import asyncHandler from "express-async-handler";
import User from "../models/user.js";
import mongoose from "mongoose";


export const getallusers = asyncHandler(async (req,res)=>{

    try {
      const user = await User.find().sort({ createdAt: -1 });
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
})
export const getalluserspublic = asyncHandler(async (req,res)=>{

  try {
    const user = await User.find().sort({ createdAt: -1 }).select("-contactNumber -whatsappNumber -url")
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

export const updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if(!id){
        return res.status(400).json({ message: "User Not Found." });
    }
  
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid User Id." });
    }
    const user = await User.findById(id);
   
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
  
 
  
    if(user.status=="accepted"){
      return res.status(400).json({ message: "already accepted" });

    }
    const updatedUser = await User.findByIdAndUpdate(
        id,
        { status: "accepted" }     
      );

   
      if(!updatedUser){
        return res.status(400).json({ message: "User status updation failed" });
      }
  
    
  
    // 4) Success response
    res.status(200).json({
      message: "Status updated successfully",
      updatedUser,
    });
  });


  export const deleteStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
  
    // 1) Validate id present
    if (!id) {
      return res.status(400).json({ message: "user id is required." });
    }
  
    // 2) Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id." });
    }
  
    // 3) Find schedule
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "user not found." });
    }
  
   
  
    const coordinatorOf = (req.admin.coordinatorOf || "").toString().toLowerCase();
   
    if ( !user.sports.includes(coordinatorOf) ) {
      return res.status(403).json({ message: "Forbidden. You are not coordinator of this game." });
    }
    await User.findByIdAndDelete(id);
  
  
    // 6) Success response with helpful info
    return res.json({
      message: "user deleted successfully.",
    });
  });
  