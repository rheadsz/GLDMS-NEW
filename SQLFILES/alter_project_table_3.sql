-- Alter the project table to increase County and District field sizes
ALTER TABLE project MODIFY COLUMN County VARCHAR(10) DEFAULT NULL;
ALTER TABLE project MODIFY COLUMN District VARCHAR(10) NOT NULL DEFAULT '';
