const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Only Admin can register EC Officer
exports.registerECO = async (req, res) => {
    try {
        if (!req.body || !req.body.name || !req.body.username || !req.body.password) {
            return res.status(400).json({ error: "All fields are required" });
        }
        if (await User.findOne({ username: req.body.username })) {
            return res.status(400).json({ error: "Username already exists" });
        }
        if (req.role !== "admin") return res.status(403).json({ error: "Unauthorized" });

        const { name, username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, username: username.toLowerCase(), password: hashedPassword, role: "ecofficer" });
        await user.save();
        res.json({ message: "EC Officer registered successfully" });
        
    } catch (err) {
        res.status(500).json({ error: "Registration failed" });
    }
};

// Only EC Officer can register User
exports.registerUser = async (req, res) => {
    try {
        if (req.role !== "ecofficer") return res.status(403).json({ error: "Unauthorized" });

        const { name, username, password, department, year } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, username: username.toLowerCase(), password: hashedPassword, role: "user", department, year });
        await user.save();
        res.json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ error: "User registration failed" });
    }
};

// Login stays same
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username: username.toLowerCase().trim() });
        if (!user) return res.status(401).json({ error: "Invalid username" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid password" });

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.json({ name: user.name, role: user.role,token });
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
};
