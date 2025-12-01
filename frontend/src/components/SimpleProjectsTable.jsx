import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectDetailsModal from './ProjectDetailsModal';

function SimpleProjectsTable() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'yours'
  const [searchFilters, setSearchFilters] = useState({
    projectId: '',
    ea: '',
    county: '',
    district: ''
  });
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showTableSidebar, setShowTableSidebar] = useState(false);

  // Fetch projects from the backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        
        // Get the current user from localStorage
        const userName = localStorage.getItem('userName');
        
        // Fetch user's projects if userName is available
        let response;
        if (userName && activeTab === 'yours') {
          // Fetch user's projects
          response = await fetch(`/api/user-projects/${userName}`);
        } else {
          // Fetch all projects
          response = await fetch('/api/projects');
        }
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        const projectsList = data.projects || data;
        console.log('Projects data:', projectsList);
      
      // Log each project to see the exact structure
      if (projectsList && projectsList.length > 0) {
        console.log('First project details:', projectsList[0]);
        console.log('ProjectID:', projectsList[0].ProjectID);
        console.log('DBProjectID:', projectsList[0].DBProjectID);
        console.log('EfisProjectId:', projectsList[0].EfisProjectId);
        
        // Convert to lowercase keys for easier debugging
        const keysMap = {};
        Object.keys(projectsList[0]).forEach(key => {
          keysMap[key.toLowerCase()] = key;
        });
        console.log('Available keys (case-insensitive mapping):', keysMap);
      }  
        
        setProjects(projectsList);
        setError(null);
      } catch (err) {
        setError('Failed to fetch projects: ' + err.message);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [activeTab]);
  
  // Handle search filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    // Apply filters in the UI
  };
  
  // Filter projects based on search criteria
  const getFilteredProjects = () => {
    return projects.filter(project => (
      (searchFilters.projectId === '' || 
        (project.ProjectID || project.EfisProjectId)?.toString().toLowerCase().includes(searchFilters.projectId.toLowerCase())) &&
      (searchFilters.ea === '' || 
        project.EA?.toString().toLowerCase().includes(searchFilters.ea.toLowerCase())) &&
      (searchFilters.county === '' || 
        project.County?.toString().toLowerCase().includes(searchFilters.county.toLowerCase())) &&
      (searchFilters.district === '' || 
        project.District?.toString().toLowerCase().includes(searchFilters.district.toLowerCase()))
    ));
  };
  
  const filteredProjects = getFilteredProjects();
  
  const handleViewDetails = (projectId) => {
    console.log('Opening details for project ID:', projectId);
    setSelectedProjectId(projectId);
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProjectId(null);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', position: 'relative', flexDirection: 'row' }}>
      {/* Hamburger Menu Button (visible only when modal is open) */}
      {showModal && (
        <button
          onClick={() => setShowTableSidebar(!showTableSidebar)}
          className="btn"
          style={{
            position: 'fixed',
            top: '80px',
            left: showTableSidebar ? '420px' : '15px',
            zIndex: 2000,
            backgroundColor: '#ffffff',
            color: '#0d6efd',
            border: '2px solid #0d6efd',
            borderRadius: '8px',
            padding: '12px 16px',
            cursor: 'pointer',
            fontSize: '24px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#0d6efd';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.color = '#0d6efd';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title={showTableSidebar ? "Hide Projects" : "Show Projects"}
        >
          <span style={{ lineHeight: '1' }}>☰</span>
          <span style={{ fontSize: '14px', display: showTableSidebar ? 'none' : 'inline' }}>Projects</span>
        </button>
      )}

      {/* Collapsible Table Sidebar (visible when hamburger is clicked) */}
      {showModal && showTableSidebar && (
        <div style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '400px',
          height: '100vh',
          backgroundColor: '#f8f9fa',
          boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
          overflow: 'auto',
          zIndex: 1500,
          transition: 'transform 0.3s ease',
          transform: showTableSidebar ? 'translateX(0)' : 'translateX(-100%)',
          borderRight: '1px solid #dee2e6'
        }}>
          <div style={{ padding: '20px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '2px solid #0d6efd'
            }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => setActiveTab('all')}
                  style={{
                    background: activeTab === 'all' ? '#0d6efd' : 'transparent',
                    color: activeTab === 'all' ? '#fff' : '#0d6efd',
                    border: '2px solid #0d6efd',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'all') {
                      e.currentTarget.style.backgroundColor = '#e7f3ff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'all') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <i className="bi bi-folder2-open me-2"></i>
                  All Projects
                </button>
                <button
                  onClick={() => setActiveTab('yours')}
                  style={{
                    background: activeTab === 'yours' ? '#0d6efd' : 'transparent',
                    color: activeTab === 'yours' ? '#fff' : '#0d6efd',
                    border: '2px solid #0d6efd',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'yours') {
                      e.currentTarget.style.backgroundColor = '#e7f3ff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'yours') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <i className="bi bi-person-circle me-2"></i>
                  My Projects
                </button>
              </div>
              <button
                onClick={() => setShowTableSidebar(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6c757d',
                  padding: '0',
                  lineHeight: '1'
                }}
                title="Close"
              >
                ×
              </button>
            </div>
            <div className="list-group" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              {filteredProjects.map((project, index) => {
                const projectId = project.ProjectID || project.projectId || project.projectID || 'N/A';
                const actualProjectId = project.DBProjectID || project.dbprojectid || project.ProjectID || project.EfisProjectId;
                let projectName = project.ProjectName || '';
                if (projectName.includes(' - ')) {
                  projectName = projectName.split(' - ').slice(1).join(' - ');
                }
                
                const isSelected = selectedProjectId === actualProjectId;
                
                return (
                  <button
                    key={index}
                    className={`list-group-item list-group-item-action ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      handleViewDetails(actualProjectId);
                      setShowTableSidebar(false);
                    }}
                    style={{ 
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      border: 'none',
                      borderBottom: '1px solid #e9ecef',
                      padding: '12px 16px',
                      transition: 'all 0.2s ease',
                      backgroundColor: isSelected ? '#0d6efd' : '#fff'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#e7f3ff';
                        e.currentTarget.style.paddingLeft = '20px';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.paddingLeft = '16px';
                      }
                    }}
                  >
                    <div className="fw-bold" style={{ marginBottom: '4px', color: isSelected ? '#fff' : '#212529' }}>
                      <i className="bi bi-file-earmark-text me-2"></i>
                      {projectId}
                    </div>
                    <div className="small text-truncate" style={{ color: isSelected ? '#fff' : '#6c757d' }}>
                      {projectName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ 
        flex: showModal ? '0' : '1', 
        transition: 'flex 0.3s ease', 
        overflow: 'auto',
        display: showModal ? 'none' : 'flex',
        flexDirection: 'column'
      }}>
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
            My Projects
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
          <div className="table-responsive">
            <table className="table table-striped table-hover" style={{ tableLayout: 'fixed', width: '100%' }}>
              <thead className="table-light">
                <tr>
                  <th style={{ width: '70%' }}>Project_ID_EA_District_County_Route_Project_Name</th>
                  <th style={{ width: '15%' }}>Status</th>
                  <th style={{ width: '15%' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project, index) => {
                    // Get project ID
                    const projectId = project.ProjectID || project.projectId || project.projectID || 'N/A';
                    const actualProjectId = project.DBProjectID || project.dbprojectid || project.ProjectID || project.EfisProjectId;
                    
                    // Get project name and remove the ID prefix if it exists
                    let projectName = project.ProjectName || '';
                    // Remove the project ID prefix from the name (e.g., "0100000088 - " from "0100000088 - ROADWAY REHABILITATION")
                    if (projectName.includes(' - ')) {
                      projectName = projectName.split(' - ').slice(1).join(' - ');
                    }
                    
                    // Combine all fields with underscores
                    const combinedInfo = [
                      projectId,
                      project.EA || project.ProjectEa || project.projectEa || '',
                      project.District || '',
                      project.County || '',
                      project.Route || project.RouteCode || '',
                      projectName
                    ].filter(val => val !== '').join('_');
                    
                    // Check if this row is selected
                    const isSelected = selectedProjectId === actualProjectId;
                    
                    // Hide other rows when a project is selected
                    if (showModal && !isSelected) {
                      return null;
                    }
                    
                    return (
                      <tr 
                        key={index}
                        style={{ 
                          backgroundColor: isSelected ? '#e7f3ff' : '',
                          fontWeight: isSelected ? 'bold' : 'normal',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <td style={{ wordWrap: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis' }}>{combinedInfo}</td>
                        <td>
                          <span className="badge bg-success">Submitted</span>
                        </td>
                        <td className="text-center">
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              console.log('Project data:', project);
                              console.log('Using project ID:', actualProjectId);
                              handleViewDetails(actualProjectId);
                            }}
                            title="View Details"
                          >
                            <i className="bi bi-chevron-right"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center py-4">
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
        )}
      </div>
      </div>
      
      {/* Side Panel for Project Details */}
      {showModal && (
        <div style={{
          flex: '1',
          width: '100%',
          backgroundColor: '#fff',
          overflow: 'auto',
          height: '100vh',
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          marginLeft: showTableSidebar ? '400px' : '0'
        }}>
          <div style={{ position: 'relative', height: '100%' }}>
            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                border: 'none',
                background: 'transparent',
                fontSize: '24px',
                cursor: 'pointer',
                zIndex: 1000
              }}
              title="Close"
            >
              ×
            </button>
            <ProjectDetailsModal 
              projectId={selectedProjectId}
              onClose={handleCloseModal}
              isPanel={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SimpleProjectsTable;
