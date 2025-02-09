// =========================
// DEPENDENCIES & CONFIGURATION
// =========================

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const morgan = require("morgan");
const session = require("express-session");
const path = require("path");
const MongoStore = require("connect-mongo");

// Initialize Express App
const app = express();

// Controllers
const authController = require("./controllers/auth.js");

// Models
const JobApplication = require("./models/jobApplication");

// =========================
// DATABASE CONNECTION
// =========================

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", () => {
  console.log(`✅ Connected to MongoDB: ${mongoose.connection.name}`);
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB Connection Error:", err);
});

// =========================
// MIDDLEWARE
// =========================

// Body parsing & request handling
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "src")));

// Session Management
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback-secret-key",
    resave: false,
    saveUninitialized: false, 
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      mongooseConnection: mongoose.connection, 
      ttl: 24 * 60 * 60, 
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, 
      secure: false, 
      httpOnly: true, 
    },
  })
);

// Authentication Middleware
const isAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect("/auth/sign-in");
  }
  next();
};

// =========================
// ROUTES
// =========================

// Authentication Routes
app.use("/auth", authController);

// Landing Page - Redirects if logged in
app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/applications");
  }
  res.render("index.ejs", {
    user: req.session.user,
    formType: req.query.form || "signin", 
    error: req.query.error || null,
  });
});

// =========================
// JOB APPLICATION ROUTES
// =========================

// GET: List all job applications for the logged-in user
app.get("/applications", isAuthenticated, async (req, res) => {
  try {
    const applications = await JobApplication.find({ userId: req.session.userId });
    res.render("applications/index.ejs", { applications, user: req.session.user });
  } catch (err) {
    res.status(500).send("Error retrieving applications.");
  }
});

// GET: Show form to create a new application
app.get("/applications/new", isAuthenticated, (req, res) => {
  res.render("applications/new.ejs");
});

// POST: Create a new job application
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

// GET: Show details of a single application
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

// GET: Edit form for an application
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

// PUT: Update an application
app.put("/applications/:id", isAuthenticated, async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id);
    if (!application || application.userId.toString() !== req.session.userId) {
      return res.status(403).send("Unauthorized access.");
    }

    Object.assign(application, {
      companyName: req.body.companyName,
      jobTitle: req.body.jobTitle,
      applicationDate: req.body.applicationDate,
      status: req.body.status,
      notes: req.body.notes,
    });

    await application.save();
    res.redirect(`/applications/${req.params.id}`);
  } catch (err) {
    res.status(500).send("Error updating application.");
  }
});

// DELETE: Remove an application
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

// =========================
// SERVER START
// =========================

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
