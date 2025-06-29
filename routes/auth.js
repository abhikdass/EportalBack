const express = require("express");
const router = express.Router();
const { login, registerECO, registerUser } = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/login", login);

// Protected by role
router.post("/register/user", verifyToken, registerUser);      // By EC Officer
router.post("/register/ec", verifyToken, registerECO);         // By Admin

module.exports = router;
