import React from "react";

function RaiseRequestForm() {
  return (
    <div className="container py-4">
      <div className="card shadow p-4 mb-4">
        <h4 className="mb-3">GEOTECHNICAL LABORATORY TEST REQUEST <span className="text-primary" style={{ fontStyle: 'italic', fontSize: '1rem' }}>(for Borehole Samples)</span></h4>
        <form>
          {/* Requester Information */}
          <div className="card mb-3">
            <div className="card-header bg-light fw-bold">Requester Information</div>
            <div className="card-body pb-2">
              <div className="row mb-2">
                <div className="col-md-2 mb-2">
                  <label className="form-label">Office:</label>
                  <select className="form-select form-select-sm"><option>Choose an item.</option></select>
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Branch:</label>
                  <select className="form-select form-select-sm"><option>Choose an item.</option></select>
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Requester Name:</label>
                  <input type="text" className="form-control form-control-sm" />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Requester Email:</label>
                  <input type="email" className="form-control form-control-sm" />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Requester Phone:</label>
                  <input type="tel" className="form-control form-control-sm" />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Supervisor Name:</label>
                  <input type="text" className="form-control form-control-sm" />
                </div>
              </div>
              <div className="row mb-2">
                <div className="col-md-2 mb-2">
                  <label className="form-label">Supervisor Email:</label>
                  <input type="email" className="form-control form-control-sm" />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Supervisor Phone:</label>
                  <input type="tel" className="form-control form-control-sm" />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Test Results Due Date:</label>
                  <input type="date" className="form-control form-control-sm" />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Date of Request:</label>
                  <input type="date" className="form-control form-control-sm" />
                </div>
              </div>
            </div>
          </div>
          {/* Project Information */}
          <div className="card mb-3">
            <div className="card-header bg-light fw-bold">Project Information</div>
            <div className="card-body pb-2">
              <div className="row mb-2">
                <div className="col-md-2 mb-2">
                  <label className="form-label">EFIS (Project ID):</label>
                  <input type="text" className="form-control form-control-sm" />
                </div>
                <div className="col-md-1 mb-2">
                  <label className="form-label">EA:</label>
                  <input type="text" className="form-control form-control-sm" />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Structure No.:</label>
                  <input type="text" className="form-control form-control-sm" />
                </div>
                <div className="col-md-1 mb-2">
                  <label className="form-label">District:</label>
                  <select className="form-select form-select-sm"><option>Choose an item.</option></select>
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">County:</label>
                  <select className="form-select form-select-sm"><option>Choose an item.</option></select>
                </div>
                <div className="col-md-1 mb-2">
                  <label className="form-label">Route:</label>
                  <input type="text" className="form-control form-control-sm" />
                </div>
                <div className="col-md-1 mb-2">
                  <label className="form-label">PM:</label>
                  <input type="text" className="form-control form-control-sm" />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Project Component:</label>
                  <input type="text" className="form-control form-control-sm" />
                </div>
              </div>
            </div>
          </div>
          {/* Charging Code */}
          <div className="card mb-3">
            <div className="card-header bg-light fw-bold">Charging Code</div>
            <div className="card-body pb-2">
              <div className="row mb-2">
                <div className="col-md-2 mb-2">
                  <label className="form-label">Project ID:</label>
                  <input type="text" className="form-control form-control-sm" />
                </div>
                <div className="col-md-1 mb-2">
                  <label className="form-label">Unit:</label>
                  <input type="text" className="form-control form-control-sm" />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Reporting Code:</label>
                  <input type="text" className="form-control form-control-sm" />
                </div>
                <div className="col-md-1 mb-2">
                  <label className="form-label">Phase:</label>
                  <input type="text" className="form-control form-control-sm" />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Sub Object:</label>
                  <input type="text" className="form-control form-control-sm" />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Activity:</label>
                  <input type="text" className="form-control form-control-sm" />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Sub Activity:</label>
                  <input type="text" className="form-control form-control-sm" />
                </div>
              </div>
            </div>
          </div>
          {/* Sample Information */}
          <div className="card mb-3">
            <div className="card-header bg-light fw-bold">Sample Information</div>
            <div className="card-body pb-2">
              <div className="row mb-2">
                <div className="col-md-3 mb-2">
                  <label className="form-label">Number of Samples:</label>
                  <input type="number" className="form-control form-control-sm" min="1" max="10" defaultValue={5} />
                </div>
                <div className="col-md-4 mb-2">
                  <label className="form-label">Expected Sample Receipt Date:</label>
                  <input type="date" className="form-control form-control-sm" />
                </div>
              </div>
              <div className="table-responsive mb-3">
                <table className="table table-bordered align-middle text-center small">
                  <thead className="table-light">
                    <tr>
                      <th>Sample ID (No.)</th>
                      {[1,2,3,4,5].map(n => <th key={n}>{n}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Borehole ID</td>
                      {[1,2,3,4,5].map(n => <td key={n}><input type="text" className="form-control form-control-sm" /></td>)}
                    </tr>
                    <tr>
                      <td>Depth (ft): From / To</td>
                      {[1,2,3,4,5].map(n => <td key={n}><input type="text" className="form-control form-control-sm" placeholder="/" /></td>)}
                    </tr>
                    <tr>
                      <td>TL-101 No.</td>
                      {[1,2,3,4,5].map(n => <td key={n}><input type="text" className="form-control form-control-sm" /></td>)}
                    </tr>
                    <tr>
                      <td>Tube/Jar</td>
                      {[1,2,3,4,5].map(n => <td key={n}><input type="text" className="form-control form-control-sm" /></td>)}
                    </tr>
                    <tr>
                      <td>Quantity (Repetition)</td>
                      {[1,2,3,4,5].map(n => <td key={n}><input type="number" className="form-control form-control-sm" min="1" /></td>)}
                    </tr>
                    <tr>
                      <td>Sample Field Collection</td>
                      {[1,2,3,4,5].map(n => <td key={n}><input type="date" className="form-control form-control-sm" /></td>)}
                    </tr>
                    <tr>
                      <td>Same tests as sample No?</td>
                      {[1,2,3,4,5].map(n => <td key={n}><input type="checkbox" className="form-check-input" /></td>)}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* Tests */}
          <div className="card mb-3">
            <div className="card-header bg-light fw-bold">Tests</div>
            <div className="card-body pb-2">
              <div className="table-responsive mb-3">
                <table className="table table-bordered align-middle text-center small">
                  <thead className="table-light">
                    <tr>
                      <th>Test</th>
                      {[1,2,3,4,5].map(n => <th key={n}>Sample {n}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      "Moisture Content: ASTM D2216",
                      "Unit Weight: ASTM D7263-B",
                      "Particle Size Analysis",
                      "Plasticity Index",
                      "Specific Gravity: AASHTO T100",
                      "Compaction: CTM 216",
                      "Consolidation",
                      "Direct Shear",
                      "Triaxial (CU)",
                      "Triaxial (UU)",
                      "Unconfined Compression (Soil) (qu)",
                      "Point Load Index: ASTM D5731",
                      "Unconfined Compression (Rock): ASTM D7012-C",
                      "Hydraulic Conductivity",
                      "Corrosion: CTM 643,417,422"
                    ].map((test, i) => (
                      <tr key={test}>
                        <td>{test}</td>
                        {[1,2,3,4,5].map(n => <td key={n}><input type="checkbox" className="form-check-input" /></td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* Comments */}
          <div className="card mb-3">
            <div className="card-header bg-light fw-bold">Comments</div>
            <div className="card-body pb-2">
              <textarea className="form-control" rows={3} placeholder="Enter any additional comments here..."></textarea>
            </div>
          </div>
          <div className="d-flex justify-content-end mt-3">
            <div className="d-flex justify-content-center w-100">
              <button type="submit" className="btn btn-success px-4">Submit Request</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RaiseRequestForm; 