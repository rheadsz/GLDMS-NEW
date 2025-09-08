import React, { useState } from "react";

function SampleInfo({ data, onChange, onAddSample, onDeleteSample, index = 0 }) {
  const [samples, setSamples] = useState(data?.samples || [{
    id: Date.now().toString(),
    sampleId: '',
    boreholeId: '',
    depthFrom: '',
    depthTo: '',
    tl101No: '',
    containerType: 'Tube',
    quantity: '',
    fieldCollectionDate: ''
  }]);

  const handleAddAnotherSample = () => {
    const newSample = {
      id: Date.now().toString(),
      sampleId: '',
      boreholeId: '',
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
        {samples.map((sample, sampleIndex) => (
          <div key={sample.id} className="mb-4 pb-3" style={{ borderBottom: sampleIndex < samples.length - 1 ? '1px solid #dee2e6' : 'none' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Sample {sampleIndex + 1}</h5>
              {samples.length > 1 && (
                <button 
                  type="button" 
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => handleDeleteSample(sample.id)}
                >
                  <i className="bi bi-trash"></i> Remove
                </button>
              )}
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
                <label className="form-label">Borehole ID:</label>
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  value={sample.boreholeId || ''} 
                  onChange={(e) => handleSampleChange(sample.id, 'boreholeId', e.target.value)}
                />
              </div>
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
        ))}
        
        <div className="d-flex justify-content-center mt-3">
          <button 
            type="button" 
            className="btn btn-success" 
            onClick={handleAddAnotherSample}
          >
            <i className="bi bi-plus-circle me-1"></i> Add Another Sample
          </button>
        </div>
        
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
  );
}

export default SampleInfo;