import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

function ProjectInfo({ data, onChange }) {
  const [error, setError] = useState(null);
  const [structures, setStructures] = useState(data.structures || []);
  const [projectSuggestions, setProjectSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Function to fetch project data from visiondb
  const fetchProjectData = useCallback(async (projectIdRaw) => {
    const projectId = projectIdRaw?.trim();
    if (!projectId) {
      return;
    }

    setError(null);

    try {
      const response = await axios.get(`/api/visiondb/project/${encodeURIComponent(projectId)}`);
      
      if (response.data) {
        console.log('Received project data:', response.data);
        // Map database columns to form fields
        const projectData = {
          // Get the current data values from the parent component
          ...data,
          // Only update fields from the API response
          ea: response.data.ProjectEa || '',
          projectName: response.data.ProjectName || '',
          district: response.data.District || '',
          county: response.data.County || '',
          route: response.data.RouteCode || '',
          pmStart: response.data.PostMileBegin || '',
          pmEnd: response.data.PostMileEnd || '',
          // Preserve user-entered values for these fields
          projectComponent: data.projectComponent || '',
          structureNo: data.structureNo || ''
        };
        
        onChange(projectData);
      }
    } catch (err) {
      console.error('Error fetching project data:', err);
      const message = err.response?.data?.message || 'Failed to fetch project data. Please check the Project ID.';
      setError(message);
    }
  }, [data, onChange]);

  // Function to search for project IDs
  const searchProjectIds = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setProjectSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    console.log('Searching for projects with term:', searchTerm);
    setIsSearching(true);
    try {
      const response = await axios.get(`/api/visiondb/search-projects?q=${encodeURIComponent(searchTerm)}`);
      console.log('Search response:', response.data);
      setProjectSuggestions(response.data || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Error searching projects:', err);
      console.error('Error details:', err.response?.data);
      setProjectSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Create a ref to track the previous projectID
  const prevProjectIdRef = useRef('');
  
  // Effect to fetch data when projectID changes
  useEffect(() => {
    // Only fetch data when projectID is not empty and has changed
    const normalizedId = data.projectID?.trim();
    if (normalizedId && normalizedId !== prevProjectIdRef.current) {
      // Update the ref with current projectID
      prevProjectIdRef.current = normalizedId;
      // Fetch data for the new projectID
      fetchProjectData(normalizedId);
    }
  }, [data.projectID, fetchProjectData]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle project ID input change with debounce
  const handleProjectIdChange = (value) => {
    const normalizedValue = value.toString().trimStart();
    onChange({ ...data, projectID: normalizedValue });
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for search (300ms delay)
    searchTimeoutRef.current = setTimeout(() => {
      searchProjectIds(value);
    }, 300);
  };

  // Handle selecting a suggestion
  const handleSelectSuggestion = (projectId) => {
    const normalized = projectId.trim();
    onChange({ ...data, projectID: normalized });
    setShowSuggestions(false);
    setProjectSuggestions([]);
    fetchProjectData(normalized);
  };

  return (
    <div className="card mb-3">
      <style>
        {`
          .form-control,
          .form-select,
          .form-check-input {
            border-color: #495057 !important;
            border-width: 2px !important;
          }
          .form-control:focus,
          .form-select:focus,
          .form-check-input:focus {
            border-color: #212529 !important;
            border-width: 2px !important;
            box-shadow: 0 0 0 0.2rem rgba(33, 37, 41, 0.25) !important;
          }
          .autocomplete-suggestions {
            position: absolute;
            z-index: 1000;
            background: white;
            border: 2px solid #495057;
            border-top: none;
            max-height: 200px;
            overflow-y: auto;
            width: 100%;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .autocomplete-suggestion {
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid #e9ecef;
          }
          .autocomplete-suggestion:hover {
            background-color: #e9ecef;
          }
          .autocomplete-suggestion:last-child {
            border-bottom: none;
          }
        `}
      </style>
      <div className="card-header bg-light fw-bold">PROJECT INFORMATION</div>
      <div className="card-body pb-2">
        {/* First row - Project ID */}
        <div className="row mb-2">
          <div className="col-md-4 mb-2" style={{ position: 'relative' }}>
            <label className="form-label">Project ID (EFIS):</label>
            <input 
              ref={inputRef}
              type="text" 
              className="form-control form-control-sm" 
              value={data.projectID || ""} 
              onChange={e => {
                console.log('Input changed:', e.target.value);
                handleProjectIdChange(e.target.value);
              }}
              onFocus={() => {
                console.log('Input focused, suggestions:', projectSuggestions.length);
                if (projectSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              placeholder="Start typing to search..."
              autoComplete="off"
            />
            {isSearching && (
              <div className="small text-muted mt-1">
                <span className="spinner-border spinner-border-sm me-1"></span>
                Searching...
              </div>
            )}
            {showSuggestions && projectSuggestions.length > 0 && (
              <div ref={suggestionsRef} className="autocomplete-suggestions">
                {projectSuggestions.map((project, index) => (
                  <div
                    key={index}
                    className="autocomplete-suggestion"
                    onClick={() => {
                      console.log('Suggestion clicked:', project.ProjectID);
                      handleSelectSuggestion(project.ProjectID);
                    }}
                  >
                    <div className="fw-bold">{project.ProjectID}</div>
                    {project.ProjectName && (
                      <div className="small text-muted">{project.ProjectName}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!isSearching && data.projectID && data.projectID.length >= 2 && projectSuggestions.length === 0 && showSuggestions && (
              <div className="small text-muted mt-1">No projects found</div>
            )}
            {error && <div className="text-danger small mt-1">{error}</div>}
          </div>
        </div>
        
        {/* Second row - EA */}
        <div className="row mb-2">
          <div className="col-md-4 mb-2">
            <label className="form-label">EA:</label>
            <input type="text" className="form-control form-control-sm" value={data.ea || ""} onChange={e => onChange({ ...data, ea: e.target.value })} />
          </div>
        </div>
        
        {/* Third row - District, County, Route, PM(Beg), PM(End) */}
        <div className="row mb-2">
          <div className="col-md-2 mb-2">
            <label className="form-label">District:</label>
            <input type="text" className="form-control form-control-sm" value={data.district || ""} onChange={e => onChange({ ...data, district: e.target.value })} />
          </div>
          <div className="col-md-2 mb-2">
            <label className="form-label">County:</label>
            <input type="text" className="form-control form-control-sm" value={data.county || ""} onChange={e => onChange({ ...data, county: e.target.value })} />
          </div>
          <div className="col-md-2 mb-2">
            <label className="form-label">Route:</label>
            <input type="text" className="form-control form-control-sm" value={data.route || ""} onChange={e => onChange({ ...data, route: e.target.value })} />
          </div>
          <div className="col-md-2 mb-2">
            <div className="mb-2">
              <label className="form-label">PM(Beg):</label>
              <input type="text" className="form-control form-control-sm" value={data.pmStart || ""} onChange={e => onChange({ ...data, pmStart: e.target.value })} />
            </div>
            <div>
              <label className="form-label">PM(End):</label>
              <input type="text" className="form-control form-control-sm" value={data.pmEnd || ""} onChange={e => onChange({ ...data, pmEnd: e.target.value })} />
            </div>
          </div>
        </div>
        
        {/* Fourth row - Project Name */}
        <div className="row mb-2">
          <div className="col-md-12 mb-2">
            <label className="form-label">Project Name:</label>
            <input type="text" className="form-control form-control-sm" value={data.projectName || ""} onChange={e => onChange({ ...data, projectName: e.target.value })} />
          </div>
        </div>
        
        {/* Fifth row - Structures Section */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="card-title mb-0">Structures</h5>
              <button 
                type="button" 
                className="btn btn-success btn-sm"
                onClick={() => {
                  const newStructures = [...structures, { 
                    id: Date.now().toString(),
                    projectComponent: '',
                    structureNo: '' 
                  }];
                  setStructures(newStructures);
                  onChange({ ...data, structures: newStructures });
                }}
              >
                <i className="bi bi-plus-circle me-1"></i> Add New Structure
              </button>
            </div>
            
            {/* Display added structures */}
            {structures.length > 0 ? (
              <div className="structures-container">
                {structures.map((structure, index) => (
                  <div key={structure.id} className="structure-row border p-3 mb-2 rounded bg-light">
                    <div className="d-flex justify-content-between mb-2">
                      <strong>Structure {index + 1}</strong>
                      <button 
                        type="button" 
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => {
                          const newStructures = structures.filter(s => s.id !== structure.id);
                          setStructures(newStructures);
                          onChange({ ...data, structures: newStructures });
                        }}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <label className="form-label">Project Component:</label>
                        <input 
                          type="text" 
                          className="form-control form-control-sm" 
                          value={structure.projectComponent || ""} 
                          onChange={e => {
                            const updatedStructures = structures.map(s => 
                              s.id === structure.id ? {...s, projectComponent: e.target.value} : s
                            );
                            setStructures(updatedStructures);
                            onChange({ ...data, structures: updatedStructures });
                          }} 
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Structure No.:</label>
                        <input 
                          type="text" 
                          className="form-control form-control-sm" 
                          value={structure.structureNo || ""} 
                          onChange={e => {
                            const updatedStructures = structures.map(s => 
                              s.id === structure.id ? {...s, structureNo: e.target.value} : s
                            );
                            setStructures(updatedStructures);
                            onChange({ ...data, structures: updatedStructures });
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-3 border rounded bg-light">
                <p className="mb-0 text-muted">No structures added. Click "Add New Structure" to begin.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Keep legacy fields for backward compatibility if needed */}
        <div className="d-none">
          <input type="hidden" value={data.projectComponent || ""} />
          <input type="hidden" value={data.structureNo || ""} />
        </div>
        
        {/* Navigation buttons */}
        <div className="row mt-3">
          <div className="col-12 d-flex justify-content-end">
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => onChange({ ...data, _nextStep: true })}
            >
              Next <i className="bi bi-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectInfo;