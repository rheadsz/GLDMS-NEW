// routes/supervisor.js
const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // GET /api/supervisor/requests
  // Returns: RequestID, ProjectID, EfisProjectId, CreatedBy, Status
  router.get("/requests", (req, res) => {
    console.log("HIT /api/supervisor/requests (EfisProjectId + CreatedBy)");

    const sql = `
      SELECT 
        pr.RequestID,
        pr.ProjectID,
        p.EfisProjectId   AS EfisProjectId,
        p.CreatedBy       AS CreatedBy,
        pr.Status
      FROM project_requests AS pr
      LEFT JOIN project AS p
        ON p.ProjectID = pr.ProjectID
      ORDER BY pr.RequestID DESC
    `;

    db.query(sql, (err, rows) => {
      if (err) {
        console.error("Error fetching supervisor requests:", err);
        return res.status(500).json({ error: "Failed to fetch data" });
      }
      res.json(rows || []);
    });
  });

  return router;
};
