-- Update Test Type Methods
-- This script updates the test_type table to include multiple methods for specific tests

-- Update Specific Gravity to include both methods
UPDATE `test_type` 
SET `Method` = 'ASTM D854, AASHTO T100' 
WHERE `TestName` = 'Specific Gravity';

-- Update Unconfined Compression to include both methods
UPDATE `test_type` 
SET `Method` = 'ASTM D2166, ASTM D7012-C' 
WHERE `TestName` = 'Unconfined Compression';

-- Update Corrosion to include all four methods
UPDATE `test_type` 
SET `Method` = 'ASTM G51, CTM 643, CTM 417, CTM 422' 
WHERE `TestName` = 'Corrosion';

-- Verify the updates
SELECT `TestName`, `Method` FROM `test_type` 
WHERE `TestName` IN ('Specific Gravity', 'Unconfined Compression', 'Corrosion');
