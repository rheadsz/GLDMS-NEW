const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const fs = require('fs');
const { parse } = require('csv-parse');

const app = express();
const port = 3001;

console.log("Starting server.js...");

app.use(cors());
app.use(express.json());

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
const supervisorRoutes = require("./routes/supervisor")(db);
app.use("/api/supervisor", supervisorRoutes);
const staffRequestsRoutes = require("./routes/staffrequests")(db);
app.use("/api/requests", staffRequestsRoutes);
const projectsRoutes = require("./routes/projects")(db);
app.use("/api/projects", projectsRoutes);

app.get("/api/test-types", (req, res) => {
  const query = "SELECT * FROM test_type";
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.json(results);
  });
});

app.get('/api/project-info-options', (req, res) => {
  const csvPath = __dirname + '/../Other/District_County_Route_Summary.csv';
  const districts = new Set();
  const counties = new Set();
  const routes = new Set();
  fs.createReadStream(csvPath)
    .pipe(parse({ columns: true, trim: true }))
    .on('data', (row) => {
      if (row['District']) districts.add(row['District']);
      if (row['County Name']) counties.add(row['County Name']);
      if (row['Route']) routes.add(row['Route']);
    })
    .on('end', () => {
      res.json({
        districts: Array.from(districts).sort(),
        counties: Array.from(counties).sort(),
        routes: Array.from(routes).sort()
      });
    })
    .on('error', (err) => {
      res.status(500).json({ error: 'Failed to read project info options', details: err.message });
    });
});

app.post("/api/login", (req, res) => {
  // Log the incoming request body (for debugging)
  console.log("Login attempt:", req.body);

  const { username, password } = req.body;
  const query =
    "SELECT * FROM users WHERE UserName = ? AND Password = ? LIMIT 1";

  // Log the query and parameters
  console.log("Executing query:", query, "with params:", [username, password]);

  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    // Log the results from the database
    console.log("Query results:", results);

    if (results.length === 0) {
      console.log("Invalid username or password");
      return res.status(401).json({ message: "Invalid username or password" });
    }
    // Return userType (role), userName, email, and phone to frontend
    const user = results[0];
    console.log("Login successful, userType:", user.UserType);
    res.json({ userType: user.UserType, userName: user.UserName, email: user.Email, phone: user.Phone });
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
