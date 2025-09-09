-- =====================================================
-- Add RequestingUser column to project_tests table
-- =====================================================
-- Created: 2025-09-07
-- Purpose: Track which user submitted each test request
-- =====================================================

-- Add RequestingUser column to project_tests table
ALTER TABLE `project_tests` 
ADD COLUMN `RequestingUser` varchar(100) DEFAULT NULL COMMENT 'Username of person who requested the test' AFTER `Status`;

-- Update the existing CreatedBy column description to clarify its purpose
ALTER TABLE `project_tests` 
MODIFY COLUMN `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record in the system';

-- Create an index on RequestingUser for faster queries
CREATE INDEX `idx_project_tests_requesting_user` ON `project_tests` (`RequestingUser`);
