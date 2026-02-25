// routes/assignments.js
const express = require("express");
const { Op, QueryTypes } = require("sequelize");

/* --------------------- UTIL: Status mapping (same as request-samples.js) --------------------- */
const mapDbStatusToUi = (s) => {
  if (s == null) return null;
  const v = String(s).trim();
  if (!v) return null;
  if (v === "Completed") return "Accepted";
  if (v === "Cancelled") return "Rejected";
  if (v === "Requested") return null;
  return v;
};

/* --------------------- UTIL: normalize for robust diffs --------------------- */
const normStr = (v) => (v == null ? null : String(v).trim());
const normDate = (v) => {
  if (!v) return null;
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
function resolveUser(req) {
  if (req.session?.userId && req.session?.userName) {
    return { UserID: req.session.userId, UserName: req.session.userName };
  }
  if (req.user?.UserID && req.user?.UserName) {
    return { UserID: req.user.UserID, UserName: req.user.UserName };
  }
  const hId = req.headers["x-user-id"];
  const hName = req.headers["x-user-name"];
  if (hId && hName) {
    return { UserID: Number(hId) || 0, UserName: String(hName) };
  }
  return null;
}

/* -------------- ensure assignment_history table exists on init -------------- */
async function ensureHistoryTable(sequelize) {
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
  try {
    await sequelize.query(ddl);
  } catch (e) {
    console.error("[assignment_history] DDL error:", e.message);
  }
}

module.exports = (models) => {
  const router = express.Router();
  const {
    sequelize,
    Project,
    ProjectRequests,
    ProjectSamples,
    ProjectTests,
    ProjectBoreholes,
    TestType,
    Users,
  } = models;

  ensureHistoryTable(sequelize); // ensure table exists

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
  router.get("/assignments/:requestId", async (req, res) => {
    const requestId = Number(req.params.requestId);
    if (!Number.isInteger(requestId))
      return res.status(400).json({ error: "Invalid request id" });

    try {
      // Use raw query for complex join that matches the original SQL
      const sqlNew = `
        SELECT
          pr.RequestID,
          pr.Status AS RequestStatus,
          DATE(pr.RequestDate) AS RequestSubmissionDate,
          p.EfisProjectId,
          pr.RequestingUser AS CreatedBy,
          pt.TestID,
          pt.Status AS TestStatus,
          DATE(pt.RequestedDate) AS RequestedDueDate,
          pt.AssignedTester,
          DATE(pt.ResultDueDate) AS ResultDueDate,
          DATE(pt.ReportDueDate) AS ReportDueDate,
          pt.AssignmentNotes,
          pt.Notes,
          pt.SampleID,
          tt.TestName,
          ps.DepthFrom, ps.DepthTo,
          pb.BoreholeNumber
        FROM project_requests pr
        LEFT JOIN project p ON p.ProjectID = pr.ProjectID
        LEFT JOIN project_samples ps ON ps.RequestID = pr.RequestID
        LEFT JOIN project_tests pt ON pt.SampleID = ps.SampleID
        LEFT JOIN test_type tt ON tt.TestTypeID = pt.TestTypeID
        LEFT JOIN project_boreholes pb ON pb.BoreholeID = ps.BoreholeID
        WHERE pr.RequestID = ?
        ORDER BY pt.TestID ASC
      `;

      const [rowsNew] = await sequelize.query(sqlNew, {
        replacements: [requestId],
        type: QueryTypes.SELECT,
        raw: true,
      });

      const rows = Array.isArray(rowsNew) ? rowsNew : [rowsNew].filter(Boolean);

      if (rows && rows.length > 0) {
        const efis = rows[0]?.EfisProjectId ?? "—";
        const testRows = rows.filter((r) => r.TestID != null);

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
          RequestID: rows[0].RequestID,
          EfisProjectId: efis,
          CreatedBy: rows[0].CreatedBy ?? "—",
          Status: rows[0].RequestStatus ?? "—",
          TotalTests,
          AssignedCount,
          SubmittedCount,
        };

        const items = testRows.map(toUiRow);
        return res.json({ header, items });
      }

      // Fallback: try legacy tables
      const sqlLegacy = `
        SELECT
          tr.RequestID,
          DATE(tr.DateOfRequest) AS RequestSubmissionDate,
          DATE(tr.TestResultsDueDate) AS RequestedDueDate,
          tr.ProjectID AS EfisProjectId,
          tr.RequesterName AS CreatedBy,
          tr.Status AS RequestStatus,
          trd.DetailID AS TestID,
          trd.SampleNumber AS SampleID,
          trd.DepthFrom, trd.DepthTo,
          trd.BoreholeID AS LegacyBH,
          tt.TestName
        FROM test_request tr
        JOIN test_request_details trd ON trd.RequestID = tr.RequestID
        LEFT JOIN test_type tt ON tt.TestTypeID = trd.TestTypeID
        WHERE tr.RequestID = ?
        ORDER BY trd.DetailID ASC
      `;

      const [rowsOld] = await sequelize.query(sqlLegacy, {
        replacements: [requestId],
        type: QueryTypes.SELECT,
        raw: true,
      });

      const legacyRows = Array.isArray(rowsOld)
        ? rowsOld
        : [rowsOld].filter(Boolean);

      if (!legacyRows || legacyRows.length === 0) {
        return sendEmpty(res, requestId, "—");
      }

      const header = {
        RequestID: legacyRows[0].RequestID,
        EfisProjectId: legacyRows[0].EfisProjectId ?? "—",
        CreatedBy: legacyRows[0].CreatedBy ?? "—",
        Status: legacyRows[0].RequestStatus ?? "—",
        TotalTests: legacyRows.length,
        AssignedCount: 0,
        SubmittedCount: 0,
      };
      const items = legacyRows.map(toUiRow);
      return res.json({ header, items });
    } catch (err) {
      console.error("assignments error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  /* ------------- counts/debug/testers ------------- */
  router.get("/assignments/:requestId/counts", async (req, res) => {
    const requestId = Number(req.params.requestId);
    if (!Number.isInteger(requestId))
      return res.status(400).json({ error: "Invalid request id" });

    try {
      const sql = `
        SELECT
          COUNT(pt.TestID) AS total,
          SUM(CASE WHEN pt.AssignedTester IS NOT NULL AND TRIM(pt.AssignedTester) <> '' THEN 1 ELSE 0 END) AS assigned,
          SUM(CASE WHEN pt.Status = 'Submitted' THEN 1 ELSE 0 END) AS submitted
        FROM project_tests pt
        JOIN project_samples ps ON ps.SampleID = pt.SampleID
        WHERE ps.RequestID = ?
      `;
      const [rows] = await sequelize.query(sql, {
        replacements: [requestId],
        type: QueryTypes.SELECT,
        raw: true,
      });
      const result = Array.isArray(rows) ? rows[0] : rows;
      const total = Number(result?.total || 0);
      const assigned = Number(result?.assigned || 0);
      const submitted = Number(result?.submitted || 0);
      res.json({ requestId, total, assigned, submitted });
    } catch (err) {
      console.error("GET /assignments/:requestId/counts error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  router.get("/assignments/:requestId/debug", async (req, res) => {
    const requestId = Number(req.params.requestId);
    if (!Number.isInteger(requestId))
      return res.status(400).json({ error: "Invalid request id" });

    try {
      const [r1] = await sequelize.query(
        "SELECT COUNT(*) c FROM project_requests WHERE RequestID=?",
        { replacements: [requestId], type: QueryTypes.SELECT },
      );
      const [r2] = await sequelize.query(
        "SELECT COUNT(*) c FROM project_tests WHERE RequestID=?",
        { replacements: [requestId], type: QueryTypes.SELECT },
      );
      const [r3] = await sequelize.query(
        "SELECT COUNT(*) c FROM test_request WHERE RequestID=?",
        { replacements: [requestId], type: QueryTypes.SELECT },
      );
      const [r4] = await sequelize.query(
        "SELECT COUNT(*) c FROM test_request_details WHERE RequestID=?",
        { replacements: [requestId], type: QueryTypes.SELECT },
      );

      res.json({
        project_requests: r1?.c || 0,
        project_tests: r2?.c || 0,
        legacy_test_request: r3?.c || 0,
        legacy_test_request_details: r4?.c || 0,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  router.get("/testers", async (_req, res) => {
    try {
      const testers = await Users.findAll({
        where: { UserType: "Tester" },
        attributes: ["UserName"],
        order: [["UserName", "ASC"]],
      });
      const items = testers.map((r) => r.UserName);
      res.json({ items });
    } catch (err) {
      console.error("GET /testers error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  /* -------------------- POST /assignments/:testId/assign --------------------- */
  router.post("/assignments/:testId/assign", async (req, res) => {
    const testId = Number(req.params.testId);
    if (!Number.isInteger(testId))
      return res.status(400).json({ error: "Invalid test id" });

    const user = resolveUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated." });

    const { assignedTester, resultDueDate, reportDueDate, notes } =
      req.body || {};

    try {
      // Fetch BEFORE state
      const testRecord = await ProjectTests.findByPk(testId);
      if (!testRecord) {
        return res.status(404).json({ error: "Test not found" });
      }

      const before = {
        AssignedTester: testRecord.AssignedTester ?? null,
        ResultDueDate: testRecord.ResultDueDate ?? null,
        ReportDueDate: testRecord.ReportDueDate ?? null,
        AssignmentNotes: testRecord.AssignmentNotes ?? null,
        Status: testRecord.Status ?? null,
      };

      // Build AFTER state
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

      // Auto-progress status if changed
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
        return res.json({ ok: true, updated: 0, noChange: true });
      }

      // Update record
      await ProjectTests.update(
        {
          AssignedTester: after.AssignedTester,
          ResultDueDate: after.ResultDueDate,
          ReportDueDate: after.ReportDueDate,
          AssignmentNotes: after.AssignmentNotes,
          Status: after.Status,
          UpdatedBy: user.UserName,
        },
        { where: { TestID: testId } },
      );

      // Insert history
      try {
        await sequelize.query(
          `INSERT INTO assignment_history (TestID, ChangedByUserID, ChangedByUserName, ChangedAt, Changes) VALUES (?, ?, ?, NOW(), ?)`,
          {
            replacements: [
              testId,
              user.UserID,
              user.UserName,
              JSON.stringify(changes),
            ],
          },
        );
      } catch (histErr) {
        console.error("assign INSERT history error:", histErr);
      }

      // Check if all tests assigned and update request status
      const requestId = testRecord.RequestID;
      if (!requestId) {
        return res.json({
          ok: true,
          TestID: testId,
          requestStatusUpdated: false,
        });
      }

      const [countResult] = await sequelize.query(
        `SELECT COUNT(*) AS total, SUM(CASE WHEN AssignedTester IS NOT NULL AND TRIM(AssignedTester) <> '' THEN 1 ELSE 0 END) AS assigned FROM project_tests WHERE RequestID = ?`,
        { replacements: [requestId], type: QueryTypes.SELECT },
      );

      const total = Number(countResult?.total || 0);
      const assigned = Number(countResult?.assigned || 0);
      const allAssigned = total > 0 && assigned === total;

      if (!allAssigned) {
        return res.json({
          ok: true,
          TestID: testId,
          requestStatusUpdated: false,
          totals: { total, assigned },
        });
      }

      const [, updateMeta] = await ProjectRequests.update(
        { Status: "Assigned" },
        { where: { RequestID: requestId, Status: { [Op.ne]: "Assigned" } } },
      );

      res.json({
        ok: true,
        TestID: testId,
        requestStatusUpdated: updateMeta > 0,
        totals: { total, assigned },
      });
    } catch (err) {
      console.error("POST /assignments/:testId/assign error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  /* ---------------------- summary ---------------------- */
  router.get("/assignments/:requestId/summary", async (req, res) => {
    const requestId = Number(req.params.requestId);
    if (!Number.isInteger(requestId)) {
      return res.status(400).json({ error: "Invalid request id" });
    }

    try {
      const sqlNew = `
        SELECT
          pr.RequestID,
          DATE(pr.RequestDate) AS RequestSubmissionDate,
          DATE(pt.RequestedDate) AS RequestedDueDate,
          tt.TestName AS RequestedTest,
          ps.BoreholeID AS BoreholeNumber,
          ps.SampleID AS SampleID,
          ps.SampleNumber AS SampleNumber,
          ps.DepthFrom AS DepthFrom,
          ps.DepthTo AS DepthTo,
          CONCAT(ps.BoreholeID, ' (', ps.DepthFrom, '–', ps.DepthTo, ')') AS BoreholeDepth,
          pt.TestID,
          pt.Status AS TestStatus,
          pt.AssignedTester,
          DATE(pt.ResultDueDate) AS AssignedResultDueDate,
          DATE(pt.ReportDueDate) AS AssignedReportDueDate,
          pt.AssignmentNotes AS Notes
        FROM project_requests pr
        LEFT JOIN project_samples ps ON ps.RequestID = pr.RequestID
        LEFT JOIN project_tests pt ON pt.SampleID = ps.SampleID
        LEFT JOIN test_type tt ON tt.TestTypeID = pt.TestTypeID
        WHERE pr.RequestID = ?
        ORDER BY pt.TestID ASC
      `;

      const rowsNew = await sequelize.query(sqlNew, {
        replacements: [requestId],
        type: QueryTypes.SELECT,
      });

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
          TestStatus: mapDbStatusToUi(r.TestStatus),
          AssignedTester: r.AssignedTester ?? null,
          AssignedResultDueDate: r.AssignedResultDueDate ?? null,
          AssignedReportDueDate: r.AssignedReportDueDate ?? null,
          Notes: r.Notes ?? null,
        }));
        return res.json({ requestId, items });
      }

      // Fallback to legacy tables
      const sqlLegacy = `
        SELECT
          tr.RequestID,
          DATE(tr.DateOfRequest) AS RequestSubmissionDate,
          DATE(tr.TestResultsDueDate) AS RequestedDueDate,
          tt.TestName AS RequestedTest,
          trd.BoreholeID AS BoreholeNumber,
          trd.SampleNumber AS SampleNumber,
          trd.DepthFrom AS DepthFrom,
          trd.DepthTo AS DepthTo,
          CONCAT(trd.BoreholeID, ' (', trd.DepthFrom, '–', trd.DepthTo, ')') AS BoreholeDepth,
          trd.DetailID AS TestID
        FROM test_request tr
        JOIN test_request_details trd ON trd.RequestID = tr.RequestID
        LEFT JOIN test_type tt ON tt.TestTypeID = trd.TestTypeID
        WHERE tr.RequestID = ?
        ORDER BY trd.DetailID ASC
      `;

      const rowsOld = await sequelize.query(sqlLegacy, {
        replacements: [requestId],
        type: QueryTypes.SELECT,
      });

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
    } catch (err) {
      console.error("GET /assignments/:requestId/summary error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  /* ------------------- GET /assignments/:testId/history ------------------ */
  router.get("/assignments/:testId/history", async (req, res) => {
    const testId = Number(req.params.testId);
    if (!Number.isInteger(testId)) {
      return res.status(400).json({ error: "Invalid test id" });
    }

    try {
      const sql = `
        SELECT HistoryID, TestID, ChangedByUserID, ChangedByUserName, ChangedAt, Changes
        FROM assignment_history
        WHERE TestID = ?
        ORDER BY ChangedAt DESC, HistoryID DESC
      `;
      const rows = await sequelize.query(sql, {
        replacements: [testId],
        type: QueryTypes.SELECT,
      });

      const items = (rows || []).map((r) => ({
        HistoryID: r.HistoryID,
        TestID: r.TestID,
        ChangedBy: r.ChangedByUserName,
        ChangedAt: r.ChangedAt,
        Changes:
          typeof r.Changes === "string" ? safeParseJSON(r.Changes) : r.Changes,
      }));
      return res.json({ items });
    } catch (err) {
      console.error("GET /assignments/:testId/history error:", err);
      return res.status(500).json({ error: "Server error" });
    }
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
