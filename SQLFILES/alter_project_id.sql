-- Alter the project table to change ProjectID to VARCHAR(20)
-- First, disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Modify the ProjectID column in the project table
ALTER TABLE project 
  MODIFY COLUMN ProjectID VARCHAR(20) NOT NULL,
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (ProjectID);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
