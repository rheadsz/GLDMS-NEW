// routes/staffrequests.js
const express = require("express");
const router = express.Router();

module.exports = (models) => {
  const { ProjectRequests } = models;

  // PATCH /api/requests/:id/status
  router.patch("/:id/status", async (req, res) => {
    const requestId = req.params.id;
    const { status, assignedStaff, dateOfApproval } = req.body;

    // Whitelist allowed statuses
    const allowed = new Set([
      "pending",
      "approved",
      "rejected",
      "in-progress",
      "completed",
      "Submitted",
      "In Progress",
      "Completed",
      "Rejected",
      "PendingApproval",
      "Assigned",
    ]);
    if (!status || !allowed.has(status)) {
      return res.status(400).json({ message: "Invalid or missing status." });
    }

    try {
      // Build update object
      const updateData = { Status: status };

      const [affectedRows] = await ProjectRequests.update(updateData, {
        where: { RequestID: requestId },
      });

      if (affectedRows === 0) {
        return res.status(404).json({ message: "Request not found." });
      }

      res.json({
        message: "Status updated.",
        requestId,
        status,
        assignedStaff,
        dateOfApproval,
      });
    } catch (err) {
      console.error("Error updating request status:", err);
      return res
        .status(500)
        .json({ message: "Database error: " + err.message });
    }
  });

  return router;
};
