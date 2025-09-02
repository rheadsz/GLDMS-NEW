const fs = require('fs');
const mysql = require('mysql2/promise');
const csv = require('csv-parser');

// Database connection configuration
const dbConfig = {
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'gldms_2025',
  port: 3306
};

// Path to the CSV file
const csvFilePath = './Other/visiondb.csv';

// Function to convert date numbers to MySQL date format
function convertDateNumber(dateNum) {
  if (!dateNum || isNaN(dateNum)) return null;
  
  // Excel dates are days since 1900-01-01 (with a leap year bug)
  // Adjust for Excel's leap year bug (Excel thinks 1900 was a leap year)
  const excelEpoch = new Date(1900, 0, 1);
  const daysSinceEpoch = parseInt(dateNum);
  
  if (daysSinceEpoch < 60) {
    // Before the bug date (February 29, 1900)
    excelEpoch.setDate(excelEpoch.getDate() + daysSinceEpoch - 1);
  } else {
    // After the bug date
    excelEpoch.setDate(excelEpoch.getDate() + daysSinceEpoch - 2);
  }
  
  // Format date as YYYY-MM-DD for MySQL
  return excelEpoch.toISOString().split('T')[0];
}

// Function to extract project name without the ID prefix
function extractProjectName(fullName) {
  if (!fullName) return '';
  
  // Check if the name has the format "ID - Name"
  const match = fullName.match(/^\d+ - (.+)$/);
  return match ? match[1].trim() : fullName;
}

async function importCsvToDatabase() {
  let connection;
  
  try {
    // Connect to the database
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully');
    
    // Disable foreign key checks temporarily
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Delete existing records instead of truncate to avoid foreign key issues
    // Comment out this line if you want to keep existing data
    await connection.execute('DELETE FROM project_new');
    console.log('Existing project_new records deleted');
    
    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    // Read and process the CSV file
    const results = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`Read ${results.length} records from CSV file`);
    
    // Prepare batch insert
    let successCount = 0;
    let errorCount = 0;
    
    for (const row of results) {
      try {
        // Map CSV columns to database columns
        const projectData = {
          // Store EfisProjectId in the dedicated column
          EfisProjectId: row.EfisProjectId || '',
          GLTrackNumber: row.EfisProjectId || '', // Also keep it in GLTrackNumber for backward compatibility
          ProjectName: extractProjectName(row.ProjectName),
          District: row.District || '',
          County: row.CountyCode || null,
          Route: row.RouteCode || null,
          PMFrom: row.PostMileBegin || null,
          PMTo: row.PostMileEnd || null,
          StartedDate: convertDateNumber(row.ScheduleStartDate),
          EstimatedDeliveryDate: convertDateNumber(row.ScheduleFinishDate),
          EA: row.ProjectEa || '',
          CreatedAt: new Date(),
          UpdatedAt: new Date(),
          CreatedBy: 'CSV Import',
          UpdatedBy: 'CSV Import'
        };
        
        // Insert into database
        const query = `
          INSERT INTO project_new 
          (EfisProjectId, GLTrackNumber, ProjectName, District, County, Route, PMFrom, PMTo, 
           StartedDate, EstimatedDeliveryDate, EA, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
          projectData.EfisProjectId,
          projectData.GLTrackNumber,
          projectData.ProjectName,
          projectData.District,
          projectData.County,
          projectData.Route,
          projectData.PMFrom,
          projectData.PMTo,
          projectData.StartedDate,
          projectData.EstimatedDeliveryDate,
          projectData.EA,
          projectData.CreatedAt,
          projectData.UpdatedAt,
          projectData.CreatedBy,
          projectData.UpdatedBy
        ];
        
        await connection.execute(query, values);
        successCount++;
        
        // Log progress every 100 records
        if (successCount % 100 === 0) {
          console.log(`Imported ${successCount} records so far...`);
        }
      } catch (err) {
        console.error(`Error importing record ${row.EfisProjectId}: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`Import complete. Successfully imported ${successCount} records. Failed: ${errorCount} records.`);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the import function
importCsvToDatabase();
