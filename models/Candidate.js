const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
    name: String,
    StudentId: { type: String, unique: true },
    email: { type: String, unique: true },  
    phone: String,
    statement: {
        type: String,
        required: true,
        minlength: 50,
        maxlength: 500
    },  
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    position: String,
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    rejectionReason: String,
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: "Election" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Candidate", candidateSchema);
