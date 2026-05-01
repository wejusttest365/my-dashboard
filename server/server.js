const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express(); // ✅ MUST BE FIRST

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());

/* ---------------- MONGOOSE CONNECT ---------------- */
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log("DB error:", err));

/* ---------------- SCHEMA ---------------- */
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

/* ---------------- SIGNUP ---------------- */
app.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).json({ message: "Signup successful" });

    } catch (err) {
        console.log("SIGNUP ERROR:", err);

        if (err.code === 11000) {
            return res.status(409).json({ message: "User already exists" });
        }

        res.status(500).json({ message: "Server error" });
    }
});

/* ---------------- LOGIN ---------------- */
app.post("/login", async (req, res) => {
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

        res.json({
            message: "Login successful",
            user: { name: user.name, email: user.email }
        });

    } catch (err) {
        console.log("LOGIN ERROR:", err);
        res.status(500).json({ message: "Login failed" });
    }
});

/* ---------------- ROOT ---------------- */
app.get("/", (req, res) => {
    res.send("API is running 🚀");
});

/* ---------------- SERVER START ---------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});