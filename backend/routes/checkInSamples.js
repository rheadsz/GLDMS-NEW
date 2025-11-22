const express = require("express");

// routes/checkInSamples.js
// Backend replica for the "Check in Samples" tab.
// It exposes the same data as supervisor.js (requests + samples)
// but under a separate /api/checkin/* prefix.

module.exports = (db) => {
  const router = express.Router();

  // GET /api/checkin/requests
  // Returns: RequestID, ProjectID, EfisProjectId, CreatedBy, Status
  router.get("/checkin/requests", (_req, res) => {
    console.log("[REQ] GET /api/checkin/requests");
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
        console.error("[ERR] /api/checkin/requests:", err.message);
        return res.status(500).json({ error: "Failed to fetch data" });
      }
      console.log(`[RES] /api/checkin/requests → ${rows.length} rows`);
      res.json(rows || []);
    });
  });

  // GET /api/checkin/samples
  // Generic list: SampleID, EfisProjectId, CreatedBy, Status, RequestId
  router.get("/checkin/samples", (_req, res) => {
    console.log("[REQ] GET /api/checkin/samples");
    const sql = `
      SELECT
        ps.SampleID,
        ps.RequestID                 AS RequestId,
        p.EfisProjectId              AS EfisProjectId,
        COALESCE(pr.RequestingUser, p.CreatedBy) AS CreatedBy,
        pr.Status                    AS Status
      FROM project_samples ps
      LEFT JOIN project_requests pr ON pr.RequestID = ps.RequestID
      LEFT JOIN project_boreholes pb ON pb.BoreholeID = ps.BoreholeID
      LEFT JOIN project_structures st ON st.StructureID = pb.StructureID
      LEFT JOIN project p ON p.ProjectID = st.ProjectID
      ORDER BY ps.SampleID DESC
    `;
    db.query(sql, (err, rows) => {
      if (err) {
        console.error("[ERR] GET /api/checkin/samples:", err.message);
        return res.status(500).json({ error: "Failed to fetch samples." });
      }
      console.log(`[RES] /api/checkin/samples → ${rows.length} rows`);
      res.json(rows || []);
    });
  });

  // GET /api/checkin/request-samples/:requestId
  // Request-scoped list: SampleID, BoreholeID, RequestId, EfisProjectId, CreatedBy, Status
  router.get("/checkin/request-samples/:requestId", (req, res) => {
    const { requestId } = req.params;
    console.log(`[REQ] GET /api/checkin/request-samples/${requestId}`);

    const sql = `
      SELECT
        ps.SampleID,
        ps.BoreholeID,
        ps.RequestID                 AS RequestId,
        p.EfisProjectId              AS EfisProjectId,
        COALESCE(pr.RequestingUser, p.CreatedBy) AS CreatedBy,
        pr.Status                    AS Status
      FROM project_samples ps
      JOIN project_requests pr ON ps.RequestID = pr.RequestID
      JOIN project p          ON pr.ProjectID = p.ProjectID
      WHERE pr.RequestID = ?
      ORDER BY ps.SampleID DESC
    `;

    db.query(sql, [requestId], (err, rows) => {
      if (err) {
        console.error(
          "[ERR] /api/checkin/request-samples/:requestId:",
          err.message
        );
        return res
          .status(500)
          .json({ error: "Failed to fetch samples for the request." });
      }
      console.log(
        `[RES] /api/checkin/request-samples/${requestId} → ${rows.length} rows`
      );
      res.json(rows || []);
    });
  });

  return router;
};
