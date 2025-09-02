const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const csv = require('csv-parser');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Add your MySQL password if needed
  database: 'gldms_2025'
};

// Path to CSV file
const csvFilePath = path.join(__dirname, 'Other', 'visiondb.csv');

// Function to create the visiondb table
async function createTable(connection) {
  console.log('Creating visiondb table if it does not exist...');
  
  // Create table if not exists
  const createTableSQL = `CREATE TABLE IF NOT EXISTS visiondb (
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
  )`;
  
  await connection.query(createTableSQL);
  
  // Check if indexes exist before creating them
  try {
    // Add index on ProjectEa for faster lookups
    await connection.query(`CREATE INDEX idx_visiondb_projectea ON visiondb(ProjectEa)`);
    console.log('Created ProjectEa index');
  } catch (error) {
    // Index might already exist, which is fine
    if (error.code !== 'ER_DUP_KEYNAME') {
      console.error('Error creating ProjectEa index:', error.message);
    }
  }
  
  try {
    // Add index on location fields for filtering
    await connection.query(`CREATE INDEX idx_visiondb_location ON visiondb(District, CountyCode, RouteCode)`);
    console.log('Created location index');
  } catch (error) {
    // Index might already exist, which is fine
    if (error.code !== 'ER_DUP_KEYNAME') {
      console.error('Error creating location index:', error.message);
    }
  }
  
  console.log('Table created or already exists.');
}

// Function to import data from CSV
async function importData(connection) {
  console.log('Starting data import from CSV...');
  
  // First, truncate the table to ensure clean import
  await connection.query('TRUNCATE TABLE visiondb');
  
  // Read and process the CSV file
  const records = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        // Process each row and prepare for batch insert
        records.push([
          row.EfisProjectId,
          row.Id,
          row.ProjectEa,
          row.ProjectName,
          row.District,
          row.CountyCode,
          row.RouteCode,
          parseFloat(row.PostMileBegin) || null,
          parseFloat(row.PostMileEnd) || null,
          parseInt(row.ScheduleStartDate) || null,
          parseInt(row.ScheduleFinishDate) || null,
          row.M040_BeginProj ? parseInt(row.M040_BeginProj) : null,
          row.M800_ENDPROJ ? parseInt(row.M800_ENDPROJ) : null
        ]);
        
        // Insert in batches of 1000 records
        if (records.length >= 1000) {
          batchInsert(connection, records.splice(0, 1000));
        }
      })
      .on('end', async () => {
        // Insert any remaining records
        if (records.length > 0) {
          await batchInsert(connection, records);
        }
        
        // Get the count of imported records
        const [countResult] = await connection.query('SELECT COUNT(*) as count FROM visiondb');
        console.log(`Import completed. Total records imported: ${countResult[0].count}`);
        resolve();
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        reject(error);
      });
  });
}

// Function to perform batch insert
async function batchInsert(connection, records) {
  if (records.length === 0) return;
  
  const insertSQL = `
    INSERT INTO visiondb (
      EfisProjectId, Id, ProjectEa, ProjectName, District, CountyCode, RouteCode,
      PostMileBegin, PostMileEnd, ScheduleStartDate, ScheduleFinishDate,
      M040_BeginProj, M800_ENDPROJ
    ) VALUES ?
  `;
  
  try {
    await connection.query(insertSQL, [records]);
    console.log(`Inserted batch of ${records.length} records`);
  } catch (error) {
    console.error('Error inserting batch:', error);
    throw error;
  }
}

// Main function
async function main() {
  let connection;
  
  try {
    // Connect to the database
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');
    
    // Create table if it doesn't exist
    await createTable(connection);
    
    // Import data from CSV
    await importData(connection);
    
    console.log('Import process completed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the database connection
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the script
main();
