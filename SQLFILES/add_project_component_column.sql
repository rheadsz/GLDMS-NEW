-- =====================================================
-- Add ProjectComponent column to project_structures table
-- =====================================================
-- Created: 2025-09-16
-- Purpose: Store project component information for structures
-- =====================================================

-- Check if the ProjectComponent column exists
SELECT COUNT(*) AS column_exists
FROM information_schema.columns
WHERE table_schema = 'gldms_2025'
  AND table_name = 'project_structures'
  AND column_name = 'ProjectComponent';

-- Add ProjectComponent column if it doesn't exist
ALTER TABLE project_structures
ADD COLUMN ProjectComponent VARCHAR(100) DEFAULT NULL COMMENT 'Project component description' AFTER StructureNumber;

-- Add index for ProjectComponent
CREATE INDEX idx_project_structures_component ON project_structures(ProjectComponent);
