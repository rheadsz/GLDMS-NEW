import React, { useState } from "react";
import axios from "axios";

function TestsInfo({ data, onChange }) {
  // Extract data from props (data is already flattened in CreateProjectWizard)
  const structures = data?.structures || [];
  const boreholes = data?.boreholes || [];
  const samples = data?.samples || [];
  
  // State for tree expansion
  const [expandedStructures, setExpandedStructures] = useState(new Set());
  const [expandedBoreholes, setExpandedBoreholes] = useState(new Set());
  
  // State for selected samples (multiple selection)
  const [selectedSamples, setSelectedSamples] = useState(new Set());
  
  // State for test assignments: { sampleId: [testNames] }
  const initialTestAssignments = data?.testAssignments || {};
  const [testAssignments, setTestAssignments] = useState(initialTestAssignments);
  
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Check if any sample has Sand Equivalent or Corrosion tests assigned
  const hasRelevantTests = Object.values(testAssignments).some(tests => 
    tests && (tests.includes('Sand Equivalent') || tests.includes('Corrosion'))
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

  // Toggle structure expansion
  const toggleStructure = (structureId) => {
    const newExpanded = new Set(expandedStructures);
    if (newExpanded.has(structureId)) {
      newExpanded.delete(structureId);
    } else {
      newExpanded.add(structureId);
    }
    setExpandedStructures(newExpanded);
  };

  // Toggle borehole expansion
  const toggleBorehole = (boreholeId) => {
    const newExpanded = new Set(expandedBoreholes);
    if (newExpanded.has(boreholeId)) {
      newExpanded.delete(boreholeId);
    } else {
      newExpanded.add(boreholeId);
    }
    setExpandedBoreholes(newExpanded);
  };

  // Toggle sample selection
  const toggleSampleSelection = (sampleId) => {
    const newSelected = new Set(selectedSamples);
    if (newSelected.has(sampleId)) {
      newSelected.delete(sampleId);
    } else {
      newSelected.add(sampleId);
    }
    setSelectedSamples(newSelected);
  };

  // Get boreholes for a structure
  const getBoreholesByStructure = (structureId) => {
    return boreholes.filter(b => b.structureId === structureId);
  };

  // Get samples for a borehole
  const getSamplesByBorehole = (boreholeInternalId) => {
    // Find the borehole to get its boreholeId (user-entered identifier)
    const borehole = boreholes.find(b => b.id === boreholeInternalId);
    if (!borehole) return [];
    
    // Samples store boreholeId as the user-entered identifier (e.g., "BH-001")
    return samples.filter(s => s.boreholeId === borehole.boreholeId);
  };

  // Get structure name
  const getStructureName = (structure) => {
    if (structure.structureNo) {
      return `${structure.projectComponent} (${structure.structureNo})`;
    }
    return structure.projectComponent || 'Unknown Structure';
  };

  // Get borehole name
  const getBoreholeName = (borehole) => {
    return borehole.boreholeId || 'Unknown Borehole';
  };

  // Get sample name
  const getSampleName = (sample) => {
    const depthDisplay = sample.depthFrom && sample.depthTo
      ? `${sample.depthFrom}-${sample.depthTo} ft`
      : sample.depthFrom || sample.depthTo || 'Unknown depth';
    return `${sample.sampleId || 'Sample'} (${depthDisplay})`;
  };
  
  // Handle PDF generation
  const handleGenerateTestForms = async () => {
    setIsGeneratingPDF(true);
    try {
      // Get the parent formData from window or pass it through props
      // For now, we'll need to access it from the parent component
      console.log('Data available in TestsInfo:', data);
      
      // Convert testAssignments to testRows format for PDF generation
      const testRows = [];
      Object.entries(testAssignments).forEach(([sampleId, tests]) => {
        if (tests && tests.length > 0) {
          // Find the sample to get its details
          const sample = samples.find(s => s.id === sampleId);
          if (sample) {
            // Find the borehole for this sample
            const borehole = boreholes.find(b => b.boreholeId === sample.boreholeId);
            if (borehole) {
              // Find the structure for this borehole
              const structure = structures.find(s => s.id === borehole.structureId);
              
              testRows.push({
                id: sampleId,
                structure: structure?.id || '',
                boreholeSample: `${sample.boreholeId} - ${sample.depthFrom}-${sample.depthTo}`,
                tests: tests
              });
            }
          }
        }
      });
      
      // Prepare the data to send to backend
      const requestData = {
        testRows: testRows,
        projectInfo: data.projectInfo || {},
        boreholes: boreholes || [],
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

  // Handle test toggle for selected samples
  const handleTestToggle = (testName) => {
    if (selectedSamples.size === 0) return;

    const updatedAssignments = { ...testAssignments };
    
    // Toggle test for all selected samples
    selectedSamples.forEach(sampleId => {
      const currentTests = updatedAssignments[sampleId] || [];
      const testIndex = currentTests.indexOf(testName);
      
      if (testIndex !== -1) {
        // Remove test
        updatedAssignments[sampleId] = currentTests.filter(t => t !== testName);
      } else {
        // Add test
        updatedAssignments[sampleId] = [...currentTests, testName];
      }
    });
    
    setTestAssignments(updatedAssignments);
    onChange({ 
      ...data,
      testAssignments: updatedAssignments
    });
  };

  // Check if a test is selected for any of the selected samples
  const isTestChecked = (testName) => {
    if (selectedSamples.size === 0) return false;
    
    // Check if ALL selected samples have this test
    return Array.from(selectedSamples).every(sampleId => {
      const tests = testAssignments[sampleId] || [];
      return tests.includes(testName);
    });
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
        `}
      </style>
      <div className="card-header bg-light fw-bold d-flex justify-content-between align-items-center">
        <span>Tests</span>
        {selectedSamples.size > 0 && (
          <small className="text-muted">
            {selectedSamples.size} sample{selectedSamples.size > 1 ? 's' : ''} selected
          </small>
        )}
      </div>
      <div className="card-body pb-2">
        
        {structures.length === 0 ? (
          <div className="alert alert-warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Please add structures, boreholes, and samples in the previous steps before assigning tests.
          </div>
        ) : (
          <div className="row">
            {/* Left Column: Tree Structure */}
            <div className="col-md-6">
              <div className="card">
                <div className="card-header bg-light">
                  <strong>Select Project Component (Structure Number)</strong>
                </div>
                <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {structures.map(structure => {
                    const structureBoreholes = getBoreholesByStructure(structure.id);
                    const isStructureExpanded = expandedStructures.has(structure.id);
                    
                    return (
                      <div key={structure.id} className="mb-2">
                        {/* Structure Level */}
                        <div 
                          className="d-flex align-items-center p-2 border rounded bg-light"
                          style={{ cursor: 'pointer' }}
                          onClick={() => toggleStructure(structure.id)}
                        >
                          <i className={`bi bi-chevron-${isStructureExpanded ? 'down' : 'right'} me-2`}></i>
                          <span className="me-2 fw-bold">Structure:</span>
                          <strong>{getStructureName(structure)}</strong>
                          <span className="ms-2 badge bg-secondary">{structureBoreholes.length}</span>
                        </div>
                        
                        {/* Boreholes (shown when structure is expanded) */}
                        {isStructureExpanded && (
                          <div className="ms-4 mt-2">
                            {structureBoreholes.length === 0 ? (
                              <div className="text-muted small">No boreholes for this structure</div>
                            ) : (
                              structureBoreholes.map(borehole => {
                                const boreholeSamples = getSamplesByBorehole(borehole.id);
                                const isBoreholeExpanded = expandedBoreholes.has(borehole.id);
                                
                                return (
                                  <div key={borehole.id} className="mb-2">
                                    {/* Borehole Level */}
                                    <div 
                                      className="d-flex align-items-center p-2 border rounded"
                                      style={{ cursor: 'pointer', backgroundColor: '#f8f9fa' }}
                                      onClick={() => toggleBorehole(borehole.id)}
                                    >
                                      <i className={`bi bi-chevron-${isBoreholeExpanded ? 'down' : 'right'} me-2`}></i>
                                      <span className="me-2 fw-bold">Borehole:</span>
                                      <span>{getBoreholeName(borehole)}</span>
                                      <span className="ms-2 badge bg-info">{boreholeSamples.length}</span>
                                    </div>
                                    
                                    {/* Samples (shown when borehole is expanded) */}
                                    {isBoreholeExpanded && (
                                      <div className="ms-4 mt-2">
                                        {boreholeSamples.length === 0 ? (
                                          <div className="text-muted small">No samples for this borehole</div>
                                        ) : (
                                          boreholeSamples.map(sample => {
                                            const isSelected = selectedSamples.has(sample.id);
                                            
                                            return (
                                              <div 
                                                key={sample.id} 
                                                className={`d-flex align-items-center p-2 border rounded mb-1 ${isSelected ? 'bg-primary text-white' : ''}`}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => toggleSampleSelection(sample.id)}
                                              >
                                                <input
                                                  type="checkbox"
                                                  className="form-check-input me-2"
                                                  checked={isSelected}
                                                  onChange={() => {}}
                                                  onClick={(e) => e.stopPropagation()}
                                                />
                                                <span className="me-2 fw-bold">Sample:</span>
                                                <span>{getSampleName(sample)}</span>
                                              </div>
                                            );
                                          })
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Right Column: Test Selection */}
            <div className="col-md-6">
              <div className="card">
                <div className="card-header bg-light">
                  <strong>Available Tests</strong>
                </div>
                <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {selectedSamples.size === 0 ? (
                    <div className="text-muted text-center py-5">
                      <i className="bi bi-arrow-left me-2"></i>
                      Select one or more samples from the left to assign tests
                    </div>
                  ) : (
                    <div>
                      {testOptions.map((testName, index) => (
                        <div key={index} className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`test-${index}`}
                            checked={isTestChecked(testName)}
                            onChange={() => handleTestToggle(testName)}
                          />
                          <label className="form-check-label" htmlFor={`test-${index}`}>
                            {testName}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Generate PDF Button */}
        {hasRelevantTests && (
          <div className="d-flex justify-content-center mt-3">
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
          </div>
        )}
        
        {/* Navigation buttons */}
        <div className="row mt-4">
          <div className="col-12">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => onChange({ 
                ...data, 
                testAssignments: testAssignments,
                _prevStep: true
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
