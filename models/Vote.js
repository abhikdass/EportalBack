const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
    voterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" },
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: "Election" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Vote", voteSchema);
