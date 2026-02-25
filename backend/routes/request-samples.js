const express = require("express");

module.exports = function requestSamplesRouter(models) {
  const router = express.Router();
  const { Project, ProjectRequests, ProjectSamples, ProjectTests, TestType } =
    models;

  const mapUiStatusToDb = (s) => {
    if (s == null) return null;
    const v = String(s).trim();
    if (!v) return "Requested";
    if (v === "Accepted") return "Completed";
    if (v === "Rejected" || v === "Not Received") return "Cancelled";
    return v;
  };

  const mapDbStatusToUi = (s) => {
    if (s == null) return null;
    const v = String(s).trim();
    if (!v) return null;
    if (v === "Completed") return "Accepted";
    if (v === "Cancelled") return "Not Received";
    if (v === "Requested") return null;
    return v;
  };

  // ------------------------------------------
  // GET /api/supervisor/request-samples
  // ------------------------------------------
  router.get("/request-samples", async (_req, res) => {
    try {
      const samples = await ProjectSamples.findAll({
        include: [
          {
            model: ProjectRequests,
            as: "request",
            attributes: ["RequestingUser", "ProjectID"],
            required: true,
            include: [
              {
                model: Project,
                as: "project",
                attributes: ["EfisProjectId"],
                required: true,
              },
            ],
          },
          {
            model: ProjectTests,
            as: "tests",
            attributes: [
              "TestID",
              "Status",
              "RequestedDate",
              "CompletedDate",
              "TestTypeID",
            ],
            required: false,
            include: [
              {
                model: TestType,
                as: "testType",
                attributes: ["TestName"],
                required: false,
              },
            ],
          },
        ],
        order: [["SampleID", "DESC"]],
      });

      // Flatten the results - one row per test
      const rows = [];
      for (const ps of samples) {
        const baseRow = {
          SampleID: ps.SampleID,
          SampleNumber: ps.SampleNumber,
          RequestID: ps.RequestID,
          Status: ps.SampleStatus,
          BoreholeID: ps.BoreholeID,
          DepthFrom: ps.DepthFrom,
          DepthTo: ps.DepthTo,
          ContainerType: ps.ContainerType,
          FieldCollectionDate: ps.FieldCollectionDate,
          EfisProjectID: ps.request?.project?.EfisProjectId || null,
          CreatedBy: ps.request?.RequestingUser || null,
        };

        if (ps.tests && ps.tests.length > 0) {
          for (const pt of ps.tests) {
            rows.push({
              ...baseRow,
              TestName: pt.testType?.TestName || null,
              TestID: pt.TestID,
              TestStatus: mapDbStatusToUi(pt.Status),
              RequestedDate: pt.RequestedDate,
              CompletedDate: pt.CompletedDate,
            });
          }
        } else {
          rows.push({
            ...baseRow,
            TestName: null,
            TestID: null,
            TestStatus: null,
            RequestedDate: null,
            CompletedDate: null,
          });
        }
      }

      console.log(
        `[REQ] GET /api/supervisor/request-samples → ${rows.length} rows`,
      );
      res.json(rows);
    } catch (err) {
      console.error("[ERR] GET /api/supervisor/request-samples:", err.message);
      return res.status(500).json({ error: "Failed to fetch samples." });
    }
  });

  // ------------------------------------------
  // POST /api/supervisor/request-samples/update-tests
  // ------------------------------------------
  router.post("/request-samples/update-tests", async (req, res) => {
    const { updates } = req.body || {};
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: "No updates provided." });
    }

    for (const u of updates) {
      if (!u || u.TestID == null) {
        return res
          .status(400)
          .json({ error: "Each update must include TestID." });
      }
    }

    try {
      const results = [];
      for (const u of updates) {
        const dbStatus = mapUiStatusToDb(u.TestStatus);
        const [affectedRows] = await ProjectTests.update(
          { Status: dbStatus },
          { where: { TestID: u.TestID } },
        );

        console.log(
          `[UPD] project_tests TestID=${u.TestID} ui=${String(u.TestStatus)} db=${String(dbStatus)} affectedRows=${affectedRows}`,
        );

        const row = await ProjectTests.findByPk(u.TestID, {
          attributes: ["TestID", "Status"],
        });

        results.push({ affectedRows, row: row ? row.toJSON() : null });
      }

      res.json({ ok: true, count: updates.length, results });
    } catch (err) {
      console.error(
        "[ERR] POST /api/supervisor/request-samples/update-tests:",
        err.message,
      );
      res.status(500).json({ error: "Failed to save updates." });
    }
  });

  return router;
};
