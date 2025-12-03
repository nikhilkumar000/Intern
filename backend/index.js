
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRouter from "./routes/user_auth.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import ExpertRouter from "./routes/expert.js";
import adminRouter from "./routes/admin_auth.js";
import CallRouter from "./routes/call.js"

import http from "http";
import { Server } from "socket.io";


dotenv.config();
const app = express();


app.use(express.json());
app.use(cookieParser());

const server = http.createServer(app);

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
app.use("/admin", adminRouter);
app.use("/call", CallRouter);


// // ===== Serve react build in production =====
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// if (process.env.NODE_ENV === "production") {
//   const buildPath = path.join(__dirname, "../client/build"); // adjust if structure differs
//   app.use(express.static(buildPath));
//   app.get("*", (req, res) => {
//     res.sendFile(path.join(buildPath, "index.html"));
//   });
// }











 
// const io = new Server(server, {
//   cors: { origin: "*", methods: ["GET", "POST"] },
// });

// const onlineExperts = {}; // expertId -> socketId
// const onlineUsers = {};  // userId -> socketId

// io.on("connection", (socket) => {
//   console.log("connected:", socket.id);

//   // store socket mapping
//   socket.on("register-expert", (expertId) => {
//     onlineExperts[expertId] = socket.id;
//     console.log(expertId);
//     console.log(`Expert ${expertId} registered as ${socket.id}`);

//     io.emit("online-experts", onlineExperts);   //notify all clients 
//   });

//   socket.on("register-user", (userId) => {
//     onlineUsers[userId] = socket.id;
//     console.log(`User ${userId} registered as ${socket.id}`);
//   });

//   // CALL REQUEST
//   socket.on("call-user", ({ to, from, callerName }) => {
//     console.log("CALLING")
//     io.to(onlineExperts[to]).emit("incoming-call", {
//       from,
//       callerName,
//     });
//     console.log("Calling Complete", onlineExperts[to]);
//   });

//   // ACCEPT CALL
//   socket.on("accept-call", ({ to, from }) => {
//     io.to(onlineExperts[to]).emit("call-accepted", { from });
//   });

//   // WebRTC signaling
//   socket.on("signal", ({ to, from, payload }) => {
//     io.to(onlineExperts[to]).emit("signal", { from, payload });
//   });

//   socket.on("end-call", ({ to }) => {
//     io.to(onlineExperts[to]).emit("call-ended");
//   });

//   socket.on("disconnect", () => {

//     for (const id in onlineExperts) {
//       if (onlineExperts[id] === socket.id) {
//         delete onlineExperts[id];
//       }
//     } 
//     console.log("disconnected:", socket.id);

//     io.emit("online-experts", onlineExperts);
//   });
// });


const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const onlineExperts = {}; // expertId (Mongo) -> socketId
const onlineUsers = {};   // userId (Mongo) -> socketId


// expert dhiraj mongoid 692db0009fc6fc6264dfe55c
// user dhiraj mongo id 692d9f7f76d281c931ce3060


io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  // ===== Register sockets =====
  socket.on("register-expert", (expertId) => {
    onlineExperts[expertId] = socket.id;
    console.log(`Expert ${expertId} registered as ${socket.id}`);
    io.emit("online-experts", onlineExperts); // notify all clients
  });

  socket.on("register-user", (userId) => {
    onlineUsers[userId] = socket.id;
    console.log(`User ${userId} registered as ${socket.id}`);
  });

  // ===== CALL REQUEST (ONLY user -> expert) =====
  // User emits: socket.emit("call-user", { to: expertId, from: userId, callerName })
  socket.on("call-user", ({ to, from, callerName ,callId}) => {
    // to = expertId (Mongo), from = userId (Mongo)
    const expertSocketId = onlineExperts[to];
    console.log("CALL-USER", { to, from, expertSocketId, callerName ,callId});

    // to: expert mongoid
    //from user mongoid 

    if (!expertSocketId) {
      console.log("Expert not online:", to);
      return;
    }

    io.to(expertSocketId).emit("incoming-call", {
      from,       // userId (Mongo)
      callerName,
      callId
    });
    console.log("from incoming call",from);

    console.log("Calling Complete", expertSocketId);
  });

  // ===== ACCEPT CALL (expert -> user) =====
  // Expert emits: socket.emit("accept-call", { to: userId, from: expertId })
  socket.on("accept-call", ({ to, from,callId }) => {
    // to = userId (caller), from = expertId
    //to = user mongo id   , from = expert socket id
    console.log(onlineExperts)
    console.log(onlineUsers)
    const userSocketId = onlineUsers[to] ;
    console.log("ACCEPT-CALL", { to, from, userSocketId });

    if (!userSocketId) {
      console.log("User not online:", to);
      return;
    }

    io.to(userSocketId).emit("call-accepted", { from, callId });
  });

  // ===== WebRTC signaling (BOTH directions, but always by Mongo IDs) =====
  // Both sides emit: socket.emit("signal", { to: remoteMongoId, from: myMongoId, payload })
  socket.on("signal", ({ to, from, payload }) => {
    // 'to' can be either userId or expertId (Mongo)
    console.log("to",to);
    console.log(onlineExperts);
    console.log(onlineUsers)
    const targetSocketId =   onlineUsers[to]  || onlineExperts[to];

    console.log("SIGNAL", { to, from, targetSocketId });

    if (!targetSocketId) {
      console.log("Target not online for signal:", to);
      return;
    }

    io.to(targetSocketId).emit("signal", { from, payload });
  });

  // ===== End call (either side can end) =====
  // Both sides emit: socket.emit("end-call", { to: remoteMongoId })
  socket.on("end-call", ({ to }) => {
    const targetSocketId = onlineExperts[to] || onlineUsers[to];

    console.log("END-CALL", { to, targetSocketId });

    if (!targetSocketId) return;

    io.to(targetSocketId).emit("call-ended");
  });

  // ===== Disconnect cleanup =====
  socket.on("disconnect", () => {
    for (const id in onlineExperts) {
      if (onlineExperts[id] === socket.id) {
        delete onlineExperts[id];
      }
    }

    for (const id in onlineUsers) {
      if (onlineUsers[id] === socket.id) {
        delete onlineUsers[id];
      }
    }

    console.log("disconnected:", socket.id);
    io.emit("online-experts", onlineExperts);
  });
});



const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    process.exit(1);
  });
  



// const io = new Server(server, {
//   cors: { origin: "*", methods: ["GET", "POST"] },
// });

// const onlineExperts = {}; // expertId -> socketId
// const onlineUsers = {};   // userId -> socketId

// io.on("connection", (socket) => {
//   console.log("connected:", socket.id);

//   // ===== Register sockets =====
//   socket.on("register-expert", (expertId) => {
//     onlineExperts[expertId] = socket.id;
//     console.log(`Expert ${expertId} registered as ${socket.id}`);
//     io.emit("online-experts", onlineExperts);
//   });

//   socket.on("register-user", (userId) => {
//     onlineUsers[userId] = socket.id;
//     console.log(`User ${userId} registered as ${socket.id}`);
//   });

//   // ===== CALL REQUEST (user -> expert) =====
//   socket.on("call-user", ({ to, from, callerName }) => {
//     // to = expertId (Mongo), from = userId (Mongo)
//     const expertSocketId = onlineExperts[to];
//     console.log("CALLING", { to, expertSocketId });

//     if (!expertSocketId) {
//       console.log("Expert not online:", to);
//       return;
//     }

//     io.to(expertSocketId).emit("incoming-call", {
//       from,        // userId
//       callerName,
//     });

//     console.log("Calling Complete", expertSocketId);
//   });

//   // ===== ACCEPT CALL (expert -> user) =====
//   socket.on("accept-call", ({ to, from }) => {
//     // to = userId (caller), from = expertId
//     const userSocketId = onlineUsers[to];
//     console.log("ACCEPT-CALL", { to, userSocketId });

//     if (!userSocketId) {
//       console.log("User not online:", to);
//       return;
//     }

//     io.to(userSocketId).emit("call-accepted", { from }); // from = expertId
//   });

//   // ===== WebRTC signaling (both directions) =====
//   socket.on("signal", ({ to, from, payload }) => {
//     // 'to' can be either userId or expertId
//     const targetSocketId =
//       onlineExperts[to] || onlineUsers[to];

//     console.log("SIGNAL", { to, targetSocketId });

//     if (!targetSocketId) {
//       console.log("Target not online for signal:", to);
//       return;
//     }

//     io.to(targetSocketId).emit("signal", { from, payload });
//   });

//   // ===== End call =====
//   socket.on("end-call", ({ to }) => {
//     const targetSocketId =
//       onlineExperts[to] || onlineUsers[to];

//     console.log("END-CALL", { to, targetSocketId });

//     if (!targetSocketId) return;

//     io.to(targetSocketId).emit("call-ended");
//   });

//   // ===== Disconnect cleanup =====
//   socket.on("disconnect", () => {
//     for (const id in onlineExperts) {
//       if (onlineExperts[id] === socket.id) {
//         delete onlineExperts[id];
//       }
//     }

//     for (const id in onlineUsers) {
//       if (onlineUsers[id] === socket.id) {
//         delete onlineUsers[id];
//       }
//     }

//     console.log("disconnected:", socket.id);
//     io.emit("online-experts", onlineExperts);
//   });
// });


// const PORT = process.env.PORT || 5000;
// connectDB()
//   .then(() => {
//     server.listen(PORT, () => {
//       console.log(`✅ Server running on port ${PORT}`);
//     });
//   })
//   .catch((error) => {
//     console.error("❌ Failed to connect to MongoDB:", error.message);
//     process.exit(1);
//   });







 
