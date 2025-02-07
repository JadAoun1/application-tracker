const JobApplication = require("../models/jobApplication");

// Get all job applications for logged-in user
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await JobApplication.find({ userId: req.session.userId });
    res.render("applications/index", { applications });
  } catch (err) {
    res.status(500).send("Error retrieving applications.");
  }
};

// Render form to create a new application
exports.renderNewApplicationForm = (req, res) => {
  res.render("applications/new");
};

// Create a new job application
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
    res.status(500).send("Error creating application.");
  }
};

// Show details of a single job application
exports.getApplicationById = async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id);
    if (!application || application.userId.toString() !== req.session.userId) {
      return res.status(403).send("Unauthorized access.");
    }
    res.render("applications/show", { application });
  } catch (err) {
    res.status(500).send("Error retrieving application.");
  }
};

// Render edit form
exports.renderEditApplicationForm = async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id);
    if (!application || application.userId.toString() !== req.session.userId) {
      return res.status(403).send("Unauthorized access.");
    }
    res.render("applications/edit", { application });
  } catch (err) {
    res.status(500).send("Error loading edit form.");
  }
};

// Update an existing application
exports.updateApplication = async (req, res) => {
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
};

// Delete an application
exports.deleteApplication = async (req, res) => {
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
};
