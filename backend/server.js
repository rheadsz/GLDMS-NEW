const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3001;

console.log('Starting server.js...');

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'gldms_2025',
  port: 3306
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to database:', err.stack);
    return;
  }
  console.log('Connected to database as id ' + db.threadId);
});

app.get('/api/test-types', (req, res) => {
  const query = 'SELECT * FROM test_type';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.json(results);
  });
});

app.post('/api/login', (req, res) => {
  // Log the incoming request body (for debugging)
  console.log('Login attempt:', req.body);

  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE UserName = ? AND Password = ? LIMIT 1';

  // Log the query and parameters
  console.log('Executing query:', query, 'with params:', [username, password]);

  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    // Log the results from the database
    console.log('Query results:', results);

    if (results.length === 0) {
      console.log('Invalid username or password');
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    // Return userType (role) to frontend
    const user = results[0];
    console.log('Login successful, userType:', user.UserType);
    res.json({ userType: user.UserType });
  });
});

app.post('/api/requests', (req, res) => {
  const data = req.body;
  // 1. Insert into test_request
  const requestSql = `INSERT INTO test_request (
    Office, Branch, RequesterName, RequesterEmail, RequesterPhone, SupervisorName, SupervisorEmail, SupervisorPhone,
    TestResultsDueDate, DateOfRequest, ProjectID, EA, StructureNo, District, County, Route, PM, ProjectComponent,
    ChargingProjectID, ChargingUnit, ReportingCode, Phase, SubObject, Activity, SubActivity, NumSamples, ExpectedSampleReceiptDate, Comments, Status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const requestValues = [
    data.office, data.branch, data.requesterName, data.requesterEmail, data.requesterPhone, data.supervisorName, data.supervisorEmail, data.supervisorPhone,
    data.testResultsDueDate, data.dateOfRequest, data.projectID, data.ea, data.structureNo, data.district, data.county, data.route, data.pm, data.projectComponent,
    data.chargingProjectID, data.chargingUnit, data.reportingCode, data.phase, data.subObject, data.activity, data.subActivity, data.numSamples, data.expectedSampleReceiptDate, data.comments, 'pending'
  ];

  db.query(requestSql, requestValues, (err, result) => {
    if (err) {
      console.error('Error inserting into test_request:', err);
      return res.status(500).json({ message: 'Database error (test_request)' });
    }
    const requestId = result.insertId;
    // 2. Insert into test_request_details for each sample/test
    const details = data.details; // Array of { sampleNumber, boreholeID, depthFrom, depthTo, TL101No, tubeJar, quantity, fieldCollectionDate, testTypeId, sameAsSampleNo, comments }
    if (!Array.isArray(details) || details.length === 0) {
      return res.status(400).json({ message: 'No test details provided' });
    }
    const detailSql = `INSERT INTO test_request_details (
      RequestID, SampleNumber, BoreholeID, DepthFrom, DepthTo, TL101No, TubeJar, Quantity, FieldCollectionDate, TestTypeID, SameAsSampleNo, Comments
    ) VALUES ?`;
    const detailValues = details.map(d => [
      requestId, d.sampleNumber, d.boreholeID, d.depthFrom, d.depthTo, d.TL101No, d.tubeJar, d.quantity, d.fieldCollectionDate, d.testTypeId, d.sameAsSampleNo, d.comments
    ]);
    db.query(detailSql, [detailValues], (err2, result2) => {
      if (err2) {
        console.error('Error inserting into test_request_details:', err2);
        return res.status(500).json({ message: 'Database error (test_request_details)' });
      }
      res.json({ message: 'Request submitted successfully', requestId });
    });
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});