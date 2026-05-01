const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();

/* ---------------- TRUSTED CORS (NO CRASH VERSION) ---------------- */
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://my-dashboard-six-swart.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

// IMPORTANT: preflight must be handled BEFORE routes
app.options("*", cors());

app.use(express.json());

/* ---------------- MONGO SAFE CONNECT ---------------- */
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("MongoDB connected"))
    .catch(err => {
        console.log("DB ERROR:", err);
        process.exit(1);
    });

/* ---------------- USER MODEL ---------------- */
const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
});

const User = mongoose.model("User", UserSchema);

/* ---------------- SIGNUP ---------------- */
app.post("/signup", async (req, res) => {
    try {
        console.log("SIGNUP REQUEST:", req.body);

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields required" });
        }

        const exists = await User.findOne({ email });

        if (exists) {
            return res.status(409).json({ message: "User already exists" });
        }

        const hashed = await bcrypt.hash(password, 10);

        await User.create({ name, email, password: hashed });

        return res.status(201).json({ message: "Signup successful" });

    } catch (err) {
        console.log("SIGNUP ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
});

/* ---------------- LOGIN ---------------- */
app.post("/login", async (req, res) => {
    try {
        console.log("LOGIN REQUEST:", req.body);

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        return res.json({
            message: "Login successful",
            user: { name: user.name, email: user.email }
        });

    } catch (err) {
        console.log("LOGIN ERROR:", err);
        return res.status(500).json({ message: "Login failed" });
    }
});

/* ---------------- ROOT ---------------- */
app.get("/", (req, res) => {
    res.send("API running 🚀");
});

/* ---------------- START ---------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("Server running on", PORT);
});