import React, { useState } from "react";
import axios from "axios";

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
    structure: hasSingleStructure ? (structures[0]?.id || '') : '',
    boreholeSample: hasSingleBoreholeSample ? (boreholeSampleOptions[0] || '') : '',
    tests: []
  }];
  
  const [testRows, setTestRows] = useState(initialTestRows);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Check if any test row has Sand Equivalent or Corrosion
  const hasRelevantTests = testRows.some(row => 
    row.tests && (row.tests.includes('Sand Equivalent') || row.tests.includes('Corrosion'))
  );

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
      structure: hasSingleStructure ? (structures[0]?.id || '') : '',
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
  
  // Handle PDF generation
  const handleGenerateTestForms = async () => {
    setIsGeneratingPDF(true);
    try {
      // Get the parent formData from window or pass it through props
      // For now, we'll need to access it from the parent component
      console.log('Data available in TestsInfo:', data);
      
      // Prepare the data to send to backend
      const requestData = {
        testRows: testRows,
        projectInfo: data.projectInfo || {},
        boreholes: data.boreholes || [],
        samples: samples
      };
      
      console.log('Sending request data:', requestData);

      const response = await axios.post('/api/pdf/generate-test-form', requestData, {
        responseType: 'blob' // Important for downloading files
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'test-form.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert('Test form generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating test form: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsGeneratingPDF(false);
    }
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
                      // If there's only one structure, show a text input with structure info
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        value={
                          structures[0] ? (
                            `${structures[0].projectComponent || ''} ${structures[0].structureNo ? '- ' + structures[0].structureNo : ''}`
                          ) : ''
                        }
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
                          <option key={structure.id} value={structure.id}>
                            {structure.projectComponent ? structure.projectComponent : ''}
                            {structure.projectComponent && structure.structureNo ? ' - ' : ''}
                            {structure.structureNo ? structure.structureNo : ''}
                            {!structure.projectComponent && !structure.structureNo ? (structure.id || 'Unknown Structure') : ''}
                          </option>
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
        
        <div className="d-flex justify-content-center gap-2 mt-3">
          <button 
            type="button" 
            className="btn btn-success" 
            onClick={handleAddRow}
          >
            <i className="bi bi-plus-circle me-1"></i> Add new row
          </button>
          
          {hasRelevantTests && (
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleGenerateTestForms}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Generating...
                </>
              ) : (
                <>
                  <i className="bi bi-file-pdf me-1"></i> Generate Test Forms
                </>
              )}
            </button>
          )}
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
