import React, { useState, useEffect } from "react";
import "./RaiseRequestForm.css";

// Custom styles for the component
const tableScrollStyle = {
  maxWidth: '100%',
  overflowX: 'auto',
};

// Fixed width for the first column
const firstColumnStyle = {
  position: 'sticky',
  left: 0,
  backgroundColor: '#fff',
  zIndex: 1,
  textAlign: 'right',
  minWidth: '180px',
};

// Fixed width for sample columns
const sampleColumnStyle = {
  minWidth: '150px',
};

function RaiseRequestForm({ userName, userEmail, userPhone }) {
  // I am setting up state for all the main fields
  const [office, setOffice] = useState("");
  const [branch, setBranch] = useState("");
  const [requesterName, setRequesterName] = useState(userName || "");
  const [requesterEmail, setRequesterEmail] = useState(userEmail || "");
  const [requesterPhone, setRequesterPhone] = useState(userPhone || "");
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorEmail, setSupervisorEmail] = useState("");
  const [supervisorPhone, setSupervisorPhone] = useState("");
  const [testResultsDueDate, setTestResultsDueDate] = useState("");
  const [dateOfRequest, setDateOfRequest] = useState("");
  const [projectID, setProjectID] = useState("");
  const [ea, setEA] = useState("");
  const [structureNo, setStructureNo] = useState("");
  const [district, setDistrict] = useState("");
  const [county, setCounty] = useState("");
  const [route, setRoute] = useState("");
  const [pm, setPM] = useState("");
  const [projectComponent, setProjectComponent] = useState("");
  const [chargingProjectID, setChargingProjectID] = useState("");
  const [chargingUnit, setChargingUnit] = useState("");
  const [reportingCode, setReportingCode] = useState("");
  const [phase, setPhase] = useState("");
  const [subObject, setSubObject] = useState("");
  const [activity, setActivity] = useState("");
  const [subActivity, setSubActivity] = useState("");
  // Max number of samples
  const MAX_SAMPLES = 50;
  const [numSamples, setNumSamples] = useState(2); // Start with 2 samples
  const [expectedSampleReceiptDate, setExpectedSampleReceiptDate] = useState("");
  const [comments, setComments] = useState("");

  // I am using a simple array for sample details (for demo, 5 samples)
  // Update sampleDetails and selectedTests to support dynamic columns
  const [sampleDetails, setSampleDetails] = useState(
    Array.from({ length: 2 }, () => ({
      boreholeID: "",
      top: "",
      bottom: "",
      TL101No: "",
      type: "Bag",
      length: "",
      diameter: "",
      weight: "",
      fieldCollectionDate: "",
      sameAsSampleNo: null,
    }))
  );

  // I am using a full array for all test types from the request form
  const testTypes = [
    { id: 1, name: "Moisture Content: ASTM D2216" },
    { id: 2, name: "Unit Weight: ASTM D7263-B" },
    { id: 3, name: "Particle Size Analysis" },
    { id: 4, name: "Plasticity Index" },
    { id: 5, name: "Specific Gravity: AASHTO T100" },
    { id: 6, name: "Compaction: CTM 216" },
    { id: 7, name: "Consolidation" },
    { id: 8, name: "Direct Shear" },
    { id: 9, name: "Triaxial (CU)" },
    { id: 10, name: "Triaxial (UU)" },
    { id: 11, name: "Unconfined Compression (Soil) (qu)" },
    { id: 12, name: "Point Load Index: ASTM D5731" },
    { id: 13, name: "Unconfined Compression (Rock): ASTM D7012-C" },
    { id: 14, name: "Hydraulic Conductivity" },
    { id: 15, name: "Corrosion: CTM 643,417,422" }
  ];
  // Update selectedTests to match the new testTypes length
  const [selectedTests, setSelectedTests] = useState(
    Array.from({ length: 2 }, () => Array(testTypes.length).fill(false))
  );

  const [supervisors, setSupervisors] = useState([]);
  useEffect(() => {
    fetch("/api/supervisor/all")
      .then(res => res.json())
      .then(data => setSupervisors(data))
      .catch(() => setSupervisors([]));
  }, []);

  // When supervisorName changes, auto-fill email and phone
  useEffect(() => {
    const selected = supervisors.find(s => s.UserName === supervisorName);
    if (selected) {
      setSupervisorEmail(selected.Email);
      setSupervisorPhone(selected.Phone);
    } else {
      setSupervisorEmail("");
      setSupervisorPhone("");
    }
  }, [supervisorName, supervisors]);

  // I am handling changes for sample details
  // Update sampleDetailChange to handle new fields
  const handleSampleDetailChange = (idx, field, value) => {
    const updated = [...sampleDetails];
    updated[idx][field] = value;
    setSampleDetails(updated);
  };

  // Update type change handler to reset size fields
  const handleTypeChange = (idx, value) => {
    const updated = [...sampleDetails];
    updated[idx].type = value;
    if (value === "Bag") {
      updated[idx].length = "";
      updated[idx].diameter = "";
    }
    setSampleDetails(updated);
  };

  // I am handling test checkbox changes
  const handleTestChange = (sampleIdx, testIdx) => {
    const updated = selectedTests.map(arr => [...arr]);
    updated[sampleIdx][testIdx] = !updated[sampleIdx][testIdx];
    setSelectedTests(updated);
  };

  // Add a Sample button handler
  const handleAddSample = () => {
    if (numSamples < MAX_SAMPLES) {
      setNumSamples(numSamples + 1);
      setSampleDetails([
        ...sampleDetails,
        {
          boreholeID: "",
          top: "",
          bottom: "",
          TL101No: "",
          type: "Bag",
          length: "",
          diameter: "",
          weight: "",
          fieldCollectionDate: "",
          sameAsSampleNo: null,
        },
      ]);
      setSelectedTests([
        ...selectedTests,
        Array(testTypes.length).fill(false),
      ]);
    }
  };

  // I am handling form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    // I am building the details array for all selected tests
    const details = [];
    for (let i = 0; i < numSamples; i++) {
      for (let j = 0; j < testTypes.length; j++) {
        if (selectedTests[i][j]) {
          details.push({
            sampleNumber: i + 1,
            boreholeID: sampleDetails[i].boreholeID,
            depthFrom: sampleDetails[i].top, // Assuming top is depthFrom
            depthTo: sampleDetails[i].bottom, // Assuming bottom is depthTo
            TL101No: sampleDetails[i].TL101No,
            tubeJar: "", // No longer applicable for Tube type
            quantity: 1, // Assuming quantity is 1 for each test
            fieldCollectionDate: sampleDetails[i].fieldCollectionDate,
            testTypeId: testTypes[j].id,
            sameAsSampleNo: sampleDetails[i].sameAsSampleNo,
            comments: ""
          });
        }
      }
    }
    // I am building the main request object
    const requestData = {
      office, branch, requesterName, requesterEmail, requesterPhone, supervisorName, supervisorEmail, supervisorPhone,
      testResultsDueDate, dateOfRequest, projectID, ea, structureNo, district, county, route, pm, projectComponent,
      chargingProjectID, chargingUnit, reportingCode, phase, subObject, activity, subActivity, numSamples, expectedSampleReceiptDate, comments,
      details
    };
    // I am submitting the request to the backend
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      const data = await res.json();
      if (res.ok) {
        alert('Request submitted successfully!');
      } else {
        alert('Error: ' + (data.message || 'Failed to submit request'));
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    }
  };

  const officeOptions = ["Central Office", "North Branch", "South Branch"];
  const branchOptions = ["Branch A", "Branch B", "Branch C"];
  const districtOptions = ["District 1", "District 2", "District 3"];
  const countyOptions = ["County A", "County B", "County C"];

  console.log(sampleDetails); // Debug: check the structure of sampleDetails
  // I am rendering the form (simplified for clarity)
  return (
    <div className={`container py-4 ${numSamples > 4 ? 'many-samples' : ''}`}>
      <div className="card shadow p-4 mb-4">
        <h4 className="mb-3 sticky-header">
          GEOTECHNICAL LABORATORY TEST REQUEST
          <span className="text-primary" style={{ fontStyle: 'italic', fontSize: '1rem' }}>
            (for Borehole Samples)
          </span>
        </h4>
        <form onSubmit={handleSubmit}>
          {/* Requester Information */}
          <div className="card mb-3">
            <div className="card-header bg-light fw-bold">Requester Information</div>
            <div className="card-body pb-2">
              <div className="row mb-2">
                <div className="col-md-2 mb-2">
                  <label className="form-label">Office:</label>
                  <select className="form-control form-control-sm" value={office} onChange={e => setOffice(e.target.value)}>
                    <option value="">Select Office</option>
                    {officeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Branch:</label>
                  <select className="form-control form-control-sm" value={branch} onChange={e => setBranch(e.target.value)}>
                    <option value="">Select Branch</option>
                    {branchOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Requester Name:</label>
                  <input type="text" className="form-control form-control-sm" value={requesterName} readOnly />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Requester Email:</label>
                  <input type="email" className="form-control form-control-sm" value={requesterEmail} readOnly />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Requester Phone:</label>
                  <input type="tel" className="form-control form-control-sm" value={requesterPhone} readOnly />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Supervisor Name:</label>
                  <select className="form-control form-control-sm" value={supervisorName} onChange={e => setSupervisorName(e.target.value)}>
                    <option value="">Select Supervisor</option>
                    {supervisors.map(s => (
                      <option key={s.UserName} value={s.UserName}>{s.UserName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="row mb-2">
                <div className="col-md-2 mb-2">
                  <label className="form-label">Supervisor Email:</label>
                  <input type="email" className="form-control form-control-sm" value={supervisorEmail} readOnly />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Supervisor Phone:</label>
                  <input type="tel" className="form-control form-control-sm" value={supervisorPhone} readOnly />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label" style={{ whiteSpace: 'nowrap' }}>
                    Test Results Due Date:
                    <span
                      data-bs-toggle="tooltip"
                      data-bs-placement="top"
                      title="Please allow a minimum of three weeks for completion of the test results after the sample is received."
                      style={{ cursor: 'pointer', marginLeft: 4, verticalAlign: 'middle', display: 'inline-block' }}
                      tabIndex={0}
                    >
                      <i className="bi bi-info-circle text-primary" style={{ fontSize: '1rem', verticalAlign: 'middle' }} />
                    </span>
                  </label>
                  <input type="date" className="form-control form-control-sm" value={testResultsDueDate} onChange={e => setTestResultsDueDate(e.target.value)} />
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
                  <input type="text" className="form-control form-control-sm" value={projectID} onChange={e => setProjectID(e.target.value)} />
                </div>
                <div className="col-md-1 mb-2">
                  <label className="form-label">EA:</label>
                  <input type="text" className="form-control form-control-sm" value={ea} onChange={e => setEA(e.target.value)} />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Structure No.:</label>
                  <input type="text" className="form-control form-control-sm" value={structureNo} onChange={e => setStructureNo(e.target.value)} />
                </div>
                <div className="col-md-1 mb-2">
                  <label className="form-label">District:</label>
                  <select className="form-control form-control-sm" value={district} onChange={e => setDistrict(e.target.value)}>
                    <option value="">Select District</option>
                    {districtOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">County:</label>
                  <select className="form-control form-control-sm" value={county} onChange={e => setCounty(e.target.value)}>
                    <option value="">Select County</option>
                    {countyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="col-md-1 mb-2">
                  <label className="form-label">Route:</label>
                  <input type="text" className="form-control form-control-sm" value={route} onChange={e => setRoute(e.target.value)} />
                </div>
                <div className="col-md-1 mb-2">
                  <label className="form-label">PM:</label>
                  <input type="text" className="form-control form-control-sm" value={pm} onChange={e => setPM(e.target.value)} />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Project Component:</label>
                  <input type="text" className="form-control form-control-sm" value={projectComponent} onChange={e => setProjectComponent(e.target.value)} />
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
                  <input type="text" className="form-control form-control-sm" value={chargingProjectID} onChange={e => setChargingProjectID(e.target.value)} />
                </div>
                <div className="col-md-1 mb-2">
                  <label className="form-label">Unit:</label>
                  <input type="text" className="form-control form-control-sm" value={chargingUnit} onChange={e => setChargingUnit(e.target.value)} />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Reporting Code:</label>
                  <input type="text" className="form-control form-control-sm" value={reportingCode} onChange={e => setReportingCode(e.target.value)} />
                </div>
                <div className="col-md-1 mb-2">
                  <label className="form-label">Phase:</label>
                  <input type="text" className="form-control form-control-sm" value={phase} onChange={e => setPhase(e.target.value)} />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Sub Object:</label>
                  <input type="text" className="form-control form-control-sm" value={subObject} onChange={e => setSubObject(e.target.value)} />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Activity:</label>
                  <input type="text" className="form-control form-control-sm" value={activity} onChange={e => setActivity(e.target.value)} />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label">Sub Activity:</label>
                  <input type="text" className="form-control form-control-sm" value={subActivity} onChange={e => setSubActivity(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
          {/* Sample Information */}
          <div className="card mb-3">
            <div className="card-header bg-light fw-bold d-flex justify-content-between align-items-center">
              <span>Sample Information</span>
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleAddSample} disabled={numSamples >= MAX_SAMPLES}>
                Add a Sample
              </button>
            </div>
            <div className="card-body pb-2">
              <div className="table-responsive mb-3">
                <table className="table table-bordered align-middle text-center small">
                  <thead className="table-light">
                    <tr>
                      <th style={{ textAlign: 'right', verticalAlign: 'middle' }}>Sample ID (No.)</th>
                      {[...Array(numSamples)].map((_, n) => <th key={n}>{n + 1}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'right' }}>Borehole ID</td>
                      {[...Array(numSamples)].map((_, n) => (
                        <td key={n}>
                          <input type="text" className="form-control form-control-sm" value={sampleDetails[n]?.boreholeID || ""} onChange={e => handleSampleDetailChange(n, 'boreholeID', e.target.value)} />
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'right' }}>Depth (ft): Top/Bottom</td>
                      {[...Array(numSamples)].map((_, n) => (
                        <td key={n}>
                          <div className="d-flex justify-content-center align-items-center gap-1">
                            <input type="text" className="form-control form-control-sm" placeholder="Top" value={sampleDetails[n]?.top || ""} onChange={e => handleSampleDetailChange(n, 'top', e.target.value)} style={{ width: 60 }} />/
                            <input type="text" className="form-control form-control-sm" placeholder="Bottom" value={sampleDetails[n]?.bottom || ""} onChange={e => handleSampleDetailChange(n, 'bottom', e.target.value)} style={{ width: 60 }} />
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'right' }}>TL-101 No. <span className="text-muted" style={{ fontSize: '0.85em' }}>(if applicable)</span></td>
                      {[...Array(numSamples)].map((_, n) => (
                        <td key={n}>
                          <input type="text" className="form-control form-control-sm" value={sampleDetails[n]?.TL101No || ""} onChange={e => handleSampleDetailChange(n, 'TL101No', e.target.value)} />
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'right' }}>Type</td>
                      {[...Array(numSamples)].map((_, n) => (
                        <td key={n}>
                          <div className="d-flex justify-content-center align-items-center gap-2">
                            <div className="form-check form-check-inline">
                              <input className="form-check-input" type="radio" name={`type-${n}`} id={`bag-${n}`} value="Bag" checked={sampleDetails[n]?.type === "Bag"} onChange={() => handleTypeChange(n, "Bag")} />
                              <label className="form-check-label" htmlFor={`bag-${n}`}>Bag</label>
                            </div>
                            <div className="form-check form-check-inline">
                              <input className="form-check-input" type="radio" name={`type-${n}`} id={`tube-${n}`} value="Tube" checked={sampleDetails[n]?.type === "Tube"} onChange={() => handleTypeChange(n, "Tube")} />
                              <label className="form-check-label" htmlFor={`tube-${n}`}>Tube</label>
                            </div>
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'right' }}>Size</td>
                      {[...Array(numSamples)].map((_, n) => (
                        <td key={n}>
                          <div className="d-flex justify-content-center gap-1">
                            {sampleDetails[n]?.type === "Tube" ? (
                              <>
                                <input type="text" className="form-control form-control-sm" placeholder="Length (in)" value={sampleDetails[n]?.length || ""} onChange={e => handleSampleDetailChange(n, 'length', e.target.value)} style={{ width: 70 }} />
                                <input type="text" className="form-control form-control-sm" placeholder="Diameter (in)" value={sampleDetails[n]?.diameter || ""} onChange={e => handleSampleDetailChange(n, 'diameter', e.target.value)} style={{ width: 90 }} />
                                <input type="text" className="form-control form-control-sm" placeholder="Weight (lb)" value={sampleDetails[n]?.weight || ""} onChange={e => handleSampleDetailChange(n, 'weight', e.target.value)} style={{ width: 90 }} />
                              </>
                            ) : (
                              <input type="text" className="form-control form-control-sm" placeholder="Weight (lb)" value={sampleDetails[n]?.weight || ""} onChange={e => handleSampleDetailChange(n, 'weight', e.target.value)} style={{ width: 90 }} />
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'right' }}>Sample Field Collection</td>
                      {[...Array(numSamples)].map((_, n) => <td key={n}><input type="date" className="form-control form-control-sm" value={sampleDetails[n]?.fieldCollectionDate || ""} onChange={e => handleSampleDetailChange(n, 'fieldCollectionDate', e.target.value)} /></td>)}
                    </tr>
                    {/* Same tests as sample No.? row removed as requested */}
                    {/* Tests row removed as requested */}
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
                      {[...Array(numSamples)].map((_, n) => <th key={n}>Sample {n + 1}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {testTypes.map((test, testIdx) => (
                      <tr key={test.id}>
                        <td>{test.name}</td>
                        {[...Array(numSamples)].map((_, n) => (
                          <td key={n}>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedTests[n][testIdx]}
                              onChange={() => handleTestChange(n, testIdx)}
                            />
                          </td>
                        ))}
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
              <textarea className="form-control" rows={3} placeholder="Enter any additional comments here..." value={comments} onChange={e => setComments(e.target.value)}></textarea>
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