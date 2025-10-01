// backend/routes/request-samples.js
const express = require("express");

module.exports = function requestSamplesRouter(db) {
  const router = express.Router();

  // ==========================================
  // GET /api/supervisor/request-samples
  // (unfiltered list; useful for quick checks)
  // Returns: SampleID, BoreholeID, RequestId, EfisProjectId, CreatedBy, Status
  // ==========================================
  router.get("/request-samples", (_req, res) => {
    const sql = `
      SELECT 
        ps.SampleID,
        ps.BoreholeID,
        ps.RequestID       AS RequestId,
        p.EfisProjectId    AS EfisProjectId,
        pr.RequestingUser  AS CreatedBy,
        pr.Status          AS Status
      FROM project_samples ps
      JOIN project_requests pr ON ps.RequestID = pr.RequestID
      JOIN project p          ON pr.ProjectID = p.ProjectID
      ORDER BY ps.SampleID DESC
    `;

    db.query(sql, (err, rows) => {
      if (err) {
        console.error("[ERR] GET /api/supervisor/request-samples:", err.message);
        return res.status(500).json({ error: "Failed to fetch samples." });
      }

      console.log(`[REQ] GET /api/supervisor/request-samples → ${rows.length} rows`);
      console.log(JSON.stringify(rows, null, 2));

      res.json(rows || []);
    });
  });

  return router;
};
