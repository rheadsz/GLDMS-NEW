// server.js
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const fs = require("fs");
const { parse } = require("csv-parser"); // keep as in your original file
const session = require("express-session");

const app = express();
const port = 3001;

console.log("Starting server.js...");

// ---------------- Core middleware ----------------
// If your frontend runs on a different origin/port, keep credentials:true.
app.use(
  cors({
    origin: true,          // reflect the request origin
    credentials: true,     // allow cookies so sessions work cross-origin
  })
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
      sameSite: "lax",   // use 'none' + secure:true if cross-site over HTTPS
      secure: false,     // set true when serving over HTTPS
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  })
);

// Log every incoming request (method + path)
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

// ---------------- MySQL Connection ----------------
const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "gldms_2025",
  port: 3306,
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err.stack);
    return;
  }
  console.log("Connected to database as id " + db.threadId);
});

// ---------------- Routes ----------------
// NOTE: These routers are functions that accept `db` and return an Express router.
const supervisorRoutes = require("./routes/supervisor")(db);
app.use("/api/supervisor", supervisorRoutes);

const staffRequestsRoutes = require("./routes/staffrequests")(db);
app.use("/api/requests", staffRequestsRoutes);

// Projects wizard must be registered BEFORE the general projects routes
const projectsWizardRoutes = require("./routes/projects_wizard")(db);
app.use("/api/projects", projectsWizardRoutes);

// General projects routes
const projectsRoutes = require("./routes/projects")(db);
app.use("/api/projects", projectsRoutes);

// User projects route
const userProjectsRoutes = require("./routes/user-projects")(db);
app.use("/api/user-projects", userProjectsRoutes);

// Email routes
const emailRoutes = require("./routes/emails")(db);
app.use("/api/emails", emailRoutes);

// Vision DB (no db injection in your original code)
const visiondbRoutes = require("./routes/visiondb");
app.use("/api/visiondb", visiondbRoutes);

// PDF generation routes
const pdfRoutes = require("./routes/pdf");
app.use("/api/pdf", pdfRoutes);

// Assignments router (relies on req.session.* for user stamping)
const assignmentsRouter = require("./routes/assignments")(db);
app.use("/api", assignmentsRouter);

// Request samples router
const requestSamplesRoutes = require("./routes/request-samples")(db);
app.use("/api/supervisor", requestSamplesRoutes);

// ---------------- Ad-hoc endpoints ----------------
app.get("/api/test-types", (req, res) => {
  const query = "SELECT * FROM test_type";
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.json(results);
  });
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
app.post("/api/login", (req, res) => {
  console.log("Login attempt:", req.body);

  const { username, password } = req.body;
  const query =
    "SELECT * FROM users WHERE UserName = ? AND Password = ? LIMIT 1";

  console.log("Executing query:", query, "with params:", [username, password]);

  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    console.log("Query results:", results);

    if (results.length === 0) {
      console.log("Invalid username or password");
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = results[0];
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
  });
});

// Quick helper to verify session is set
app.get("/api/me", (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ message: "Not signed in" });
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
