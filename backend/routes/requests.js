// backend/routes/requests.js
const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // POST /api/requests - create a new test request + detail rows
  router.post("/", (req, res) => {
    const {
      office, branch, requesterName, requesterEmail, requesterPhone,
      supervisorName, supervisorEmail, supervisorPhone,
      testResultsDueDate, dateOfRequest,
      projectID, ea, structureNo, district, county, route, pm, projectComponent,
      chargingProjectID, chargingUnit, reportingCode, phase, subObject, activity, subActivity,
      numSamples, expectedSampleReceiptDate, comments,
      details = []  // [{ sampleNumber, boreholeID, depthFrom, depthTo, TL101No, tubeJar, quantity, fieldCollectionDate, testTypeId, /* method */, sameAsSampleNo, comments }]
    } = req.body;

    db.beginTransaction((err) => {
      if (err) return res.status(500).json({ message: "TXN start error", error: err.message });

      const insertRequestSql = `
        INSERT INTO test_request (
          Office, Branch, RequesterName, RequesterEmail, RequesterPhone,
          SupervisorName, SupervisorEmail, SupervisorPhone,
          TestResultsDueDate, DateOfRequest,
          ProjectID, EA, StructureNo, District, County, Route, PM, ProjectComponent,
          ChargingProjectID, ChargingUnit, ReportingCode, Phase, SubObject, Activity, SubActivity,
          NumSamples, ExpectedSampleReceiptDate, Comments, Status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `;

      const requestVals = [
        office||"", branch||"", requesterName||"", requesterEmail||"", requesterPhone||"",
        supervisorName||"", supervisorEmail||"", supervisorPhone||"",
        testResultsDueDate||null, dateOfRequest||null,
        projectID||"", ea||"", structureNo||"", district||"", county||"", route||"", pm||"", projectComponent||"",
        chargingProjectID||"", chargingUnit||"", reportingCode||"", phase||"", subObject||"", activity||"", subActivity||"",
        numSamples||0, expectedSampleReceiptDate||null, comments||""
      ];

      db.query(insertRequestSql, requestVals, (err, result) => {
        if (err) {
          db.rollback(() => res.status(500).json({ message: "Insert request failed", error: err.message }));
          return;
        }
        const requestId = result.insertId;

        if (!details.length) {
          return db.commit((commitErr) => {
            if (commitErr) {
              db.rollback(() => res.status(500).json({ message: "Commit failed", error: commitErr.message }));
            } else {
              res.status(201).json({ message: "Request created", requestId });
            }
          });
        }

        const insertDetailSql = `
          INSERT INTO test_request_details (
            RequestID, SampleNumber, BoreholeID, DepthFrom, DepthTo, TL101No,
            TubeJar, Quantity, FieldCollectionDate, TestTypeID, SameAsSampleNo, Comments
          ) VALUES ?
        `;

        // NOTE: schema doesn't have a "Method" column; we omit it or add one later if needed. :contentReference[oaicite:6]{index=6}
        const values = details.map(d => ([
          requestId,
          d.sampleNumber||1,
          d.boreholeID||"",
          d.depthFrom||"",
          d.depthTo||"",
          d.TL101No||"",
          d.tubeJar||"",                // maps to TubeJar
          d.quantity||1,
          d.fieldCollectionDate||null,
          d.testTypeId,                 // must match test_type.TestTypeID
          d.sameAsSampleNo ?? null,
          d.comments||""
        ]));

        db.query(insertDetailSql, [values], (err) => {
          if (err) {
            db.rollback(() => res.status(500).json({ message: "Insert details failed", error: err.message }));
            return;
          }
          db.commit((commitErr) => {
            if (commitErr) {
              db.rollback(() => res.status(500).json({ message: "Commit failed", error: commitErr.message }));
            } else {
              res.status(201).json({ message: "Request + details created", requestId });
            }
          });
        });
      });
    });
  });

  return router;
};
