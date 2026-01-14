const express = require("express");

module.exports = function requestSamplesRouter(db) {
  const router = express.Router();

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
  // Return DateAssigned as YYYY-MM-DD for stable UI display
  // ------------------------------------------
  router.get("/request-samples", (_req, res) => {
    const sql = `
      SELECT
        ps.SampleID,
        ps.SampleNumber,
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
        pt.Status AS TestStatus,
        pt.RequestedDate,
        pt.CompletedDate
      FROM project_samples AS ps
      JOIN project_requests AS pr
        ON pr.RequestID = ps.RequestID
      JOIN project AS p
        ON p.ProjectID = pr.ProjectID
      LEFT JOIN project_tests AS pt
        ON pt.SampleID = ps.SampleID
      LEFT JOIN test_type AS tt
        ON tt.TestTypeID = pt.TestTypeID
      ORDER BY ps.SampleID DESC, pt.TestID ASC;
    `;

    db.query(sql, (err, rows) => {
      if (err) {
        console.error(
          "[ERR] GET /api/supervisor/request-samples:",
          err.message
        );
        return res.status(500).json({ error: "Failed to fetch samples." });
      }
      console.log(
        `[REQ] GET /api/supervisor/request-samples → ${rows.length} rows`
      );
      const out = (rows || []).map((r) => ({
        ...r,
        TestStatus: mapDbStatusToUi(r.TestStatus),
      }));
      res.json(out);
    });
  });

  // ------------------------------------------
  // POST /api/supervisor/request-samples/update-tests
  // Body: { updates: [{ TestID, TestStatus|null, NumberOfSpecimen|null, DateAssigned|null('YYYY-MM-DD') }, ...] }
  // Saves to project_tests
  // ------------------------------------------
  router.post("/request-samples/update-tests", (req, res) => {
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
      // project_tests schema stores status in pt.Status
    }

    const sql = `
      UPDATE project_tests
      SET
        Status = ?
      WHERE TestID = ?;
    `;

    const sqlReadBack = `
      SELECT TestID, Status
      FROM project_tests
      WHERE TestID = ?
      LIMIT 1;
    `;

    const runUpdate = (u) =>
      new Promise((resolve, reject) => {
        const dbStatus = mapUiStatusToDb(u.TestStatus);
        db.query(sql, [dbStatus, u.TestID], (err, result) => {
          if (err) return reject(err);
          const affected = result?.affectedRows ?? 0;
          console.log(
            `[UPD] project_tests TestID=${u.TestID} ui=${String(
              u.TestStatus
            )} db=${String(dbStatus)} affectedRows=${affected}`
          );
          db.query(sqlReadBack, [u.TestID], (err2, rows) => {
            if (err2) return reject(err2);
            const row = Array.isArray(rows) ? rows[0] : null;
            resolve({ affectedRows: affected, row });
          });
        });
      });

    (async () => {
      try {
        const results = [];
        for (const u of updates) results.push(await runUpdate(u));
        res.json({ ok: true, count: updates.length, results });
      } catch (e) {
        console.error(
          "[ERR] POST /api/supervisor/request-samples/update-tests:",
          e.message
        );
        res.status(500).json({ error: "Failed to save updates." });
      }
    })();
  });

  return router;
};
