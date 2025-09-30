// routes/supervisor.js
const express = require("express");

module.exports = (db) => {
  const router = express.Router();

  // ================================
  // GET /api/supervisor/requests
  // Returns: RequestID, ProjectID, EfisProjectId, CreatedBy, Status
  // ================================
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

  // ================================
  // GET /api/supervisor/samples
  // For the Samples tab list:
  // Returns: SampleID, EfisProjectId, CreatedBy, Status
  // NOTE: project_samples does NOT have ps.Status; use pr.Status
  // ================================
  router.get("/samples", (req, res) => {
    console.log("HIT /api/supervisor/samples");

    const sql = `
      SELECT
        ps.SampleID,
        p.EfisProjectId AS EfisProjectId,
        COALESCE(pr.RequestingUser, p.CreatedBy) AS CreatedBy,
        pr.Status AS Status
      FROM project_samples ps
      LEFT JOIN project_requests pr
        ON pr.RequestID = ps.RequestID
      LEFT JOIN project_boreholes pb
        ON pb.BoreholeID = ps.BoreholeID
      LEFT JOIN project_structures st
        ON st.StructureID = pb.StructureID
      LEFT JOIN project p
        ON p.ProjectID = st.ProjectID
      ORDER BY ps.SampleID DESC
    `;

    db.query(sql, (err, rows) => {
      if (err) {
        console.error("GET /api/supervisor/samples error:", err);
        return res.status(500).json({ error: "Failed to fetch samples." });
      }
      res.json(rows || []);
    });
  });

  // ================================
  // GET /api/supervisor/request-samples/:requestId
  // For AssignmentDetails: Sample ID | Project ID | Submitter | Status
  // ================================
  router.get("/request-samples/:requestId", (req, res) => {
    const { requestId } = req.params;
    console.log("HIT /api/supervisor/request-samples/", requestId);

    const sql = `
      SELECT
        ps.SampleID                       AS SampleID,
        p.EfisProjectId                   AS ProjectID,
        COALESCE(pr.RequestingUser, p.CreatedBy) AS Submitter,
        pr.Status                         AS Status
      FROM project_requests pr
      JOIN project p
        ON p.ProjectID = pr.ProjectID
      JOIN project_samples ps
        ON ps.RequestID = pr.RequestID
      WHERE pr.RequestID = ?
      ORDER BY ps.SampleID
    `;

    db.query(sql, [requestId], (err, rows) => {
      if (err) {
        console.error("request-samples query error:", err);
        return res.status(500).json({ error: "Failed to fetch samples for the request." });
      }
      res.json(rows || []);
    });
  });

  return router;
};
