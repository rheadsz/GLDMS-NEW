const mysql = require('mysql2');

// Create a connection to the database
const connection = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "gldms_2025",
  port: 3306,
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err.stack);
    return;
  }
  console.log("Connected to database as id " + connection.threadId);
  
  // Query to get column names from visiondb table
  connection.query("SHOW COLUMNS FROM visiondb", (err, results) => {
    if (err) {
      console.error("Error querying database:", err);
      connection.end();
      return;
    }
    
    console.log("Column names in visiondb table:");
    results.forEach(column => {
      console.log(`- ${column.Field} (${column.Type})`);
    });
    
    // Get a sample row to see the data
    connection.query("SELECT * FROM visiondb LIMIT 1", (err, rows) => {
      if (err) {
        console.error("Error querying database:", err);
        connection.end();
        return;
      }
      
      console.log("\nSample row from visiondb table:");
      console.log(rows[0]);
      
      connection.end();
    });
  });
});
