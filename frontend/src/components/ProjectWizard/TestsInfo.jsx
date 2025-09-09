import React, { useState } from "react";

function TestsInfo({ data, onChange }) {
  // Extract data from props
  const structures = data?.structures || [];
  const samples = data?.samples || [];
  
  // Check if there's only one structure
  const hasSingleStructure = structures.length === 1;
  
  // Generate borehole-sample options from samples data
  const boreholeSampleOptions = [];
  
  samples.forEach(sample => {
    if (sample && sample.boreholeId && (sample.depthFrom || sample.depthTo)) {
      // Create a display string with borehole ID and depth
      const depthDisplay = sample.depthFrom && sample.depthTo
        ? `${sample.depthFrom}-${sample.depthTo}`
        : sample.depthFrom || sample.depthTo;
      
      boreholeSampleOptions.push(`${sample.boreholeId} - ${depthDisplay}`);
    }
  });
  
  // Check if there's only one borehole-sample option
  const hasSingleBoreholeSample = boreholeSampleOptions.length === 1;
  
  // Initialize test rows with structure and boreholeSample values if there's only one of each
  const initialTestRows = data?.testRows || [{
    id: Date.now().toString(),
    structure: hasSingleStructure ? (structures[0]?.structureId || '') : '',
    boreholeSample: hasSingleBoreholeSample ? (boreholeSampleOptions[0] || '') : '',
    tests: []
  }];
  
  const [testRows, setTestRows] = useState(initialTestRows);

  // Test options
  const testOptions = [
    'Moisture Content', 
    'Unit Weight', 
    'Specific Gravity', 
    'Particle Size Analysis', 
    'Plasticity Index',
    'No. 200 Sieve Wash',
    'Particle Size Distribution - Sieve Analysis',
    'Particle Size Distribution - Hydrometer',
    'Consolidation',
    'Direct Shear',
    'Triaxial - CUe',
    'Triaxial - UU',
    'Unconfined Compression – Soil',
    'Unconfined Compression – Rock',
    'Point Load',
    'Permeability/Hydraulic Conductivity',
    'Swell/Collapse Potential',
    'Expansion Index',
    'Compaction Curve',
    'Sand Equivalent',
    'Corrosion'
  ];

  const handleAddRow = () => {
    const newRow = {
      id: Date.now().toString(),
      // If there's only one structure, automatically set the structure value
      structure: hasSingleStructure ? (structures[0]?.structureId || '') : '',
      // If there's only one borehole-sample, automatically set the boreholeSample value
      boreholeSample: hasSingleBoreholeSample ? (boreholeSampleOptions[0] || '') : '',
      tests: []
    };
    
    const updatedRows = [...testRows, newRow];
    setTestRows(updatedRows);
    onChange({ 
      ...data, 
      testRows: updatedRows,
      // Don't include these in the onChange as they're passed from parent
      structures: undefined,
      samples: undefined
    });
  };

  const handleDeleteRow = (rowId) => {
    const updatedRows = testRows.filter(row => row.id !== rowId);
    setTestRows(updatedRows);
    onChange({ 
      ...data, 
      testRows: updatedRows,
      // Don't include these in the onChange as they're passed from parent
      structures: undefined,
      samples: undefined
    });
  };

  const handleRowChange = (rowId, field, value) => {
    const updatedRows = testRows.map(row => {
      if (row.id === rowId) {
        // If there's only one structure, automatically set the structure value
        if (hasSingleStructure && field === 'structure') {
          return { ...row, structure: structures[0]?.structureId || '' };
        }
        // If there's only one borehole-sample, automatically set the boreholeSample value
        if (hasSingleBoreholeSample && field === 'boreholeSample') {
          return { ...row, boreholeSample: boreholeSampleOptions[0] || '' };
        }
        return { ...row, [field]: value };
      }
      return row;
    });
    
    setTestRows(updatedRows);
    // Preserve structures and samples data when updating
    onChange({ 
      ...data, 
      testRows: updatedRows,
      // Don't include these in the onChange as they're passed from parent
      structures: undefined,
      samples: undefined
    });
  };
  
  // Handle toggling tests on and off
  const handleTestToggle = (rowId, testName) => {
    const updatedRows = testRows.map(row => {
      if (row.id === rowId) {
        const currentTests = [...(row.tests || [])];
        const testIndex = currentTests.indexOf(testName);
        
        // If test is already selected, remove it; otherwise add it
        if (testIndex !== -1) {
          currentTests.splice(testIndex, 1);
        } else {
          currentTests.push(testName);
        }
        
        return { ...row, tests: currentTests };
      }
      return row;
    });
    
    setTestRows(updatedRows);
    onChange({ 
      ...data, 
      testRows: updatedRows,
      // Don't include these in the onChange as they're passed from parent
      structures: undefined,
      samples: undefined
    });
  };

  return (
    <div className="card mb-3">
      <div className="card-header bg-light fw-bold d-flex justify-content-between align-items-center">
        <span>Tests</span>
      </div>
      <div className="card-body pb-2">
        <div className="table-responsive mb-3">
          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th style={{ width: '20%' }}>Structure</th>
                <th style={{ width: '50%' }}>Tests</th>
                <th style={{ width: '20%' }}>Borehole-Samples</th>
                <th style={{ width: '10%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {testRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    {hasSingleStructure ? (
                      // If there's only one structure, show a text input with that structure ID
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        value={structures[0]?.structureId || ''}
                        readOnly
                      />
                    ) : (
                      // If there are multiple structures, show a dropdown
                      <select 
                        className="form-select form-select-sm" 
                        value={row.structure || ''}
                        onChange={(e) => handleRowChange(row.id, 'structure', e.target.value)}
                      >
                        <option value="">Select Structure</option>
                        {structures.map((structure) => (
                          <option key={structure.id} value={structure.structureId}>{structure.structureId}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    <div className="test-checkboxes" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {testOptions.map((testName, index) => (
                        <div key={index} className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`test-${row.id}-${index}`}
                            checked={row.tests?.includes(testName) || false}
                            onChange={() => handleTestToggle(row.id, testName)}
                          />
                          <label className="form-check-label" htmlFor={`test-${row.id}-${index}`}>
                            {testName}
                          </label>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    {hasSingleBoreholeSample ? (
                      // If there's only one borehole-sample, show a text input with that value
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        value={boreholeSampleOptions[0] || ''}
                        readOnly
                      />
                    ) : (
                      // If there are multiple borehole-samples, show a dropdown
                      <select 
                        className="form-select form-select-sm" 
                        value={row.boreholeSample || ''}
                        onChange={(e) => handleRowChange(row.id, 'boreholeSample', e.target.value)}
                      >
                        <option value="">Select Borehole-Sample</option>
                        {boreholeSampleOptions.length > 0 ? (
                          boreholeSampleOptions.map((option, index) => (
                            <option key={index} value={option}>{option}</option>
                          ))
                        ) : (
                          <option value="" disabled>No boreholes available</option>
                        )}
                      </select>
                    )}
                  </td>
                  <td className="text-center">
                    {testRows.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDeleteRow(row.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="d-flex justify-content-center mt-3">
          <button 
            type="button" 
            className="btn btn-success" 
            onClick={handleAddRow}
          >
            <i className="bi bi-plus-circle me-1"></i> Add new row
          </button>
        </div>
        
        {/* Navigation buttons */}
        <div className="row mt-4">
          <div className="col-12">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => onChange({ 
                ...data, 
                testRows: testRows, 
                _prevStep: true,
                // Don't include these in the onChange as they're passed from parent
                structures: undefined,
                samples: undefined
              })}
            >
              <i className="bi bi-arrow-left me-1"></i> Previous
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestsInfo;
