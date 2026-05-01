const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();

/* ---------------- TRUSTED CORS (NO CRASH VERSION) ---------------- */
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "https://my-dashboard-six-swart.vercel.app",
    "https://my-dashboard-il25.onrender.com"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
    credentials: true
}));

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    }
    next();
});

app.use(express.json());

/* ---------------- MONGO SAFE CONNECT ---------------- */
const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI || "mongodb+srv://wejusttest365_db_user:th4C9Iv0buDY1m4v@cluster0.xurandz.mongodb.net/myapp?retryWrites=true&w=majority";

mongoose.connect(mongoUrl)
    .then(() => console.log("✅ MongoDB connected successfully"))
    .catch(err => {
        console.log("❌ DB CONNECTION ERROR:", err.message);
        console.log("🔍 Make sure MONGO_URL or MONGODB_URI environment variable is set on Render");
        process.exit(1);
    });

/* ---------------- USER MODEL ---------------- */
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

        await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashed,
            metrics: {
                convertedImages: 0,
                compressedImages: 0,
                totalSavedBytes: 0
            }
        });

        return res.status(201).json({ message: "Signup successful" });

    } catch (err) {
        console.log("SIGNUP ERROR:", err.message);
        console.log("ERROR STACK:", err.stack);

        // Handle specific errors
        if (err.code === 11000) {
            return res.status(409).json({ message: "Email already exists" });
        }

        return res.status(500).json({ message: "Server error during signup" });
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

/* ---------------- TEST ENDPOINT ---------------- */
app.get("/test", (req, res) => {
    res.json({
        status: "OK",
        message: "Server is running",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development"
    });
});

/* ---------------- HEALTH CHECK ---------------- */
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development"
    });
});

/* ---------------- METRICS ENDPOINTS ---------------- */
app.get("/metrics/:email", async (req, res) => {
    try {
        const { email } = req.params;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "Metrics retrieved",
            metrics: user.metrics || { convertedImages: 0, compressedImages: 0, totalSavedBytes: 0 }
        });

    } catch (err) {
        console.log("METRICS GET ERROR:", err);
        res.status(500).json({ message: "Failed to retrieve metrics" });
    }
});

app.post("/metrics/:email", async (req, res) => {
    try {
        const { email } = req.params;
        const { convertedImages, compressedImages, totalSavedBytes } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
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
            message: "Metrics updated",
            metrics: user.metrics
        });

    } catch (err) {
        console.log("METRICS POST ERROR:", err);
        res.status(500).json({ message: "Failed to update metrics" });
    }
});

/* ---------------- ERROR HANDLING ---------------- */
app.use((err, req, res, next) => {
    console.error("UNHANDLED ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
});

/* ---------------- START ---------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Health check: http://localhost:${PORT}/health`);
});