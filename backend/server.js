// server.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { parse } = require("csv-parser"); // keep as in your original file
const session = require("express-session");

// Sequelize models
const {
  sequelize,
  Project,
  TestType,
  Sample,
  Specimen,
  Users,
  AuditLog,
  ProjectStructures,
  ProjectBoreholes,
  ProjectSamples,
  ProjectTests,
  ProjectRequests,
  ProjectChargingCodes,
} = require("./models");

const app = express();
const port = 3001;

console.log("Starting server.js...");

// ---------------- Core middleware ----------------
// If your frontend runs on a different origin/port, keep credentials:true.
app.use(
  cors({
    origin: true, // reflect the request origin
    credentials: true, // allow cookies so sessions work cross-origin
  }),
);
app.use(express.json());

// Sessions (MemoryStore is fine for dev; swap to a DB-backed store for prod)
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax", // use 'none' + secure:true if cross-site over HTTPS
      secure: false, // set true when serving over HTTPS
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  }),
);

// Log every incoming request (method + path)
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

// ---------------- Sequelize Connection ----------------
const models = {
  sequelize,
  Project,
  TestType,
  Sample,
  Specimen,
  Users,
  AuditLog,
  ProjectStructures,
  ProjectBoreholes,
  ProjectSamples,
  ProjectTests,
  ProjectRequests,
  ProjectChargingCodes,
};

// Test database connection
sequelize
  .authenticate()
  .then(() => {
    console.log("Connected to database via Sequelize");
  })
  .catch((err) => {
    console.error("Error connecting to database:", err);
  });

// ---------------- Routes ----------------
// NOTE: These routers are functions that accept `models` and return an Express router.
const supervisorRoutes = require("./routes/supervisor")(models);
app.use("/api/supervisor", supervisorRoutes);

const staffRequestsRoutes = require("./routes/staffrequests")(models);
app.use("/api/requests", staffRequestsRoutes);

// Projects wizard must be registered BEFORE the general projects routes
const projectsWizardRoutes = require("./routes/projects_wizard")(models);
app.use("/api/projects", projectsWizardRoutes);

// General projects routes
const projectsRoutes = require("./routes/projects")(models);
app.use("/api/projects", projectsRoutes);

// User projects route
const userProjectsRoutes = require("./routes/user-projects")(models);
app.use("/api/user-projects", userProjectsRoutes);

// Email routes
const emailRoutes = require("./routes/emails")(models);
app.use("/api/emails", emailRoutes);

// Vision DB (no db injection in your original code)
const visiondbRoutes = require("./routes/visiondb");
app.use("/api/visiondb", visiondbRoutes);

// PDF generation routes
const pdfRoutes = require("./routes/pdf");
app.use("/api/pdf", pdfRoutes);

// Assignments router (relies on req.session.* for user stamping)
const assignmentsRouter = require("./routes/assignments")(models);
app.use("/api", assignmentsRouter);

// Check-in samples router (frontend replica of supervisor.js for the Check in Samples tab)
const checkInSamplesRoutes = require("./routes/checkInSamples")(models);
app.use("/api", checkInSamplesRoutes);

// Request samples router
const requestSamplesRoutes = require("./routes/request-samples")(models);
app.use("/api/supervisor", requestSamplesRoutes);

// Test management router
const testManagementRoutes = require("./routes/test-management")(models);
app.use("/api/test-management", testManagementRoutes);

// ---------------- Ad-hoc endpoints ----------------
app.get("/api/test-types", async (req, res) => {
  try {
    const results = await TestType.findAll();
    res.json(results);
  } catch (err) {
    console.error("Error fetching test types:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/project-info-options", (req, res) => {
  const csvPath = __dirname + "/../Other/District_County_Route_Summary.csv";
  const districts = new Set();
  const counties = new Set();
  const routes = new Set();

  fs.createReadStream(csvPath)
    .pipe(parse({ columns: true, trim: true }))
    .on("data", (row) => {
      if (row["District"]) districts.add(row["District"]);
      if (row["County Name"]) counties.add(row["County Name"]);
      if (row["Route"]) routes.add(row["Route"]);
    })
    .on("end", () => {
      res.json({
        districts: Array.from(districts).sort(),
        counties: Array.from(counties).sort(),
        routes: Array.from(routes).sort(),
      });
    })
    .on("error", (err) => {
      res.status(500).json({
        error: "Failed to read project info options",
        details: err.message,
      });
    });
});

// ---------------- Auth: login / me / logout ----------------
app.post("/api/login", async (req, res) => {
  console.log("Login attempt:", req.body);

  const { username, password } = req.body;

  try {
    const user = await Users.findOne({
      where: { UserName: username, Password: password },
    });

    if (!user) {
      console.log("Invalid username or password");
      return res.status(401).json({ message: "Invalid username or password" });
    }

    console.log("Login successful, userType:", user.UserType);

    // Persist login in a session cookie so other routes can read the user
    req.session.userId = user.UserID;
    req.session.userName = user.UserName;
    req.session.userType = user.UserType;

    res.json({
      ok: true,
      userId: user.UserID,
      userType: user.UserType,
      userName: user.UserName,
      email: user.Email,
      phone: user.Phone,
    });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

// Quick helper to verify session is set
app.get("/api/me", (req, res) => {
  if (!req.session?.userId)
    return res.status(401).json({ message: "Not signed in" });
  res.json({
    ok: true,
    userId: req.session.userId,
    userName: req.session.userName,
    userType: req.session.userType,
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sid");
    res.json({ ok: true });
  });
});

// ---------------- Health & 404 ----------------
app.get("/health", (_req, res) => res.send("OK"));

// 404 fallback (keep last)
app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).send("Not Found");
});

// ---------------- Start server ----------------
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
