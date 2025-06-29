const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Election = require("../models/Election");
const Vote = require("../models/Vote");

router.get("/stats", async (req, res) => {
    const users = await User.countDocuments();
    const activeElections = await Election.countDocuments({ active: true });
    const totalVotes = await Vote.countDocuments();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const ecOfficers = await User.countDocuments({ role: "ecofficer" });
    const ecOfficerDocs = await User.find(
  { role: "ecofficer" },
  { name: 1, username: 1, _id: 0 }
);

    res.json({
        users,
        ecOfficers,
        ecOfficerDocs,
        activeElections,
        totalVotes,
        uptime: process.uptime(),
        memory: {
            rss: (memoryUsage.rss / 1024 / 1024).toFixed(2) + " MB",
            heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2) + " MB",
            heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + " MB",
            external: (memoryUsage.external / 1024 / 1024).toFixed(2) + " MB"
        },
        cpu: {
            user: (cpuUsage.user / 1000).toFixed(2) + " ms",
            system: (cpuUsage.system / 1000).toFixed(2) + " ms"
        }
    });
});

router.get("/db", async (req, res) => {
    const students = await User.countDocuments({ role: "user" });
    const teachers = await User.countDocuments({ role: "teacher" });
    const votes = await Vote.countDocuments();
    res.json({ students, teachers, votes });
});

module.exports = router;
