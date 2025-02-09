// =========================
// DEPENDENCIES & MODEL IMPORT
// =========================
const JobApplication = require("../models/jobApplication");

// =========================
// HELPER FUNCTION: AUTHORIZATION CHECK
// =========================
const isAuthorized = (application, userId) => {
  return application && application.userId.toString() === userId;
};

// =========================
// JOB APPLICATION CONTROLLER FUNCTIONS
// =========================

// 1️⃣ GET: Fetch all job applications for the logged-in user
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await JobApplication.find({ userId: req.session.userId });
    res.render("applications/index", { applications });
  } catch (err) {
    res.status(500).send("❌ Error retrieving applications.");
  }
};

// 2️⃣ GET: Render the new job application form
exports.renderNewApplicationForm = (req, res) => {
  res.render("applications/new");
};

// 3️⃣ POST: Create a new job application
exports.createApplication = async (req, res) => {
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
    res.status(500).send("❌ Error creating application.");
  }
};

// 4️⃣ GET: Fetch details of a single job application
exports.getApplicationById = async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id);
    if (!isAuthorized(application, req.session.userId)) {
      return res.status(403).send("⛔ Unauthorized access.");
    }
    res.render("applications/show", { application });
  } catch (err) {
    res.status(500).send("❌ Error retrieving application.");
  }
};

// 5️⃣ GET: Render edit form for an existing job application
exports.renderEditApplicationForm = async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id);
    if (!isAuthorized(application, req.session.userId)) {
      return res.status(403).send("⛔ Unauthorized access.");
    }
    res.render("applications/edit", { application });
  } catch (err) {
    res.status(500).send("❌ Error loading edit form.");
  }
};

// 6️⃣ PUT: Update an existing job application
exports.updateApplication = async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id);
    if (!isAuthorized(application, req.session.userId)) {
      return res.status(403).send("⛔ Unauthorized access.");
    }

    // Update application fields
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
    res.status(500).send("❌ Error updating application.");
  }
};

// 7️⃣ DELETE: Remove a job application
exports.deleteApplication = async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id);
    if (!isAuthorized(application, req.session.userId)) {
      return res.status(403).send("⛔ Unauthorized access.");
    }

    await application.deleteOne();
    res.redirect("/applications");
  } catch (err) {
    res.status(500).send("❌ Error deleting application.");
  }
};
