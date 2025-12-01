import React, { useState, useEffect } from "react";
import axios from 'axios';

const SOIL_BAG_SIZE_OPTIONS = [
  '25% of 1 gallon bag',
  '50% of 1 gallon bag',
  '75% of 1 gallon bag',
  'Full 1 gallon bag'
];

const SOIL_TUBE_SIZE_OPTIONS = [
  '1.944 inch',
  '2.375 inch',
  '2.875 inch'
];

const MANUAL_OPTION_VALUE = 'manual';

const normalizeSample = (sample = {}) => {
  const sampleType = sample.sampleType === 'Rock' ? 'Rock' : 'Soil';
  let containerType = sample.containerType || '';
  if (containerType === 'Jar') {
    containerType = 'Bag';
  }

  const containerSizeOption = sample.containerSizeOption || '';
  const containerSizeManual = sample.containerSizeManual || '';

  let containerSize = sample.containerSize || '';
  if (!containerSize) {
    if (containerSizeOption && containerSizeOption !== MANUAL_OPTION_VALUE) {
      containerSize = containerSizeOption;
    } else if (containerSizeOption === MANUAL_OPTION_VALUE) {
      containerSize = containerSizeManual;
    }
  }

  return {
    ...sample,
    sampleType,
    containerType,
    containerSizeOption,
    containerSizeManual,
    containerSize
  };
};

const createBlankSample = (overrides = {}) => normalizeSample({
  id: Date.now().toString(),
  sampleId: '',
  boreholeId: '',
  depthFrom: '',
  depthTo: '',
  tl101No: '',
  containerType: '',
  containerSizeOption: '',
  containerSizeManual: '',
  containerSize: '',
  quantity: '',
  fieldCollectionDate: '',
  ...overrides
});

function SampleInfo({ data, boreholes = [], onChange, onAddSample, onDeleteSample, index = 0 }) {
  const [samples, setSamples] = useState(() => (data?.samples || []).map(normalizeSample));
  // Track the currently selected borehole
  const [selectedBoreholeId, setSelectedBoreholeId] = useState(boreholes.length > 0 ? boreholes[0].boreholeId : null);
  // Track the currently selected sample ID
  const [selectedSampleId, setSelectedSampleId] = useState(null);

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
      const initialSamples = boreholes.map(borehole => createBlankSample({
        id: `${Date.now().toString()}-${borehole.id}`,
        boreholeId: borehole.boreholeId,
        containerType: 'Tube'
      }));
      setSamples(initialSamples);
      onChange({ ...data, samples: initialSamples });
      
      // Set first borehole as selected when boreholes are loaded
      if (boreholes.length > 0 && !selectedBoreholeId) {
        setSelectedBoreholeId(boreholes[0].boreholeId);
      }
      // Set first sample as selected
      if (initialSamples.length > 0) {
        setSelectedSampleId(initialSamples[0].id);
      }
    }
  }, [boreholes]); // Only run when boreholes changes

  // When borehole selection changes, select the first sample of that borehole
  useEffect(() => {
    if (selectedBoreholeId) {
      const boreholeSamples = samples.filter(s => s.boreholeId === selectedBoreholeId);
      if (boreholeSamples.length > 0 && !selectedSampleId) {
        // Only auto-select if no sample is currently selected
        setSelectedSampleId(boreholeSamples[0].id);
      } else if (boreholeSamples.length === 0) {
        setSelectedSampleId(null);
      }
    }
  }, [selectedBoreholeId]); // Only run when borehole changes, not when samples change

  const handleAddAnotherSample = (boreholeId) => {
    const newSample = createBlankSample({
      id: Date.now().toString(),
      boreholeId: boreholeId,
      containerType: 'Tube'
    });
    
    const updatedSamples = [...samples, newSample];
    setSamples(updatedSamples);
    onChange({ ...data, samples: updatedSamples });
    // Auto-select the newly added sample
    setSelectedSampleId(newSample.id);
  };

  const handleDeleteSample = (sampleId) => {
    const updatedSamples = samples.filter(sample => sample.id !== sampleId);
    setSamples(updatedSamples);
    onChange({ ...data, samples: updatedSamples });
    
    // If we deleted the selected sample, select another one
    if (sampleId === selectedSampleId) {
      const boreholeSamples = updatedSamples.filter(s => s.boreholeId === selectedBoreholeId);
      if (boreholeSamples.length > 0) {
        setSelectedSampleId(boreholeSamples[0].id);
      } else {
        setSelectedSampleId(null);
      }
    }
  };

  const handleSampleChange = (sampleId, field, value) => {
    const updatedSamples = samples.map(sample => {
      if (sample.id === sampleId) {
        return normalizeSample({ ...sample, [field]: value });
      }
      return sample;
    });
    
    setSamples(updatedSamples);
    onChange({ ...data, samples: updatedSamples });
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
          <div className="row">
            {/* Borehole IDs column */}
            <div className="col-md-3 border-end">
              <div className="mb-3">
                <h5 className="mb-3">Boreholes</h5>
                <div className="list-group">
                  {boreholes.map((borehole) => (
                    <button
                      key={borehole.id}
                      type="button"
                      className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selectedBoreholeId === borehole.boreholeId ? 'active' : ''}`}
                      onClick={() => setSelectedBoreholeId(borehole.boreholeId)}
                    >
                      <span>boreholeid- {borehole.boreholeId}</span>
                      <span className="badge bg-primary rounded-pill">
                        {samples.filter(sample => sample.boreholeId === borehole.boreholeId).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Sample details area */}
            <div className="col-md-9">
              {selectedBoreholeId && (
                <>
                  {/* Display samples for selected borehole */}
                  {(() => {
                    const selectedBorehole = boreholes.find(b => b.boreholeId === selectedBoreholeId);
                    if (!selectedBorehole) return null;
                    
                    const boreholeSamples = samples.filter(sample => sample.boreholeId === selectedBoreholeId);
                    
                    return (
                      <div key={selectedBorehole.id} className="pb-4">
                        <div className="d-flex align-items-center mb-3 bg-light p-2 rounded">
                          <h5 className="mb-0 flex-grow-1">Borehole: {selectedBoreholeId}</h5>
                        </div>
  
                        {/* Display samples for this borehole */}
                        {boreholeSamples.length === 0 ? (
                          <div className="text-center py-3 text-muted">
                            <i className="bi bi-info-circle me-2"></i>
                            No samples added yet for this borehole.
                          </div>
                        ) : (
                          <div className="row">
                            {/* Sample list column */}
                            <div className="col-md-3 border-end">
                              <h6 className="mb-3">Samples</h6>
                              <div className="list-group">
                                {boreholeSamples.map((sample, sampleIndex) => (
                                  <button
                                    key={sample.id}
                                    type="button"
                                    className={`list-group-item list-group-item-action ${selectedSampleId === sample.id ? 'active' : ''}`}
                                    onClick={() => setSelectedSampleId(sample.id)}
                                  >
                                    Sample {sampleIndex + 1}
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Sample form area */}
                            <div className="col-md-9">
                              {selectedSampleId && boreholeSamples.find(s => s.id === selectedSampleId) && (() => {
                                const sample = boreholeSamples.find(s => s.id === selectedSampleId);
                                const sampleIndex = boreholeSamples.findIndex(s => s.id === selectedSampleId);
                                
                                return (
                                  <div
                                    key={sample.id}
                                    className="mb-4 pb-3"
                                    style={{ borderBottom: sampleIndex < boreholeSamples.length - 1 ? '1px dashed #dee2e6' : 'none' }}
                                  >
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
                                      <div className="col-md-6">
                                        <label className="form-label d-block">Sample Type</label>
                                        <div className="d-flex align-items-center gap-3">
                                          <div className="form-check">
                                            <input
                                              className="form-check-input"
                                              type="radio"
                                              name={`sampleType-${sample.id}`}
                                              id={`sampleType-soil-${sample.id}`}
                                              value="Soil"
                                              checked={sample.sampleType === 'Soil'}
                                              onChange={() => handleSampleChange(sample.id, 'sampleType', 'Soil')}
                                            />
                                            <label className="form-check-label" htmlFor={`sampleType-soil-${sample.id}`}>
                                              Soil
                                            </label>
                                          </div>
                                          <div className="form-check">
                                            <input
                                              className="form-check-input"
                                              type="radio"
                                              name={`sampleType-${sample.id}`}
                                              id={`sampleType-rock-${sample.id}`}
                                              value="Rock"
                                              checked={sample.sampleType === 'Rock'}
                                              onChange={() => handleSampleChange(sample.id, 'sampleType', 'Rock')}
                                            />
                                            <label className="form-check-label" htmlFor={`sampleType-rock-${sample.id}`}>
                                              Rock
                                            </label>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {sample.sampleType === 'Soil' && (
                                      <>
                                        <div className="row mb-3">
                                          <div className="col-md-6">
                                            <label className="form-label d-block">Container Type</label>
                                            <div className="form-check form-check-inline">
                                              <input
                                                className="form-check-input"
                                                type="radio"
                                                name={`containerType-${sample.id}`}
                                                id={`container-bag-${sample.id}`}
                                                value="Bag"
                                                checked={sample.containerType === 'Bag'}
                                                onChange={() => handleSampleChange(sample.id, 'containerType', 'Bag')}
                                              />
                                              <label className="form-check-label" htmlFor={`container-bag-${sample.id}`}>
                                                Bag
                                              </label>
                                            </div>
                                            <div className="form-check form-check-inline">
                                              <input
                                                className="form-check-input"
                                                type="radio"
                                                name={`containerType-${sample.id}`}
                                                id={`container-tube-${sample.id}`}
                                                value="Tube"
                                                checked={sample.containerType === 'Tube'}
                                                onChange={() => handleSampleChange(sample.id, 'containerType', 'Tube')}
                                              />
                                              <label className="form-check-label" htmlFor={`container-tube-${sample.id}`}>
                                                Tube
                                              </label>
                                            </div>
                                          </div>
                                        </div>

                                        {sample.containerType === 'Bag' && (
                                          <div className="row mb-3">
                                            <div className="col-md-6">
                                              <label className="form-label">Bag Size</label>
                                              <select
                                                className="form-select form-select-sm"
                                                value={sample.containerSizeOption || ''}
                                                onChange={(e) => handleSampleChange(sample.id, 'containerSizeOption', e.target.value)}
                                              >
                                                <option value="">Select bag size</option>
                                                {SOIL_BAG_SIZE_OPTIONS.map((option) => (
                                                  <option key={option} value={option}>
                                                    {option}
                                                  </option>
                                                ))}
                                                <option value={MANUAL_OPTION_VALUE}>Enter manually</option>
                                              </select>
                                            </div>
                                            {sample.containerSizeOption === MANUAL_OPTION_VALUE && (
                                              <div className="col-md-6">
                                                <label className="form-label">Custom Size</label>
                                                <input
                                                  type="text"
                                                  className="form-control form-control-sm"
                                                  placeholder="Enter bag size"
                                                  value={sample.containerSizeManual || ''}
                                                  onChange={(e) => handleSampleChange(sample.id, 'containerSizeManual', e.target.value)}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {sample.containerType === 'Tube' && (
                                          <div className="row mb-3">
                                            <div className="col-md-6">
                                              <label className="form-label">Tube Size</label>
                                              <select
                                                className="form-select form-select-sm"
                                                value={sample.containerSizeOption || ''}
                                                onChange={(e) => handleSampleChange(sample.id, 'containerSizeOption', e.target.value)}
                                              >
                                                <option value="">Select tube size</option>
                                                {SOIL_TUBE_SIZE_OPTIONS.map((option) => (
                                                  <option key={option} value={option}>
                                                    {option}
                                                  </option>
                                                ))}
                                                <option value={MANUAL_OPTION_VALUE}>Enter manually</option>
                                              </select>
                                            </div>
                                            {sample.containerSizeOption === MANUAL_OPTION_VALUE && (
                                              <div className="col-md-6">
                                                <label className="form-label">Custom Size</label>
                                                <input
                                                  type="text"
                                                  className="form-control form-control-sm"
                                                  placeholder="Enter tube size"
                                                  value={sample.containerSizeManual || ''}
                                                  onChange={(e) => handleSampleChange(sample.id, 'containerSizeManual', e.target.value)}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        <div className="row mb-3">
                                          <div className="col-md-6">
                                            <label className="form-label">Top Depth (ft)</label>
                                            <input
                                              type="text"
                                              className="form-control form-control-sm"
                                              value={sample.depthFrom || ''}
                                              onChange={(e) => handleSampleChange(sample.id, 'depthFrom', e.target.value)}
                                            />
                                          </div>
                                          <div className="col-md-6">
                                            <label className="form-label">Bottom Depth (ft)</label>
                                            <input
                                              type="text"
                                              className="form-control form-control-sm"
                                              value={sample.depthTo || ''}
                                              onChange={(e) => handleSampleChange(sample.id, 'depthTo', e.target.value)}
                                            />
                                          </div>
                                        </div>
                                      </>
                                    )}

                                    {sample.sampleType === 'Rock' && (
                                      <>
                                        <div className="row mb-3">
                                          <div className="col-md-6">
                                            <label className="form-label d-block">Container Type</label>
                                            <div className="form-check form-check-inline">
                                              <input
                                                className="form-check-input"
                                                type="radio"
                                                name={`containerType-${sample.id}`}
                                                id={`rock-container-bag-${sample.id}`}
                                                value="Bag"
                                                checked={sample.containerType === 'Bag'}
                                                onChange={() => handleSampleChange(sample.id, 'containerType', 'Bag')}
                                              />
                                              <label className="form-check-label" htmlFor={`rock-container-bag-${sample.id}`}>
                                                Bag
                                              </label>
                                            </div>
                                            <div className="form-check form-check-inline">
                                              <input
                                                className="form-check-input"
                                                type="radio"
                                                name={`containerType-${sample.id}`}
                                                id={`rock-container-core-${sample.id}`}
                                                value="Core"
                                                checked={sample.containerType === 'Core'}
                                                onChange={() => handleSampleChange(sample.id, 'containerType', 'Core')}
                                              />
                                              <label className="form-check-label" htmlFor={`rock-container-core-${sample.id}`}>
                                                Core
                                              </label>
                                            </div>
                                          </div>
                                        </div>

                                        {sample.containerType && (
                                          <div className="row mb-3">
                                            <div className="col-md-6">
                                              <label className="form-label">Top Depth (ft)</label>
                                              <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={sample.depthFrom || ''}
                                                onChange={(e) => handleSampleChange(sample.id, 'depthFrom', e.target.value)}
                                              />
                                            </div>
                                            <div className="col-md-6">
                                              <label className="form-label">Bottom Depth (ft)</label>
                                              <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={sample.depthTo || ''}
                                                onChange={(e) => handleSampleChange(sample.id, 'depthTo', e.target.value)}
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    )}

                                    <div className="row mb-3">
                                      <div className="col-md-6">
                                        <label className="form-label">Sample Field Collection</label>
                                        <input
                                          type="date"
                                          className="form-control form-control-sm"
                                          value={sample.fieldCollectionDate || ''}
                                          onChange={(e) => handleSampleChange(sample.id, 'fieldCollectionDate', e.target.value)}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}

                        {/* Add another sample button for this borehole */}
                        <div className="d-flex justify-content-center mt-3 mb-3">
                          <button 
                            type="button" 
                            className="btn btn-success btn-sm" 
                            onClick={() => handleAddAnotherSample(selectedBoreholeId)}
                          >
                            <i className="bi bi-plus-circle me-1"></i> Add Another Sample
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        )}

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
      </div>
    </div>
  );
}

export default SampleInfo;