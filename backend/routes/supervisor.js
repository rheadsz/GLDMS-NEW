// routes/supervisor.js
const express = require("express");

module.exports = (models) => {
  const router = express.Router();
  const {
    Project,
    ProjectRequests,
    ProjectSamples,
    ProjectBoreholes,
    ProjectStructures,
  } = models;

  // ================================
  // GET /api/supervisor/requests
  // Returns: RequestID, ProjectID, EfisProjectId, CreatedBy, Status
  // ================================
  router.get("/requests", async (_req, res) => {
    console.log("[REQ] GET /api/supervisor/requests");
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
        EfisProjectId: r.project?.EfisProjectId || null,
        CreatedBy: r.project?.CreatedBy || null,
        Status: r.Status,
      }));

      console.log(`[RES] /api/supervisor/requests → ${rows.length} rows`);
      res.json(rows);
    } catch (err) {
      console.error("[ERR] /api/supervisor/requests:", err.message);
      return res.status(500).json({ error: "Failed to fetch data" });
    }
  });

  // ================================
  // GET /api/supervisor/samples
  // Generic list used as fallback in UI:
  // Returns: SampleID, EfisProjectId, CreatedBy, Status, RequestId
  // ================================
  router.get("/samples", async (_req, res) => {
    console.log("[REQ] GET /api/supervisor/samples");
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
        RequestId: ps.RequestID,
        EfisProjectId: ps.borehole?.structure?.project?.EfisProjectId || null,
        CreatedBy:
          ps.request?.RequestingUser ||
          ps.borehole?.structure?.project?.CreatedBy ||
          null,
        Status: ps.request?.Status || null,
        ActionStatus: ps.ActionStatus,
      }));

      console.log(`[RES] /api/supervisor/samples → ${rows.length} rows`);
      res.json(rows);
    } catch (err) {
      console.error("[ERR] GET /api/supervisor/samples:", err.message);
      return res.status(500).json({ error: "Failed to fetch samples." });
    }
  });

  // ================================
  // GET /api/supervisor/request-samples/:requestId
  // **Request-scoped** list used by right panel:
  // Returns: SampleID, BoreholeID, RequestId, EfisProjectId, CreatedBy, Status
  // ================================
  router.get("/request-samples/:requestId", async (req, res) => {
    const { requestId } = req.params;
    console.log(`[REQ] GET /api/supervisor/request-samples/${requestId}`);

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
        ],
        order: [["SampleID", "DESC"]],
      });

      const rows = samples.map((ps) => ({
        SampleID: ps.SampleID,
        SampleNumber: ps.SampleNumber,
        BoreholeID: ps.BoreholeID,
        RequestId: ps.RequestID,
        EfisProjectId: ps.request?.project?.EfisProjectId || null,
        CreatedBy:
          ps.request?.RequestingUser || ps.request?.project?.CreatedBy || null,
        Status: ps.request?.Status || null,
        ActionStatus: ps.ActionStatus,
      }));

      console.log(
        `[RES] /api/supervisor/request-samples/${requestId} → ${rows.length} rows`,
      );
      res.json(rows);
    } catch (err) {
      console.error(
        "[ERR] /api/supervisor/request-samples/:requestId:",
        err.message,
      );
      return res
        .status(500)
        .json({ error: "Failed to fetch samples for the request." });
    }
  });

  return router;
};
