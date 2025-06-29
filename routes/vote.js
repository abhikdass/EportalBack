const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const {
    castVote,
    getLiveVoteCount,
    getActiveLiveVoteCount,
    getVoteStatistics,
    checkVoteStatus,
    getVoteUpdatesSSE,
    getElectionResults,
    getActiveElectionResults,
    declareWinner,
    getAllElectionResults,
    getApprovedCandidates
} = require("../controllers/voteController");

// Public routes (for viewing live results)
router.get("/candidates/:electionId", getApprovedCandidates); // Get approved candidates for an election
router.get("/live-count/:electionId", getLiveVoteCount);
router.get("/live-count/active", getActiveLiveVoteCount);
router.get("/statistics/:electionId", getVoteStatistics);
router.get("/live-updates/:electionId", getVoteUpdatesSSE); // Server-Sent Events

// Result routes (public access after result announcement time)
router.get("/results/:electionId", getElectionResults);
router.get("/results/active", getActiveElectionResults);
router.get("/winner/:electionId", verifyToken, (req, res, next) => {
    if (req.role !== "ecofficer") {
        return res.status(403).json({ error: "Only EC Officer can view winner" });
    }
    next();
}, declareWinner);
router.get("/results/all", getAllElectionResults);

// Protected routes (require authentication)
router.post("/cast", verifyToken, (req, res, next) => {
    if (req.role !== "user") {
        return res.status(403).json({ error: "Only users can cast votes" });
    }
    next();
}, castVote);

router.get("/status/:electionId", verifyToken, checkVoteStatus);

module.exports = router;
