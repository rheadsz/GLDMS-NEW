const express = require("express");
const router = express.Router();

/**
 * @route   POST /api/projects/wizard
 * @desc    Submit project wizard data
 * @access  Private
 */
module.exports = (db) => {
  // Submit complete project wizard data
  router.post("/wizard", (req, res) => {
    // Extract data with validation
    const ProjectInfo = req.body.ProjectInfo || {};
    const Boreholes = req.body.Boreholes || {};
    const SampleInfoSets = req.body.SampleInfoSets || [];
    const TestsInfo = req.body.TestsInfo || {};
    const chargingCodeComment = req.body.chargingCodeComment || "";

    // Define userName at the top level so it's accessible to all functions
    const userName = req.body.userName || "System";
    console.log("User submitting the project:", userName);

    console.log(
      "Received project wizard submission:",
      JSON.stringify(req.body, null, 2)
    );

    // Basic validation
    if (!ProjectInfo || typeof ProjectInfo !== "object") {
      return res.status(400).json({
        message: "Invalid project information provided",
        detail: "ProjectInfo must be a valid object",
      });
    }

    // Initialize variables to store IDs across promise chain
    let projectId, requestId;

    // Start a transaction
    db.beginTransaction((err) => {
      if (err) {
        console.error("Error starting transaction:", err);
        return res
          .status(500)
          .json({ message: "Error starting database transaction" });
      }

      console.log("Transaction started");

      // Use promise chain to handle transaction steps
      insertProject()
        .then((ids) => {
          projectId = ids.projectId;
          requestId = ids.requestId;
          console.log(
            `Project created with ID: ${projectId}, Request ID: ${requestId}`
          );
          return insertStructures(projectId, requestId);
        })
        .then(() => {
          console.log("Structures inserted successfully");
          return insertBoreholes(projectId, requestId);
        })
        .then(() => {
          console.log("Boreholes inserted successfully");
          return insertSamples(projectId, requestId);
        })
        .then(() => {
          console.log("Samples inserted successfully");
          return insertTests(projectId, requestId);
        })
        .then(() => {
          console.log("Tests inserted successfully");
          return commitTransaction();
        })
        .catch(handleError);

      // 1. Insert project information
      function insertProject() {
        return new Promise((resolve, reject) => {
          // Additional validation for project fields with detailed logging
          console.log("ProjectInfo in insertProject:", ProjectInfo);

          // Prepare safe values with fallbacks for all fields
          const projectName = ProjectInfo.projectName || "";
          const ea = ProjectInfo.ea || "";
          const district = ProjectInfo.district || "";
          const county = ProjectInfo.county || "";
          // Convert route to NULL if empty (it's a numeric field)
          const route =
            ProjectInfo.route && ProjectInfo.route !== ""
              ? parseInt(ProjectInfo.route, 10)
              : null;
          const pmFrom = ProjectInfo.pmStart || ProjectInfo.pmFrom || "";
          const pmTo = ProjectInfo.pmEnd || ProjectInfo.pmTo || "";
          const structureNo = ProjectInfo.structureNo || "";
          // Set efisProjectId from projectID field or as a fallback use efisProjectId
          const efisProjectId =
            ProjectInfo.projectID || ProjectInfo.efisProjectId || "";

          const projectQuery = `
            INSERT INTO project (
              ProjectName, EA, District, County, Route, 
              PMFrom, PMTo, StructureNumber, CreatedBy, EfisProjectId
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const params = [
            projectName,
            ea,
            district,
            county,
            route,
            pmFrom,
            pmTo,
            structureNo,
            userName,
            efisProjectId,
          ];

          console.log("Project insert parameters:", params);

          db.query(projectQuery, params, (err, result) => {
            if (err) {
              console.error("Error inserting project:", err);
              return reject(err);
            }

            const projectId = result.insertId;
            console.log(`Project created with ID: ${projectId}`);

            // Create a new request
            const requestQuery = `
                INSERT INTO project_requests (ProjectID, Status, RequestingUser, Notes)
                VALUES (?, 'Submitted', ?, ?)
              `;

            db.query(
              requestQuery,
              [projectId, userName, chargingCodeComment],
              (err, requestResult) => {
                if (err) {
                  console.error("Error creating request:", err);
                  return reject(err);
                }

                const requestId = requestResult.insertId;
                console.log(`Request created with ID: ${requestId}`);
                resolve({ projectId, requestId });
              }
            );
          });
        });
      }

      // 2. Insert structures
      function insertStructures(projectId, requestId) {
        return new Promise((resolve, reject) => {
          // Skip if no structures
          if (!ProjectInfo.structures || ProjectInfo.structures.length === 0) {
            console.log("No structures to insert");
            return resolve();
          }

          console.log("Processing project structures:", ProjectInfo.structures);

          // Create an array of promises for inserting all structures
          const structurePromises = ProjectInfo.structures.map((structure) => {
            return new Promise((resolveStructure, rejectStructure) => {
              const structureQuery = `
                INSERT INTO project_structures (
                  ProjectID, StructureNumber, CreatedBy, RequestID, ProjectComponent
                ) VALUES (?, ?, ?, ?, ?)
              `;

              db.query(
                structureQuery,
                [
                  projectId,
                  structure.structureNo || "",
                  userName,
                  requestId,
                  structure.projectComponent || "",
                ],
                (err, result) => {
                  if (err) {
                    console.error("Error inserting structure:", err);
                    rejectStructure(err);
                  } else {
                    console.log(
                      `Structure created with ID: ${result.insertId}`
                    );
                    resolveStructure(result);
                  }
                }
              );
            });
          });

          // Wait for all structure insertions to complete
          Promise.all(structurePromises)
            .then(() => resolve())
            .catch((err) => reject(err));
        });
      }

      // 3. Insert boreholes
      function insertBoreholes(projectId, requestId) {
        return new Promise((resolve, reject) => {
          // Skip if no boreholes
          if (
            !Boreholes ||
            !Boreholes.boreholes ||
            Boreholes.boreholes.length === 0
          ) {
            console.log("No boreholes to insert");
            return resolve();
          }

          console.log(
            "Processing boreholes:",
            JSON.stringify(Boreholes.boreholes)
          );

          // Create an array of promises for inserting all boreholes
          const boreholePromises = Boreholes.boreholes.map((borehole) => {
            return new Promise((resolveBorehole, rejectBorehole) => {
              // Find the structure ID for this borehole
              findStructureId(borehole, projectId)
                .then((structureId) => {
                  if (!structureId) {
                    console.warn(
                      `No valid structure found for borehole ${borehole.boreholeId}`
                    );
                    return resolveBorehole(); // Skip this borehole but don't fail the whole operation
                  }

                  console.log(
                    `Inserting borehole with structure ID: ${structureId}`
                  );

                  const boreholeQuery = `
                    INSERT INTO project_boreholes (
                      StructureID, BoreholeNumber, Latitude, Longitude,
                      Northing, Easting, GroundSurfaceElevation, CreatedBy, RequestID
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `;

                  const params = [
                    structureId,
                    borehole.boreholeId || "",
                    borehole.latitude || null,
                    borehole.longitude || null,
                    borehole.northing || null,
                    borehole.easting || null,
                    borehole.groundSurfaceElevation || null,
                    userName, // Use the already defined userName variable
                    requestId,
                  ];

                  db.query(boreholeQuery, params, (err, result) => {
                    if (err) {
                      console.error("Error inserting borehole:", err);
                      rejectBorehole(err);
                    } else {
                      console.log(
                        `Borehole created with ID: ${result.insertId}`
                      );
                      resolveBorehole(result);
                    }
                  });
                })
                .catch((err) => rejectBorehole(err));
            });
          });

          // Wait for all borehole insertions to complete
          Promise.all(boreholePromises)
            .then(() => resolve())
            .catch((err) => reject(err));
        });
      }

      // Helper function to find structure ID
      function findStructureId(borehole, projectId) {
        return new Promise((resolve, reject) => {
          // First try to find by matching structure ID from ProjectInfo
          if (borehole.structureId && ProjectInfo.structures) {
            const matchingStructure = ProjectInfo.structures.find(
              (s) => s.id === borehole.structureId
            );
            if (matchingStructure) {
              const findStructureQuery = `
                SELECT StructureID FROM project_structures 
                WHERE ProjectID = ? AND ProjectComponent = ? AND StructureNumber = ?
              `;

              db.query(
                findStructureQuery,
                [
                  projectId,
                  matchingStructure.projectComponent || "",
                  matchingStructure.structureNo || "",
                ],
                (err, result) => {
                  if (err) {
                    console.error("Error finding structure:", err);
                    reject(err);
                  } else if (result && result.length > 0) {
                    resolve(result[0].StructureID);
                  } else {
                    // Fall back to any structure for this project
                    findAnyStructure();
                  }
                }
              );
              return;
            }
          }

          // Fall back to any structure for this project
          findAnyStructure();

          function findAnyStructure() {
            db.query(
              "SELECT StructureID FROM project_structures WHERE ProjectID = ? LIMIT 1",
              [projectId],
              (err, result) => {
                if (err) {
                  console.error("Error finding any structure:", err);
                  reject(err);
                } else if (result && result.length > 0) {
                  console.log(
                    `Using fallback structure ID: ${result[0].StructureID}`
                  );
                  resolve(result[0].StructureID);
                } else {
                  console.warn("No structures found at all");
                  resolve(null);
                }
              }
            );
          }
        });
      }

      // 4. Insert samples
      function insertSamples(projectId, requestId) {
        return new Promise((resolve, reject) => {
          // Skip if no samples
          if (!SampleInfoSets || !SampleInfoSets.length) {
            console.log("No sample sets to insert");
            return resolve();
          }

          console.log(
            "Processing sample info sets:",
            JSON.stringify(SampleInfoSets)
          );

          // Process each sample set
          const sampleSetPromises = SampleInfoSets.map((sampleSet) => {
            return new Promise((resolveSampleSet, rejectSampleSet) => {
              // Skip if no samples in this set
              if (!sampleSet.samples || !sampleSet.samples.length) {
                return resolveSampleSet();
              }

              // Process each sample in the set
              const samplePromises = sampleSet.samples.map((sample) => {
                return new Promise((resolveSample, rejectSample) => {
                  // Skip if no borehole ID
                  if (!sample.boreholeId) {
                    console.warn("Sample missing boreholeId, skipping");
                    return resolveSample();
                  }

                  // Find the borehole in the database
                  const boreholeQuery = `
                    SELECT b.BoreholeID 
                    FROM project_boreholes b
                    JOIN project_structures s ON b.StructureID = s.StructureID
                    WHERE s.ProjectID = ? AND b.BoreholeNumber = ?
                  `;

                  db.query(
                    boreholeQuery,
                    [projectId, sample.boreholeId || ""],
                    (err, boreholeResult) => {
                      if (err) {
                        console.error("Error finding borehole:", err);
                        return rejectSample(err);
                      }

                      let boreholeId;

                      if (boreholeResult.length === 0) {
                        console.warn(
                          `Borehole not found for sample: ${sample.sampleId}`
                        );

                        // Try to get any borehole as fallback
                        db.query(
                          "SELECT b.BoreholeID FROM project_boreholes b JOIN project_structures s ON b.StructureID = s.StructureID WHERE s.ProjectID = ? LIMIT 1",
                          [projectId],
                          (err, anyBoreholeResult) => {
                            if (err) {
                              console.error("Error finding any borehole:", err);
                              return rejectSample(err);
                            }

                            if (anyBoreholeResult.length === 0) {
                              console.warn(
                                "No boreholes found at all, skipping sample"
                              );
                              return resolveSample();
                            }

                            boreholeId = anyBoreholeResult[0].BoreholeID;
                            insertSampleRecord(boreholeId);
                          }
                        );
                      } else {
                        boreholeId = boreholeResult[0].BoreholeID;
                        insertSampleRecord(boreholeId);
                      }

                      function insertSampleRecord(boreholeId) {
                        // Check if samples table exists first
                        db.query(
                          "SHOW TABLES LIKE 'project_samples'",
                          (err, tableResult) => {
                            if (err) {
                              console.error(
                                "Error checking for project_samples table:",
                                err
                              );
                              return rejectSample(err);
                            }

                            if (tableResult.length === 0) {
                              console.error(
                                "project_samples table does not exist!"
                              );
                              return rejectSample(
                                new Error("project_samples table missing")
                              );
                            }

                            // Insert the sample
                            const sampleQuery = `
                              INSERT INTO project_samples (
                                BoreholeID, SampleNumber, SampleType, DepthFrom, DepthTo,
                                TL101Number, ContainerType, ContainerSizeOption, ContainerSizeManual,
                                Quantity, FieldCollectionDate, CreatedBy, RequestID
                              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            `;

                            const sampleParams = [
                              boreholeId,
                              sample.sampleId || "",
                              sample.sampleType || null,
                              sample.depthFrom || null,
                              sample.depthTo || null,
                              sample.tl101No || null,
                              sample.containerType || "Tube",
                              sample.containerSizeOption || null,
                              sample.containerSizeManual || null,
                              sample.quantity || null,
                              sample.fieldCollectionDate || null,
                              userName, // Use the already defined userName variable
                              requestId,
                            ];

                            db.query(
                              sampleQuery,
                              sampleParams,
                              (err, sampleResult) => {
                                if (err) {
                                  console.error("Error inserting sample:", err);
                                  rejectSample(err);
                                } else {
                                  console.log(
                                    `Sample created with ID: ${sampleResult.insertId}`
                                  );
                                  resolveSample(sampleResult);
                                }
                              }
                            );
                          }
                        );
                      }
                    }
                  );
                });
              });

              // Wait for all samples in this set to be processed
              Promise.all(samplePromises)
                .then(() => resolveSampleSet())
                .catch((err) => rejectSampleSet(err));
            });
          });

          // Wait for all sample sets to be processed
          Promise.all(sampleSetPromises)
            .then(() => resolve())
            .catch((err) => reject(err));
        });
      }

      // 5. Insert tests
      function insertTests(projectId, requestId) {
        return new Promise((resolve, reject) => {
          if (!TestsInfo || !TestsInfo.testRows || !TestsInfo.testRows.length) {
            console.log("No tests to insert");
            return resolve();
          }

          console.log(
            "Processing test rows:",
            JSON.stringify(TestsInfo.testRows)
          );

          const parseDepthPair = (raw) => {
            if (!raw) return { depthFrom: null, depthTo: null };
            const m = String(raw).match(
              /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/
            );
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

          const resolveSampleIdForTestRow = (testRow) =>
            new Promise((resolveSample, rejectSample) => {
              const submittedSample = findSubmittedSample(testRow?.id);

              let boreholeNum = submittedSample?.boreholeId ?? null;
              let sampleNumber = submittedSample?.sampleId ?? null;
              let depthFrom =
                submittedSample?.depthFrom != null
                  ? Number(submittedSample.depthFrom)
                  : null;
              let depthTo =
                submittedSample?.depthTo != null
                  ? Number(submittedSample.depthTo)
                  : null;

              if (!boreholeNum) {
                const raw = testRow?.boreholeSample;
                if (typeof raw === "string" && raw.includes(" - ")) {
                  boreholeNum = raw
                    .split(" - ")[0]
                    .replace("Borehole:", "")
                    .trim();
                  const depths = parseDepthPair(raw);
                  if (depthFrom == null) depthFrom = depths.depthFrom;
                  if (depthTo == null) depthTo = depths.depthTo;
                } else if (raw) {
                  boreholeNum = String(raw).replace("Borehole:", "").trim();
                }
              }

              if (!boreholeNum) return resolveSample(null);

              const sampleQuery = `
                SELECT s.SampleID
                FROM project_samples s
                JOIN project_boreholes b ON s.BoreholeID = b.BoreholeID
                WHERE b.BoreholeNumber = ?
                  AND s.RequestID = ?
                  AND (
                    ( ? IS NOT NULL AND s.SampleNumber = ? )
                    OR
                    ( ? IS NOT NULL AND ? IS NOT NULL AND s.DepthFrom = ? AND s.DepthTo = ? )
                  )
                ORDER BY s.SampleID DESC
                LIMIT 1
              `;

              const params = [
                boreholeNum,
                requestId,
                sampleNumber,
                sampleNumber,
                depthFrom,
                depthTo,
                depthFrom,
                depthTo,
              ];

              db.query(sampleQuery, params, (err, rows) => {
                if (err) return rejectSample(err);
                const row = Array.isArray(rows) ? rows[0] : null;
                resolveSample(row ? row.SampleID : null);
              });
            });

          const insertTestForSample = (sampleId, testName) =>
            new Promise((resolveTest, rejectTest) => {
              const testTypeQuery = `
                SELECT TestTypeID FROM test_type WHERE TestName = ?
              `;

              db.query(testTypeQuery, [testName], (err, testTypeResult) => {
                if (err) return rejectTest(err);
                if (!testTypeResult || testTypeResult.length === 0)
                  return resolveTest();

                const testTypeId = testTypeResult[0].TestTypeID;
                const testQuery = `
                  INSERT INTO project_tests (
                    SampleID, TestTypeID, Status, RequestingUser, RequestedDate, CreatedBy
                  ) VALUES (?, ?, ?, ?, CURDATE(), ?)
                `;
                const testParams = [
                  sampleId,
                  testTypeId,
                  "Requested",
                  userName,
                  userName,
                ];

                db.query(testQuery, testParams, (err2) => {
                  if (err2) return rejectTest(err2);
                  resolveTest();
                });
              });
            });

          const testRowPromises = TestsInfo.testRows.map((testRow) =>
            resolveSampleIdForTestRow(testRow).then((sampleId) => {
              if (!sampleId) return null;
              if (!testRow?.tests || testRow.tests.length === 0) return null;
              return Promise.all(
                testRow.tests.map((testName) =>
                  insertTestForSample(sampleId, testName)
                )
              );
            })
          );

          Promise.all(testRowPromises)
            .then(() => resolve())
            .catch((err) => reject(err));
        });
      }

      // Commit transaction
      function commitTransaction() {
        return new Promise((resolve, reject) => {
          db.commit((err) => {
            if (err) {
              console.error("Error committing transaction:", err);
              db.rollback(() => {
                reject(err);
              });
            } else {
              console.log("Transaction committed successfully");
              res.status(201).json({
                message: "Project created successfully",
                projectId,
              });
              resolve();
            }
          });
        });
      }

      // Handle errors
      function handleError(error) {
        console.error("Error in transaction:", error);
        db.rollback(() => {
          console.error("Transaction rolled back due to error");
          res
            .status(500)
            .json({ message: "Error creating project", error: error.message });
        });
      }
    });
  });

  return router;
};
