const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // POST /api/requests - Staff submits a form
  router.post("/", (req, res) => {
    const data = req.body;
    // 1. Insert into test_request
    const requestSql = `INSERT INTO test_request (
      Office, Branch, RequesterName, RequesterEmail, RequesterPhone, SupervisorName, SupervisorEmail, SupervisorPhone,
      TestResultsDueDate, DateOfRequest, ProjectID, EA, StructureNo, District, County, Route, PM, ProjectComponent,
      ChargingProjectID, ChargingUnit, ReportingCode, Phase, SubObject, Activity, SubActivity, NumSamples, ExpectedSampleReceiptDate, Comments, Status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const requestValues = [
      data.office,
      data.branch,
      data.requesterName,
      data.requesterEmail,
      data.requesterPhone,
      data.supervisorName,
      data.supervisorEmail,
      data.supervisorPhone,
      data.testResultsDueDate,
      data.dateOfRequest,
      data.projectID,
      data.ea,
      data.structureNo,
      data.district,
      data.county,
      data.route,
      data.pm,
      data.projectComponent,
      data.chargingProjectID,
      data.chargingUnit,
      data.reportingCode,
      data.phase,
      data.subObject,
      data.activity,
      data.subActivity,
      data.numSamples,
      data.expectedSampleReceiptDate,
      data.comments,
      "pending",
    ];

    db.query(requestSql, requestValues, (err, result) => {
      if (err) {
        console.error("Error inserting into test_request:", err);
        return res.status(500).json({ message: "Database error (test_request)" });
      }
      const requestId = result.insertId;
      // 2. Insert into test_request_details for each sample/test
      const details = data.details; // Array of { sampleNumber, boreholeID, depthFrom, depthTo, TL101No, tubeJar, quantity, fieldCollectionDate, testTypeId, sameAsSampleNo, comments }
      if (!Array.isArray(details) || details.length === 0) {
        return res.status(400).json({ message: "No test details provided" });
      }
      const detailSql = `INSERT INTO test_request_details (
        RequestID, SampleNumber, BoreholeID, DepthFrom, DepthTo, TL101No, TubeJar, Quantity, FieldCollectionDate, TestTypeID, SameAsSampleNo, Comments
      ) VALUES ?`;
      const detailValues = details.map((d) => [
        requestId,
        d.sampleNumber,
        d.boreholeID,
        d.depthFrom,
        d.depthTo,
        d.TL101No,
        d.tubeJar,
        d.quantity,
        d.fieldCollectionDate,
        d.testTypeId,
        d.sameAsSampleNo,
        d.comments,
      ]);
      db.query(detailSql, [detailValues], (err2, result2) => {
        if (err2) {
          console.error("Error inserting into test_request_details:", err2);
          return res
            .status(500)
            .json({ message: "Database error (test_request_details)" });
        }
        res.json({ message: "Request submitted successfully", requestId });
      });
    });
  });

  return router;
}; 