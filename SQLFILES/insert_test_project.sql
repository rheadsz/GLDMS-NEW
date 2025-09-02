-- Insert a test project with EfisProjectId
INSERT INTO project (
  ProjectID, 
  ProjectName, 
  EA, 
  District, 
  County, 
  Route, 
  PMFrom, 
  PMTo, 
  StructureNumber, 
  Status, 
  CreatedBy, 
  CreatedAt, 
  GLTrackNumber
) VALUES (
  'TEST001', 
  'Test Project 1', 
  'EA12345', 
  '04', 
  'ALA', 
  '580', 
  '10.5', 
  '12.3', 
  'BR-001', 
  'active', 
  'system', 
  NOW(), 
  'EFIS001'
);

-- Insert a second test project
INSERT INTO project (
  ProjectID, 
  ProjectName, 
  EA, 
  District, 
  County, 
  Route, 
  PMFrom, 
  PMTo, 
  StructureNumber, 
  Status, 
  CreatedBy, 
  CreatedAt, 
  GLTrackNumber
) VALUES (
  'TEST002', 
  'Test Project 2', 
  'EA67890', 
  '04', 
  'SCL', 
  '101', 
  '45.2', 
  '47.8', 
  'BR-002', 
  'active', 
  'system', 
  NOW(), 
  'EFIS002'
);
