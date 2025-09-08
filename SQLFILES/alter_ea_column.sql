-- =====================================================
-- Alter EA column in project table
-- =====================================================
-- Created: 2025-09-07
-- Purpose: Increase the size of EA column to accommodate longer values
-- =====================================================

-- Check current column definition
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'gldms_2025' 
AND TABLE_NAME = 'project' 
AND COLUMN_NAME = 'EA';

-- Alter EA column to increase size
ALTER TABLE `project` 
MODIFY COLUMN `EA` varchar(20) NOT NULL DEFAULT '' COMMENT 'Expenditure authorization - maps to DIGGS otherProjectProperty';
