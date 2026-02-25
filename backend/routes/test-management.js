// routes/test-management.js
const express = require("express");

module.exports = (models) => {
  const router = express.Router();
  const {
    ProjectTests,
    ProjectRequests,
    TestType,
    ProjectSamples,
    ProjectBoreholes,
  } = models;

  // GET /api/test-management/tests
  // Returns fields similar to Assignments summary but for all tests
  router.get("/tests", async (_req, res) => {
    try {
      const tests = await ProjectTests.findAll({
        include: [
          {
            model: TestType,
            as: "testType",
            attributes: ["TestName"],
            required: false,
          },
          {
            model: ProjectSamples,
            as: "sample",
            attributes: ["SampleID", "SampleStatus", "DepthFrom", "DepthTo"],
            required: false,
            include: [
              {
                model: ProjectBoreholes,
                as: "borehole",
                attributes: ["BoreholeNumber"],
                required: false,
              },
            ],
          },
        ],
        order: [["TestID", "DESC"]],
        limit: 500,
      });

      const items = tests.map((pt) => ({
        TestID: pt.TestID,
        RequestID: pt.RequestID,
        RequestedTest: pt.testType?.TestName ?? "—",
        BoreholeDepth: pt.sample?.borehole?.BoreholeNumber
          ? `${pt.sample.borehole.BoreholeNumber} (${pt.sample?.DepthFrom ?? ""}–${pt.sample?.DepthTo ?? ""})`
          : "—",
        SampleID: pt.SampleID ?? null,
        SampleStatus: pt.sample?.SampleStatus ?? null,
        DisplayStatus:
          pt.TestStatus ?? pt.sample?.SampleStatus ?? pt.Status ?? null,
        AssignedTester: pt.AssignedTester ?? null,
        AssignedResultDueDate: pt.ResultDueDate ?? null,
        AssignedReportDueDate: pt.ReportDueDate ?? null,
      }));

      res.json({ items });
    } catch (err) {
      console.error("GET /api/test-management/tests error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  return router;
};
