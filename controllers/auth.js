// =========================
// DEPENDENCIES & MODEL IMPORT
// =========================
const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const bcrypt = require("bcrypt");

// =========================
// USER AUTHENTICATION ROUTES
// =========================

// 1️⃣ GET: Redirect to Sign-Up Form
router.get("/sign-up", (req, res) => {
  res.redirect("/?form=signup");
});

// 2️⃣ POST: Register a New User
router.post("/sign-up", async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, confirmPassword } = req.body;

    // Check if username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.redirect("/?form=signup&error=username_or_email_taken");
    }

    // Validate that the passwords match
    if (password !== confirmPassword) {
      return res.redirect("/?form=signup&error=password_mismatch");
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
    });

    // Store user session
    req.session.userId = user._id;
    req.session.user = { username: user.username, _id: user._id };

    await req.session.save(); // Ensure session persistence

    // Redirect to applications dashboard
    res.redirect("/applications");
  } catch (err) {
    console.error("❌ Error signing up user:", err);
    res.redirect("/?form=signup&error=server_error");
  }
});

// 3️⃣ GET: Redirect to Sign-In Form
router.get("/sign-in", (req, res) => {
  res.redirect("/?form=signin");
});

// 4️⃣ POST: Authenticate and Sign-In User
router.post("/sign-in", async (req, res) => {
  try {
    const loginIdentifier = req.body.login;

    // Find user by username or email
    const user = await User.findOne({ $or: [{ username: loginIdentifier }, { email: loginIdentifier }] });
    if (!user) {
      return res.redirect("/?form=signin&error=invalid_credentials");
    }

    // Validate password
    const passwordMatches = await bcrypt.compare(req.body.password, user.password);
    if (!passwordMatches) {
      return res.redirect("/?form=signin&error=invalid_credentials");
    }

    // Store user session
    req.session.userId = user._id;
    req.session.user = { username: user.username, _id: user._id };

    await req.session.save(); // Ensure session persistence

    // Redirect to applications dashboard
    res.redirect("/applications");
  } catch (err) {
    console.error("❌ Error signing in user:", err);
    res.redirect("/?form=signin&error=server_error");
  }
});

// 5️⃣ GET: Sign-Out and Destroy Session
router.get("/sign-out", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("❌ Error destroying session:", err);
      return res.redirect("/?error=logout_failed");
    }
    res.redirect("/");
  });
});

module.exports = router;
