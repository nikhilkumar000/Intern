// controllers/scheduleController.js
import asyncHandler from "express-async-handler";
import Schedule from "../models/schedule.js";
import mongoose from "mongoose";

// Helper: allowed game names (same as schema)
const ALLOWED_GAMES = [
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

const ALLOWED_TEAMS = [
  "cse",
  "ece",
  "me",
  "ce",
  "bca",
  "mca"
];


// Helper: Check if two matches have same teams regardless of order/case
export const areTeamsSame = (teamA1, teamB1, teamA2, teamB2) => {
  const t1 = teamA1.trim().toLowerCase();
  const t2 = teamB1.trim().toLowerCase();
  const x1 = teamA2.trim().toLowerCase();
  const x2 = teamB2.trim().toLowerCase();

  // Check unordered equality -> A vs B === B vs A
  return (t1 === x1 && t2 === x2) || (t1 === x2 && t2 === x1);
};

const isValidUrl = (u) => {
  if (!u) return true;
  const urlRegex = /^(https?:\/\/)?([\w\-])+\.{1}[a-zA-Z]{2,63}([\/\w\-.]*)*\/?$/;
  return urlRegex.test(u);
};



// helper to check time overlap: returns true if (s1,e1) overlaps (s2,e2)
function timesOverlap(s1, e1, s2, e2) {
  return s1 < e2 && e1 > s2;
}

export const createSchedule = asyncHandler(async (req, res) => {
  const { gameName, teamA, teamB, venue, startTime, endTime, match_live_url } = req.body;

  // basic validations
  if (!gameName || !teamA || !teamB || !venue || !startTime || !endTime) {
    return res.status(400).json({ message: "gameName, teamA, teamB, venue, startTime and endTime are required." });
  }
  
  if(req.admin.coordinatorOf != gameName){
    return res.status(404).json({ message: "You are not coordinator of this game , you can't create schedule" });
  }

  const gameLower = String(gameName).toLowerCase().trim();
  if (!ALLOWED_GAMES.includes(gameLower)) {
    return res.status(400).json({ message: `gameName must be one of: ${ALLOWED_GAMES.join(", ")}` });
  }

  const aLower = String(teamA).toLowerCase().trim();
  const bLower = String(teamB).toLowerCase().trim();

  if (!ALLOWED_TEAMS.includes(aLower) || !ALLOWED_TEAMS.includes(bLower)) {
    return res.status(400).json({ message: `teamA and teamB must be one of: ${ALLOWED_TEAMS.join(", ")}` });
  }

  if (aLower === bLower) {
    return res.status(400).json({ message: "teamA and teamB cannot be the same." });
  }

  if (!isValidUrl(match_live_url)) {
    return res.status(400).json({ message: "Invalid match_live_url format." });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return res.status(400).json({ message: "startTime and endTime must be valid date strings." });
  }
  if (end <= start) {
    return res.status(400).json({ message: "endTime must be after startTime." });
  }

  // ---- Duplicate + overlap check ----


  



   // Check if there's an overlapping schedule with same teams
   const existingMatches = await Schedule.find({ gameName });

   const isDuplicate = existingMatches.some(
     (m) => areTeamsSame(m.teamA, m.teamB, teamA, teamB)
   );

   if (isDuplicate) {
     return res.status(400).json({
       message:
         "A match between these two teams already exists (CSE vs ECE is same as ECE vs CSE).",
     });
   }





  // if (isDuplicate && timesOverlap(start, end, existing.startTime, existing.endTime)) {
  //   return res.status(409).json({
  //     message: `A match between ${teamA} and ${teamB} for '${gameName}' is already scheduled and overlaps with this time.`
  //   });
  // }

  const newSchedule = await Schedule.create({
    gameName: gameLower,
    teamA: aLower,
    teamB: bLower,
    venue: String(venue).trim(),
    startTime: start,
    endTime: end,
    match_live_url: match_live_url ? match_live_url.trim() : undefined,
  });

  return res.status(201).json({ message: "Schedule created", schedule: newSchedule });
});


export const updateSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const schedule = await Schedule.findById(id);
  if (!schedule) return res.status(404).json({ message: "Schedule not found." });
  const game = schedule.gameName;
  console.log(game)
  if(req.admin.coordinatorOf != game){
    return res.status(404).json({ message: "You are not coordinator of this game , you can't update schedule" });
  }
  

  // Validate if gameName present
  if (updates.gameName) {
    const gameLower = String(updates.gameName).toLowerCase().trim();
    if (!ALLOWED_GAMES.includes(gameLower)) {
      return res.status(400).json({ message: `gameName must be one of: ${ALLOWED_GAMES.join(", ")}` });
    }
  }

  if (updates.match_live_url && !isValidUrl(updates.match_live_url)) {
    return res.status(400).json({ message: "Invalid match_live_url format." });
  }

  // If updating teams, validate
  let newTeamA = updates.teamA ? String(updates.teamA).toLowerCase().trim() : schedule.teamA;
  let newTeamB = updates.teamB ? String(updates.teamB).toLowerCase().trim() : schedule.teamB;

  if (!ALLOWED_TEAMS.includes(newTeamA) || !ALLOWED_TEAMS.includes(newTeamB)) {
    return res.status(400).json({ message: `teamA and teamB must be one of: ${ALLOWED_TEAMS.join(", ")}` });
  }
  if (newTeamA === newTeamB) {
    return res.status(400).json({ message: "teamA and teamB cannot be the same." });
  }

  // If updating times, validate
  const start = updates.startTime ? new Date(updates.startTime) : schedule.startTime;
  const end = updates.endTime ? new Date(updates.endTime) : schedule.endTime;

  if (updates.startTime && Number.isNaN(start.getTime())) return res.status(400).json({ message: "Invalid startTime." });
  if (updates.endTime && Number.isNaN(end.getTime())) return res.status(400).json({ message: "Invalid endTime." });
  if (end <= start) return res.status(400).json({ message: "endTime must be after startTime." });

  const gameLower = updates.gameName ? String(updates.gameName).toLowerCase().trim() : schedule.gameName;
 

  // Check duplicates excluding current document
  const existing = await Schedule.findOne({
    _id: { $ne: schedule._id },
    gameName: gameLower,
    
  });

  if (existing ) {
    return res.status(409).json({
      message: "schedule already exists"
    });
  }

  // apply updates (normalized)
  schedule.gameName = gameLower;
  schedule.teamA = newTeamA;
  schedule.teamB = newTeamB;
  
  if (updates.venue) schedule.venue = String(updates.venue).trim();
  schedule.startTime = start;
  schedule.endTime = end;
  schedule.match_live_url = updates.match_live_url !== undefined ? (updates.match_live_url ? updates.match_live_url.trim() : undefined) : schedule.match_live_url;

  const updated = await schedule.save();
  return res.json({ message: "Schedule updated", schedule: updated });
});





export const deleteSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1) Validate id present
  if (!id) {
    return res.status(400).json({ message: "Schedule id is required." });
  }

  // 2) Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid schedule id." });
  }

  // 3) Find schedule
  const schedule = await Schedule.findById(id);
  if (!schedule) {
    return res.status(404).json({ message: "Schedule not found." });
  }

 

  const coordinatorOf = (req.admin.coordinatorOf || "").toString().toLowerCase();
 

  if (coordinatorOf !== schedule.gameName ) {
    return res.status(403).json({ message: "Forbidden. You are not coordinator of this game." });
  }
  await Schedule.findByIdAndDelete(id);


  // 6) Success response with helpful info
  return res.json({
    message: "Schedule deleted successfully.",
  });
});


// GET all schedules
export const getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find().sort({ createdAt: -1 });
    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET schedule by ID
export const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid schedule ID" });
    }

    const schedule = await Schedule.findById(id);

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    res.status(200).json(schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

