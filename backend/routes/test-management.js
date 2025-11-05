// routes/test-management.js
const express = require("express");

module.exports = (db) => {
  const router = express.Router();

  // GET /api/test-management/tests
  // Returns fields similar to Assignments summary but for all tests
  router.get("/tests", (_req, res) => {
    const sql = `
      SELECT
        pt.TestID,
        pr.RequestID,
        tt.TestName                AS RequestedTest,
        CONCAT(pb.BoreholeNumber, ' (', ps.DepthFrom, '–', ps.DepthTo, ')') AS BoreholeDepth,
        ps.SampleID,
        ps.SampleStatus            AS SampleStatus,
        COALESCE(pt.TestStatus, ps.SampleStatus, pt.Status) AS DisplayStatus,
        pt.AssignedTester,
        DATE(pt.ResultDueDate)     AS AssignedResultDueDate,
        DATE(pt.ReportDueDate)     AS AssignedReportDueDate
      FROM project_tests pt
      LEFT JOIN project_requests   pr ON pr.RequestID  = pt.RequestID
      LEFT JOIN test_type          tt ON tt.TestTypeID = pt.TestTypeID
      LEFT JOIN project_samples    ps ON ps.SampleID   = pt.SampleID
      LEFT JOIN project_boreholes  pb ON pb.BoreholeID = ps.BoreholeID
      ORDER BY pt.TestID DESC
      LIMIT 500
    `;
    db.query(sql, (err, rows) => {
      if (err) {
        console.error("GET /api/test-management/tests error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      const items = (rows || []).map((r) => ({
        TestID: r.TestID,
        RequestID: r.RequestID,
        RequestedTest: r.RequestedTest ?? "—",
        BoreholeDepth: r.BoreholeDepth ?? "—",
        SampleID: r.SampleID ?? null,
        SampleStatus: r.SampleStatus ?? null,
        DisplayStatus: r.DisplayStatus ?? null,
        AssignedTester: r.AssignedTester ?? null,
        AssignedResultDueDate: r.AssignedResultDueDate ?? null,
        AssignedReportDueDate: r.AssignedReportDueDate ?? null,
      }));
      res.json({ items });
    });
  });

  return router;
};
