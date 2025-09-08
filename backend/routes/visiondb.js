const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const config = require('../config/database');

// Create a connection pool to the database
const pool = mysql.createPool(config.mysql);

/**
 * @route   GET /api/visiondb/project/:projectId
 * @desc    Get project data from visiondb by project ID
 * @access  Private
 */
// Add a route to check if the visiondb table exists
router.get('/check-table', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      // Check if the visiondb table exists
      const [tables] = await connection.query(
        "SHOW TABLES LIKE 'visiondb'"
      );
      
      if (tables.length === 0) {
        return res.status(404).json({ message: 'visiondb table does not exist' });
      }
      
      // Get the structure of the visiondb table
      const [columns] = await connection.query(
        "DESCRIBE visiondb"
      );
      
      connection.release();
      return res.json({ message: 'visiondb table exists', columns });
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error checking visiondb table:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log(`Fetching project data for ID: ${projectId}`);
    
    // Validate projectId
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }
    
    // Get connection from pool
    const connection = await pool.getConnection();
    console.log('Database connection established');
    
    try {
      // First check if the visiondb table exists
      const [tables] = await connection.query(
        "SHOW TABLES LIKE 'visiondb'"
      );
      
      if (tables.length === 0) {
        connection.release();
        return res.status(404).json({ message: 'visiondb table does not exist in the database' });
      }
      
      console.log('visiondb table exists, executing query');
      
      // Query the visiondb table for the project data
      const [rows] = await connection.query(
        `SELECT 
          EfisProjectId as ProjectID,
          ProjectEa, 
          ProjectName, 
          District, 
          CountyCode as County, 
          RouteCode, 
          PostMileBegin, 
          PostMileEnd 
        FROM visiondb 
        WHERE EfisProjectId = ?`,
        [projectId]
      );
      
      console.log(`Query executed, found ${rows.length} results`);
      
      // Release the connection back to the pool
      connection.release();
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Project not found with ID: ' + projectId });
      }
      
      // Return the project data
      return res.json(rows[0]);
    } catch (error) {
      // Release the connection back to the pool in case of error
      connection.release();
      console.error('Database query error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error fetching project data:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
