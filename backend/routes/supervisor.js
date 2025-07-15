// routes/supervisor.js
const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // GET all requests with joined details
  router.get("/requests", (req, res) => {
    const query = `
      SELECT r.*, d.*
      FROM test_request r
      LEFT JOIN test_request_details d ON r.RequestID = d.RequestID
      ORDER BY r.RequestID DESC
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching supervisor requests:", err);
        return res.status(500).json({ error: "Failed to fetch data" });
      }

      // Group by RequestID
      const grouped = {};
      for (const row of results) {
        const id = row.RequestID;
        if (!grouped[id]) {
          grouped[id] = {
            ...row,
            details: [],
          };
        }
        grouped[id].details.push({
          SampleNumber: row.SampleNumber,
          BoreholeID: row.BoreholeID,
          DepthFrom: row.DepthFrom,
          DepthTo: row.DepthTo,
          TL101No: row.TL101No,
          TubeJar: row.TubeJar,
          Quantity: row.Quantity,
          FieldCollectionDate: row.FieldCollectionDate,
          TestTypeID: row.TestTypeID,
          SameAsSampleNo: row.SameAsSampleNo,
          Comments: row.Comments,
        });
      }

      res.json(Object.values(grouped));
    });
  });

  // GET all supervisors for dropdown
  router.get("/all", (req, res) => {
    const query = "SELECT UserName, Email, Phone FROM users WHERE UserType = 'supervisor'";
    db.query(query, (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Database error" });
      }
      res.json(results);
    });
  });

  return router;
};
