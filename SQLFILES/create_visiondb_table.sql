-- Create visiondb table based on visiondb.csv
CREATE TABLE IF NOT EXISTS visiondb (
    EfisProjectId VARCHAR(20) PRIMARY KEY,
    Id VARCHAR(20),
    ProjectEa VARCHAR(20),
    ProjectName VARCHAR(255),
    District VARCHAR(10),
    CountyCode VARCHAR(10),
    RouteCode VARCHAR(10),
    PostMileBegin DECIMAL(10,2),
    PostMileEnd DECIMAL(10,2),
    ScheduleStartDate INT,
    ScheduleFinishDate INT,
    M040_BeginProj INT,
    M800_ENDPROJ INT
);

-- Add index on ProjectEa for faster lookups
CREATE INDEX idx_visiondb_projectea ON visiondb(ProjectEa);

-- Add index on District, CountyCode, RouteCode for filtering
CREATE INDEX idx_visiondb_location ON visiondb(District, CountyCode, RouteCode);
