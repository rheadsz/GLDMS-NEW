-- Import data from visiondb.csv into visiondb table
-- First, make sure the table exists
SOURCE create_visiondb_table.sql;

-- Load data from CSV file
LOAD DATA INFILE '/Users/rheadsouza/Documents/GLDMS_NEW/GLDMS_2025/Other/visiondb.csv'
INTO TABLE visiondb
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(EfisProjectId, Id, ProjectEa, ProjectName, District, CountyCode, RouteCode, 
 PostMileBegin, PostMileEnd, ScheduleStartDate, ScheduleFinishDate, 
 @M040_BeginProj, @M800_ENDPROJ)
SET 
    M040_BeginProj = NULLIF(@M040_BeginProj, ''),
    M800_ENDPROJ = NULLIF(@M800_ENDPROJ, '');

-- Show record count to verify import
SELECT COUNT(*) AS 'Total Records Imported' FROM visiondb;
