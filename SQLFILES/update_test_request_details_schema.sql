-- Update test_request_details table to add Method column
-- This allows storing which specific method was selected for each test

-- First check if the Method column already exists
SET @columnExists = 0;
SELECT COUNT(*) INTO @columnExists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'test_request_details' 
AND COLUMN_NAME = 'Method'
AND TABLE_SCHEMA = DATABASE();

-- Add the Method column if it doesn't exist
SET @query = IF(@columnExists = 0, 
    'ALTER TABLE test_request_details ADD COLUMN Method VARCHAR(50) AFTER TestTypeID',
    'SELECT "Method column already exists" AS message');

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update the SameAsSampleNo column to be nullable
-- This is because not all tests will reference another sample now
ALTER TABLE test_request_details MODIFY COLUMN SameAsSampleNo INT NULL;

-- Display the updated table structure
DESCRIBE test_request_details;
