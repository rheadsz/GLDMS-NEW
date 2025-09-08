const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // GET /api/user-projects/:username - Get projects for a specific user
  router.get("/:username", (req, res) => {
    const username = req.params.username;
    
    const sql = `
      SELECT 
        p.EfisProjectId as ProjectID, 
        p.EfisProjectId,
        p.ProjectName,
        p.EA, 
        p.District, 
        p.County, 
        p.Route, 
        p.StructureNumber, 
        'Submitted' as Status,
        p.CreatedBy
      FROM 
        project p
      WHERE 
        p.CreatedBy = ?
      ORDER BY 
        p.ProjectID DESC
    `;

    db.query(sql, [username], (err, results) => {
      if (err) {
        console.error("Error fetching user projects:", err);
        return res.status(500).json({ message: "Database error: " + err.message });
      }
      
      res.json({ projects: results });
    });
  });

  return router;
};
