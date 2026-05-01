const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();

/* ---------------- SIMPLE & STABLE CORS ---------------- */
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://my-dashboard-six-swart.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());

/* ---------------- MONGO CONNECT ---------------- */
const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI || "mongodb+srv://wejusttest365_db_user:th4C9Iv0buDY1m4v@cluster0.xurandz.mongodb.net/myapp?retryWrites=true&w=majority";

mongoose.connect(mongoUrl)
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => {
        console.log("❌ DB ERROR:", err.message);
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
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields required" });
        }

        const exists = await User.findOne({ email: email.toLowerCase().trim() });
        if (exists) {
            return res.status(409).json({ message: "User already exists" });
        }

        const hashed = await bcrypt.hash(password, 10);

        const newUser = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashed
        });

        await newUser.save();

        res.status(201).json({ message: "Signup successful" });

    } catch (err) {
        console.log("❌ SIGNUP ERROR:", err.message);

        if (err.code === 11000) {
            return res.status(409).json({ message: "Email already exists" });
        }

        res.status(500).json({ message: "Signup failed" });
    }
});

/* ---------------- LOGIN ---------------- */
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

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
        console.log("❌ LOGIN ERROR:", err.message);
        res.status(500).json({ message: "Login failed" });
    }
});

/* ---------------- ROOT ---------------- */
app.get("/", (req, res) => {
    res.send("API running 🚀");
});

/* ---------------- HEALTH ---------------- */
app.get("/health", (req, res) => {
    res.json({ status: "OK" });
});


/* ---------------- google auth config ---------------- */

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");

app.use(session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// google passport.strategies

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
},
    async (accessToken, refreshToken, profile, done) => {

        const email = profile.emails[0].value;

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name: profile.displayName,
                email,
                password: "google-auth"
            });
        }

        return done(null, user);
    }
));

// Serialize
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});
// Routes
// start auth
app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// callback
app.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
        res.redirect("https://my-dashboard-six-swart.vercel.app/dashboard");
    }
);

/* ---------------- START ---------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
