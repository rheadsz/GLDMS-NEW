const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // GET /api/projects - Get all projects
  router.get("/", (req, res) => {
    const sql = `
      SELECT 
        p.ProjectID, 
        p.GLTrackNumber as EfisProjectId,
        p.ProjectName,
        p.EA, 
        p.District, 
        p.County as CountyCode, 
        p.Route as RouteCode, 
        p.StructureNumber as StructureNo, 
        'active' as Status,
        p.PMFrom as PostmileBegin,
        p.PMTo as PostmileEnd,
        '' as ProjectComponent,
        p.ClientLastName as CreatedBy,
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
      data.efisProjectId || data.projectID, // Use EfisProjectId if provided, otherwise use projectID
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
