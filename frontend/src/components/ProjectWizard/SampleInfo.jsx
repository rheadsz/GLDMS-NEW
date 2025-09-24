import React, { useState, useEffect } from "react";
import axios from 'axios';

function SampleInfo({ data, boreholes = [], onChange, onAddSample, onDeleteSample, index = 0 }) {
  const [samples, setSamples] = useState(data?.samples || []);

  // Group samples by boreholeId for rendering
  const getSamplesByBorehole = () => {
    const samplesByBorehole = {};
    
    // Initialize empty arrays for each borehole
    boreholes.forEach(borehole => {
      samplesByBorehole[borehole.boreholeId] = [];
    });
    
    // Group existing samples by borehole
    samples.forEach(sample => {
      if (sample.boreholeId && samplesByBorehole[sample.boreholeId]) {
        samplesByBorehole[sample.boreholeId].push(sample);
      } else if (sample.boreholeId) {
        // Handle case where boreholeId exists but not in current boreholes list
        samplesByBorehole[sample.boreholeId] = [sample];
      } else {
        // Put unassigned samples in a special category
        if (!samplesByBorehole['unassigned']) {
          samplesByBorehole['unassigned'] = [];
        }
        samplesByBorehole['unassigned'].push(sample);
      }
    });
    
    return samplesByBorehole;
  };

  // On first load, if there are no samples but there are boreholes,
  // create a default sample for each borehole
  useEffect(() => {
    if (samples.length === 0 && boreholes.length > 0) {
      const initialSamples = boreholes.map(borehole => ({
        id: Date.now().toString() + '-' + borehole.id,
        sampleId: '',
        boreholeId: borehole.boreholeId,
        depthFrom: '',
        depthTo: '',
        tl101No: '',
        containerType: 'Tube',
        quantity: '',
        fieldCollectionDate: ''
      }));
      setSamples(initialSamples);
      onChange({ ...data, samples: initialSamples });
    }
  }, [boreholes]); // Only run when boreholes changes

  const handleAddAnotherSample = (boreholeId) => {
    const newSample = {
      id: Date.now().toString(),
      sampleId: '',
      boreholeId: boreholeId,  // Pre-assign to the correct borehole
      depthFrom: '',
      depthTo: '',
      tl101No: '',
      containerType: 'Tube',
      quantity: '',
      fieldCollectionDate: ''
    };
    
    const updatedSamples = [...samples, newSample];
    setSamples(updatedSamples);
    onChange({ ...data, samples: updatedSamples });
  };

  const handleDeleteSample = (sampleId) => {
    const updatedSamples = samples.filter(sample => sample.id !== sampleId);
    setSamples(updatedSamples);
    onChange({ ...data, samples: updatedSamples });
  };

  const handleSampleChange = (sampleId, field, value) => {
    const updatedSamples = samples.map(sample => {
      if (sample.id === sampleId) {
        return { ...sample, [field]: value };
      }
      return sample;
    });
    
    setSamples(updatedSamples);
    onChange({ ...data, samples: updatedSamples });
  };

  return (
    <div className="card mb-3">
      <div className="card-header bg-light fw-bold d-flex justify-content-between align-items-center">
        <span>Samples {index > 0 ? `(Set ${index + 1})` : ''}</span>
        {index > 0 && (
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => onDeleteSample(index)}>
            <i className="bi bi-trash"></i> Delete Sample Set
          </button>
        )}
      </div>
      <div className="card-body pb-2">
        {boreholes.length === 0 ? (
          <div className="alert alert-warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Please add boreholes in the previous step before adding samples.
          </div>
        ) : (
          <>
            {/* Group samples by borehole */}
            {boreholes.map((borehole, boreholeIndex) => {
              // Get samples for this borehole
              const boreholeId = borehole.boreholeId;
              const boreholeSamples = samples.filter(sample => sample.boreholeId === boreholeId);
              
              return (
                <div key={borehole.id} className="mb-5 border-bottom pb-4">
                  <div className="d-flex align-items-center mb-3 bg-light p-2 rounded">
                    <h5 className="mb-0 flex-grow-1">Borehole: {boreholeId}</h5>
                    <div className="form-group mb-0">
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        value={boreholeId} 
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Display samples for this borehole */}
                  {boreholeSamples.length === 0 ? (
                    <div className="text-center py-3 text-muted">
                      <i className="bi bi-info-circle me-2"></i>
                      No samples added yet for this borehole.
                    </div>
                  ) : (
                    boreholeSamples.map((sample, sampleIndex) => (
                      <div key={sample.id} className="mb-4 pb-3 ms-4" style={{ borderBottom: sampleIndex < boreholeSamples.length - 1 ? '1px dashed #dee2e6' : 'none' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="mb-0">Sample {sampleIndex + 1}</h6>
                          <button 
                            type="button" 
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDeleteSample(sample.id)}
                          >
                            <i className="bi bi-trash"></i> Remove
                          </button>
                        </div>
                        
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Sample ID (No.):</label>
                            <input 
                              type="text" 
                              className="form-control form-control-sm" 
                              value={sample.sampleId || ''} 
                              onChange={(e) => handleSampleChange(sample.id, 'sampleId', e.target.value)}
                            />
                          </div>
                          {/* Removed Borehole Dropdown since it's now organized by borehole */}
                        </div>
                        
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Depth(ft): From/To</label>
                            <div className="d-flex gap-2">
                              <input 
                                type="text" 
                                className="form-control form-control-sm" 
                                placeholder="From" 
                                value={sample.depthFrom || ''} 
                                onChange={(e) => handleSampleChange(sample.id, 'depthFrom', e.target.value)}
                              />
                              <input 
                                type="text" 
                                className="form-control form-control-sm" 
                                placeholder="To" 
                                value={sample.depthTo || ''} 
                                onChange={(e) => handleSampleChange(sample.id, 'depthTo', e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">TL-101 No.:</label>
                            <input 
                              type="text" 
                              className="form-control form-control-sm" 
                              value={sample.tl101No || ''} 
                              onChange={(e) => handleSampleChange(sample.id, 'tl101No', e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label d-block">Tube/jar:</label>
                            <div className="form-check form-check-inline">
                              <input 
                                className="form-check-input" 
                                type="radio" 
                                name={`containerType-${sample.id}`} 
                                id={`tube-${sample.id}`} 
                                value="Tube" 
                                checked={sample.containerType === "Tube"} 
                                onChange={() => handleSampleChange(sample.id, "containerType", "Tube")} 
                              />
                              <label className="form-check-label" htmlFor={`tube-${sample.id}`}>Tube</label>
                            </div>
                            <div className="form-check form-check-inline">
                              <input 
                                className="form-check-input" 
                                type="radio" 
                                name={`containerType-${sample.id}`} 
                                id={`jar-${sample.id}`} 
                                value="Jar" 
                                checked={sample.containerType === "Jar"} 
                                onChange={() => handleSampleChange(sample.id, "containerType", "Jar")} 
                              />
                              <label className="form-check-label" htmlFor={`jar-${sample.id}`}>Jar</label>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Quantity(Repetition):</label>
                            <input 
                              type="text" 
                              className="form-control form-control-sm" 
                              value={sample.quantity || ''} 
                              onChange={(e) => handleSampleChange(sample.id, 'quantity', e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Sample Field Collection:</label>
                            <input 
                              type="date" 
                              className="form-control form-control-sm" 
                              value={sample.fieldCollectionDate || ''} 
                              onChange={(e) => handleSampleChange(sample.id, 'fieldCollectionDate', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Add another sample button for this borehole */}
                  <div className="d-flex justify-content-center mt-3 mb-3">
                    <button 
                      type="button" 
                      className="btn btn-success btn-sm" 
                      onClick={() => handleAddAnotherSample(boreholeId)}
                    >
                      <i className="bi bi-plus-circle me-1"></i> Add Another Sample for Borehole {boreholeId}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Check for unassigned samples and display them */}
            {samples.filter(sample => !boreholes.find(b => b.boreholeId === sample.boreholeId)).length > 0 && (
              <div className="alert alert-warning mt-3">
                <strong>Note:</strong> Some samples are associated with boreholes that no longer exist. Please reassign them.
              </div>
            )}

            {/* Navigation buttons */}
            <div className="row mt-4">
              <div className="col-12 d-flex justify-content-between">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => onChange({ ...data, samples: samples, _prevStep: true })}
                >
                  <i className="bi bi-arrow-left me-1"></i> Previous
                </button>
                <div>
                  <button 
                    type="button" 
                    className="btn btn-success me-2" 
                    onClick={async () => {
                      try {
                        // Get project data from parent component
                        const projectData = {
                          projectID: data.projectID || '',
                          ea: data.ea || '',
                          projectName: data.projectName || '',
                          district: data.district || ''
                        };
                        
                        // Send email with all sample data
                        const response = await axios.post('/api/emails/submit-samples', {
                          projectData,
                          samples: samples
                        });
                        
                        console.log('Email sent:', response.data);
                        alert('Samples submitted successfully! Email notification sent to Rhea.Dsouza@dot.ca.gov');
                      } catch (error) {
                        console.error('Error submitting samples:', error);
                        alert('Error submitting samples: ' + (error.response?.data?.message || error.message));
                      }
                    }}
                  >
                    <i className="bi bi-check-circle me-1"></i> Submit
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={() => onChange({ ...data, samples: samples, _nextStep: true })}
                  >
                    Next <i className="bi bi-arrow-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SampleInfo;