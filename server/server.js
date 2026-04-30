process.on("uncaughtException", (err) => {
    console.log("❌ UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
    console.log("❌ UNHANDLED PROMISE:", err);
});
// server/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");




const app = express();
app.use(cors({
    origin: true, // Allow all origins
    credentials: true
}));
app.use(express.json());

// ✅ Connect MongoDB (local)
mongoose.connect("mongodb+srv://wejusttest365_db_user:th4C9Iv0buDY1m4v@cluster0.xurandz.mongodb.net/myapp?retryWrites=true&w=majority")
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));

// ✅ Schema
const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    metrics: {
        convertedImages: { type: Number, default: 0 },
        compressedImages: { type: Number, default: 0 },
        totalSavedBytes: { type: Number, default: 0 },
    },
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", UserSchema);


// app.get("/test", (req, res) => {
//     console.log("🔥 TEST HIT");
//     res.send("OK");
// });

// ✅ Signup API
app.post("/signup", async (req, res) => {
    console.log("🔥 Signup HIT");

    try {
        const { name, email, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();

        res.json({ message: "Signup working ✅" });

    } catch (err) {
        console.log("❌ Signup error:", err.message);
        if (err.code === 11000) {
            res.status(400).json({ message: "Email already exists" });
        } else {
            res.status(500).json({ message: "Signup failed" });
        }
    }
});

// ✅ Login API
app.post("/login", async (req, res) => {
    console.log("🔥 Login HIT");

    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        res.json({ message: "Login successful ✅", user: { name: user.name, email: user.email } });

    } catch (err) {
        console.log("❌ Login error:", err);
        res.status(500).json({ message: "Login failed" });
    }
});

// ✅ Get User Metrics
app.get("/metrics/:email", async (req, res) => {
    console.log("🔥 Get Metrics HIT");

    try {
        const { email } = req.params;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        res.json({
            message: "Metrics retrieved ✅",
            metrics: user.metrics || { convertedImages: 0, compressedImages: 0, totalSavedBytes: 0 }
        });

    } catch (err) {
        console.log("❌ Get Metrics error:", err);
        res.status(500).json({ message: "Failed to retrieve metrics" });
    }
});

// ✅ Update User Metrics
app.post("/metrics/:email", async (req, res) => {
    console.log("🔥 Update Metrics HIT");

    try {
        const { email } = req.params;
        const { convertedImages, compressedImages, totalSavedBytes } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Update metrics
        if (convertedImages !== undefined) {
            user.metrics.convertedImages += convertedImages;
        }
        if (compressedImages !== undefined) {
            user.metrics.compressedImages += compressedImages;
        }
        if (totalSavedBytes !== undefined) {
            user.metrics.totalSavedBytes += totalSavedBytes;
        }

        await user.save();

        res.json({
            message: "Metrics updated ✅",
            metrics: user.metrics
        });

    } catch (err) {
        console.log("❌ Update Metrics error:", err);
        res.status(500).json({ message: "Failed to update metrics" });
    }
});

// ✅ Start server
app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});