// routes/assignments.js
const express = require("express");

module.exports = (db) => {
  const router = express.Router();

  // ---------- helpers ----------
  const toUiRow = (r) => ({
    RequestID: r.RequestID,
    EfisProjectId: r.EfisProjectId ?? null,
    CreatedBy: r.CreatedBy ?? r.RequestingUser ?? null,
    Status: r.RequestStatus ?? r.TestStatus ?? null,

    TestID: r.TestID ?? null,
    TestName: r.TestName ?? "—",
    SampleId: r.SampleID ?? null,
    SubmissionDate: r.RequestSubmissionDate ?? null,
    DueDate: r.RequestedDueDate ?? null,

    AssignedTester: r.AssignedTester ?? null,
    AssignedResultDueDate: r.ResultDueDate ?? null,
    AssignedReportDueDate: r.ReportDueDate ?? null,
    Notes: r.AssignmentNotes ?? r.Notes ?? null,

    SampleDisplay:
      (r.BoreholeNumber
        ? `${r.BoreholeNumber} (${r.DepthFrom ?? ""}–${r.DepthTo ?? ""})`
        : r.LegacyBH
        ? `${r.LegacyBH} (${r.DepthFrom ?? ""}–${r.DepthTo ?? ""})`
        : null) ?? "—",
  });

  function sendEmpty(res, requestId, efis = "—") {
    return res.json({
      header: {
        RequestID: requestId,
        EfisProjectId: efis,
        CreatedBy: "—",
        Status: "—",
        // NEW: counts present even when empty
        TotalTests: 0,
        AssignedCount: 0,
        SubmittedCount: 0,
      },
      items: [],
    });
  }

  // ---------- main: GET /api/assignments/:requestId ----------
  router.get("/assignments/:requestId", (req, res) => {
    const requestId = Number(req.params.requestId);
    if (!Number.isInteger(requestId))
      return res.status(400).json({ error: "Invalid request id" });

    const sqlNew = `
      SELECT
        pr.RequestID,
        pr.Status                                  AS RequestStatus,
        DATE(pr.RequestDate)                       AS RequestSubmissionDate,
        p.EfisProjectId,
        pr.RequestingUser                          AS CreatedBy,

        pt.TestID,
        pt.Status                                  AS TestStatus,
        DATE(pt.RequestedDate)                     AS RequestedDueDate,
        pt.AssignedTester,
        DATE(pt.ResultDueDate)                     AS ResultDueDate,
        DATE(pt.ReportDueDate)                     AS ReportDueDate,
        pt.AssignmentNotes,
        pt.Notes,
        pt.SampleID,

        tt.TestName,

        ps.DepthFrom, ps.DepthTo,
        pb.BoreholeNumber
      FROM project_requests pr
      LEFT JOIN project           p  ON p.ProjectID   = pr.ProjectID
      LEFT JOIN project_tests     pt ON pt.RequestID  = pr.RequestID
      LEFT JOIN test_type         tt ON tt.TestTypeID = pt.TestTypeID
      LEFT JOIN project_samples   ps ON ps.SampleID   = pt.SampleID
      LEFT JOIN project_boreholes pb ON pb.BoreholeID = ps.BoreholeID
      WHERE pr.RequestID = ?
      ORDER BY pt.TestID ASC
    `;

    db.query(sqlNew, [requestId], (err, rowsNew) => {
      if (err) {
        console.error("assignments/new error:", err);
        return res.status(500).json({ error: "Server error" });
      }

      if (rowsNew && rowsNew.length > 0) {
        const efis = rowsNew[0].EfisProjectId ?? "—";

        // --- NEW: compute counts on the fly from current rows ---
        const testRows = rowsNew.filter((r) => r.TestID != null);

        const TotalTests = testRows.length;
        const AssignedCount = testRows.reduce(
          (n, r) => n + (r.AssignedTester && String(r.AssignedTester).trim() !== "" ? 1 : 0),
          0
        );
        // If your "submitted" state is stored in pt.Status == 'Submitted'
        const SubmittedCount = testRows.reduce(
          (n, r) => n + (r.TestStatus === "Submitted" ? 1 : 0),
          0
        );

        const header = {
          RequestID: rowsNew[0].RequestID,
          EfisProjectId: efis,
          CreatedBy: rowsNew[0].CreatedBy ?? "—",
          Status: rowsNew[0].RequestStatus ?? "—",
          // NEW: expose counts to the UI
          TotalTests,
          AssignedCount,
          SubmittedCount,
        };

        const items = testRows.map(toUiRow);

        return res.json({ header, items });
      }

      // -------- Legacy fallback --------
      const sqlLegacy = `
        SELECT
          tr.RequestID,
          DATE(tr.DateOfRequest)                    AS RequestSubmissionDate,
          DATE(tr.TestResultsDueDate)               AS RequestedDueDate,
          tr.ProjectID                              AS EfisProjectId,
          tr.RequesterName                          AS CreatedBy,
          tr.Status                                 AS RequestStatus,

          trd.DetailID                              AS TestID,
          trd.SampleNumber                          AS SampleID,
          trd.DepthFrom, trd.DepthTo,
          trd.BoreholeID                            AS LegacyBH,
          tt.TestName
        FROM test_request tr
        JOIN test_request_details trd ON trd.RequestID = tr.RequestID
        LEFT JOIN test_type tt         ON tt.TestTypeID = trd.TestTypeID
        LEFT JOIN project_boreholes pb ON pb.BoreholeNumber = trd.BoreholeID
        WHERE tr.RequestID = ?
        ORDER BY trd.DetailID ASC
      `;

      db.query(sqlLegacy, [requestId], (err2, rowsOld) => {
        if (err2) {
          console.error("assignments/legacy error:", err2);
          return res.status(500).json({ error: "Server error" });
        }
        if (!rowsOld || rowsOld.length === 0) {
          return sendEmpty(res, requestId, "—");
        }

        const header = {
          RequestID: rowsOld[0].RequestID,
          EfisProjectId: rowsOld[0].EfisProjectId ?? "—",
          CreatedBy: rowsOld[0].CreatedBy ?? "—",
          Status: rowsOld[0].RequestStatus ?? "—",
          // NEW: legacy sets have no tester/status rows -> counts 0
          TotalTests: rowsOld.length,
          AssignedCount: 0,
          SubmittedCount: 0,
        };
        const items = rowsOld.map(toUiRow);
        return res.json({ header, items });
      });
    });
  });

  // ---------- counts-only convenience: GET /api/assignments/:requestId/counts ----------
  // Returns { requestId, total, assigned, submitted }
  router.get("/assignments/:requestId/counts", (req, res) => {
    const requestId = Number(req.params.requestId);
    if (!Number.isInteger(requestId))
      return res.status(400).json({ error: "Invalid request id" });

    const sql = `
      SELECT
        COUNT(pt.TestID) AS total,
        SUM(CASE WHEN pt.AssignedTester IS NOT NULL AND TRIM(pt.AssignedTester) <> '' THEN 1 ELSE 0 END) AS assigned,
        SUM(CASE WHEN pt.Status = 'Submitted' THEN 1 ELSE 0 END) AS submitted
      FROM project_tests pt
      WHERE pt.RequestID = ?
    `;
    db.query(sql, [requestId], (err, rows) => {
      if (err) {
        console.error("GET /assignments/:requestId/counts error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      const total = Number(rows?.[0]?.total || 0);
      const assigned = Number(rows?.[0]?.assigned || 0);
      const submitted = Number(rows?.[0]?.submitted || 0);
      res.json({ requestId, total, assigned, submitted });
    });
  });

  // ---------- quick diagnostics ----------
  router.get("/assignments/:requestId/debug", (req, res) => {
    const requestId = Number(req.params.requestId);
    if (!Number.isInteger(requestId))
      return res.status(400).json({ error: "Invalid request id" });

    const q = {
      new_request: "SELECT COUNT(*) c FROM project_requests WHERE RequestID=?",
      new_tests: "SELECT COUNT(*) c FROM project_tests WHERE RequestID=?",
      legacy_request: "SELECT COUNT(*) c FROM test_request WHERE RequestID=?",
      legacy_details:
        "SELECT COUNT(*) c FROM test_request_details WHERE RequestID=?",
    };

    db.query(q.new_request, [requestId], (e1, r1) => {
      if (e1) return res.status(500).json({ error: e1.message });
      db.query(q.new_tests, [requestId], (e2, r2) => {
        if (e2) return res.status(500).json({ error: e2.message });
        db.query(q.legacy_request, [requestId], (e3, r3) => {
          if (e3) return res.status(500).json({ error: e3.message });
          db.query(q.legacy_details, [requestId], (e4, r4) => {
            if (e4) return res.status(500).json({ error: e4.message });
            res.json({
              project_requests: r1?.[0]?.c || 0,
              project_tests: r2?.[0]?.c || 0,
              legacy_test_request: r3?.[0]?.c || 0,
              legacy_test_request_details: r4?.[0]?.c || 0,
            });
          });
        });
      });
    });
  });

  // ---------- testers list ----------
  router.get("/testers", (_req, res) => {
    const sql = `
      SELECT UserName
      FROM users
      WHERE UserType = 'Tester'
      ORDER BY UserName
    `;
    db.query(sql, (err, rows) => {
      if (err) {
        console.error("GET /testers error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      const items = rows.map((r) => r.UserName);
      res.json({ items });
    });
  });

  // ---------- assign ----------
  router.post("/assignments/:testId/assign", (req, res) => {
    const testId = Number(req.params.testId);
    if (!Number.isInteger(testId))
      return res.status(400).json({ error: "Invalid test id" });

    const { assignedTester, resultDueDate, reportDueDate, notes } = req.body || {};
    const sets = [];
    const params = [];

    if (assignedTester !== undefined) {
      sets.push("AssignedTester = ?");
      params.push(assignedTester || null);
    }
    if (resultDueDate !== undefined) {
      sets.push("ResultDueDate = ?");
      params.push(resultDueDate || null);
    }
    if (reportDueDate !== undefined) {
      sets.push("ReportDueDate = ?");
      params.push(reportDueDate || null);
    }
    if (notes !== undefined) {
      sets.push("AssignmentNotes = ?");
      params.push(notes || null);
    }

    if (sets.length === 0) return res.status(400).json({ error: "No fields to update" });

    // always move test to In Progress unless already Completed
    sets.push("Status = IF(Status='Completed','Completed','In Progress')");
    sets.push("UpdatedAt = CURRENT_TIMESTAMP");

    const sqlUpdateTest = `UPDATE project_tests SET ${sets.join(", ")} WHERE TestID = ?`;
    const paramsTest = [...params, testId];

    db.query(sqlUpdateTest, paramsTest, (err, result) => {
      if (err) {
        console.error("POST /assignments/:testId/assign error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Test not found" });
      }

      // 1) Identify the parent RequestID for this TestID
      const sqlGetReq = `SELECT RequestID FROM project_tests WHERE TestID = ?`;
      db.query(sqlGetReq, [testId], (e0, r0) => {
        if (e0) {
          console.error("assign: get RequestID error:", e0);
          return res.json({ ok: true, TestID: testId, requestStatusUpdated: false });
        }
        const requestId = r0?.[0]?.RequestID;
        if (!requestId) {
          return res.json({ ok: true, TestID: testId, requestStatusUpdated: false });
        }

        // 2) Count total tests vs assigned tests for that RequestID
        const sqlCounts = `
          SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN AssignedTester IS NOT NULL AND AssignedTester <> '' THEN 1 ELSE 0 END) AS assigned
          FROM project_tests
          WHERE RequestID = ?
        `;
        db.query(sqlCounts, [requestId], (e1, r1) => {
          if (e1) {
            console.error("assign: count tests error:", e1);
            return res.json({ ok: true, TestID: testId, requestStatusUpdated: false });
          }

          const total = Number(r1?.[0]?.total || 0);
          const assigned = Number(r1?.[0]?.assigned || 0);
          const allAssigned = total > 0 && assigned === total;

          if (!allAssigned) {
            // Do not update the request status unless ALL tests are assigned
            return res.json({
              ok: true,
              TestID: testId,
              requestStatusUpdated: false,
              totals: { total, assigned }
            });
          }

          // 3) All tests assigned -> set parent request to 'Assigned'
          const sqlSetRequest = `
            UPDATE project_requests
            SET Status = 'Assigned'
            WHERE RequestID = ? AND Status <> 'Assigned'
          `;
          db.query(sqlSetRequest, [requestId], (e2, r2) => {
            if (e2) {
              console.error("assign: set request Assigned error:", e2);
              return res.json({
                ok: true,
                TestID: testId,
                requestStatusUpdated: false,
                totals: { total, assigned }
              });
            }
            res.json({
              ok: true,
              TestID: testId,
              requestStatusUpdated: r2.affectedRows > 0,
              totals: { total, assigned }
            });
          });
        });
      });
    });
  });

  // ---------- summary ----------
  router.get("/assignments/:requestId/summary", (req, res) => {
    const requestId = Number(req.params.requestId);
    if (!Number.isInteger(requestId)) {
      return res.status(400).json({ error: "Invalid request id" });
    }

    const sqlNew = `
      SELECT
        pr.RequestID,
        DATE(pr.RequestDate)       AS RequestSubmissionDate,
        DATE(pt.RequestedDate)     AS RequestedDueDate,
        tt.TestName                AS RequestedTest,
        CONCAT(pb.BoreholeNumber, ' (', ps.DepthFrom, '–', ps.DepthTo, ')') AS BoreholeDepth,
        pt.TestID,
        pt.AssignedTester,
        DATE(pt.ResultDueDate)     AS AssignedResultDueDate,
        DATE(pt.ReportDueDate)     AS AssignedReportDueDate,
        pt.AssignmentNotes         AS Notes
      FROM project_requests pr
      LEFT JOIN project_tests     pt ON pt.RequestID  = pr.RequestID
      LEFT JOIN test_type         tt ON tt.TestTypeID = pt.TestTypeID
      LEFT JOIN project_samples   ps ON ps.SampleID   = pt.SampleID
      LEFT JOIN project_boreholes pb ON pb.BoreholeID = ps.BoreholeID
      WHERE pr.RequestID = ?
      ORDER BY pt.TestID ASC
    `;

    db.query(sqlNew, [requestId], (err, rowsNew) => {
      if (err) return res.status(500).json({ error: "Server error" });

      if (rowsNew && rowsNew.length > 0) {
        const items = rowsNew.map(r => ({
          TestID: r.TestID,
          RequestedTest: r.RequestedTest ?? "—",
          BoreholeDepth: r.BoreholeDepth ?? "—",
          RequestSubmissionDate: r.RequestSubmissionDate ?? "—",
          RequestedDueDate: r.RequestedDueDate ?? "—",
          AssignedTester: r.AssignedTester ?? null,
          AssignedResultDueDate: r.AssignedResultDueDate ?? null,
          AssignedReportDueDate: r.AssignedReportDueDate ?? null,
          Notes: r.Notes ?? null,
        }));
        return res.json({ requestId, items });
      }

      const sqlLegacy = `
        SELECT
          tr.RequestID,
          DATE(tr.DateOfRequest)      AS RequestSubmissionDate,
          DATE(tr.TestResultsDueDate) AS RequestedDueDate,
          tt.TestName                 AS RequestedTest,
          CONCAT(trd.BoreholeID, ' (', trd.DepthFrom, '–', trd.DepthTo, ')') AS BoreholeDepth,
          trd.DetailID                AS TestID
        FROM test_request tr
        JOIN test_request_details trd ON trd.RequestID = tr.RequestID
        LEFT JOIN test_type tt         ON tt.TestTypeID = trd.TestTypeID
        WHERE tr.RequestID = ?
        ORDER BY trd.DetailID ASC
      `;

      db.query(sqlLegacy, [requestId], (err2, rowsOld) => {
        if (err2) return res.status(500).json({ error: "Server error" });

        const items = (rowsOld || []).map(r => ({
          TestID: r.TestID,
          RequestedTest: r.RequestedTest ?? "—",
          BoreholeDepth: r.BoreholeDepth ?? "—",
          RequestSubmissionDate: r.RequestSubmissionDate ?? "—",
          RequestedDueDate: r.RequestedDueDate ?? "—",
          AssignedTester: null,
          AssignedResultDueDate: null,
          AssignedReportDueDate: null,
          Notes: null,
        }));

        return res.json({ requestId, items });
      });
    });
  });

  return router;
};
