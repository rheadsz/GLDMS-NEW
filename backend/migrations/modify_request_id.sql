-- Step 1: Modify RequestID in project_requests table to VARCHAR
ALTER TABLE project_requests 
MODIFY COLUMN RequestID VARCHAR(20) NOT NULL PRIMARY KEY;

-- Step 2: Modify RequestID foreign keys in related tables
ALTER TABLE project_structures 
MODIFY COLUMN RequestID VARCHAR(20);

ALTER TABLE project_boreholes 
MODIFY COLUMN RequestID VARCHAR(20);

ALTER TABLE project_samples 
MODIFY COLUMN RequestID VARCHAR(20);

ALTER TABLE project_tests 
MODIFY COLUMN RequestID VARCHAR(20);

-- Step 3: Update existing numeric RequestIDs to formatted ones (optional - for existing data)
-- This will convert existing numeric IDs to GL 25-001, GL 25-002, etc.
SET @counter = 0;
UPDATE project_requests 
SET RequestID = CONCAT('GL ', DATE_FORMAT(NOW(), '%y'), '-', LPAD(@counter := @counter + 1, 3, '0'))
ORDER BY CAST(RequestID AS UNSIGNED);
