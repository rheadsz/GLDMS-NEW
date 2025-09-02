-- Script to rename project_new to project and update foreign key constraints
-- First, disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Drop the foreign key constraint from sample table
ALTER TABLE sample DROP FOREIGN KEY sample_ibfk_1;

-- Drop the original project table if it exists
DROP TABLE IF EXISTS project;

-- Rename project_new to project
RENAME TABLE project_new TO project;

-- Add the foreign key constraint back to sample table
ALTER TABLE sample ADD CONSTRAINT sample_ibfk_1 FOREIGN KEY (ProjectID) REFERENCES project(ProjectID);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
