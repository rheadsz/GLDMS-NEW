// routes/supervisor.js
const express = require("express");

module.exports = (db) => {
  const router = express.Router();

  // ================================
  // GET /api/supervisor/requests
  // Returns: RequestID, ProjectID, EfisProjectId, CreatedBy, Status
  // ================================
  router.get("/requests", (_req, res) => {
    console.log("[REQ] GET /api/supervisor/requests");
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
        console.error("[ERR] /api/supervisor/requests:", err.message);
        return res.status(500).json({ error: "Failed to fetch data" });
      }
      console.log(`[RES] /api/supervisor/requests → ${rows.length} rows`);
      res.json(rows || []);
    });
  });

  // ================================
  // GET /api/supervisor/samples
  // Generic list used as fallback in UI:
  // Returns: SampleID, EfisProjectId, CreatedBy, Status, RequestId
  // ================================
  router.get("/samples", (_req, res) => {
    console.log("[REQ] GET /api/supervisor/samples");
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
        console.error("[ERR] GET /api/supervisor/samples:", err.message);
        return res.status(500).json({ error: "Failed to fetch samples." });
      }
      console.log(`[RES] /api/supervisor/samples → ${rows.length} rows`);
      res.json(rows || []);
    });
  });

  // ================================
  // GET /api/supervisor/request-samples/:requestId
  // **Request-scoped** list used by right panel:
  // Returns: SampleID, BoreholeID, RequestId, EfisProjectId, CreatedBy, Status
  // ================================
  router.get("/request-samples/:requestId", (req, res) => {
    const { requestId } = req.params;
    console.log(`[REQ] GET /api/supervisor/request-samples/${requestId}`);

    const sql = `
      SELECT
        ps.SampleID,
        ps.BoreholeID,
        ps.RequestID                 AS RequestId,      -- normalized camelCase
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
        console.error("[ERR] /api/supervisor/request-samples/:requestId:", err.message);
        return res.status(500).json({ error: "Failed to fetch samples for the request." });
      }
      console.log(`[RES] /api/supervisor/request-samples/${requestId} → ${rows.length} rows`);
      res.json(rows || []);
    });
  });

  return router;
};
