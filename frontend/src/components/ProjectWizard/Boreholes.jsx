import React, { useState, useEffect } from 'react';

function Boreholes({ data, onChange }) {
  // Use boreholes from the current step but get structure list from ProjectInfo
  const [boreholes, setBoreholes] = useState(data.Boreholes?.boreholes || []);
  
  // Get previously added structures from ProjectInfo step
  const projectStructures = data.ProjectInfo?.structures || [];

  // Initialize or update boreholes when data changes
  useEffect(() => {
    if (data.Boreholes?.boreholes) {
      setBoreholes(data.Boreholes.boreholes);
    }
  }, [data.Boreholes?.boreholes]);

  const handleAddBorehole = () => {
    const newBorehole = {
      id: Date.now().toString(),
      structureId: projectStructures.length > 0 ? projectStructures[0].id : '',
      boreholeId: '',
      latitude: '',
      longitude: '',
      northing: '',
      easting: '',
      groundSurfaceElevation: ''
    };
    
    const updatedBoreholes = [...boreholes, newBorehole];
    setBoreholes(updatedBoreholes);
    onChange({ boreholes: updatedBoreholes });
  };

  const handleDeleteBorehole = (boreholeId) => {
    const updatedBoreholes = boreholes.filter(borehole => borehole.id !== boreholeId);
    setBoreholes(updatedBoreholes);
    onChange({ boreholes: updatedBoreholes });
  };

  const handleBoreholeChange = (boreholeId, field, value) => {
    const updatedBoreholes = boreholes.map(borehole => {
      if (borehole.id === boreholeId) {
        return { ...borehole, [field]: value };
      }
      return borehole;
    });
    
    setBoreholes(updatedBoreholes);
    onChange({ boreholes: updatedBoreholes });
  };

  return (
    <div className="card mb-3">
      <div className="card-header bg-light fw-bold">
        <span>Boreholes</span>
      </div>
      <div className="card-body pb-2">
        {projectStructures.length === 0 ? (
          <div className="alert alert-warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Please add structures in the Project Information step before adding boreholes.
          </div>
        ) : (
          <>
            
            <div className="table-responsive">
              <table className="table table-bordered table-sm">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '15%' }}>Structure</th>
                    <th style={{ width: '14%' }}>Borehole ID</th>
                    <th style={{ width: '14%' }}>Latitude</th>
                    <th style={{ width: '14%' }}>Longitude</th>
                    <th style={{ width: '14%' }}>Northing</th>
                    <th style={{ width: '14%' }}>Easting</th>
                    <th style={{ width: '14%' }}>Ground Surface Elevation</th>
                    <th style={{ width: '4%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {boreholes.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-3 text-muted">
                        <i className="bi bi-info-circle me-2"></i>
                        No boreholes added yet.
                      </td>
                    </tr>
                  ) : (
                    boreholes.map(borehole => (
                      <tr key={borehole.id}>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={borehole.structureId || ''}
                            onChange={(e) => handleBoreholeChange(borehole.id, 'structureId', e.target.value)}
                          >
                            <option value="">-- Select --</option>
                            {projectStructures.map(structure => (
                              <option key={structure.id} value={structure.id}>
                                {structure.structureNo ? `${structure.projectComponent} (${structure.structureNo})` : structure.projectComponent}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control form-control-sm" 
                            value={borehole.boreholeId || ''} 
                            onChange={(e) => handleBoreholeChange(borehole.id, 'boreholeId', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control form-control-sm" 
                            value={borehole.latitude || ''} 
                            onChange={(e) => handleBoreholeChange(borehole.id, 'latitude', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control form-control-sm" 
                            value={borehole.longitude || ''} 
                            onChange={(e) => handleBoreholeChange(borehole.id, 'longitude', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control form-control-sm" 
                            value={borehole.northing || ''} 
                            onChange={(e) => handleBoreholeChange(borehole.id, 'northing', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control form-control-sm" 
                            value={borehole.easting || ''} 
                            onChange={(e) => handleBoreholeChange(borehole.id, 'easting', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control form-control-sm" 
                            value={borehole.groundSurfaceElevation || ''} 
                            onChange={(e) => handleBoreholeChange(borehole.id, 'groundSurfaceElevation', e.target.value)}
                          />
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDeleteBorehole(borehole.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  <tr>
                    <td colSpan="8" className="text-center">
                      <button 
                        type="button" 
                        className="btn btn-success btn-sm"
                        onClick={handleAddBorehole}
                        disabled={projectStructures.length === 0}
                      >
                        <i className="bi bi-plus-circle me-1"></i> Add New Borehole
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {/* Navigation buttons */}
        <div className="row mt-3">
          <div className="col-12 d-flex justify-content-between">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => onChange({ boreholes: boreholes, _prevStep: true })}
            >
              <i className="bi bi-arrow-left me-1"></i> Previous
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => onChange({ boreholes: boreholes, _nextStep: true })}
            >
              Next <i className="bi bi-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Boreholes;
