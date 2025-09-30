// backend/routes/request-samples.js
const express = require("express");

module.exports = function requestSamplesRouter(db) {
  const router = express.Router();

  // GET /api/supervisor/request-samples/:requestId
  router.get("/request-samples/:requestId", (req, res) => {
    const { requestId } = req.params;

  const sql = `
    SELECT
      ps.SampleID,
      p.EfisProjectId AS EfisProjectId,
      COALESCE(pr.RequestingUser, p.CreatedBy) AS CreatedBy,
      pr.Status AS Status
    FROM project_samples ps
    LEFT JOIN project_requests pr
      ON pr.RequestID = ps.RequestID
    JOIN project_boreholes pb
      ON pb.BoreholeID = ps.BoreholeID
    JOIN project_structures st
      ON st.StructureID = pb.StructureID
    JOIN project p
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

  return router;
};
