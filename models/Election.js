const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema({
    title: String,
    description: String,
    post: String, // Election post/position
    nominationStartDate: Date,
    nominationEndDate: Date,
    campaignStartDate: Date,
    campaignEndDate: Date,
    votingDate: Date,
    resultAnnouncementDate: Date,
    type: { type: String }, // e.g., "Student Council"
    active: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Election", electionSchema);
