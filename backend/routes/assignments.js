// routes/assignments.js
const express = require("express");

/* --------------------- UTIL: normalize for robust diffs --------------------- */
const normStr = (v) => (v == null ? null : String(v).trim());
const normDate = (v) => {
  if (!v) return null;
  // Accept "YYYY-MM-DD" or ISO, return "YYYY-MM-DD"
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(+d)) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Build a shallow diff across fields we care about, with normalization
function buildDiff(before, after) {
  const fields = [
    "AssignedTester",
    "ResultDueDate",
    "ReportDueDate",
    "AssignmentNotes",
    "Status",
  ];
  const diff = {};
  fields.forEach((k) => {
    let from = before?.[k] ?? null;
    let to = after?.[k] ?? null;

    // normalize per field type
    if (k === "ResultDueDate" || k === "ReportDueDate") {
      from = normDate(from);
      to = normDate(to);
    } else {
      from = normStr(from);
      to = normStr(to);
    }
    if ((from ?? "") !== (to ?? "")) {
      diff[k] = { from, to };
    }
  });
  return diff;
}

/* --------------------- resolve current user from request -------------------- */
function resolveUser(db, req) {
  return new Promise((resolve) => {
    // Prefer session (set by /api/login)
    if (req.session?.userId && req.session?.userName) {
      return resolve({
        UserID: req.session.userId,
        UserName: req.session.userName,
      });
    }
    // Optional: if you've attached req.user upstream, honor it
    if (req.user?.UserID && req.user?.UserName) {
      return resolve({ UserID: req.user.UserID, UserName: req.user.UserName });
    }
    // Dev/alternate fallback via headers
    const hId = req.headers["x-user-id"];
    const hName = req.headers["x-user-name"];
    if (hId && hName) {
      return resolve({ UserID: Number(hId) || 0, UserName: String(hName) });
    }
    resolve(null);
  });
}

/* -------------- ensure assignment_history table exists on init -------------- */
function ensureHistoryTable(db) {
  const ddl = `
    CREATE TABLE IF NOT EXISTS assignment_history (
      HistoryID INT UNSIGNED NOT NULL AUTO_INCREMENT,
      TestID INT UNSIGNED NOT NULL,
      ChangedByUserID MEDIUMINT UNSIGNED NOT NULL,
      ChangedByUserName VARCHAR(50) NOT NULL,
      ChangedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      Changes JSON NOT NULL,
      PRIMARY KEY (HistoryID),
      KEY idx_hist_test (TestID),
      KEY idx_hist_user (ChangedByUserID)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  db.query(ddl, (e) => {
    if (e) console.error("[assignment_history] DDL error:", e.message);
  });
}

module.exports = (db) => {
  const router = express.Router();
  ensureHistoryTable(db); // <-- make sure table exists

  /* ------------------------------- helpers ------------------------------- */
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
        TotalTests: 0,
        AssignedCount: 0,
        SubmittedCount: 0,
      },
      items: [],
    });
  }

  /* ---------------- GET /api/assignments/:requestId ---------------- */
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
      LEFT JOIN project_samples   ps ON ps.RequestID  = pr.RequestID
      LEFT JOIN project_tests     pt ON pt.SampleID   = ps.SampleID
      LEFT JOIN test_type         tt ON tt.TestTypeID = pt.TestTypeID
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
        const testRows = rowsNew.filter((r) => r.TestID != null);

        const TotalTests = testRows.length;
        const AssignedCount = testRows.reduce(
          (n, r) =>
            n +
            (r.AssignedTester && String(r.AssignedTester).trim() !== ""
              ? 1
              : 0),
          0,
        );
        const SubmittedCount = testRows.reduce(
          (n, r) => n + (r.TestStatus === "Submitted" ? 1 : 0),
          0,
        );

        const header = {
          RequestID: rowsNew[0].RequestID,
          EfisProjectId: efis,
          CreatedBy: rowsNew[0].CreatedBy ?? "—",
          Status: rowsNew[0].RequestStatus ?? "—",
          TotalTests,
          AssignedCount,
          SubmittedCount,
        };

        const items = testRows.map(toUiRow);
        return res.json({ header, items });
      }

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
          TotalTests: rowsOld.length,
          AssignedCount: 0,
          SubmittedCount: 0,
        };
        const items = rowsOld.map(toUiRow);
        return res.json({ header, items });
      });
    });
  });

  /* ------------- counts/debug/testers ------------- */
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
      JOIN project_samples ps ON ps.SampleID = pt.SampleID
      WHERE ps.RequestID = ?
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

  /* -------------------- POST /assignments/:testId/assign --------------------- */
  router.post("/assignments/:testId/assign", async (req, res) => {
    const testId = Number(req.params.testId);
    if (!Number.isInteger(testId))
      return res.status(400).json({ error: "Invalid test id" });

    const user = await resolveUser(db, req);
    if (!user) return res.status(401).json({ error: "Not authenticated." });

    const { assignedTester, resultDueDate, reportDueDate, notes } =
      req.body || {};

    // Fetch BEFORE state
    const sqlBefore = `
      SELECT TestID, AssignedTester, ResultDueDate, ReportDueDate, AssignmentNotes, Status
      FROM project_tests
      WHERE TestID = ?
      LIMIT 1
    `;
    db.query(sqlBefore, [testId], (e0, r0) => {
      if (e0) {
        console.error("assign SELECT before error:", e0);
        return res.status(500).json({ error: "Server error" });
      }
      if (!r0 || r0.length === 0)
        return res.status(404).json({ error: "Test not found" });

      const before = {
        AssignedTester: r0[0].AssignedTester ?? null,
        ResultDueDate: r0[0].ResultDueDate ?? null,
        ReportDueDate: r0[0].ReportDueDate ?? null,
        AssignmentNotes: r0[0].AssignmentNotes ?? null,
        Status: r0[0].Status ?? null,
      };

      // Build AFTER state (apply provided values, keep others)
      const after = {
        AssignedTester:
          assignedTester !== undefined
            ? normStr(assignedTester)
            : before.AssignedTester,
        ResultDueDate:
          resultDueDate !== undefined
            ? normDate(resultDueDate)
            : normDate(before.ResultDueDate),
        ReportDueDate:
          reportDueDate !== undefined
            ? normDate(reportDueDate)
            : normDate(before.ReportDueDate),
        AssignmentNotes:
          notes !== undefined ? normStr(notes) : before.AssignmentNotes,
        Status: before.Status || "Requested",
      };

      // Auto-progress status if we changed anything (unless already Completed)
      if (after.Status !== "Completed") {
        if (
          assignedTester !== undefined ||
          resultDueDate !== undefined ||
          reportDueDate !== undefined ||
          notes !== undefined
        ) {
          after.Status = "In Progress";
        }
      }

      const changes = buildDiff(before, after);
      const hasChanges = Object.keys(changes).length > 0;

      if (!hasChanges) {
        // No real change -> do not insert history
        return res.json({ ok: true, updated: 0, noChange: true });
      }

      // UPDATE record (also stamp UpdatedBy)
      const sets = [
        "AssignedTester = ?",
        "ResultDueDate = ?",
        "ReportDueDate = ?",
        "AssignmentNotes = ?",
        "Status = ?",
        "UpdatedBy = ?",
        "UpdatedAt = CURRENT_TIMESTAMP",
      ];
      const params = [
        after.AssignedTester,
        after.ResultDueDate,
        after.ReportDueDate,
        after.AssignmentNotes,
        after.Status,
        user.UserName,
      ];

      const sqlUpdate = `UPDATE project_tests SET ${sets.join(
        ", ",
      )} WHERE TestID = ?`;
      db.query(sqlUpdate, [...params, testId], (e1, r1) => {
        if (e1) {
          console.error("POST /assignments/:testId/assign UPDATE error:", e1);
          return res.status(500).json({ error: "Server error" });
        }
        if (r1.affectedRows === 0) {
          return res.status(404).json({ error: "Test not found" });
        }

        // INSERT history
        const sqlHist = `
          INSERT INTO assignment_history
            (TestID, ChangedByUserID, ChangedByUserName, ChangedAt, Changes)
          VALUES (?, ?, ?, NOW(), ?)
        `;
        db.query(
          sqlHist,
          [testId, user.UserID, user.UserName, JSON.stringify(changes)],
          (e2) => {
            if (e2) {
              console.error("assign INSERT history error:", e2);
              // keep going; logging failure shouldn't fail the main response
            }

            // Set parent request to Assigned if all tests assigned
            const sqlGetReq = `SELECT RequestID FROM project_tests WHERE TestID = ?`;
            db.query(sqlGetReq, [testId], (e3, r3) => {
              if (e3) {
                console.error("assign: get RequestID error:", e3);
                return res.json({
                  ok: true,
                  TestID: testId,
                  requestStatusUpdated: false,
                });
              }
              const requestId = r3?.[0]?.RequestID;
              if (!requestId) {
                return res.json({
                  ok: true,
                  TestID: testId,
                  requestStatusUpdated: false,
                });
              }

              const sqlCounts = `
                SELECT COUNT(*) AS total,
                       SUM(CASE WHEN AssignedTester IS NOT NULL AND TRIM(AssignedTester) <> '' THEN 1 ELSE 0 END) AS assigned
                FROM project_tests
                WHERE RequestID = ?
              `;
              db.query(sqlCounts, [requestId], (e4, r4) => {
                if (e4) {
                  console.error("assign: count tests error:", e4);
                  return res.json({
                    ok: true,
                    TestID: testId,
                    requestStatusUpdated: false,
                  });
                }

                const total = Number(r4?.[0]?.total || 0);
                const assigned = Number(r4?.[0]?.assigned || 0);
                const allAssigned = total > 0 && assigned === total;

                if (!allAssigned) {
                  return res.json({
                    ok: true,
                    TestID: testId,
                    requestStatusUpdated: false,
                    totals: { total, assigned },
                  });
                }

                const sqlSetRequest = `
                  UPDATE project_requests
                  SET Status = 'Assigned'
                  WHERE RequestID = ? AND Status <> 'Assigned'
                `;
                db.query(sqlSetRequest, [requestId], (e5, r5) => {
                  if (e5) {
                    console.error("assign: set request Assigned error:", e5);
                    return res.json({
                      ok: true,
                      TestID: testId,
                      requestStatusUpdated: false,
                      totals: { total, assigned },
                    });
                  }
                  res.json({
                    ok: true,
                    TestID: testId,
                    requestStatusUpdated: r5.affectedRows > 0,
                    totals: { total, assigned },
                  });
                });
              });
            });
          },
        );
      });
    });
  });

  /* ---------------------- summary ---------------------- */
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
        pb.BoreholeNumber          AS BoreholeNumber,
        ps.SampleID                AS SampleID,
        ps.SampleNumber            AS SampleNumber,
        ps.DepthFrom               AS DepthFrom,
        ps.DepthTo                 AS DepthTo,
        CONCAT(pb.BoreholeNumber, ' (', ps.DepthFrom, '–', ps.DepthTo, ')') AS BoreholeDepth,
        pt.TestID,
        COALESCE(pt.TestStatus, pt.Status)         AS TestStatus,
        pt.AssignedTester,
        DATE(pt.ResultDueDate)     AS AssignedResultDueDate,
        DATE(pt.ReportDueDate)     AS AssignedReportDueDate,
        pt.AssignmentNotes         AS Notes
      FROM project_requests pr
      LEFT JOIN project_samples   ps ON ps.RequestID  = pr.RequestID
      LEFT JOIN project_tests     pt ON pt.SampleID   = ps.SampleID
      LEFT JOIN test_type         tt ON tt.TestTypeID = pt.TestTypeID
      LEFT JOIN project_boreholes pb ON pb.BoreholeID = ps.BoreholeID
      WHERE pr.RequestID = ?
      ORDER BY pt.TestID ASC
    `;

    db.query(sqlNew, [requestId], (err, rowsNew) => {
      if (err) return res.status(500).json({ error: "Server error" });

      if (rowsNew && rowsNew.length > 0) {
        const items = rowsNew.map((r) => ({
          TestID: r.TestID,
          RequestedTest: r.RequestedTest ?? "—",
          BoreholeNumber: r.BoreholeNumber ?? null,
          SampleID: r.SampleID ?? null,
          SampleNumber: r.SampleNumber ?? null,
          DepthFrom: r.DepthFrom ?? null,
          DepthTo: r.DepthTo ?? null,
          BoreholeDepth: r.BoreholeDepth ?? "—",
          RequestSubmissionDate: r.RequestSubmissionDate ?? "—",
          RequestedDueDate: r.RequestedDueDate ?? "—",
          TestStatus: r.TestStatus ?? null,
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
          trd.BoreholeID              AS BoreholeNumber,
          trd.SampleNumber            AS SampleNumber,
          trd.DepthFrom               AS DepthFrom,
          trd.DepthTo                 AS DepthTo,
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

        const items = (rowsOld || []).map((r) => ({
          TestID: r.TestID,
          RequestedTest: r.RequestedTest ?? "—",
          BoreholeNumber: r.BoreholeNumber ?? null,
          SampleID: null,
          SampleNumber: r.SampleNumber ?? null,
          DepthFrom: r.DepthFrom ?? null,
          DepthTo: r.DepthTo ?? null,
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

  /* ------------------- GET /assignments/:testId/history ------------------ */
  router.get("/assignments/:testId/history", (req, res) => {
    const testId = Number(req.params.testId);
    if (!Number.isInteger(testId)) {
      return res.status(400).json({ error: "Invalid test id" });
    }
    const sql = `
      SELECT HistoryID, TestID, ChangedByUserID, ChangedByUserName, ChangedAt, Changes
      FROM assignment_history
      WHERE TestID = ?
      ORDER BY ChangedAt DESC, HistoryID DESC
    `;
    db.query(sql, [testId], (err, rows) => {
      if (err) {
        console.error("GET /assignments/:testId/history error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      const items = (rows || []).map((r) => ({
        HistoryID: r.HistoryID,
        TestID: r.TestID,
        ChangedBy: r.ChangedByUserName,
        ChangedAt: r.ChangedAt,
        Changes:
          typeof r.Changes === "string" ? safeParseJSON(r.Changes) : r.Changes,
      }));
      return res.json({ items });
    });
  });

  function safeParseJSON(s) {
    try {
      return JSON.parse(s);
    } catch {
      return {};
    }
  }

  return router;
};
