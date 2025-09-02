# VisionDB Import Instructions

This document provides instructions for importing the visiondb.csv data into the GLDMS_2025 database.

## Option 1: Using SQL Scripts

1. Open your MySQL client (e.g., MySQL Workbench, command line client)
2. Connect to your GLDMS_2025 database
3. Run the following SQL scripts in order:

```sql
-- First create the table structure
SOURCE /Users/rheadsouza/Documents/GLDMS_NEW/GLDMS_2025/SQLFILES/create_visiondb_table.sql;

-- Then import the data
SOURCE /Users/rheadsouza/Documents/GLDMS_NEW/GLDMS_2025/SQLFILES/import_visiondb_data.sql;
```

Note: If you encounter permission issues with the `LOAD DATA INFILE` command, you may need to:
- Copy the CSV file to the MySQL server's data directory
- Use the `LOCAL` keyword: `LOAD DATA LOCAL INFILE...`
- Or use Option 2 below

## Option 2: Using Node.js Script

1. Make sure you have Node.js installed
2. Install the required dependencies:

```bash
cd /Users/rheadsouza/Documents/GLDMS_NEW/GLDMS_2025
npm install mysql2 csv-parser
```

3. Update the database configuration in `import_visiondb.js` if needed:
   - host (default: 'localhost')
   - user (default: 'root')
   - password (add your MySQL password)
   - database (default: 'gldms_2025')

4. Run the import script:

```bash
node import_visiondb.js
```

## Verifying the Import

After running either import method, verify that the data was imported correctly:

```sql
-- Check the total number of records
SELECT COUNT(*) FROM visiondb;

-- Sample a few records
SELECT * FROM visiondb LIMIT 10;
```

## Table Structure

The `visiondb` table contains the following columns:

- `EfisProjectId` VARCHAR(20) PRIMARY KEY - The unique project identifier
- `Id` VARCHAR(20) - Project ID
- `ProjectEa` VARCHAR(20) - Project EA number
- `ProjectName` VARCHAR(255) - Project name/description
- `District` VARCHAR(10) - District code
- `CountyCode` VARCHAR(10) - County code
- `RouteCode` VARCHAR(10) - Route code
- `PostMileBegin` DECIMAL(10,2) - Beginning post mile
- `PostMileEnd` DECIMAL(10,2) - Ending post mile
- `ScheduleStartDate` INT - Schedule start date
- `ScheduleFinishDate` INT - Schedule finish date
- `M040_BeginProj` INT - M040 begin project date
- `M800_ENDPROJ` INT - M800 end project date
