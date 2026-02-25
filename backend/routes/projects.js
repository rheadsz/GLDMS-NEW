const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");

module.exports = (models) => {
  const {
    Project,
    ProjectRequests,
    ProjectStructures,
    ProjectBoreholes,
    ProjectSamples,
    ProjectTests,
    TestType,
  } = models;

  // GET /api/projects - Get all projects
  router.get("/", async (req, res) => {
    try {
      const projects = await Project.findAll({
        attributes: [
          ["ProjectID", "DBProjectID"],
          ["EfisProjectId", "ProjectID"],
          "EfisProjectId",
          "ProjectName",
          "EA",
          "District",
          "County",
          "Route",
          "StructureNumber",
          "PMFrom",
          "PMTo",
          "CreatedBy",
          "CreatedAt",
        ],
        order: [["CreatedAt", "DESC"]],
      });

      // Add isYourProject flag and Status
      const projectsWithFlag = projects.map((project) => ({
        ...project.toJSON(),
        Status: "Submitted",
        ProjectComponent: "",
        isYourProject: Math.random() > 0.5, // Random assignment for demo
      }));

      res.json(projectsWithFlag);
    } catch (err) {
      console.error("Error fetching projects:", err);
      return res
        .status(500)
        .json({ message: "Database error: " + err.message });
    }
  });

  // GET /api/projects/:id/details - Get complete project hierarchy
  router.get("/:id/details", async (req, res) => {
    const projectId = req.params.id;

    console.log(
      `[PROJECT DETAILS] Fetching details for project ID: ${projectId}`,
    );

    try {
      // Find project by ProjectID or EfisProjectId
      const project = await Project.findOne({
        where: {
          [Op.or]: [{ ProjectID: projectId }, { EfisProjectId: projectId }],
        },
      });

      if (!project) {
        console.log(
          `[PROJECT DETAILS] Project not found with ID: ${projectId}`,
        );
        return res.status(404).json({
          message: "Project not found",
          searchedId: projectId,
          hint: "Make sure the project exists in the database",
        });
      }

      const dbProjectId = project.ProjectID;
      console.log(`[PROJECT DETAILS] Using database ProjectID: ${dbProjectId}`);

      // Get the latest RequestID for this project
      const latestRequest = await ProjectRequests.findOne({
        where: { ProjectID: dbProjectId },
        order: [["RequestDate", "DESC"]],
        attributes: ["RequestID"],
      });

      const requestId = latestRequest ? latestRequest.RequestID : null;
      console.log(`[PROJECT DETAILS] Found RequestID: ${requestId}`);

      // Get structures for this project
      const structureWhere = { ProjectID: dbProjectId };
      if (requestId) structureWhere.RequestID = requestId;

      const structures = await ProjectStructures.findAll({
        where: structureWhere,
        order: [["StructureID", "ASC"]],
      });

      console.log(`[PROJECT DETAILS] Found ${structures.length} structures`);

      if (structures.length === 0) {
        return res.json({ project: project.toJSON(), structures: [] });
      }

      const structureIds = structures.map((s) => s.StructureID);

      // Get boreholes for these structures
      const boreholes = await ProjectBoreholes.findAll({
        where: { StructureID: { [Op.in]: structureIds } },
        order: [["BoreholeID", "ASC"]],
      });

      console.log(`[PROJECT DETAILS] Found ${boreholes.length} boreholes`);

      if (boreholes.length === 0) {
        const structuresWithBoreholes = structures.map((s) => ({
          ...s.toJSON(),
          boreholes: [],
        }));
        return res.json({
          project: project.toJSON(),
          structures: structuresWithBoreholes,
        });
      }

      const boreholeIds = boreholes.map((b) => b.BoreholeID);

      // Get samples for these boreholes
      const samples = await ProjectSamples.findAll({
        where: { BoreholeID: { [Op.in]: boreholeIds } },
        order: [["SampleID", "ASC"]],
      });

      if (samples.length === 0) {
        const boreholesWithSamples = boreholes.map((b) => ({
          ...b.toJSON(),
          samples: [],
        }));
        const structuresWithBoreholes = structures.map((s) => ({
          ...s.toJSON(),
          boreholes: boreholesWithSamples.filter(
            (b) => b.StructureID === s.StructureID,
          ),
        }));
        return res.json({
          project: project.toJSON(),
          structures: structuresWithBoreholes,
        });
      }

      const sampleIds = samples.map((s) => s.SampleID);
      console.log(`[PROJECT DETAILS] Found ${samples.length} samples`);

      // Get tests for these samples with TestType info
      const tests = await ProjectTests.findAll({
        where: { SampleID: { [Op.in]: sampleIds } },
        include: [
          {
            model: TestType,
            as: "testType",
            attributes: ["TestName"],
          },
        ],
        order: [["TestID", "ASC"]],
      });

      console.log(`[PROJECT DETAILS] Found ${tests.length} tests`);

      // Build the hierarchy
      const samplesWithTests = samples.map((sample) => ({
        ...sample.toJSON(),
        tests: tests
          .filter((t) => t.SampleID === sample.SampleID)
          .map((t) => ({
            ...t.toJSON(),
            TestName: t.testType?.TestName || `Test Type ${t.TestTypeID}`,
          })),
      }));

      const boreholesWithSamples = boreholes.map((borehole) => ({
        ...borehole.toJSON(),
        samples: samplesWithTests.filter(
          (s) => s.BoreholeID === borehole.BoreholeID,
        ),
      }));

      const structuresWithBoreholes = structures.map((structure) => ({
        ...structure.toJSON(),
        boreholes: boreholesWithSamples.filter(
          (b) => b.StructureID === structure.StructureID,
        ),
      }));

      res.json({
        project: project.toJSON(),
        structures: structuresWithBoreholes,
      });
    } catch (err) {
      console.error("Error fetching project details:", err);
      return res
        .status(500)
        .json({ message: "Database error: " + err.message });
    }
  });

  // GET /api/projects/:id - Get a specific project
  router.get("/:id", async (req, res) => {
    const projectId = req.params.id;

    try {
      const project = await Project.findByPk(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project.toJSON());
    } catch (err) {
      console.error("Error fetching project:", err);
      return res
        .status(500)
        .json({ message: "Database error: " + err.message });
    }
  });

  // POST /api/projects - Create a new project
  router.post("/", async (req, res) => {
    const data = req.body;

    // Required fields
    if (!data.projectID || !data.district) {
      return res
        .status(400)
        .json({ message: "Project ID and District are required" });
    }

    try {
      const newProject = await Project.create({
        EfisProjectId: data.efisProjectId || data.projectID,
        ProjectName: data.projectName || "",
        EA: data.ea || "",
        District: data.district,
        County: data.county || "",
        StructureNumber: data.structureNo || "",
        Route: data.route || null,
        PMFrom: data.pmFrom || data.pm || "",
        PMTo: data.pmTo || data.pm || "",
        CreatedBy: data.createdBy || "system",
      });

      res.status(201).json({
        message: "Project created successfully",
        projectId: newProject.ProjectID,
      });
    } catch (err) {
      console.error("Error creating project:", err);
      return res
        .status(500)
        .json({ message: "Database error: " + err.message });
    }
  });

  return router;
};
