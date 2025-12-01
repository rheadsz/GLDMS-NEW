// routes/checkInSamples.js
const express = require("express");

// Backend for the "Check in Samples" tab.
// Mount under /api, e.g. app.use("/api", require("./routes/checkInSamples")(db));

module.exports = (db) => {
  const router = express.Router();

  // GET /api/checkin/requests
  // Returns: RequestID, ProjectID, EfisProjectID, CreatedBy, Status
  router.get("/checkin/requests", (_req, res) => {
    console.log("[REQ] GET /api/checkin/requests");
    const sql = `
      SELECT 
        pr.RequestID,
        pr.ProjectID,
        p.EfisProjectID   AS EfisProjectID,
        p.CreatedBy       AS CreatedBy,
        pr.Status
      FROM project_requests AS pr
      LEFT JOIN project AS p
        ON p.ProjectID = pr.ProjectID
      ORDER BY pr.RequestID DESC
    `;
    db.query(sql, (err, rows) => {
      if (err) {
        console.error("[ERR] /api/checkin/requests:", err.message);
        return res.status(500).json({ error: "Failed to fetch data" });
      }
      console.log(`[RES] /api/checkin/requests → ${rows.length} rows`);
      res.json(rows || []);
    });
  });

  // GET /api/checkin/samples
  // Generic list used by the frontend component:
  // SampleID, BoreholeID, DepthFrom, DepthTo, ContainerType,
  // FieldCollectionDate, ActionStatus, RequestId, EfisProjectID, CreatedBy, Status
  router.get("/checkin/samples", (_req, res) => {
    console.log("[REQ] GET /api/checkin/samples");
    const sql = `
      SELECT
        ps.SampleID,
        ps.BoreholeID,
        ps.DepthFrom,
        ps.DepthTo,
        ps.ContainerType,
        ps.FieldCollectionDate,
        ps.ActionStatus,
        ps.RequestID                 AS RequestId,
        p.EfisProjectID              AS EfisProjectID,
        COALESCE(pr.RequestingUser, p.CreatedBy) AS CreatedBy,
        pr.Status                    AS Status
      FROM project_samples ps
      LEFT JOIN project_requests pr ON pr.RequestID = ps.RequestID
      LEFT JOIN project_boreholes pb ON pb.BoreholeID = ps.BoreholeID
      LEFT JOIN project_structures st ON st.StructureID = pb.StructureID
      LEFT JOIN project p ON p.ProjectID = st.ProjectID
      ORDER BY ps.SampleID DESC
    `;
    db.query(sql, (err, rows) => {
      if (err) {
        console.error("[ERR] GET /api/checkin/samples:", err.message);
        return res.status(500).json({ error: "Failed to fetch samples." });
      }
      console.log(`[RES] /api/checkin/samples → ${rows.length} rows`);
      res.json(rows || []);
    });
  });

  // GET /api/checkin/request-samples/:requestId
  // Request-scoped list (same core columns as /checkin/samples)
  router.get("/checkin/request-samples/:requestId", (req, res) => {
    const { requestId } = req.params;
    console.log(`[REQ] GET /api/checkin/request-samples/${requestId}`);

    const sql = `
      SELECT
        ps.SampleID,
        ps.BoreholeID,
        ps.DepthFrom,
        ps.DepthTo,
        ps.ContainerType,
        ps.FieldCollectionDate,
        ps.ActionStatus,
        ps.RequestID                 AS RequestId,
        p.EfisProjectID              AS EfisProjectID,
        COALESCE(pr.RequestingUser, p.CreatedBy) AS CreatedBy,
        pr.Status                    AS Status
      FROM project_samples ps
      JOIN project_requests pr ON ps.RequestID = pr.RequestID
      JOIN project_boreholes pb ON pb.BoreholeID = ps.BoreholeID
      JOIN project_structures st ON st.StructureID = pb.StructureID
      JOIN project p          ON pr.ProjectID = p.ProjectID
      WHERE pr.RequestID = ?
      ORDER BY ps.SampleID DESC
    `;

    db.query(sql, [requestId], (err, rows) => {
      if (err) {
        console.error(
          "[ERR] /api/checkin/request-samples/:requestId:",
          err.message
        );
        return res
          .status(500)
          .json({ error: "Failed to fetch samples for the request." });
      }
      console.log(
        `[RES] /api/checkin/request-samples/${requestId} → ${rows.length} rows`
      );
      res.json(rows || []);
    });
  });

  // POST /api/checkin/sample-status
  // Body: { SampleID, Action }
  // Saves the normalized action label into project_samples.ActionStatus
  router.post("/checkin/sample-status", (req, res) => {
    const { SampleID, Action } = req.body || {};
    if (!SampleID) {
      return res.status(400).json({ error: "SampleID is required." });
    }

    if (!Action) {
      return res.status(400).json({ error: "Action is required." });
    }

    // Normalize a few common labels but otherwise store what we receive
    const label = String(Action).toLowerCase();
    let actionStatus;
    if (label.includes("checked")) {
      // Store exactly "Checked in" for checked-in samples
      actionStatus = "Checked in";
    } else if (label.includes("reject")) {
      actionStatus = "Rejected";
    } else if (label.includes("not")) {
      actionStatus = "Not Received";
    } else {
      actionStatus = Action;
    }

    const sql = `
      UPDATE project_samples
      SET ActionStatus = ?
      WHERE SampleID = ?;
    `;

    db.query(sql, [actionStatus, SampleID], (err, result) => {
      if (err) {
        console.error("[ERR] POST /api/checkin/sample-status:", err.message);
        return res
          .status(500)
          .json({ error: "Failed to update ActionStatus." });
      }

      console.log(
        `[RES] POST /api/checkin/sample-status SampleID=${SampleID} -> ${actionStatus}`
      );
      return res.json({
        ok: true,
        affectedRows: result.affectedRows,
        actionStatus,
      });
    });
  });

  return router;
};
