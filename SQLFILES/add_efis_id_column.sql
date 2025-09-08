-- Add EFIS ID column to the project table
ALTER TABLE project
ADD COLUMN EfisProjectId VARCHAR(50);

-- Add an index to improve query performance
CREATE INDEX idx_efis_project_id ON project(EfisProjectId);
