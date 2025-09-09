import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

function ProjectInfo({ data, onChange }) {
  const [error, setError] = useState(null);

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
        
        {/* Fifth row - Project Component */}
        <div className="row mb-2">
          <div className="col-md-12 mb-2">
            <label className="form-label">Project Component:</label>
            <input type="text" className="form-control form-control-sm" value={data.projectComponent || ""} onChange={e => onChange({ ...data, projectComponent: e.target.value })} />
          </div>
        </div>
        
        {/* Sixth row - Structure No. */}
        <div className="row mb-2">
          <div className="col-md-4 mb-2">
            <label className="form-label">Structure No.:</label>
            <input type="text" className="form-control form-control-sm" value={data.structureNo || ""} onChange={e => onChange({ ...data, structureNo: e.target.value })} />
          </div>
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