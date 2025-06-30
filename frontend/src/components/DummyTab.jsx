import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert
} from '@mui/material';

function DummyTab() {
  const [testTypes, setTestTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/test-types')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setTestTypes(data);
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Error loading test types: {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Test Type Data Table
      </Typography>
      <Typography variant="body1" paragraph>
        This table displays live data from the MySQL `test_type` table.
      </Typography>
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="test types table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Test Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Table Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Abbreviation</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Method</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {testTypes.map((testType) => (
                <TableRow
                  key={testType.TestTypeID}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>{testType.TestTypeID}</TableCell>
                  <TableCell>{testType.TestName}</TableCell>
                  <TableCell>{testType.TableName}</TableCell>
                  <TableCell>{testType.Abbreviation}</TableCell>
                  <TableCell>{testType.Method}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Total records: {testTypes.length}
      </Typography>
    </Box>
  );
}

export default DummyTab; 