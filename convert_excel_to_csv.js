const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Path to the Excel file
const excelFilePath = path.join(__dirname, 'Other', 'visiondb.xlsx');

// Path for the output CSV file
const csvFilePath = path.join(__dirname, 'Other', 'visiondb.csv');

try {
  console.log(`Reading Excel file: ${excelFilePath}`);
  
  // Read the Excel file
  const workbook = xlsx.readFile(excelFilePath);
  
  // Get the first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to CSV
  console.log(`Converting to CSV: ${csvFilePath}`);
  const csv = xlsx.utils.sheet_to_csv(worksheet);
  
  // Write to file
  fs.writeFileSync(csvFilePath, csv);
  
  console.log(`Conversion complete! CSV file saved to: ${csvFilePath}`);
  
  // Get some info about the data
  const jsonData = xlsx.utils.sheet_to_json(worksheet);
  console.log(`Number of rows: ${jsonData.length}`);
  if (jsonData.length > 0) {
    console.log(`Columns: ${Object.keys(jsonData[0]).join(', ')}`);
  }
  
} catch (error) {
  console.error(`Error converting file: ${error.message}`);
}
