use GLDMS_2025;
SELECT TestName, Method FROM test_type;
ALTER TABLE users
ADD COLUMN Password VARCHAR(255) NOT NULL AFTER UserType;
INSERT INTO users (
    UserName,
    UserType,
    Password,
    CreatedBy,
    UpdatedBy
) VALUES
    ('Rhea', 'staff', 'gldmstaff', 'system', 'system'),
    ('supervisor1', 'supervisor', 'supervisorpassword', 'system', 'system');
    
select * from users;

INSERT INTO test_type (TestName, Method, Abbreviation)
VALUES
  ('Particle Size Analysis', 'ASTM D422', 'PSA'),
  ('Plasticity Index', 'ASTM D4318', 'PI'),
  ('Specific Gravity', 'AASHTO T100', 'SG-T100'),
  ('Compaction', 'CTM 216', 'CC-216'),
  ('Unconfined Compression (Rock)', 'ASTM D7012-C', 'UCR'),
  ('Hydraulic Conductivity', 'ASTM D2434', 'HC'),
  ('Corrosion', 'CTM 643,417,422', 'CO-CTM');
  
SELECT TestName, Abbreviation FROM test_type;

CREATE TABLE test_request (
  RequestID INT AUTO_INCREMENT PRIMARY KEY,
  Office VARCHAR(100),
  Branch VARCHAR(100),
  RequesterName VARCHAR(100),
  RequesterEmail VARCHAR(100),
  RequesterPhone VARCHAR(50),
  SupervisorName VARCHAR(100),
  SupervisorEmail VARCHAR(100),
  SupervisorPhone VARCHAR(50),
  TestResultsDueDate DATE,
  DateOfRequest DATE,
  ProjectID VARCHAR(50),         -- EFIS
  EA VARCHAR(20),
  StructureNo VARCHAR(50),
  District VARCHAR(20),
  County VARCHAR(50),
  Route VARCHAR(20),
  PM VARCHAR(20),
  ProjectComponent VARCHAR(100),
  ChargingProjectID VARCHAR(50),
  ChargingUnit VARCHAR(20),
  ReportingCode VARCHAR(50),
  Phase VARCHAR(20),
  SubObject VARCHAR(20),
  Activity VARCHAR(50),
  SubActivity VARCHAR(50),
  NumSamples INT,
  ExpectedSampleReceiptDate DATE,
  Comments TEXT,
  Status VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE test_request_details (
  DetailID INT AUTO_INCREMENT PRIMARY KEY,
  RequestID INT,
  SampleNumber INT,
  BoreholeID VARCHAR(50),
  DepthFrom VARCHAR(20),
  DepthTo VARCHAR(20),
  TL101No VARCHAR(50),
  TubeJar VARCHAR(50),
  Quantity INT,
  FieldCollectionDate DATE,
  TestTypeID TINYINT UNSIGNED,  -- Must match test_type table!
  SameAsSampleNo INT,
  Comments TEXT,
  FOREIGN KEY (RequestID) REFERENCES test_request(RequestID),
  FOREIGN KEY (TestTypeID) REFERENCES test_type(TestTypeID)
);
select * from test_request;
select * from test_request_details;