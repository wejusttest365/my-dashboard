const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();

/* ---------------- CORS (FIXED FOR PRE-FLIGHT) ---------------- */
const allowedOrigins = [
    "http://localhost:5173",
    "https://my-dashboard-six-swart.vercel.app"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, false); // ❗ don't crash server
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

// ✅ IMPORTANT: handle preflight requests
app.options("*", cors());

app.use(express.json());

/* ---------------- MONGO (SAFE CONNECTION) ---------------- */
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("MongoDB connected"))
    .catch(err => {
        console.log("DB ERROR:", err);
        process.exit(1);
    });

/* ---------------- SCHEMA ---------------- */
const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
});

const User = mongoose.model("User", UserSchema);

/* ---------------- SIGNUP ---------------- */
app.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        console.log("SIGNUP HIT:", req.body);

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields required" });
        }

        const exists = await User.findOne({ email });

        if (exists) {
            return res.status(409).json({ message: "User already exists" });
        }

        const hashed = await bcrypt.hash(password, 10);

        await User.create({ name, email, password: hashed });

        res.status(201).json({ message: "Signup successful" });

    } catch (err) {
        console.log("SIGNUP ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

/* ---------------- LOGIN ---------------- */
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("LOGIN HIT:", req.body);

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
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
    res.send("API running 🚀");
});

/* ---------------- START SERVER ---------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("Server running on", PORT);
});