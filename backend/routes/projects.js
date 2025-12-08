const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // GET /api/projects - Get all projects
  router.get("/", (req, res) => {
    const sql = `
      SELECT 
        p.ProjectID as DBProjectID,
        p.EfisProjectId as ProjectID, 
        p.EfisProjectId,
        p.ProjectName,
        p.EA, 
        p.District, 
        p.County, 
        p.Route, 
        p.StructureNumber, 
        'Submitted' as Status,
        p.PMFrom,
        p.PMTo,
        '' as ProjectComponent,
        p.CreatedBy,
        p.CreatedAt
      FROM 
        project p
      ORDER BY 
        p.CreatedAt DESC
    `;

    db.query(sql, (err, results) => {
      if (err) {
        console.error("Error fetching projects:", err);
        return res.status(500).json({ message: "Database error: " + err.message });
      }
      
      // Add isYourProject flag based on user ID (this would be replaced with actual user authentication)
      // For demo purposes, we're marking random projects as "yours"
      const projectsWithFlag = results.map(project => ({
        ...project,
        isYourProject: Math.random() > 0.5 // Random assignment for demo
      }));
      
      res.json(projectsWithFlag);
    });
  });

  // GET /api/projects/:id/details - Get complete project hierarchy
  router.get("/:id/details", (req, res) => {
    const projectId = req.params.id;
    
    console.log(`[PROJECT DETAILS] Fetching details for project ID: ${projectId}`);
    
    // First, let's check what projects exist
    db.query('SELECT ProjectID, EfisProjectId FROM project LIMIT 5', (err, allProjects) => {
      if (!err) {
        console.log('[PROJECT DETAILS] Sample projects in DB:', allProjects);
      }
    });
    
    // Query to get project with all related data
    // Try matching by ProjectID (numeric) or EfisProjectId (string)
    const projectQuery = `
      SELECT 
        p.ProjectID,
        p.EfisProjectId,
        p.ProjectName,
        p.EA,
        p.District,
        p.County,
        p.Route,
        p.PMFrom,
        p.PMTo,
        p.StructureNumber,
        p.CreatedBy,
        p.CreatedAt
      FROM project p
      WHERE p.ProjectID = ? OR p.EfisProjectId = ? OR CAST(p.ProjectID AS CHAR) = ?
    `;
    
    db.query(projectQuery, [projectId, projectId, projectId], (err, projectResults) => {
      if (err) {
        console.error("Error fetching project:", err);
        return res.status(500).json({ message: "Database error: " + err.message });
      }
      
      console.log(`[PROJECT DETAILS] Query returned ${projectResults.length} results`);
      console.log('[PROJECT DETAILS] Project result:', projectResults[0]);
      
      if (projectResults.length === 0) {
        console.log(`[PROJECT DETAILS] Project not found with ID: ${projectId}`);
        return res.status(404).json({ 
          message: "Project not found", 
          searchedId: projectId,
          hint: "Make sure the project exists in the database"
        });
      }
      
      const project = projectResults[0];
      const dbProjectId = project.ProjectID;
      
      console.log(`[PROJECT DETAILS] Using database ProjectID: ${dbProjectId}`);
      
      // First, get the RequestID for this project (if it exists)
      const requestQuery = `SELECT RequestID FROM project_requests WHERE ProjectID = ? ORDER BY RequestDate DESC LIMIT 1`;
      
      db.query(requestQuery, [dbProjectId], (err, requestResults) => {
        if (err) {
          console.error("Error fetching request:", err);
        }
        
        const requestId = requestResults && requestResults.length > 0 ? requestResults[0].RequestID : null;
        console.log(`[PROJECT DETAILS] Found RequestID: ${requestId}`);
        
        // Get structures for this project (filter by RequestID if available)
        const structuresQuery = requestId 
          ? `SELECT s.StructureID, s.StructureNumber, s.ProjectComponent, s.CreatedAt
             FROM project_structures s
             WHERE s.ProjectID = ? AND s.RequestID = ?
             ORDER BY s.StructureID`
          : `SELECT s.StructureID, s.StructureNumber, s.ProjectComponent, s.CreatedAt
             FROM project_structures s
             WHERE s.ProjectID = ?
             ORDER BY s.StructureID`;
        
        const structureParams = requestId ? [dbProjectId, requestId] : [dbProjectId];
      
      db.query(structuresQuery, structureParams, (err, structures) => {
        if (err) {
          console.error("Error fetching structures:", err);
          return res.status(500).json({ message: "Database error: " + err.message });
        }
        
        console.log(`[PROJECT DETAILS] Found ${structures.length} structures`);
        
        if (structures.length === 0) {
          console.log('[PROJECT DETAILS] No structures found, returning empty result');
          return res.json({ project, structures: [] });
        }
        
        // Get all boreholes for these structures
        const structureIds = structures.map(s => s.StructureID);
        const boreholesQuery = `
          SELECT 
            b.BoreholeID,
            b.StructureID,
            b.BoreholeNumber,
            b.Latitude,
            b.Longitude,
            b.Northing,
            b.Easting,
            b.GroundSurfaceElevation,
            b.CreatedAt
          FROM project_boreholes b
          WHERE b.StructureID IN (?)
          ORDER BY b.BoreholeID
        `;
        
        db.query(boreholesQuery, [structureIds], (err, boreholes) => {
          if (err) {
            console.error("Error fetching boreholes:", err);
            return res.status(500).json({ message: "Database error: " + err.message });
          }
          
          console.log(`[PROJECT DETAILS] Found ${boreholes.length} boreholes`);
          
          if (boreholes.length === 0) {
            console.log('[PROJECT DETAILS] No boreholes found');
            const structuresWithBoreholes = structures.map(s => ({ ...s, boreholes: [] }));
            return res.json({ project, structures: structuresWithBoreholes });
          }
          
          // Get all samples for these boreholes
          const boreholeIds = boreholes.map(b => b.BoreholeID);
          const samplesQuery = `
            SELECT 
              s.SampleID,
              s.BoreholeID,
              s.SampleNumber,
              s.DepthFrom,
              s.DepthTo,
              s.TL101Number,
              s.ContainerType,
              s.Quantity,
              s.FieldCollectionDate,
              s.CreatedAt
            FROM project_samples s
            WHERE s.BoreholeID IN (?)
            ORDER BY s.SampleID
          `;
          
          db.query(samplesQuery, [boreholeIds], (err, samples) => {
            if (err) {
              console.error("Error fetching samples:", err);
              return res.status(500).json({ message: "Database error: " + err.message });
            }
            
            if (samples.length === 0) {
              const boreholesWithSamples = boreholes.map(b => ({ ...b, samples: [] }));
              const structuresWithBoreholes = structures.map(s => ({
                ...s,
                boreholes: boreholesWithSamples.filter(b => b.StructureID === s.StructureID)
              }));
              return res.json({ project, structures: structuresWithBoreholes });
            }
            
            // Get all tests for these samples
            const sampleIds = samples.map(s => s.SampleID);
            console.log(`[PROJECT DETAILS] Found ${samples.length} samples, IDs:`, sampleIds);
            
            // Debug: Check if any tests exist at all
            db.query('SELECT COUNT(*) as count FROM project_tests', (err, countResult) => {
              if (!err) {
                console.log(`[PROJECT DETAILS] Total tests in database: ${countResult[0].count}`);
              }
            });
            
            // Debug: Check if tests exist for these specific samples
            db.query('SELECT SampleID, COUNT(*) as count FROM project_tests WHERE SampleID IN (?) GROUP BY SampleID', [sampleIds], (err, sampleTestCounts) => {
              if (!err) {
                console.log(`[PROJECT DETAILS] Tests per sample:`, sampleTestCounts);
              }
            });
            
            const testsQuery = `
              SELECT 
                t.TestID,
                t.SampleID,
                t.TestTypeID,
                COALESCE(tt.TestName, CONCAT('Test Type ', t.TestTypeID)) as TestName,
                t.Status,
                t.RequestingUser,
                t.RequestedDate,
                t.CompletedDate,
                t.CreatedAt,
                t.RequestID
              FROM project_tests t
              LEFT JOIN test_type tt ON t.TestTypeID = tt.TestTypeID
              WHERE t.SampleID IN (?)
              ORDER BY t.TestID
            `;
            
            db.query(testsQuery, [sampleIds], (err, tests) => {
              if (err) {
                console.error("Error fetching tests:", err);
                return res.status(500).json({ message: "Database error: " + err.message });
              }
              
              console.log(`[PROJECT DETAILS] Found ${tests.length} tests for samples`);
              if (tests.length > 0) {
                console.log('[PROJECT DETAILS] Sample test:', tests[0]);
              }
              
              // Build the hierarchy
              const samplesWithTests = samples.map(sample => ({
                ...sample,
                tests: tests.filter(t => t.SampleID === sample.SampleID)
              }));
              
              const boreholesWithSamples = boreholes.map(borehole => ({
                ...borehole,
                samples: samplesWithTests.filter(s => s.BoreholeID === borehole.BoreholeID)
              }));
              
              const structuresWithBoreholes = structures.map(structure => ({
                ...structure,
                boreholes: boreholesWithSamples.filter(b => b.StructureID === structure.StructureID)
              }));
              
              res.json({
                project,
                structures: structuresWithBoreholes
              });
            });
          });
        });
      });
      }); // Close requestQuery callback
    });
  });

  // GET /api/projects/:id - Get a specific project
  router.get("/:id", (req, res) => {
    const projectId = req.params.id;
    const sql = `
      SELECT 
        p.*, 
        p.GLTrackNumber as EfisProjectId,
        (
          SELECT COUNT(*) 
          FROM test_request tr 
          WHERE tr.ProjectID = p.ProjectID
        ) as requestCount,
        (
          SELECT COUNT(*) 
          FROM samples s 
          WHERE s.ProjectID = p.ProjectID
        ) as sampleCount
      FROM 
        project p
      WHERE 
        p.ProjectID = ?
    `;

    db.query(sql, [projectId], (err, results) => {
      if (err) {
        console.error("Error fetching project:", err);
        return res.status(500).json({ message: "Database error: " + err.message });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(results[0]);
    });
  });

  // POST /api/projects - Create a new project
  router.post("/", (req, res) => {
    const data = req.body;
    const today = new Date();
    const dateCreated = today.toISOString().split('T')[0];
    
    // Required fields
    if (!data.projectID || !data.district) {
      return res.status(400).json({ message: "Project ID and District are required" });
    }
    
    const sql = `
      INSERT INTO project (
        ProjectID, EA, District, County, StructureNo, Route, PMFrom, PMTo, 
        ProjectComponent, Status, CreatedBy, CreatedAt, GLTrackNumber, ProjectName
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      data.projectID,
      data.ea || '',
      data.district,
      data.county || '',
      data.structureNo || '',
      data.route || '',
      data.pmFrom || data.pm || '',
      data.pmTo || data.pm || '',
      data.projectComponent || '',
      'active', // Default status
      data.createdBy || 'system',
      dateCreated,
      data.efisProjectId || data.projectID, // EfisProjectId if provided, otherwise  projectID
      data.projectName || ''
    ];
    
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error creating project:", err);
        return res.status(500).json({ message: "Database error: " + err.message });
      }
      
      res.status(201).json({ 
        message: "Project created successfully", 
        projectId: data.projectID 
      });
    });
  });

  return router;
};
