const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const bcrypt = require("bcrypt");

// GET - Redirect to index with Sign Up form
router.get("/sign-up", (req, res) => {
  res.redirect("/?form=signup");
});

// POST - Signing Up New User!
router.post("/sign-up", async (req, res) => {
  try {
    // Destructure the necessary fields from req.body
    const { firstName, lastName, username, email, password, confirmPassword } = req.body;

    // Check if a user already exists by username (you might also want to check email)
    const userInDatabase = await User.findOne({ username: username });
    if (userInDatabase) {
      return res.redirect("/?form=signup&error=username_taken");
    }

    // Validate that the passwords match
    if (password !== confirmPassword) {
      return res.redirect("/?form=signup&error=password_mismatch");
    }

    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Create the user data object WITHOUT the confirmPassword field
    const userData = {
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword
    };

    // Create the new user
    const user = await User.create(userData);

    // Set the user session
    req.session.user = {
      username: user.username,
      _id: user._id,
    };
    req.session.userId = user._id;

    // Redirect to the job applications dashboard
    res.redirect("/applications");
  } catch (err) {
    console.error(err);
    res.redirect("/?form=signup&error=server_error");
  }
});


// GET - Redirect to index with Sign In form
router.get("/sign-in", (req, res) => {
  res.redirect("/?form=signin");
});

// POST - Sign In as a User
router.post("/sign-in", async (req, res) => {
  try {
    const loginIdentifier = req.body.login;

    // Find a user where either the username or email matches the input
    const userInDatabase = await User.findOne({
      $or: [
        { username: loginIdentifier },
        { email: loginIdentifier }
      ]
    });

    if (!userInDatabase) {
      return res.redirect("/?form=signin&error=login_failed");
    }

    // Validate the password
    const validPassword = bcrypt.compareSync(req.body.password, userInDatabase.password);
    if (!validPassword) {
      return res.redirect("/?form=signin&error=login_failed");
    }

    // Create the user session
    req.session.user = {
      username: userInDatabase.username,
      _id: userInDatabase._id,
    };
    req.session.userId = userInDatabase._id;

    // Redirect to the job applications dashboard
    res.redirect("/applications");
  } catch (err) {
    console.error(err);
    res.redirect("/?form=signin&error=server_error");
  }
});


// GET - SIGN OUT USER
router.get("/sign-out", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
