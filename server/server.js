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

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS not allowed'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    optionsSuccessStatus: 204,
    preflightContinue: false
};

const corsMiddleware = cors(corsOptions);
app.options('*', corsMiddleware);
app.use(corsMiddleware);
app.use(express.json());

// CORS error handler
app.use((err, req, res, next) => {
    if (err && err.message === 'CORS not allowed') {
        return res.status(403).json({ message: 'CORS not allowed' });
    }
    next(err);
});

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
        console.log("🔥 SIGNUP REQUEST RECEIVED:", req.body);

        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            console.log("❌ Missing fields:", { name: !!name, email: !!email, password: !!password });
            return res.status(400).json({ message: "All fields required" });
        }

        // Check if user exists
        console.log("🔍 Checking if user exists with email:", email.toLowerCase().trim());
        const exists = await User.findOne({ email: email.toLowerCase().trim() });

        if (exists) {
            console.log("⚠️ User already exists:", email);
            return res.status(409).json({ message: "User already exists" });
        }

        // Hash password
        console.log("🔐 Hashing password...");
        const hashed = await bcrypt.hash(password, 10);

        // Create new user
        console.log("📝 Creating new user...");
        const newUser = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashed,
            metrics: {
                convertedImages: 0,
                compressedImages: 0,
                totalSavedBytes: 0
            }
        });

        await newUser.save();
        console.log("✅ User created successfully:", newUser._id);

        return res.status(201).json({ message: "Signup successful" });

    } catch (err) {
        console.error("❌ SIGNUP ERROR:", err.message);
        console.error("ERROR DETAILS:", {
            name: err.name,
            code: err.code,
            message: err.message,
            stack: err.stack
        });

        // Handle specific errors
        if (err.code === 11000) {
            return res.status(409).json({ message: "Email already exists" });
        }

        if (err.name === "ValidationError") {
            return res.status(400).json({ message: "Invalid data format" });
        }

        return res.status(500).json({
            message: "Server error during signup",
            error: process.env.NODE_ENV === "development" ? err.message : undefined
        });
    }
});

/* ---------------- LOGIN ---------------- */
app.post("/login", async (req, res) => {
    try {
        console.log("🔥 LOGIN REQUEST RECEIVED:", { email: req.body.email, hasPassword: !!req.body.password });

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        console.log("🔍 Finding user with email:", email.toLowerCase().trim());
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            console.log("⚠️ User not found:", email);
            return res.status(400).json({ message: "Invalid email or password" });
        }

        console.log("🔐 Comparing passwords...");
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            console.log("⚠️ Password mismatch for user:", email);
            return res.status(400).json({ message: "Invalid email or password" });
        }

        console.log("✅ Login successful:", user._id);
        return res.json({
            message: "Login successful",
            user: { name: user.name, email: user.email }
        });

    } catch (err) {
        console.error("❌ LOGIN ERROR:", err.message);
        console.error("ERROR DETAILS:", {
            name: err.name,
            message: err.message
        });
        return res.status(500).json({
            message: "Login failed",
            error: process.env.NODE_ENV === "development" ? err.message : undefined
        });
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