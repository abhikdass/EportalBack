const express = require("express");
const router = express.Router();
const Election = require("../models/Election");
const { verifyToken } = require("../middlewares/authMiddleware");
const {
    applyCandidate,
    getMyCandidateApplications,
    getCandidateApplication,
    updateCandidateApplication,
    deleteCandidateApplication
} = require("../controllers/userController");

// Public routes
router.get("/active-election", async (req, res) => {
    try {
        const election = await Election.findOne({ active: true });
        res.json(election);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch active election" });
    }
});

router.get("/timeline", async (req, res) => {
    try {
        const election = await Election.find({}).sort({ nominationStartDate: -1 }).limit(1);
        res.json(election[0]);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch timeline" });
    }
});

// Protected routes (User only)
router.post("/apply-candidate", verifyToken, (req, res, next) => {
    if (req.role !== "user") {
        return res.status(403).json({ error: "Only users can apply as candidates" });
    }
    next();
}, applyCandidate);

router.get("/my-applications", verifyToken, (req, res, next) => {
    if (req.role !== "user") {
        return res.status(403).json({ error: "Unauthorized" });
    }
    next();
}, getMyCandidateApplications);

router.get("/application/:id", verifyToken, (req, res, next) => {
    if (req.role !== "user") {
        return res.status(403).json({ error: "Unauthorized" });
    }
    next();
}, getCandidateApplication);

router.put("/application/:id", verifyToken, (req, res, next) => {
    if (req.role !== "user") {
        return res.status(403).json({ error: "Unauthorized" });
    }
    next();
}, updateCandidateApplication);

router.delete("/application/:id", verifyToken, (req, res, next) => {
    if (req.role !== "user") {
        return res.status(403).json({ error: "Unauthorized" });
    }
    next();
}, deleteCandidateApplication);

module.exports = router;
