const express = require("express");
const router = express.Router();
const { sendRequestNotifications } = require('../utils/emailService');

module.exports = (db) => {
  // POST /api/requests - Staff submits a form
  router.post("/", (req, res) => {
    console.log('Received form submission:', JSON.stringify(req.body, null, 2));
    const data = req.body;
    // Sets DateOfRequest to today (YYYY-MM-DD)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateOfRequest = `${yyyy}-${mm}-${dd}`;

    try {
      // 1. Insert into test_request table
      const sql = `INSERT INTO test_request (
        Office, Branch, RequesterName, RequesterEmail, RequesterPhone, SupervisorName, SupervisorEmail, SupervisorPhone,
        TestResultsDueDate, DateOfRequest, ProjectID, EA, StructureNo, District, County, Route, PM, ProjectComponent,
        ChargingProjectID, ChargingUnit, ReportingCode, Phase, SubObject, Activity, SubActivity, NumSamples, ExpectedSampleReceiptDate, Comments, Status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const values = [
        data.office || '',
        data.branch || '',
        data.requesterName || '',
        data.requesterEmail || '',
        data.requesterPhone || '',
        data.supervisorName || '',
        data.supervisorEmail || '',
        data.supervisorPhone || '',
        data.testResultsDueDate || dateOfRequest, // Use today's date as default
        dateOfRequest,
        data.projectID || '',
        data.ea || '',
        data.structureNo || '',
        data.district || '',
        data.county || '',
        data.route || '',
        data.pm || '',
        data.projectComponent || '',
        data.chargingProjectID || '',
        data.chargingUnit || '',
        data.reportingCode || '',
        data.phase || '',
        data.subObject || '',
        data.activity || '',
        data.subActivity || '',
        data.numSamples || 0,
        data.expectedSampleReceiptDate || null, // Use null instead of empty string for date fields
        data.comments || '',
        'pending' // Default status
      ];

      db.query(sql, values, (err, result) => {
        if (err) {
          console.error("Error inserting into test_request:", err);
          return res
            .status(500)
            .json({ message: "Database error (test_request): " + err.message });
        }

        // Get the inserted ID
        const requestId = result.insertId;
        console.log('Successfully inserted test_request with ID:', requestId);
        
        // 2. Insert into test_request_details for each sample/test
        const details = data.details; // Array of { sampleNumber, boreholeID, depthFrom, depthTo, TL101No, tubeJar, quantity, fieldCollectionDate, testTypeId, method, sameAsSampleNo, comments }
        
        if (!Array.isArray(details)) {
          return res.status(400).json({ message: "Invalid test details format" });
        }
        
        if (details.length === 0) {
          console.log('No tests selected. Creating request without test details.');
          return res.json({ message: "Request submitted successfully without test details", requestId });
        }
        
        console.log('Details to insert:', JSON.stringify(details, null, 2));
        
        // Prepare the values for batch insert
        const detailValues = details.map((d) => [
          requestId,
          d.sampleNumber || 1,
          d.boreholeID || '',
          d.depthFrom || '',
          d.depthTo || '',
          d.TL101No || '',
          d.tubeJar || '',
          d.quantity || 1,
          d.fieldCollectionDate || null,
          d.testTypeId || 0,
          d.method || '', // Add the selected method
          d.sameAsSampleNo || null,
          d.comments || '',
        ]);
        
        console.log('Values to insert:', JSON.stringify(detailValues, null, 2));
        
        // Use a simplified SQL query to avoid potential syntax issues
        const detailSql = `INSERT INTO test_request_details 
          (RequestID, SampleNumber, BoreholeID, DepthFrom, DepthTo, TL101No, TubeJar, Quantity, FieldCollectionDate, TestTypeID, Method, SameAsSampleNo, Comments) 
          VALUES ?`;
        
        db.query(detailSql, [detailValues], (err2, result2) => {
          if (err2) {
            console.error("Error inserting into test_request_details:", err2);
            return res
              .status(500)
              .json({ message: "Database error (test_request_details): " + err2.message });
          }
          
          console.log('Successfully inserted test_request_details');
          
          // Send email notifications to requester and supervisor
          try {
            sendRequestNotifications(data, requestId, details)
              .then(emailResults => {
                console.log('Email notifications sent:', emailResults);
                res.json({ 
                  message: "Request submitted successfully and notifications sent", 
                  requestId,
                  emailsSent: true
                });
              })
              .catch(emailErr => {
                console.error('Failed to send email notifications:', emailErr);
                // Still return success for the request, but note that emails failed
                res.json({ 
                  message: "Request submitted successfully but email notifications failed", 
                  requestId,
                  emailsSent: false
                });
              });
          } catch (emailError) {
            console.error('Error in email notification process:', emailError);
            // Still return success for the request, but note that emails failed
            res.json({ 
              message: "Request submitted successfully but email notifications failed", 
              requestId,
              emailsSent: false
            });
          }
        });
      });
    } catch (error) {
      console.error("Exception in request processing:", error);
      return res.status(500).json({ message: "Server error: " + error.message });
    }
  });

  return router;
};