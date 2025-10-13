// backend/routes/request-samples.js
const express = require("express");

module.exports = function requestSamplesRouter(db) {
  const router = express.Router();

  // ------------------------------------------
  // GET /api/supervisor/request-samples
  // Include TestID, TestStatus, NumberOfSpecimen so the UI can edit & submit
  // ------------------------------------------
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
        pt.TestID,
        pt.AssignedTester,
        pt.ResultDueDate,
        pt.TestStatus,
        pt.NumberOfSpecimen
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

  // ------------------------------------------
  // POST /api/supervisor/request-samples/update-tests
  // Body: { updates: [{ TestID, TestStatus (or null), NumberOfSpecimen (or null) }, ...] }
  // Saves to project_tests
  // ------------------------------------------
  router.post("/request-samples/update-tests", (req, res) => {
    const { updates } = req.body || {};
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: "No updates provided." });
    }

    // Validate payload a bit
    for (const u of updates) {
      if (!u || typeof u.TestID === "undefined" || u.TestID === null) {
        return res.status(400).json({ error: "Each update must include TestID." });
      }
      // Allow NULLs for both fields, enforce enum set on server side if needed.
    }

    const sql = `
      UPDATE project_tests
      SET TestStatus = ?, NumberOfSpecimen = ?
      WHERE TestID = ?;
    `;

    // Run sequentially to keep it simple & safe with MySQL connections
    const runUpdate = (u) =>
      new Promise((resolve, reject) => {
        db.query(
          sql,
          [u.TestStatus ?? null, typeof u.NumberOfSpecimen === "number" ? u.NumberOfSpecimen : null, u.TestID],
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
      });

    (async () => {
      try {
        for (const u of updates) {
          await runUpdate(u);
        }
        res.json({ ok: true, count: updates.length });
      } catch (e) {
        console.error("[ERR] POST /api/supervisor/request-samples/update-tests:", e.message);
        res.status(500).json({ error: "Failed to save updates." });
      }
    })();
  });

  return router;
};
