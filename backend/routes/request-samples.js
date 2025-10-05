// backend/routes/request-samples.js
const express = require("express");

module.exports = function requestSamplesRouter(db) {
  const router = express.Router();

  // ==========================================
  // GET /api/supervisor/request-samples
  // Returns (one row per test; samples without tests still appear):
  //  - From project_samples: SampleID, RequestID, SampleStatus, BoreholeID, DepthFrom, DepthTo, ContainerType, FieldCollectionDate
  //  - From project: EfisProjectID
  //  - From project_requests: RequestingUser
  //  - From project_tests: AssignedTester, ResultDueDate
  //  - From test_type: TestName
  // ==========================================
  router.get("/request-samples", (_req, res) => {
    const sql = `
      SELECT
        ps.SampleID,
        ps.RequestID,
        ps.SampleStatus AS Status,
        ps.BoreholeID,
        ps.DepthFrom,
        ps.DepthTo,
        ps.ContainerType,
        ps.FieldCollectionDate,
        p.EfisProjectID,
        pr.RequestingUser AS CreatedBy,
        tt.TestName,
        pt.AssignedTester,
        pt.ResultDueDate
      FROM project_samples AS ps
      JOIN project_requests AS pr
        ON pr.RequestID = ps.RequestID
      JOIN project AS p
        ON p.ProjectID = pr.ProjectID
      LEFT JOIN project_tests AS pt
        ON pt.SampleID = ps.SampleID
      LEFT JOIN test_type AS tt
        ON tt.TestTypeID = pt.TestTypeID
      ORDER BY ps.SampleID DESC, pt.ResultDueDate IS NULL, pt.ResultDueDate ASC;
    `;

    db.query(sql, (err, rows) => {
      if (err) {
        console.error("[ERR] GET /api/supervisor/request-samples:", err.message);
        return res.status(500).json({ error: "Failed to fetch samples." });
      }
      console.log(`[REQ] GET /api/supervisor/request-samples → ${rows.length} rows`);
      res.json(rows || []);
    });
  });

  return router;
};
