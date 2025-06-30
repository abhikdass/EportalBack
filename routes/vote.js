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
    getWinnerAnnouncement,
    getAllElectionResults,
    getApprovedCandidates,
    result,
    checkVotingStatus,
    reopenVoting
} = require("../controllers/voteController");

// Public routes (for viewing live results)
router.get("/candidates/:electionId", getApprovedCandidates); // Get approved candidates for an election
router.get("/live-count/:electionId", getLiveVoteCount);
router.get("/live-count/active", getActiveLiveVoteCount);
router.get("/statistics/:electionId", getVoteStatistics);
router.get("/live-updates/:electionId", getVoteUpdatesSSE); // Server-Sent Events
router.get("/voting-status/:electionId", checkVotingStatus); // Check if voting is allowed

// Result routes (public access after result announcement time)
router.get("/results/:electionId", getElectionResults);
router.get("/results/active", getActiveElectionResults);
router.get("/winner/:electionId", getWinnerAnnouncement);
router.get("/results/all", getAllElectionResults);

// Admin/EC Officer routes for result management
router.get("/declare-results/:electionId", verifyToken, (req, res, next) => {
    if (req.role !== "admin" && req.role !== "ecofficer") {
        return res.status(403).json({ error: "Only Admin or EC Officer can declare results" });
    }
    next();
}, result);

router.post("/reopen-voting/:electionId", verifyToken, (req, res, next) => {
    if (req.role !== "admin") {
        return res.status(403).json({ error: "Only Admin can reopen voting" });
    }
    next();
}, reopenVoting);

// Protected routes (require authentication)
router.post("/cast", verifyToken, (req, res, next) => {
    if (req.role !== "user") {
        return res.status(403).json({ error: "Only users can cast votes" });
    }
    next();
}, castVote);

router.get("/status/:electionId", verifyToken, checkVoteStatus);

module.exports = router;
