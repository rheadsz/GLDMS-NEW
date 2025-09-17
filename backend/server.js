// server.js
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const fs = require("fs");
const { parse } = require("csv-parser"); // keep as in your original file

const app = express();
const port = 3001;

console.log("Starting server.js...");

// Core middleware
app.use(cors());
app.use(express.json());

// Log every incoming request (method + path)
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

// ---- MySQL Connection ----
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

// ---- Routes ----
const supervisorRoutes = require("./routes/supervisor")(db);
app.use("/api/supervisor", supervisorRoutes);

const staffRequestsRoutes = require("./routes/staffrequests")(db);
app.use("/api/requests", staffRequestsRoutes);

// Projects wizard must be registered BEFORE the general projects routes
// to ensure /api/projects/wizard is matched first
const projectsWizardRoutes = require("./routes/projects_wizard")(db);
app.use("/api/projects", projectsWizardRoutes);

// General projects routes (will not match /wizard due to router matching order)
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


// ---- Ad-hoc endpoints from your original file ----
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

app.post("/api/login", (req, res) => {
  console.log("Login attempt:", req.body);

  const { username, password } = req.body;
  const query = "SELECT * FROM users WHERE UserName = ? AND Password = ? LIMIT 1";

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
    res.json({
      userType: user.UserType,
      userName: user.UserName,
      email: user.Email,
      phone: user.Phone,
    });
  });
});

// Simple health endpoint
app.get("/health", (_req, res) => res.send("OK"));

// 404 fallback (keep last)
app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).send("Not Found");
});

// ---- Start server ----
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
