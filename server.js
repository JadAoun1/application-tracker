// DEPENDENCIES

const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const morgan = require("morgan");
const session = require("express-session");

// Set the port from environment variable or default to 3000
const port = process.env.PORT ? process.env.PORT : "3000";
const authController = require("./controllers/auth.js");

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on("connected", () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

// MIDDLEWARE

app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));
app.use(morgan("dev"));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use("/auth", authController);

// MODELS
const JobApplication = require("./models/jobApplication");

// AUTHENTICATION MIDDLEWARE
const isAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect("/auth/sign-in");
  }
  next();
};

// ROUTES

// GET / LANDING
app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/applications"); // Redirect logged-in users to the dashboard
  }
  res.render("index.ejs", { user: req.session.user });
});


// GET /applications - List all job applications for the logged-in user
app.get("/applications", isAuthenticated, async (req, res) => {
  try {
    const applications = await JobApplication.find({ userId: req.session.userId });
    res.render("applications/index.ejs", { applications });
  } catch (err) {
    res.status(500).send("Error retrieving applications.");
  }
});

// GET /applications/new - Render form to create a new application
app.get("/applications/new", isAuthenticated, (req, res) => {
  res.render("applications/new.ejs");
});

// POST /applications - Create a new job application
app.post("/applications", isAuthenticated, async (req, res) => {
  try {
    const newApplication = new JobApplication({
      userId: req.session.userId,
      companyName: req.body.companyName,
      jobTitle: req.body.jobTitle,
      applicationDate: req.body.applicationDate || new Date(),
      status: req.body.status || "Applied",
      notes: req.body.notes || "",
    });

    await newApplication.save();
    res.redirect("/applications");
  } catch (err) {
    res.status(500).send("Error creating application.");
  }
});

// GET /applications/:id - Show details of a single job application
app.get("/applications/:id", isAuthenticated, async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id);
    if (!application || application.userId.toString() !== req.session.userId) {
      return res.status(403).send("Unauthorized access.");
    }
    res.render("applications/show.ejs", { application });
  } catch (err) {
    res.status(500).send("Error retrieving application.");
  }
});

// GET /applications/:id/edit - Render edit form
app.get("/applications/:id/edit", isAuthenticated, async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id);
    if (!application || application.userId.toString() !== req.session.userId) {
      return res.status(403).send("Unauthorized access.");
    }
    res.render("applications/edit.ejs", { application });
  } catch (err) {
    res.status(500).send("Error loading edit form.");
  }
});

// PUT /applications/:id - Update an existing application
app.put("/applications/:id", isAuthenticated, async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id);
    if (!application || application.userId.toString() !== req.session.userId) {
      return res.status(403).send("Unauthorized access.");
    }

    application.companyName = req.body.companyName;
    application.jobTitle = req.body.jobTitle;
    application.applicationDate = req.body.applicationDate;
    application.status = req.body.status;
    application.notes = req.body.notes;

    await application.save();
    res.redirect(`/applications/${req.params.id}`);
  } catch (err) {
    res.status(500).send("Error updating application.");
  }
});

// DELETE /applications/:id - Delete an application
app.delete("/applications/:id", isAuthenticated, async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id);
    if (!application || application.userId.toString() !== req.session.userId) {
      return res.status(403).send("Unauthorized access.");
    }

    await application.deleteOne();
    res.redirect("/applications");
  } catch (err) {
    res.status(500).send("Error deleting application.");
  }
});

// PORT STUFF :)
app.listen(port, () => {
  console.log(`The express app is ready on port ${port}!`);
});



