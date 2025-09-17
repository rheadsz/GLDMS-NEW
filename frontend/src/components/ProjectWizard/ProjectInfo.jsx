import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

function ProjectInfo({ data, onChange }) {
  const [error, setError] = useState(null);
  const [structures, setStructures] = useState(data.structures || []);

  // Function to fetch project data from visiondb
  const fetchProjectData = useCallback(async (projectId) => {
    if (!projectId || projectId.trim() === '') return;
    
    setError(null);
    
    try {
      const response = await axios.get(`/api/visiondb/project/${projectId}`);
      
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
      setError('Failed to fetch project data. Please check the Project ID.');
    }
  }, [onChange]);

  // Create a ref to track the previous projectID
  const prevProjectIdRef = useRef('');
  
  // Effect to fetch data when projectID changes
  useEffect(() => {
    // Only fetch data when projectID is not empty and has changed
    if (data.projectID && data.projectID.trim() !== '' && 
        data.projectID !== prevProjectIdRef.current) {
      // Update the ref with current projectID
      prevProjectIdRef.current = data.projectID;
      // Fetch data for the new projectID
      fetchProjectData(data.projectID);
    }
  }, [data.projectID, fetchProjectData]);

  return (
    <div className="card mb-3">
      <div className="card-header bg-light fw-bold">PROJECT INFORMATION</div>
      <div className="card-body pb-2">
        {/* First row - Project ID */}
        <div className="row mb-2">
          <div className="col-md-4 mb-2">
            <label className="form-label">Project ID (EFIS):</label>
            <input 
              type="text" 
              className="form-control form-control-sm" 
              value={data.projectID || ""} 
              onChange={e => onChange({ ...data, projectID: e.target.value })} 
              placeholder="Enter Project ID to auto-fill fields"
            />
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