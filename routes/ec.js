const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const {
    getCandidates,
    approveCandidate,
    rejectCandidate,
    getCandidateDetails,
    updateCandidateStatus,
    bulkUpdateCandidateStatus,
    deleteElection,
    getStats,
    getStudents,
    removeStudent
} = require("../controllers/ecOfficerController");

// All routes require EC Officer authentication
router.use(verifyToken, (req, res, next) => {
    if (req.role !== "ecofficer") {
        return res.status(403).json({ error: "Unauthorized. EC Officer access required" });
    }
    next();
});

// Candidate management routes  
router.get("/candidates", getCandidates);
router.get("/candidate/:id", getCandidateDetails);
router.post("/approve/:id", approveCandidate);
router.post("/reject/:id", rejectCandidate);
router.put("/candidate/:id/status", updateCandidateStatus);
router.put("/candidates/bulk-status", bulkUpdateCandidateStatus);
router.delete("/election/:electionId", deleteElection);

// User management routes
router.get("/students", getStudents);
router.delete("/students/:id", removeStudent);
router.get("/stats", getStats);

module.exports = router;
