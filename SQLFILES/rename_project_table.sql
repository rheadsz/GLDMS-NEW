-- Rename project_new to project
-- First, disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Rename the table
RENAME TABLE project_new TO project;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
