// routes/supervisor.js
const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // ... your existing GET routes ...

  // PATCH /api/supervisor/requests/:id/status
  router.patch("/requests/:id/status", (req, res) => {
    const requestId = req.params.id;
    const { status, assignedStaff, dateOfApproval } = req.body;

    // Whitelist allowed statuses
    const allowed = new Set(["pending", "approved", "rejected", "in-progress", "completed"]);
    if (!status || !allowed.has(status)) {
      return res.status(400).json({ message: "Invalid or missing status." });
    }

    // Build dynamic SET clause based on provided fields
    const fields = ["Status = ?"];
    const values = [status];

    if (assignedStaff !== undefined) {
      fields.push("AssignedStaff = ?");
      values.push(assignedStaff || "");
    }
    if (dateOfApproval !== undefined) {
      // Expect YYYY-MM-DD (or null to clear)
      fields.push("DateOfApproval = ?");
      values.push(dateOfApproval || null);
    }

    const sql = `UPDATE test_request SET ${fields.join(", ")} WHERE RequestID = ?`;
    values.push(requestId);

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error updating request status:", err);
        return res.status(500).json({ message: "Database error: " + err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Request not found." });
      }
      res.json({ message: "Status updated.", requestId, status, assignedStaff, dateOfApproval });
    });
  });

  return router;
};
