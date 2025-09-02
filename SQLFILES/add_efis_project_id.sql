-- Add EfisProjectId column to project table
-- This script adds the EfisProjectId column that's referenced in the backend code

-- First, check if column exists to avoid errors
SET @columnExists = 0;
SELECT COUNT(*) INTO @columnExists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'project' AND COLUMN_NAME = 'EfisProjectId';

-- Only add the column if it doesn't exist
SET @query = IF(@columnExists = 0, 
  'ALTER TABLE project ADD COLUMN EfisProjectId VARCHAR(20) AFTER ProjectID',
  'SELECT "Column EfisProjectId already exists in project table"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index on EfisProjectId if it doesn't exist
SET @indexExists = 0;
SELECT COUNT(*) INTO @indexExists 
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_NAME = 'project' AND INDEX_NAME = 'idx_efis_project_id';

SET @query = IF(@indexExists = 0, 
  'ALTER TABLE project ADD INDEX idx_efis_project_id (EfisProjectId)',
  'SELECT "Index idx_efis_project_id already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing records to populate EfisProjectId with GLTrackNumber values
-- This ensures backward compatibility
UPDATE project SET EfisProjectId = GLTrackNumber WHERE EfisProjectId IS NULL;

-- Output confirmation
SELECT 'EfisProjectId column has been added to project table' AS Message;
