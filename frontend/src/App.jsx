import React, { useState } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Typography, 
  AppBar, 
  Toolbar,
  Container,
  Paper
} from '@mui/material';
import { 
  Science, 
  Assignment, 
  Storage, 
  Assessment
} from '@mui/icons-material';
import DummyTab from './components/DummyTab';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Tab Content Components
function TestManagement() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Test Management
      </Typography>
      <Typography variant="body1">
        View and manage test results. This tab will contain test data management functionality.
      </Typography>
    </Box>
  );
}

function ProjectManagement() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Project Management
      </Typography>
      <Typography variant="body1">
        Add, edit, and manage projects. This tab will contain project CRUD operations.
      </Typography>
    </Box>
  );
}

function ProductionManagement() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Production Management
      </Typography>
      <Typography variant="body1">
        View production reports and analytics. This tab will contain production data.
      </Typography>
    </Box>
  );
}

function DBManagement() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        DB Management
      </Typography>
      <Typography variant="body1">
        Database management functions. This tab will contain database administration tools.
      </Typography>
    </Box>
  );
}

function App() {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <AppBar position="static" sx={{ backgroundColor: 'white', color: 'black' }}>
        <Toolbar>
          {/* Caltrans Logo */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mr: 2
            }}
          >
            <img 
              src="/caltrans-logo.svg.png" 
              alt="Caltrans Logo" 
              style={{ 
                height: '40px', 
                width: 'auto'
              }} 
            />
          </Box>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'black' }}>
            Geotechnical Lab Database Management System
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Paper sx={{ width: '100%' }}>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={value} 
              onChange={handleChange} 
              aria-label="GLDMS admin tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab 
                icon={<Science />} 
                label="Test Management" 
                iconPosition="start"
              />
              <Tab 
                icon={<Assignment />} 
                label="Project Management" 
                iconPosition="start"
              />
              <Tab 
                icon={<Assessment />} 
                label="Production Management" 
                iconPosition="start"
              />
              <Tab 
                icon={<Storage />} 
                label="DB Management" 
                iconPosition="start"
              />
              <Tab 
                label="Dummy Tab"
              />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <TabPanel value={value} index={0}>
            <TestManagement />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <ProjectManagement />
          </TabPanel>
          <TabPanel value={value} index={2}>
            <ProductionManagement />
          </TabPanel>
          <TabPanel value={value} index={3}>
            <DBManagement />
          </TabPanel>
          <TabPanel value={value} index={4}>
            <DummyTab />
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
}

export default App;
