const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: String,
    username: { type: String, unique: true },
    password: String,
    department: { type: String, enum: ["BCA", "CSE", "ECE", "ME", "CE", "EE", "IT"], default: "BCA" },
    year: { type: String, enum: ["1", "2", "3", "4","Permanent"], default: "1" },
    role: { type: String, enum: ["user", "ecofficer", "admin"], default: "user" },
});

module.exports = mongoose.model("User", userSchema);
