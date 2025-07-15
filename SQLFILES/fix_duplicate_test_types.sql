-- Fix duplicate test type entries

-- Temporarily disable safe update mode
SET SQL_SAFE_UPDATES = 0;

-- First, check for duplicates
SELECT TestName, COUNT(*) as count 
FROM test_type 
GROUP BY TestName 
HAVING COUNT(*) > 1;

-- Delete duplicates directly using a simpler approach
-- For each TestName, keep only the record with the minimum TestTypeID
DELETE t1 FROM test_type t1
JOIN (
    SELECT TestName, MIN(TestTypeID) as min_id
    FROM test_type
    GROUP BY TestName
) t2 ON t1.TestName = t2.TestName AND t1.TestTypeID > t2.min_id;

-- Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;

-- Verify that duplicates are removed
SELECT TestName, Method 
FROM test_type 
WHERE TestName IN ('Specific Gravity', 'Unconfined Compression', 'Corrosion')
ORDER BY TestName;
