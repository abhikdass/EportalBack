const User = require("../models/User");
const Election = require("../models/Election");
const Vote = require("../models/Vote");

exports.getStats = async (req, res) => {
    const users = await User.countDocuments();
    const activeElections = await Election.countDocuments({ active: true });
    const totalVotes = await Vote.countDocuments();
    const uptime = process.uptime();
    res.json({ users, activeElections, totalVotes, uptime });
};

exports.getDBStats = async (req, res) => {
    const students = await User.countDocuments({ role: "user" });
    const teachers = await User.countDocuments({ role: "teacher" });
    const votes = await Vote.countDocuments();
    res.json({ students, teachers, votes });
};
