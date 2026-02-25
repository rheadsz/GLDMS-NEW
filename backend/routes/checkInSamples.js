// routes/checkInSamples.js
const express = require("express");
const { Op } = require("sequelize");

// Backend for the "Check in Samples" tab.
// Mount under /api, e.g. app.use("/api", require("./routes/checkInSamples")(models));

module.exports = (models) => {
  const router = express.Router();
  const {
    Project,
    ProjectRequests,
    ProjectSamples,
    ProjectBoreholes,
    ProjectStructures,
  } = models;

  // GET /api/checkin/requests
  // Returns: RequestID, ProjectID, EfisProjectID, CreatedBy, Status
  router.get("/checkin/requests", async (_req, res) => {
    console.log("[REQ] GET /api/checkin/requests");
    try {
      const requests = await ProjectRequests.findAll({
        include: [
          {
            model: Project,
            as: "project",
            attributes: ["EfisProjectId", "CreatedBy"],
          },
        ],
        order: [["RequestID", "DESC"]],
      });

      const rows = requests.map((r) => ({
        RequestID: r.RequestID,
        ProjectID: r.ProjectID,
        EfisProjectID: r.project?.EfisProjectId || null,
        CreatedBy: r.project?.CreatedBy || null,
        Status: r.Status,
      }));

      console.log(`[RES] /api/checkin/requests → ${rows.length} rows`);
      res.json(rows);
    } catch (err) {
      console.error("[ERR] /api/checkin/requests:", err.message);
      return res.status(500).json({ error: "Failed to fetch data" });
    }
  });

  // GET /api/checkin/samples
  // Generic list used by the frontend component
  router.get("/checkin/samples", async (_req, res) => {
    console.log("[REQ] GET /api/checkin/samples");
    try {
      const samples = await ProjectSamples.findAll({
        include: [
          {
            model: ProjectRequests,
            as: "request",
            attributes: ["RequestingUser", "Status"],
            required: false,
          },
          {
            model: ProjectBoreholes,
            as: "borehole",
            attributes: ["BoreholeID"],
            required: false,
            include: [
              {
                model: ProjectStructures,
                as: "structure",
                attributes: ["StructureID"],
                required: false,
                include: [
                  {
                    model: Project,
                    as: "project",
                    attributes: ["EfisProjectId", "CreatedBy"],
                    required: false,
                  },
                ],
              },
            ],
          },
        ],
        order: [["SampleID", "DESC"]],
      });

      const rows = samples.map((ps) => ({
        SampleID: ps.SampleID,
        SampleNumber: ps.SampleNumber,
        BoreholeID: ps.BoreholeID,
        DepthFrom: ps.DepthFrom,
        DepthTo: ps.DepthTo,
        ContainerSizeOption: ps.ContainerSizeOption,
        ContainerType: ps.ContainerType,
        FieldCollectionDate: ps.FieldCollectionDate,
        ActionStatus: ps.ActionStatus,
        RequestId: ps.RequestID,
        EfisProjectID: ps.borehole?.structure?.project?.EfisProjectId || null,
        CreatedBy:
          ps.request?.RequestingUser ||
          ps.borehole?.structure?.project?.CreatedBy ||
          null,
        Status: ps.request?.Status || null,
      }));

      console.log(`[RES] /api/checkin/samples → ${rows.length} rows`);
      res.json(rows);
    } catch (err) {
      console.error("[ERR] GET /api/checkin/samples:", err.message);
      return res.status(500).json({ error: "Failed to fetch samples." });
    }
  });

  // GET /api/checkin/request-samples/:requestId
  // Request-scoped list
  router.get("/checkin/request-samples/:requestId", async (req, res) => {
    const { requestId } = req.params;
    console.log(`[REQ] GET /api/checkin/request-samples/${requestId}`);

    try {
      const samples = await ProjectSamples.findAll({
        where: { RequestID: requestId },
        include: [
          {
            model: ProjectRequests,
            as: "request",
            attributes: ["RequestingUser", "Status", "ProjectID"],
            required: true,
            include: [
              {
                model: Project,
                as: "project",
                attributes: ["EfisProjectId", "CreatedBy"],
                required: true,
              },
            ],
          },
          {
            model: ProjectBoreholes,
            as: "borehole",
            attributes: ["BoreholeID"],
            required: false,
          },
        ],
        order: [["SampleID", "DESC"]],
      });

      const rows = samples.map((ps) => ({
        SampleID: ps.SampleID,
        BoreholeID: ps.BoreholeID,
        DepthFrom: ps.DepthFrom,
        DepthTo: ps.DepthTo,
        ContainerType: ps.ContainerType,
        FieldCollectionDate: ps.FieldCollectionDate,
        ActionStatus: ps.ActionStatus,
        RequestId: ps.RequestID,
        EfisProjectID: ps.request?.project?.EfisProjectId || null,
        CreatedBy:
          ps.request?.RequestingUser || ps.request?.project?.CreatedBy || null,
        Status: ps.request?.Status || null,
      }));

      console.log(
        `[RES] /api/checkin/request-samples/${requestId} → ${rows.length} rows`,
      );
      res.json(rows);
    } catch (err) {
      console.error(
        "[ERR] /api/checkin/request-samples/:requestId:",
        err.message,
      );
      return res
        .status(500)
        .json({ error: "Failed to fetch samples for the request." });
    }
  });

  // POST /api/checkin/sample-status
  // Body: { SampleID, Action }
  router.post("/checkin/sample-status", async (req, res) => {
    const { SampleID, Action } = req.body || {};
    if (!SampleID) {
      return res.status(400).json({ error: "SampleID is required." });
    }

    if (!Action) {
      return res.status(400).json({ error: "Action is required." });
    }

    // Normalize action status
    const label = String(Action).toLowerCase();
    let actionStatus;
    if (label.includes("checked")) {
      actionStatus = "Checked in";
    } else if (label.includes("reject")) {
      actionStatus = "Rejected";
    } else if (label.includes("not")) {
      actionStatus = "Not Received";
    } else {
      actionStatus = Action;
    }

    try {
      const [affectedRows] = await ProjectSamples.update(
        { ActionStatus: actionStatus },
        { where: { SampleID: SampleID } },
      );

      console.log(
        `[RES] POST /api/checkin/sample-status SampleID=${SampleID} -> ${actionStatus}`,
      );
      return res.json({
        ok: true,
        affectedRows,
        actionStatus,
      });
    } catch (err) {
      console.error("[ERR] POST /api/checkin/sample-status:", err.message);
      return res.status(500).json({ error: "Failed to update ActionStatus." });
    }
  });

  // POST /api/checkin/sample-status/bulk
  // Body: { SampleIDs: [..], Action }
  router.post("/checkin/sample-status/bulk", async (req, res) => {
    const { SampleIDs, Action } = req.body || {};
    const ids = Array.isArray(SampleIDs)
      ? SampleIDs.map((x) => (x == null ? null : Number(x))).filter((x) => x)
      : [];

    if (!ids.length) {
      return res.status(400).json({ error: "SampleIDs is required." });
    }

    if (!Action) {
      return res.status(400).json({ error: "Action is required." });
    }

    const label = String(Action).toLowerCase();
    let actionStatus;
    if (label.includes("checked")) {
      actionStatus = "Checked in";
    } else if (label.includes("reject")) {
      actionStatus = "Rejected";
    } else if (label.includes("not")) {
      actionStatus = "Not Received";
    } else {
      actionStatus = Action;
    }

    try {
      const [affectedRows] = await ProjectSamples.update(
        { ActionStatus: actionStatus },
        { where: { SampleID: { [Op.in]: ids } } },
      );

      console.log(
        `[RES] POST /api/checkin/sample-status/bulk samples=${ids.length} -> ${actionStatus}`,
      );
      return res.json({
        ok: true,
        affectedRows,
        actionStatus,
        sampleIds: ids,
      });
    } catch (err) {
      console.error("[ERR] POST /api/checkin/sample-status/bulk:", err.message);
      return res.status(500).json({ error: "Failed to update ActionStatus." });
    }
  });

  return router;
};
