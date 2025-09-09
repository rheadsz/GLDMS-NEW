import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-light">
                <tr>
                  <th>Project ID</th>
                  <th>EA</th>
                  <th>District</th>
                  <th>County</th>
                  <th>Route</th>
                  <th>Project Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project, index) => (
                    <tr key={index}>
                      <td>
                        {/* Display ProjectID based on the actual data structure */}
                        {project.ProjectID || project.projectId || project.projectID || 'N/A'}
                      </td>
                      <td>{project.EA || project.ProjectEa || project.projectEa || ''}</td>
                      <td>{project.District}</td>
                      <td>{project.County}</td>
                      <td>{project.Route || project.RouteCode || ''}</td>
                      <td>{project.ProjectName}</td>
                      <td>
                        <span className="badge bg-success">Submitted</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
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
    </>
  );
}

export default SimpleProjectsTable;
