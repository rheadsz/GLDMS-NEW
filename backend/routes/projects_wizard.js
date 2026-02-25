const express = require("express");
const router = express.Router();
const { Op, QueryTypes } = require("sequelize");

/**
 * @route   POST /api/projects/wizard
 * @desc    Submit project wizard data
 * @access  Private
 */
module.exports = (models) => {
  const {
    sequelize,
    Project,
    ProjectRequests,
    ProjectStructures,
    ProjectBoreholes,
    ProjectSamples,
    ProjectTests,
    TestType,
  } = models;

  // Submit complete project wizard data
  router.post("/wizard", async (req, res) => {
    // Extract data with validation
    const ProjectInfo = req.body.ProjectInfo || {};
    const Boreholes = req.body.Boreholes || {};
    const SampleInfoSets = req.body.SampleInfoSets || [];
    const TestsInfo = req.body.TestsInfo || {};
    const chargingCodeComment = req.body.chargingCodeComment || "";

    const userName = req.body.userName || "System";
    console.log("User submitting the project:", userName);
    console.log(
      "Received project wizard submission:",
      JSON.stringify(req.body, null, 2),
    );

    // Basic validation
    if (!ProjectInfo || typeof ProjectInfo !== "object") {
      return res.status(400).json({
        message: "Invalid project information provided",
        detail: "ProjectInfo must be a valid object",
      });
    }

    const transaction = await sequelize.transaction();

    try {
      console.log("Transaction started");

      // 1. Insert project
      const projectName = ProjectInfo.projectName || "";
      const ea = ProjectInfo.ea || "";
      const district = ProjectInfo.district || "";
      const county = ProjectInfo.county || "";
      const route =
        ProjectInfo.route && ProjectInfo.route !== ""
          ? parseInt(ProjectInfo.route, 10)
          : null;
      const pmFrom = ProjectInfo.pmStart || ProjectInfo.pmFrom || "";
      const pmTo = ProjectInfo.pmEnd || ProjectInfo.pmTo || "";
      const structureNo = ProjectInfo.structureNo || "";
      const efisProjectId =
        ProjectInfo.projectID || ProjectInfo.efisProjectId || "";

      const newProject = await Project.create(
        {
          ProjectName: projectName,
          EA: ea,
          District: district,
          County: county,
          Route: route,
          PMFrom: pmFrom,
          PMTo: pmTo,
          StructureNumber: structureNo,
          CreatedBy: userName,
          EfisProjectId: efisProjectId,
        },
        { transaction },
      );

      const projectId = newProject.ProjectID;
      console.log(`Project created with ID: ${projectId}`);

      // 2. Create request
      const newRequest = await ProjectRequests.create(
        {
          ProjectID: projectId,
          Status: "Submitted",
          RequestingUser: userName,
          Notes: chargingCodeComment,
        },
        { transaction },
      );

      const requestId = newRequest.RequestID;
      console.log(`Request created with ID: ${requestId}`);

      // 3. Insert structures
      const structureMap = {}; // Map frontend structure ID to DB structure ID
      if (ProjectInfo.structures && ProjectInfo.structures.length > 0) {
        for (const structure of ProjectInfo.structures) {
          const newStructure = await ProjectStructures.create(
            {
              ProjectID: projectId,
              StructureNumber: structure.structureNo || "",
              CreatedBy: userName,
              RequestID: requestId,
              ProjectComponent: structure.projectComponent || "",
            },
            { transaction },
          );
          structureMap[structure.id] = newStructure.StructureID;
          console.log(`Structure created with ID: ${newStructure.StructureID}`);
        }
      }

      // 4. Insert boreholes
      const boreholeMap = {}; // Map frontend borehole ID to DB borehole ID
      if (Boreholes?.boreholes?.length > 0) {
        for (const borehole of Boreholes.boreholes) {
          let structureId = null;

          // Find structure ID
          if (borehole.structureId && structureMap[borehole.structureId]) {
            structureId = structureMap[borehole.structureId];
          } else {
            // Fallback to first structure
            const firstStructure = await ProjectStructures.findOne({
              where: { ProjectID: projectId },
              transaction,
            });
            structureId = firstStructure?.StructureID;
          }

          if (!structureId) {
            console.warn(
              `No structure found for borehole ${borehole.boreholeId}`,
            );
            continue;
          }

          const newBorehole = await ProjectBoreholes.create(
            {
              StructureID: structureId,
              BoreholeNumber: borehole.boreholeId || "",
              Latitude: borehole.latitude || null,
              Longitude: borehole.longitude || null,
              Northing: borehole.northing || null,
              Easting: borehole.easting || null,
              GroundSurfaceElevation: borehole.groundSurfaceElevation || null,
              CreatedBy: userName,
              RequestID: requestId,
            },
            { transaction },
          );

          boreholeMap[borehole.boreholeId] = newBorehole.BoreholeID;
          console.log(`Borehole created with ID: ${newBorehole.BoreholeID}`);
        }
      }

      // 5. Insert samples
      const sampleMap = {}; // Map for test insertion
      if (SampleInfoSets?.length > 0) {
        for (const sampleSet of SampleInfoSets) {
          if (!sampleSet.samples?.length) continue;

          for (const sample of sampleSet.samples) {
            if (!sample.boreholeId) continue;

            let boreholeId = boreholeMap[sample.boreholeId];

            if (!boreholeId) {
              // Try to find borehole by number
              const foundBorehole = await ProjectBoreholes.findOne({
                include: [
                  {
                    model: ProjectStructures,
                    as: "structure",
                    where: { ProjectID: projectId },
                  },
                ],
                where: { BoreholeNumber: sample.boreholeId },
                transaction,
              });
              boreholeId = foundBorehole?.BoreholeID;
            }

            if (!boreholeId) {
              // Fallback to any borehole
              const anyBorehole = await ProjectBoreholes.findOne({
                include: [
                  {
                    model: ProjectStructures,
                    as: "structure",
                    where: { ProjectID: projectId },
                  },
                ],
                transaction,
              });
              boreholeId = anyBorehole?.BoreholeID;
            }

            if (!boreholeId) {
              console.warn(`No borehole found for sample ${sample.sampleId}`);
              continue;
            }

            const newSample = await ProjectSamples.create(
              {
                BoreholeID: boreholeId,
                SampleNumber: sample.sampleId || "",
                SampleType: sample.sampleType || null,
                DepthFrom: sample.depthFrom || null,
                DepthTo: sample.depthTo || null,
                TL101Number: sample.tl101No || null,
                ContainerType: sample.containerType || "Tube",
                ContainerSizeOption: sample.containerSizeOption || null,
                ContainerSizeManual: sample.containerSizeManual || null,
                Quantity: sample.quantity || null,
                FieldCollectionDate: sample.fieldCollectionDate || null,
                CreatedBy: userName,
                RequestID: requestId,
              },
              { transaction },
            );

            // Store mapping for tests
            sampleMap[sample.id] = newSample.SampleID;
            console.log(`Sample created with ID: ${newSample.SampleID}`);
          }
        }
      }

      // 6. Insert tests
      if (TestsInfo?.testRows?.length > 0) {
        const parseDepthPair = (raw) => {
          if (!raw) return { depthFrom: null, depthTo: null };
          const m = String(raw).match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
          if (!m) return { depthFrom: null, depthTo: null };
          return { depthFrom: Number(m[1]), depthTo: Number(m[2]) };
        };

        const findSubmittedSample = (testRowId) => {
          if (!testRowId || !Array.isArray(SampleInfoSets)) return null;
          for (const set of SampleInfoSets) {
            const list = Array.isArray(set?.samples) ? set.samples : [];
            for (const s of list) {
              if (String(s?.id) === String(testRowId)) return s;
            }
          }
          return null;
        };

        for (const testRow of TestsInfo.testRows) {
          const submittedSample = findSubmittedSample(testRow?.id);
          let sampleId = sampleMap[testRow?.id];

          if (!sampleId && submittedSample) {
            // Try to find by borehole and depth
            const boreholeNum = submittedSample.boreholeId;
            const depthFrom = submittedSample.depthFrom;
            const depthTo = submittedSample.depthTo;

            if (boreholeNum) {
              const foundSample = await ProjectSamples.findOne({
                include: [
                  {
                    model: ProjectBoreholes,
                    as: "borehole",
                    where: { BoreholeNumber: boreholeNum },
                  },
                ],
                where: {
                  RequestID: requestId,
                  ...(depthFrom && depthTo
                    ? { DepthFrom: depthFrom, DepthTo: depthTo }
                    : {}),
                },
                transaction,
              });
              sampleId = foundSample?.SampleID;
            }
          }

          if (!sampleId || !testRow?.tests?.length) continue;

          for (const testName of testRow.tests) {
            const testType = await TestType.findOne({
              where: { TestName: testName },
              transaction,
            });

            if (!testType) continue;

            await ProjectTests.create(
              {
                SampleID: sampleId,
                TestTypeID: testType.TestTypeID,
                Status: "Requested",
                RequestingUser: userName,
                RequestedDate: new Date(),
                CreatedBy: userName,
              },
              { transaction },
            );

            console.log(`Test created for sample ${sampleId}: ${testName}`);
          }
        }
      }

      // Commit transaction
      await transaction.commit();
      console.log("Transaction committed successfully");

      res.status(201).json({
        message: "Project created successfully",
        projectId,
      });
    } catch (error) {
      console.error("Error in transaction:", error);
      await transaction.rollback();
      console.error("Transaction rolled back due to error");
      res
        .status(500)
        .json({ message: "Error creating project", error: error.message });
    }
  });

  return router;
};
