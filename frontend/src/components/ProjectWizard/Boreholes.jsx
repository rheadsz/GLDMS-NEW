import React, { useState } from 'react';

function Boreholes({ data, onChange }) {
  const [structures, setStructures] = useState(data.structures || []);

  const handleAddStructure = () => {
    const newStructure = {
      id: Date.now().toString(),
      structureId: '',
      boreholes: []
    };
    
    const updatedStructures = [...structures, newStructure];
    setStructures(updatedStructures);
    onChange({ ...data, structures: updatedStructures });
  };

  const handleDeleteStructure = (id) => {
    const updatedStructures = structures.filter(structure => structure.id !== id);
    setStructures(updatedStructures);
    onChange({ ...data, structures: updatedStructures });
  };

  const handleStructureChange = (id, field, value) => {
    const updatedStructures = structures.map(structure => {
      if (structure.id === id) {
        return { ...structure, [field]: value };
      }
      return structure;
    });
    
    setStructures(updatedStructures);
    onChange({ ...data, structures: updatedStructures });
  };

  const handleAddBorehole = (structureId) => {
    const updatedStructures = structures.map(structure => {
      if (structure.id === structureId) {
        return { 
          ...structure, 
          boreholes: [
            ...(structure.boreholes || []), 
            {
              id: Date.now().toString(),
              boreholeId: '',
              latitude: '',
              longitude: '',
              northing: '',
              easting: '',
              groundSurfaceElevation: ''
            }
          ]
        };
      }
      return structure;
    });
    
    setStructures(updatedStructures);
    onChange({ ...data, structures: updatedStructures });
  };

  const handleDeleteBorehole = (structureId, boreholeId) => {
    const updatedStructures = structures.map(structure => {
      if (structure.id === structureId) {
        return { 
          ...structure, 
          boreholes: (structure.boreholes || []).filter(borehole => borehole.id !== boreholeId)
        };
      }
      return structure;
    });
    
    setStructures(updatedStructures);
    onChange({ ...data, structures: updatedStructures });
  };

  const handleBoreholeChange = (structureId, boreholeId, field, value) => {
    const updatedStructures = structures.map(structure => {
      if (structure.id === structureId) {
        return { 
          ...structure, 
          boreholes: (structure.boreholes || []).map(borehole => {
            if (borehole.id === boreholeId) {
              return { ...borehole, [field]: value };
            }
            return borehole;
          })
        };
      }
      return structure;
    });
    
    setStructures(updatedStructures);
    onChange({ ...data, structures: updatedStructures });
  };

  return (
    <div className="card mb-3">
      <div className="card-header bg-light fw-bold d-flex justify-content-between align-items-center">
        <span>Structures</span>
        <button 
          type="button" 
          className="btn btn-primary btn-sm" 
          onClick={handleAddStructure}
        >
          <i className="bi bi-plus-circle me-1"></i> Add New Structure
        </button>
      </div>
      <div className="card-body pb-2">
        {structures.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <i className="bi bi-info-circle me-2"></i>
            No structures added yet. Click "Add New Structure" to begin.
          </div>
        ) : (
          structures.map((structure, index) => (
            <div key={structure.id} className="card mb-4 shadow-sm" style={{ borderWidth: '2px', borderColor: '#dee2e6', borderStyle: 'solid' }}>
              <div className="card-header bg-light d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid #dee2e6' }}>
                <div className="d-flex align-items-center">
                  <label className="form-label mb-0 me-2">Structure ID or Name:</label>
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    style={{ width: '200px' }}
                    value={structure.structureId || ''} 
                    onChange={(e) => handleStructureChange(structure.id, 'structureId', e.target.value)}
                  />
                </div>
                <button 
                  type="button" 
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => handleDeleteStructure(structure.id)}
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-bordered table-sm">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '16%' }}>Borehole ID</th>
                        <th style={{ width: '16%' }}>Latitude</th>
                        <th style={{ width: '16%' }}>Longitude</th>
                        <th style={{ width: '16%' }}>Northing</th>
                        <th style={{ width: '16%' }}>Easting</th>
                        <th style={{ width: '16%' }}>Ground Surface Elevation</th>
                        <th style={{ width: '4%' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(structure.boreholes || []).map((borehole, bhIndex) => (
                        <tr key={borehole.id}>
                          <td>
                            <input 
                              type="text" 
                              className="form-control form-control-sm" 
                              value={borehole.boreholeId || ''} 
                              onChange={(e) => handleBoreholeChange(structure.id, borehole.id, 'boreholeId', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="form-control form-control-sm" 
                              value={borehole.latitude || ''} 
                              onChange={(e) => handleBoreholeChange(structure.id, borehole.id, 'latitude', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="form-control form-control-sm" 
                              value={borehole.longitude || ''} 
                              onChange={(e) => handleBoreholeChange(structure.id, borehole.id, 'longitude', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="form-control form-control-sm" 
                              value={borehole.northing || ''} 
                              onChange={(e) => handleBoreholeChange(structure.id, borehole.id, 'northing', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="form-control form-control-sm" 
                              value={borehole.easting || ''} 
                              onChange={(e) => handleBoreholeChange(structure.id, borehole.id, 'easting', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="form-control form-control-sm" 
                              value={borehole.groundSurfaceElevation || ''} 
                              onChange={(e) => handleBoreholeChange(structure.id, borehole.id, 'groundSurfaceElevation', e.target.value)}
                            />
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDeleteBorehole(structure.id, borehole.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan="7" className="text-center">
                          <button 
                            type="button" 
                            className="btn btn-success btn-sm"
                            onClick={() => handleAddBorehole(structure.id)}
                          >
                            <i className="bi bi-plus-circle me-1"></i> Add new borehole
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Navigation buttons */}
        <div className="row mt-3">
          <div className="col-12 d-flex justify-content-between">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => onChange({ ...data, structures: structures, _prevStep: true })}
            >
              <i className="bi bi-arrow-left me-1"></i> Previous
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => onChange({ ...data, structures: structures, _nextStep: true })}
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
