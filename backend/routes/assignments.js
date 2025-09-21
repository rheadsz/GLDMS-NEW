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

    AssignedStaff: r.AssignedStaff ?? null,
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
        pt.AssignedStaff,
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
        const header = {
          RequestID: rowsNew[0].RequestID,
          EfisProjectId: efis,
          CreatedBy: rowsNew[0].CreatedBy ?? "—",
          Status: rowsNew[0].RequestStatus ?? "—",
        };

        const items = rowsNew
          .filter((r) => r.TestID != null)
          .map(toUiRow);

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
        };
        const items = rowsOld.map(toUiRow);
        return res.json({ header, items });
      });
    });
  });

  // ---------- quick diagnostics: GET /api/assignments/:requestId/debug ----------
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
    const sql = `SELECT UserID, UserName, Email FROM users ORDER BY UserName`;
    db.query(sql, (err, rows) => {
      if (err) {
        console.error("GET /testers error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      const testers = rows.map((u) => ({
        value: String(u.UserID),
        label: u.UserName,
        email: u.Email,
      }));
      res.json({ testers });
    });
  });

  // ---------- assign ----------
  router.post("/assignments/:testId/assign", (req, res) => {
    const testId = Number(req.params.testId);
    if (!Number.isInteger(testId))
      return res.status(400).json({ error: "Invalid test id" });

    const { assignedStaff, resultDueDate, reportDueDate, notes } = req.body || {};
    const sets = [];
    const params = [];

    if (assignedStaff !== undefined) {
      sets.push("AssignedStaff = ?");
      params.push(String(assignedStaff));
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

    sets.push("Status = IF(Status='Completed','Completed','In Progress')");
    sets.push("UpdatedAt = CURRENT_TIMESTAMP");

    const sql = `UPDATE project_tests SET ${sets.join(", ")} WHERE TestID = ?`;
    params.push(testId);

    db.query(sql, params, (err, result) => {
      if (err) {
        console.error("POST /assignments/:testId/assign error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Test not found" });
      }
      res.json({ ok: true, TestID: testId });
    });
  });

  // ---------- summary: GET /api/assignments/:requestId/summary ----------
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
        CONCAT(pb.BoreholeNumber, ' (', ps.DepthFrom, '–', ps.DepthTo, ')') AS BoreholeDepth
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
          RequestedTest: r.RequestedTest ?? "—",
          BoreholeDepth: r.BoreholeDepth ?? "—",
          RequestSubmissionDate: r.RequestSubmissionDate ?? "—",
          RequestedDueDate: r.RequestedDueDate ?? "—",
        }));
        return res.json({ requestId, items });
      }

      const sqlLegacy = `
        SELECT
          tr.RequestID,
          DATE(tr.DateOfRequest)      AS RequestSubmissionDate,
          DATE(tr.TestResultsDueDate) AS RequestedDueDate,
          tt.TestName                 AS RequestedTest,
          CONCAT(trd.BoreholeID, ' (', trd.DepthFrom, '–', trd.DepthTo, ')') AS BoreholeDepth
        FROM test_request tr
        JOIN test_request_details trd ON trd.RequestID = tr.RequestID
        LEFT JOIN test_type tt         ON tt.TestTypeID = trd.TestTypeID
        WHERE tr.RequestID = ?
        ORDER BY trd.DetailID ASC
      `;

      db.query(sqlLegacy, [requestId], (err2, rowsOld) => {
        if (err2) return res.status(500).json({ error: "Server error" });

        const items = (rowsOld || []).map(r => ({
          RequestedTest: r.RequestedTest ?? "—",
          BoreholeDepth: r.BoreholeDepth ?? "—",
          RequestSubmissionDate: r.RequestSubmissionDate ?? "—",
          RequestedDueDate: r.RequestedDueDate ?? "—",
        }));

        return res.json({ requestId, items });
      });
    });
  });

  return router;
};
