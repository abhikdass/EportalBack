const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const {
    createElection,
    getAllElections,
    getActiveElection,
    getElectionById,
    updateElectionStatus,
    deleteElection,
    getTimeline
} = require("../controllers/electionController");

// Public roues
router.get("/active", getActiveElection);
router.get("/timeline", getTimeline);
router.get("/all", getAllElections);
router.get("/:id", getElectionById);

router.post("/create", verifyToken, (req, res, next) => {
    if (req.role !== "ecofficer") {
        return res.status(403).json({ error: "Unauthorized. Only Admin or EC Officer can create elections" });
    }
    next();
}, createElection);

router.put("/:id/status", verifyToken, (req, res, next) => {
    if (req.role !== "admin" && req.role !== "ecofficer") {
        return res.status(403).json({ error: "Unauthorized. Only Admin or EC Officer can update election status" });
    }
    next();
}, updateElectionStatus);

router.delete("/:id", verifyToken, (req, res, next) => {
    if (req.role !== "admin") {
        return res.status(403).json({ error: "Unauthorized. Only Admin can delete elections" });
    }
    next();
}, deleteElection);

module.exports = router;
