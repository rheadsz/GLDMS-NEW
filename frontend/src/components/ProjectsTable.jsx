import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

function ProjectsTable() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'yours'
  const [activeView, setActiveView] = useState('projectInfo');
  const [boreholeStructures, setBoreholeStructures] = useState([{
    id: uuidv4(),
    structureNumber: '',
    boreholes: [{
      id: uuidv4(),
      boreholeId: '',
      northingEasting: '',
      latitudeLongitude: '',
      groundSurfaceElevation: ''
    }]
  }]); // 'projectInfo', 'samples', or 'tests'
  const [showBoreholeModal, setShowBoreholeModal] = useState(false);
  const [modalMode, setModalMode] = useState('structure'); // 'structure' or 'borehole'
  const [currentStructureId, setCurrentStructureId] = useState(null);
  const [currentBoreholeId, setCurrentBoreholeId] = useState(null);
  const [modalFormValues, setModalFormValues] = useState({
    structureNumber: '',
    boreholeId: '',
    northingEasting: '',
    latitudeLongitude: '',
    groundSurfaceElevation: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchFilters, setSearchFilters] = useState({
    projectId: '',
    ea: '',
    county: '',
    district: ''
  });

  // Fetch projects from the backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        // Replace with your actual API endpoint
        const response = await fetch('/api/projects');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setProjects(data);
        setError(null);
        
        // Select the first project by default if available
        if (data.length > 0) {
          setSelectedProject(data[0]);
        }
      } catch (err) {
        setError('Failed to fetch projects: ' + err.message);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);
  
  // Handle project selection
  const handleProjectSelect = (projectId) => {
    const project = projects.find(p => p.ProjectID === projectId);
    if (project) {
      console.log('Selected project data:', project);
      setSelectedProject(project);
    }
  };

  // Handle search filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Function to open the modal for adding a new structure
  const openAddStructureModal = () => {
    // First reset the modal mode and clear any selected structure/borehole
    setModalMode('structure');
    setCurrentStructureId(null);
    setCurrentBoreholeId(null);
    
    // Reset form values to ensure no data persists between modal openings
    setModalFormValues({
      structureNumber: '',
      boreholeId: '',
      northingEasting: '',
      latitudeLongitude: '',
      groundSurfaceElevation: ''
    });
    
    // Show the modal after resetting all values
    setShowBoreholeModal(true);
  };
  
  // Function to open the modal for adding a new borehole to a specific structure
  const openAddBoreholeModal = (structureId) => {
    setModalMode('borehole');
    setCurrentStructureId(structureId);
    setCurrentBoreholeId(null);
    // Reset form values except structure number
    setModalFormValues({
      structureNumber: boreholeStructures.find(s => s.id === structureId)?.structureNumber || '',
      boreholeId: '',
      northingEasting: '',
      latitudeLongitude: '',
      groundSurfaceElevation: ''
    });
    setShowBoreholeModal(true);
  };
  
  // Function to close the modal
  const closeBoreholeModal = () => {
    setShowBoreholeModal(false);
    // Reset form values when closing the modal to prevent data persistence
    setModalFormValues({
      structureNumber: '',
      boreholeId: '',
      northingEasting: '',
      latitudeLongitude: '',
      groundSurfaceElevation: ''
    });
  };
  
  // Function to handle modal form input changes
  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setModalFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Function to add a new structure with empty borehole
  const addStructure = () => {
    const newStructure = {
      id: uuidv4(),
      structureNumber: '',
      boreholes: [{
        id: uuidv4(),
        boreholeId: '',
        northingEasting: '',
        latitudeLongitude: '',
        groundSurfaceElevation: ''
      }]
    };
    
    setBoreholeStructures([...boreholeStructures, newStructure]);
  };

  // Function to add a new borehole to a specific structure
  const addBorehole = (structureId) => {
    if (!structureId) return;
    
    const newBorehole = {
      id: uuidv4(),
      boreholeId: '',
      northingEasting: '',
      latitudeLongitude: '',
      groundSurfaceElevation: ''
    };
    
    setBoreholeStructures(boreholeStructures.map(structure => {
      if (structure.id === structureId) {
        return {
          ...structure,
          boreholes: [...structure.boreholes, newBorehole]
        };
      }
      return structure;
    }));
  };
  
  // Function to handle structure number change
  const handleStructureChange = (structureId, value) => {
    setBoreholeStructures(boreholeStructures.map(structure => {
      if (structure.id === structureId) {
        return {
          ...structure,
          structureNumber: value
        };
      }
      return structure;
    }));
  };
  
  // Function to handle borehole field changes
  const handleBoreholeChange = (structureId, boreholeId, field, value) => {
    setBoreholeStructures(boreholeStructures.map(structure => {
      if (structure.id === structureId) {
        return {
          ...structure,
          boreholes: structure.boreholes.map(borehole => {
            if (borehole.id === boreholeId) {
              return {
                ...borehole,
                [field]: value
              };
            }
            return borehole;
          })
        };
      }
      return structure;
    }));
  };

  // These functions have been moved above

  // Handle search submission

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    
    // Find the first matching project based on search filters
    const matchingProject = projects.find(project => {
      return (
        (searchFilters.projectId === '' || 
          project.EfisProjectId?.toString().toLowerCase().includes(searchFilters.projectId.toLowerCase())) &&
        (searchFilters.ea === '' || 
          project.EA?.toString().toLowerCase().includes(searchFilters.ea.toLowerCase())) &&
        (searchFilters.county === '' || 
          project.County?.toString().toLowerCase().includes(searchFilters.county.toLowerCase())) &&
        (searchFilters.district === '' || 
          project.District?.toString().toLowerCase().includes(searchFilters.district.toLowerCase()))
      );
    });
    
    // If a matching project is found, select it to display in the form
    if (matchingProject) {
      setSelectedProject(matchingProject);
    }
  };

  // Display EfisProjectId values as separate rows under All Projects tab
  const getDisplayProjects = () => {
    let filtered;
    
    if (activeTab === 'all') {
      // For All Projects tab, create a list of EfisProjectId values
      filtered = projects
        .filter(project => (
          project.EfisProjectId?.toString().toLowerCase().includes(searchFilters.projectId.toLowerCase()) &&
          project.EA?.toString().toLowerCase().includes(searchFilters.ea.toLowerCase()) &&
          project.County?.toString().toLowerCase().includes(searchFilters.county.toLowerCase()) &&
          project.District?.toString().toLowerCase().includes(searchFilters.district.toLowerCase())
        ))
        .map(project => ({
          id: project.ProjectID,
          displayId: project.EfisProjectId || project.ProjectID
        }));
    } else {
      // For Your Projects tab, filter by isYourProject
      filtered = projects
        .filter(project => (
          project.ProjectID?.toString().toLowerCase().includes(searchFilters.projectId.toLowerCase()) &&
          project.EA?.toString().toLowerCase().includes(searchFilters.ea.toLowerCase()) &&
          project.County?.toString().toLowerCase().includes(searchFilters.county.toLowerCase()) &&
          project.District?.toString().toLowerCase().includes(searchFilters.district.toLowerCase()) &&
          project.isYourProject
        ))
        .map(project => ({
          id: project.ProjectID,
          displayId: project.EfisProjectId || project.ProjectID
        }));
    }
    
    return filtered;
  };
  
  const allFilteredProjects = getDisplayProjects();
  
  // No need for pagination with scrollbar
  const filteredProjects = allFilteredProjects;

  return (
    <>
      {/* Search Bar */}
      <div className="p-3 border-bottom">
        <div className="row g-2 mb-2">
          <div className="col-md-3">
            <button 
              type="button" 
              className="btn btn-primary w-100" 
              onClick={() => navigate('/create-project')}
            >
              <i className="bi bi-plus-circle me-1"></i> Create a New Project
            </button>
          </div>
          <div className="col-md-9">
            <form onSubmit={handleSearch} className="row g-2">
              <div className="col-md-3">
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  placeholder="Project ID" 
                  name="projectId"
                  value={searchFilters.projectId}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="col-md-3">
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  placeholder="EA" 
                  name="ea"
                  value={searchFilters.ea}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="col-md-3">
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  placeholder="County" 
                  name="county"
                  value={searchFilters.county}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="col-md-2">
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  placeholder="District" 
                  name="district"
                  value={searchFilters.district}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="col-md-1">
                <button type="submit" className="btn btn-sm btn-outline-primary w-100">
                  <i className="bi bi-search"></i>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Projects
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'yours' ? 'active' : ''}`}
            onClick={() => setActiveTab('yours')}
          >
            Your Projects
          </button>
        </li>
      </ul>

      {/* Table Content */}
      <div className="p-0">
        {loading ? (
          <div className="text-center p-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger m-3" role="alert">
            {error}
          </div>
        ) : (
          <div className="d-flex">
            <div style={{ width: '300px' }}>
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>EfisProject ID</th>
                  </tr>
                </thead>
              </table>
              <div style={{ height: '400px', overflowY: 'auto', border: '1px solid #dee2e6' }}>
                <table className="table table-hover mb-0">
                  <tbody>
                    {projects.length > 0 ? (
                      projects.map((project, index) => (
                        <tr 
                          key={index} 
                          onClick={() => handleProjectSelect(project.ProjectID)}
                          className="cursor-pointer"
                          style={{ 
                            cursor: 'pointer',
                            backgroundColor: selectedProject && selectedProject.ProjectID === project.ProjectID ? '#4dabf5' : 'inherit',
                            fontWeight: selectedProject && selectedProject.ProjectID === project.ProjectID ? 'bold' : 'normal',
                            color: selectedProject && selectedProject.ProjectID === project.ProjectID ? 'white' : 'inherit'
                          }}
                        >
                          <td>{project.EfisProjectId}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="text-center py-4">
                          No projects found
                          <div className="mt-2">
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => navigate('/create-project')}
                            >
                              Create your first project
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Project Details Form */}
            <div className="ms-5 d-flex align-items-center flex-column" style={{ width: '400px' }}>
              {/* Navigation Buttons */}
              <div className="btn-group mb-3 w-100">
                <button 
                  type="button" 
                  className={`btn ${activeView === 'projectInfo' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveView('projectInfo')}
                >
                  Project Info
                </button>
                <button 
                  type="button" 
                  className={`btn ${activeView === 'borehole' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveView('borehole')}
                >
                  Borehole
                </button>
                <button 
                  type="button" 
                  className={`btn ${activeView === 'samples' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveView('samples')}
                >
                  Samples
                </button>
                <button 
                  type="button" 
                  className={`btn ${activeView === 'tests' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveView('tests')}
                >
                  Tests
                </button>
              </div>
              
              <div className="card w-100">
                <div className="card-header bg-light">
                  <h5 className="mb-0">
                    {activeView === 'projectInfo' && 'Project Details'}
                    {activeView === 'samples' && 'Sample Information'}
                    {activeView === 'borehole' && ''}
                    {activeView === 'tests' && 'Test Information'}
                  </h5>
                </div>
                <div className="card-body">
                  {/* Project Info View */}
                  {activeView === 'projectInfo' && (
                    <form>
                      <div className="row mb-3">
                        <div className="col-6">
                          <label htmlFor="projectId" className="form-label">Project ID</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="projectId" 
                            value={selectedProject ? selectedProject.EfisProjectId || '' : ''}
                            readOnly
                          />
                        </div>
                        <div className="col-6">
                          <label htmlFor="ea" className="form-label">EA</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="ea" 
                            value={selectedProject ? selectedProject.EA || '' : ''}
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="projectName" className="form-label">Project Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          id="projectName" 
                          value={selectedProject ? selectedProject.ProjectName || '' : ''}
                          readOnly
                        />
                      </div>
                      <div className="row mb-3">
                        <div className="col-4">
                          <label htmlFor="district" className="form-label">District</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="district" 
                            value={selectedProject ? selectedProject.District || 'N/A' : 'N/A'}
                            readOnly
                          />
                        </div>
                        <div className="col-4">
                          <label htmlFor="countyCode" className="form-label">County Code</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="countyCode" 
                            value={selectedProject ? selectedProject.CountyCode || '' : ''}
                            readOnly
                          />
                        </div>
                        <div className="col-4">
                          <label htmlFor="routeCode" className="form-label">Route Code</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="routeCode" 
                            value={selectedProject ? selectedProject.RouteCode || '' : ''}
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-6">
                          <label htmlFor="postmileBegin" className="form-label">Postmile Begin</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="postmileBegin" 
                            value={selectedProject ? selectedProject.PostmileBegin || '' : ''}
                            readOnly
                          />
                        </div>
                        <div className="col-6">
                          <label htmlFor="postmileEnd" className="form-label">Postmile End</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="postmileEnd" 
                            value={selectedProject ? selectedProject.PostmileEnd || '' : ''}
                            readOnly
                          />
                        </div>
                      </div>
                    </form>
                  )}
                  
                  {/* Samples View */}
                  {activeView === 'samples' && (
                    <div>
                      <p className="mb-3">Sample information for project: <strong>{selectedProject ? selectedProject.EfisProjectId || '' : ''}</strong></p>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Record/History</h5>
                        <button 
                          type="button" 
                          className="btn btn-sm btn-primary"
                          onClick={() => alert('Add new sample functionality will be implemented here')}
                        >
                          <i className="bi bi-plus-circle me-1"></i> Add New Sample
                        </button>
                      </div>
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th>Sample ID</th>
                            <th>Type</th>
                            <th>Collection Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan="3" className="text-center">No samples available for this project</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {/* Borehole View */}
                  {activeView === 'borehole' && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5>Borehole Information</h5>
                        <button 
                          type="button" 
                          className="btn btn-primary" 
                          onClick={openAddStructureModal}
                        >
                          <i className="bi bi-plus-circle me-1"></i> Add Structure
                        </button>
                      </div>
                      
                      {boreholeStructures.length === 0 ? (
                        <div className="alert alert-info">No structures added yet. Click the "Add Structure" button to get started.</div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-bordered table-hover">
                            <thead className="table-light">
                              <tr>
                                <th>Structure Number</th>
                                <th>Boreholes</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {boreholeStructures.map((structure) => (
                                <tr key={structure.id}>
                                  <td>{structure.structureNumber || '(No number)'}</td>
                                  <td>
                                    {structure.boreholes.length} borehole(s)
                                    <ul className="list-unstyled mb-0 mt-1">
                                      {structure.boreholes.map((borehole) => (
                                        <li key={borehole.id} className="small text-muted">
                                          {borehole.boreholeId || '(No ID)'}
                                        </li>
                                      ))}
                                    </ul>
                                  </td>
                                  <td>
                                    <button 
                                      type="button" 
                                      className="btn btn-sm btn-outline-primary me-2"
                                      onClick={() => openAddBoreholeModal(structure.id)}
                                    >
                                      <i className="bi bi-plus-circle"></i> Add Borehole
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Borehole Modal */}
                  {showBoreholeModal && (
                    <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                      <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title">
                              {modalMode === 'structure' ? 'Add New Structure' : 'Add New Borehole'}
                            </h5>
                            <button type="button" className="btn-close" onClick={closeBoreholeModal}></button>
                          </div>
                          <div className="modal-body">
                            <form onSubmit={(e) => {
                              e.preventDefault();
                              
                              if (modalMode === 'structure') {
                                // Add a new structure with the entered data
                                const newStructure = {
                                  id: uuidv4(),
                                  structureNumber: modalFormValues.structureNumber,
                                  boreholes: [{
                                    id: uuidv4(),
                                    boreholeId: modalFormValues.boreholeId,
                                    northingEasting: modalFormValues.northingEasting,
                                    latitudeLongitude: modalFormValues.latitudeLongitude,
                                    groundSurfaceElevation: modalFormValues.groundSurfaceElevation
                                  }]
                                };
                                
                                setBoreholeStructures([...boreholeStructures, newStructure]);
                              } else if (modalMode === 'borehole' && currentStructureId) {
                                // Add a new borehole to the selected structure
                                const newBorehole = {
                                  id: uuidv4(),
                                  boreholeId: modalFormValues.boreholeId,
                                  northingEasting: modalFormValues.northingEasting,
                                  latitudeLongitude: modalFormValues.latitudeLongitude,
                                  groundSurfaceElevation: modalFormValues.groundSurfaceElevation
                                };
                                
                                setBoreholeStructures(boreholeStructures.map(structure => {
                                  if (structure.id === currentStructureId) {
                                    return {
                                      ...structure,
                                      boreholes: [...structure.boreholes, newBorehole]
                                    };
                                  }
                                  return structure;
                                }));
                              }
                              
                              // Close the modal after saving
                              closeBoreholeModal();
                            }}>
                              {modalMode === 'structure' ? (
                                <>
                                  <div className="mb-3">
                                    <label htmlFor="structureNumber" className="form-label">Structure Number</label>
                                    <input 
                                      type="text" 
                                      className="form-control" 
                                      id="structureNumber"
                                      name="structureNumber"
                                      value={modalFormValues.structureNumber}
                                      onChange={handleModalInputChange}
                                    />
                                  </div>
                                  
                                  <h6 className="mt-4 mb-3">Initial Borehole Information</h6>
                                  
                                  <div className="mb-3">
                                    <label htmlFor="boreholeId" className="form-label">Borehole ID</label>
                                    <input 
                                      type="text" 
                                      className="form-control" 
                                      id="boreholeId"
                                      name="boreholeId"
                                      value={modalFormValues.boreholeId}
                                      onChange={handleModalInputChange}
                                    />
                                  </div>
                                  
                                  <div className="mb-3">
                                    <label htmlFor="northingEasting" className="form-label">Northing/Easting</label>
                                    <input 
                                      type="text" 
                                      className="form-control" 
                                      id="northingEasting"
                                      name="northingEasting"
                                      value={modalFormValues.northingEasting}
                                      onChange={handleModalInputChange}
                                    />
                                  </div>
                                  
                                  <div className="mb-3">
                                    <label htmlFor="latitudeLongitude" className="form-label">Latitude/Longitude</label>
                                    <input 
                                      type="text" 
                                      className="form-control" 
                                      id="latitudeLongitude"
                                      name="latitudeLongitude"
                                      value={modalFormValues.latitudeLongitude}
                                      onChange={handleModalInputChange}
                                    />
                                  </div>
                                  
                                  <div className="mb-3">
                                    <label htmlFor="groundSurfaceElevation" className="form-label">Ground Surface Elevation</label>
                                    <input 
                                      type="text" 
                                      className="form-control" 
                                      id="groundSurfaceElevation"
                                      name="groundSurfaceElevation"
                                      value={modalFormValues.groundSurfaceElevation}
                                      onChange={handleModalInputChange}
                                    />
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="mb-3">
                                    <label htmlFor="boreholeId" className="form-label">Borehole ID</label>
                                    <input 
                                      type="text" 
                                      className="form-control" 
                                      id="boreholeId"
                                      name="boreholeId"
                                      value={modalFormValues.boreholeId}
                                      onChange={handleModalInputChange}
                                    />
                                  </div>
                                  
                                  <div className="mb-3">
                                    <label htmlFor="northingEasting" className="form-label">Northing/Easting</label>
                                    <input 
                                      type="text" 
                                      className="form-control" 
                                      id="northingEasting"
                                      name="northingEasting"
                                      value={modalFormValues.northingEasting}
                                      onChange={handleModalInputChange}
                                    />
                                  </div>
                                  
                                  <div className="mb-3">
                                    <label htmlFor="latitudeLongitude" className="form-label">Latitude/Longitude</label>
                                    <input 
                                      type="text" 
                                      className="form-control" 
                                      id="latitudeLongitude"
                                      name="latitudeLongitude"
                                      value={modalFormValues.latitudeLongitude}
                                      onChange={handleModalInputChange}
                                    />
                                  </div>
                                  
                                  <div className="mb-3">
                                    <label htmlFor="groundSurfaceElevation" className="form-label">Ground Surface Elevation</label>
                                    <input 
                                      type="text" 
                                      className="form-control" 
                                      id="groundSurfaceElevation"
                                      name="groundSurfaceElevation"
                                      value={modalFormValues.groundSurfaceElevation}
                                      onChange={handleModalInputChange}
                                    />
                                  </div>
                                </>
                              )}
                              
                              <div className="mt-4">
                                <button type="submit" className="btn btn-primary">Save</button>
                                <button type="button" className="btn btn-secondary ms-2" onClick={closeBoreholeModal}>Cancel</button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Tests View */}
                  {activeView === 'tests' && (
                    <div>
                      <p className="mb-3">Test information for project: <strong>{selectedProject ? selectedProject.EfisProjectId || '' : ''}</strong></p>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Record/History</h5>
                        <button 
                          type="button" 
                          className="btn btn-sm btn-primary"
                          onClick={() => alert('Add new test functionality will be implemented here')}
                        >
                          <i className="bi bi-plus-circle me-1"></i> Add New Test
                        </button>
                      </div>
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th>Test Name</th>
                            <th>Method</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan="3" className="text-center">No tests available for this project</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ProjectsTable;
