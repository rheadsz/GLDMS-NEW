import React from "react";

function SampleInfo({ data, onChange, onAddSample, onDeleteSample, index = 0 }) {
  // Start with 3 samples by default, but allow adding more
  const [numSamples, setNumSamples] = React.useState(data?.sampleDetails?.length || 3);
  
  // Function to add a new sample to this borehole
  const handleAddSample = () => {
    const newSampleDetails = [...(data?.sampleDetails || []), {
      boreholeID: "",
      top: "",
      bottom: "",
      TL101No: "",
      type: "Bag",
      length: "",
      diameter: "",
      weight: "",
      fieldCollectionDate: ""
    }];
    
    setNumSamples(newSampleDetails.length);
    onChange({ ...data, sampleDetails: newSampleDetails });
  };
  
  // Helper to handle changes for a specific sample
  const handleSampleDetailChange = (idx, field, value) => {
    const updated = [...(data.sampleDetails || Array.from({ length: numSamples }, () => ({
      sampleType: 'Rock',
      containerType: 'Bag'
    })))];
    updated[idx][field] = value;
    onChange({ ...data, sampleDetails: updated });
  };

  return (
    <div className="card mb-3">
      <div className="card-header bg-light fw-bold d-flex justify-content-between align-items-center">
        <span>Sample Information {index > 0 ? `(Set ${index + 1})` : ''}</span>
        <div className="d-flex gap-2">
          {index > 0 && (
            <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => onDeleteSample(index)}>
              <i className="bi bi-trash"></i> Delete Sample Set
            </button>
          )}
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={onAddSample}>
            Add a Borehole
          </button>
        </div>
      </div>
      <div className="card-body pb-2">

        
        {/* Sample details table */}
        <div className="table-responsive mb-3">
          <table className="table table-bordered align-middle">
            <thead className="table-light text-center">
              <tr>
                <th style={{ width: '200px' }}></th>
                {Array.from({ length: numSamples }).map((_, n) => <th key={n}>Sample {n + 1}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Depth (ft): Top/Bottom</td>
                {Array.from({ length: numSamples }).map((_, n) => (
                  <td key={n}>
                    <div className="d-flex justify-content-center align-items-center gap-1">
                      <input type="text" className="form-control form-control-sm" placeholder="Top" value={data.sampleDetails?.[n]?.top || ""} onChange={e => handleSampleDetailChange(n, 'top', e.target.value)} style={{ width: 60 }} />/
                      <input type="text" className="form-control form-control-sm" placeholder="Bottom" value={data.sampleDetails?.[n]?.bottom || ""} onChange={e => handleSampleDetailChange(n, 'bottom', e.target.value)} style={{ width: 60 }} />
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td>Sample Type</td>
                {Array.from({ length: numSamples }).map((_, n) => (
                  <td key={n} className="text-center">
                    <div className="d-flex justify-content-center align-items-center gap-3">
                      <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name={`sampleType-${n}`} id={`rock-${n}`} value="Rock" 
                          checked={data.sampleDetails?.[n]?.sampleType === "Rock"} 
                          onChange={() => handleSampleDetailChange(n, "sampleType", "Rock")} />
                        <label className="form-check-label" htmlFor={`rock-${n}`}>Rock</label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name={`sampleType-${n}`} id={`soil-${n}`} value="Soil" 
                          checked={data.sampleDetails?.[n]?.sampleType === "Soil"} 
                          onChange={() => handleSampleDetailChange(n, "sampleType", "Soil")} />
                        <label className="form-check-label" htmlFor={`soil-${n}`}>Soil</label>
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td>Container Type</td>
                {Array.from({ length: numSamples }).map((_, n) => (
                  <td key={n} className="text-center">
                    <div className="d-flex justify-content-center align-items-center gap-3">
                      <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name={`containerType-${n}`} id={`bag-${n}`} value="Bag" 
                          checked={data.sampleDetails?.[n]?.containerType === "Bag"} 
                          onChange={() => handleSampleDetailChange(n, "containerType", "Bag")} />
                        <label className="form-check-label" htmlFor={`bag-${n}`}>Bag</label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name={`containerType-${n}`} id={`tube-${n}`} value="Tube" 
                          checked={data.sampleDetails?.[n]?.containerType === "Tube"} 
                          onChange={() => handleSampleDetailChange(n, "containerType", "Tube")} />
                        <label className="form-check-label" htmlFor={`tube-${n}`}>Tube</label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name={`containerType-${n}`} id={`core-${n}`} value="Core" 
                          checked={data.sampleDetails?.[n]?.containerType === "Core"} 
                          onChange={() => handleSampleDetailChange(n, "containerType", "Core")} />
                        <label className="form-check-label" htmlFor={`core-${n}`}>Core</label>
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td>Size</td>
                {Array.from({ length: numSamples }).map((_, n) => (
                  <td key={n}>
                    <div className="d-flex justify-content-center gap-2">
                      {data.sampleDetails?.[n]?.containerType === "Bag" ? (
                        <input type="text" className="form-control form-control-sm" placeholder="Weight (lb)" 
                          value={data.sampleDetails?.[n]?.weight || ""} 
                          onChange={e => handleSampleDetailChange(n, 'weight', e.target.value)} />
                      ) : data.sampleDetails?.[n]?.containerType === "Tube" ? (
                        <>
                          <input type="text" className="form-control form-control-sm" placeholder="Diameter" 
                            value={data.sampleDetails?.[n]?.diameter || ""} 
                            onChange={e => handleSampleDetailChange(n, 'diameter', e.target.value)} 
                            style={{ width: '90px' }} />
                          <input type="text" className="form-control form-control-sm" placeholder="Approx. Length(ft)" 
                            value={data.sampleDetails?.[n]?.length || ""} 
                            onChange={e => handleSampleDetailChange(n, 'length', e.target.value)} 
                            style={{ width: '130px' }} />
                          <input type="text" className="form-control form-control-sm" placeholder="Weight (lb)" 
                            value={data.sampleDetails?.[n]?.weight || ""} 
                            onChange={e => handleSampleDetailChange(n, 'weight', e.target.value)} 
                            style={{ width: '90px' }} />
                        </>
                      ) : (
                        <>
                          <input type="text" className="form-control form-control-sm" placeholder="Diameter" 
                            value={data.sampleDetails?.[n]?.diameter || ""} 
                            onChange={e => handleSampleDetailChange(n, 'diameter', e.target.value)} 
                            style={{ width: '90px' }} />
                          <input type="text" className="form-control form-control-sm" placeholder="Approx. Length(ft)" 
                            value={data.sampleDetails?.[n]?.length || ""} 
                            onChange={e => handleSampleDetailChange(n, 'length', e.target.value)} 
                            style={{ width: '130px' }} />
                        </>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td>Sample Field Collection Date</td>
                {Array.from({ length: numSamples }).map((_, n) => (
                  <td key={n}>
                    <input type="date" className="form-control form-control-sm" 
                      value={data.sampleDetails?.[n]?.fieldCollectionDate || ""} 
                      onChange={e => handleSampleDetailChange(n, 'fieldCollectionDate', e.target.value)} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SampleInfo; 