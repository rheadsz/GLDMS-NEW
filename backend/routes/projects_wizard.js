const express = require('express');
const router = express.Router();

/**
 * @route   POST /api/projects/wizard
 * @desc    Submit project wizard data
 * @access  Private
 */
module.exports = (db) => {
  // Submit complete project wizard data
  router.post('/wizard', async (req, res) => {
    try {
      const {
        ProjectInfo,
        Boreholes,
        SampleInfoSets,
        TestsInfo
      } = req.body;

      // Start a transaction
      db.beginTransaction(async (err) => {
        if (err) {
          console.error('Error starting transaction:', err);
          return res.status(500).json({ message: 'Error starting database transaction' });
        }

        try {
          // 1. Insert project information
          const projectResult = await new Promise((resolve, reject) => {
            const projectQuery = `
              INSERT INTO project (
                ProjectName, EA, District, County, Route, 
                PMFrom, PMTo, StructureNumber, CreatedBy, EfisProjectId
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            db.query(
              projectQuery,
              [
                ProjectInfo.projectName || '',
                ProjectInfo.ea || '',
                ProjectInfo.district || '',
                ProjectInfo.county || '',
                ProjectInfo.route || '',
                ProjectInfo.pmStart || '',
                ProjectInfo.pmEnd || '',
                ProjectInfo.structureNo || '',
                req.body.userName || 'System',
                ProjectInfo.projectID || ProjectInfo.efisProjectId || ProjectInfo.efisId || ''
              ],
              (err, result) => {
                if (err) reject(err);
                else resolve(result);
              }
            );
          });

          const projectId = projectResult.insertId;
          console.log(`Project created with ID: ${projectId}`);
          
          // 2. Create a record in the project_requests table
          const requestResult = await new Promise((resolve, reject) => {
            const requestQuery = `
              INSERT INTO project_requests (
                ProjectID, RequestingUser, Status, Notes
              ) VALUES (?, ?, ?, ?)
            `;
            
            db.query(
              requestQuery,
              [
                projectId,
                req.body.userName || 'System',
                'Submitted',
                'Initial project submission'
              ],
              (err, result) => {
                if (err) reject(err);
                else resolve(result);
              }
            );
          });
          
          const requestId = requestResult.insertId;
          console.log(`Request created with ID: ${requestId}`);

          // 2. Insert structures
          if (Boreholes && Boreholes.structures && Boreholes.structures.length > 0) {
            for (const structure of Boreholes.structures) {
              // Insert structure
              const structureResult = await new Promise((resolve, reject) => {
                const structureQuery = `
                  INSERT INTO project_structures (
                    ProjectID, StructureNumber, CreatedBy, RequestID
                  ) VALUES (?, ?, ?, ?)
                `;
                
                db.query(
                  structureQuery,
                  [
                    projectId,
                    structure.structureId || '',
                    req.body.userName || 'System',
                    requestId
                  ],
                  (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                  }
                );
              });

              const structureId = structureResult.insertId;
              console.log(`Structure created with ID: ${structureId}`);

              // Insert boreholes for this structure
              if (structure.boreholes && structure.boreholes.length > 0) {
                for (const borehole of structure.boreholes) {
                  const boreholeResult = await new Promise((resolve, reject) => {
                    const boreholeQuery = `
                      INSERT INTO project_boreholes (
                        StructureID, BoreholeNumber, Latitude, Longitude,
                        Northing, Easting, GroundSurfaceElevation, CreatedBy, RequestID
                      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    
                    db.query(
                      boreholeQuery,
                      [
                        structureId,
                        borehole.boreholeId || '',
                        borehole.latitude || null,
                        borehole.longitude || null,
                        borehole.northing || null,
                        borehole.easting || null,
                        borehole.groundSurfaceElevation || null,
                        req.body.userName || 'System',
                        requestId
                      ],
                      (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                      }
                    );
                  });

                  const boreholeId = boreholeResult.insertId;
                  console.log(`Borehole created with ID: ${boreholeId}`);
                }
              }
            }
          }

          // 3. Insert samples
          if (SampleInfoSets && SampleInfoSets.length > 0) {
            for (const sampleSet of SampleInfoSets) {
              if (sampleSet.samples && sampleSet.samples.length > 0) {
                for (const sample of sampleSet.samples) {
                  // Find the borehole ID based on borehole number
                  const boreholeResult = await new Promise((resolve, reject) => {
                    const boreholeQuery = `
                      SELECT b.BoreholeID 
                      FROM project_boreholes b
                      JOIN project_structures s ON b.StructureID = s.StructureID
                      WHERE s.ProjectID = ? AND b.BoreholeNumber = ?
                    `;
                    
                    db.query(
                      boreholeQuery,
                      [projectId, sample.boreholeId || ''],
                      (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                      }
                    );
                  });

                  if (boreholeResult.length === 0) {
                    console.warn(`Borehole not found for sample: ${sample.sampleId}`);
                    continue;
                  }

                  const boreholeId = boreholeResult[0].BoreholeID;

                  // Insert sample
                  const sampleResult = await new Promise((resolve, reject) => {
                    const sampleQuery = `
                      INSERT INTO project_samples (
                        BoreholeID, SampleNumber, DepthFrom, DepthTo,
                        TL101Number, ContainerType, Quantity, FieldCollectionDate, CreatedBy, RequestID
                      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    
                    db.query(
                      sampleQuery,
                      [
                        boreholeId,
                        sample.sampleId || '',
                        sample.depthFrom || null,
                        sample.depthTo || null,
                        sample.tl101No || null,
                        sample.containerType || 'Tube',
                        sample.quantity || null,
                        sample.fieldCollectionDate || null,
                        req.body.userName || 'System',
                        requestId
                      ],
                      (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                      }
                    );
                  });

                  const sampleId = sampleResult.insertId;
                  console.log(`Sample created with ID: ${sampleId}`);
                }
              }
            }
          }

          // 4. Insert tests
          if (TestsInfo && TestsInfo.testRows && TestsInfo.testRows.length > 0) {
            for (const testRow of TestsInfo.testRows) {
              // Parse the borehole-sample string to get borehole ID and depth
              const boreholeSampleParts = (testRow.boreholeSample || '').split(' - ');
              if (boreholeSampleParts.length < 2) continue;
              
              const boreholeId = boreholeSampleParts[0];
              
              // Find the sample ID based on borehole ID and depth
              const sampleResult = await new Promise((resolve, reject) => {
                const sampleQuery = `
                  SELECT s.SampleID 
                  FROM project_samples s
                  JOIN project_boreholes b ON s.BoreholeID = b.BoreholeID
                  WHERE b.BoreholeNumber = ?
                `;
                
                db.query(
                  sampleQuery,
                  [boreholeId],
                  (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                  }
                );
              });

              if (sampleResult.length === 0) {
                console.warn(`Sample not found for test: ${testRow.boreholeSample}`);
                continue;
              }

              const sampleId = sampleResult[0].SampleID;

              // Insert tests for this sample
              if (testRow.tests && testRow.tests.length > 0) {
                for (const testName of testRow.tests) {
                  // Find the test type ID based on test name
                  const testTypeResult = await new Promise((resolve, reject) => {
                    const testTypeQuery = `
                      SELECT TestTypeID FROM test_type WHERE TestName = ?
                    `;
                    
                    db.query(
                      testTypeQuery,
                      [testName],
                      (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                      }
                    );
                  });

                  if (testTypeResult.length === 0) {
                    console.warn(`Test type not found: ${testName}`);
                    continue;
                  }

                  const testTypeId = testTypeResult[0].TestTypeID;

                  // Insert test
                  const testResult = await new Promise((resolve, reject) => {
                    const testQuery = `
                      INSERT INTO project_tests (
                        SampleID, TestTypeID, Status, RequestingUser, RequestedDate, CreatedBy, RequestID
                      ) VALUES (?, ?, ?, ?, CURDATE(), ?, ?)
                    `;
                    
                    db.query(
                      testQuery,
                      [
                        sampleId,
                        testTypeId,
                        'Requested',
                        req.body.userName || null,  // Store the requesting user's name
                        req.body.userName || 'System',
                        requestId
                      ],
                      (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                      }
                    );
                  });

                  const testId = testResult.insertId;
                  console.log(`Test created with ID: ${testId}`);
                }
              }
            }
          }

          // Commit the transaction
          db.commit((err) => {
            if (err) {
              console.error('Error committing transaction:', err);
              return db.rollback(() => {
                res.status(500).json({ message: 'Error committing transaction' });
              });
            }

            res.status(201).json({ 
              message: 'Project created successfully', 
              projectId 
            });
          });
        } catch (error) {
          // Rollback the transaction in case of error
          db.rollback(() => {
            console.error('Error in transaction, rolled back:', error);
            res.status(500).json({ message: 'Error creating project', error: error.message });
          });
        }
      });
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  return router;
};
