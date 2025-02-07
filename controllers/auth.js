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

// POST - SIGNING UP NEW USER!
router.post("/sign-up", async (req, res) => {
    // Checking if a user already exists
    const userInDatabase = await User.findOne({ username: req.body.username });
    if (userInDatabase) {
        return res.send("Username already taken.");
    }
    // Checking if passwords match
    if (req.body.password !== req.body.confirmPassword) {
        return res.send("Password and Confirm Password must match");
    }
    // Scrambling up my password with extra characters and such
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    req.body.password = hashedPassword;
    // Grabbing user data and sending thank you message!
    const user = await User.create(req.body);
    res.send(`Thanks for signing up ${user.username}`);

})


//GET - SIGN IN ROUTE
router.get("/sign-in", (req, res) => {
    res.render("auth/sign-in.ejs");
});


//POST - SIGN IN AS A USER
router.post("/sign-in", async (req, res) => {
    // First, get the user from the database
    const userInDatabase = await User.findOne({ username: req.body.username });
    if (!userInDatabase) {
        return res.send("Login failed. Please try again.");
    }

    // There is a user! Time to test their password with bcrypt
    const validPassword = bcrypt.compareSync(
        req.body.password,
        userInDatabase.password
    );
    if (!validPassword) {
        return res.send("Login failed. Please try again.");
    }

    // There is a user AND they had the correct password. Time to make a session!
    // Avoid storing the password, even in hashed format, in the session
    // If there is other data you want to save to `req.session.user`, do so here!
    req.session.user = {
        username: userInDatabase.username,
        _id: userInDatabase._id
    };

    res.redirect("/");
});



//GET - SIGN OUT USER

router.get("/sign-out", (req, res) => {
    req.session.destroy();
    res.redirect("/");
  });
  

module.exports = router;

