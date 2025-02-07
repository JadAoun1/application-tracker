const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const bcrypt = require("bcrypt")

// AUTH ROUTES
// Routes will loook like this, not needing the /auth at the front of the route.
// this is due to the nature of the auth controller.
// router.get("/sign-up", (req, res) => {
//     res.render("auth/sign-up.ejs");
// });

// GET - SIGN UP ROUTE
router.get("/sign-up", (req, res) => {
    res.render("auth/sign-up.ejs");
});

// POST - Signing Up New User!
router.post("/sign-up", async (req, res) => {
    // Check if a user already exists
    const userInDatabase = await User.findOne({ username: req.body.username });
    if (userInDatabase) {
      return res.send("Username already taken.");
    }
  
    // Check if passwords match
    if (req.body.password !== req.body.confirmPassword) {
      return res.send("Password and Confirm Password must match");
    }
  
    // Hash the password
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    req.body.password = hashedPassword;
  
    // Create the new user
    const user = await User.create(req.body);
  
    // Automatically log in the new user by setting the session
    req.session.user = {
      username: user.username,
      _id: user._id
    };
    req.session.userId = user._id; // <-- Add this line
  
    // Redirect to the job applications dashboard
    res.redirect("/applications");
  });
  


// GET - Render the sign in page
router.get("/sign-in", (req, res) => {
    res.render("auth/sign-in.ejs");
  });

  
// POST - Sign In as a User
router.post("/sign-in", async (req, res) => {
    const userInDatabase = await User.findOne({ username: req.body.username });
    if (!userInDatabase) {
      return res.send("Login failed. Please try again.");
    }
  
    // Validate the password
    const validPassword = bcrypt.compareSync(
      req.body.password,
      userInDatabase.password
    );
    if (!validPassword) {
      return res.send("Login failed. Please try again.");
    }
  
    // Create the user session
    req.session.user = {
      username: userInDatabase.username,
      _id: userInDatabase._id
    };
    req.session.userId = userInDatabase._id; // <-- Add this line
  
    // Redirect to the job applications dashboard
    res.redirect("/applications");
  });
  



//GET - SIGN OUT USER

router.get("/sign-out", (req, res) => {
    req.session.destroy();
    res.redirect("/");
  });
  

module.exports = router;

