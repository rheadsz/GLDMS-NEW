const express = require("express");
const router = express.Router();

module.exports = (models) => {
  const { Project } = models;

  // GET /api/user-projects/:username - Get projects for a specific user
  router.get("/:username", async (req, res) => {
    const username = req.params.username;

    try {
      const projects = await Project.findAll({
        where: { CreatedBy: username },
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
          "CreatedBy",
        ],
        order: [["ProjectID", "DESC"]],
      });

      const results = projects.map((p) => ({
        ...p.toJSON(),
        Status: "Submitted",
      }));

      res.json({ projects: results });
    } catch (err) {
      console.error("Error fetching user projects:", err);
      return res
        .status(500)
        .json({ message: "Database error: " + err.message });
    }
  });

  return router;
};
