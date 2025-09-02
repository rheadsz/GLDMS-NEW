import React, { useEffect, useState } from "react";

function RequesterInfo({ data, onChange }) {
  const [supervisors, setSupervisors] = useState([]);

  useEffect(() => {
    fetch("/api/supervisor/all")
      .then(res => res.json())
      .then(list => setSupervisors(list));
  }, []);

  // Auto-fill supervisor email and phone when supervisorName changes
  useEffect(() => {
    const selected = supervisors.find(s => s.UserName === data.supervisorName);
    if (selected) {
      onChange({ ...data, supervisorEmail: selected.Email, supervisorPhone: selected.Phone });
    } else {
      onChange({ ...data, supervisorEmail: "", supervisorPhone: "" });
    }
    // eslint-disable-next-line
  }, [data.supervisorName, supervisors]);

  return (
    <div className="card mb-3">
      <div className="card-header bg-light fw-bold">Requester Information</div>
      <div className="card-body pb-2">
        <div className="row mb-2">
          <div className="col-md-2 mb-2">
            <label className="form-label">Office:</label>
            <div>
              <select 
                className="form-control form-control-sm" 
                value={data.officeDropdownValue === "custom" ? "custom" : (data.office || "")} 
                onChange={e => {
                  const value = e.target.value;
                  if (value === "custom") {
                    // Just set the dropdown to custom, keep the existing office value
                    onChange({ ...data, officeDropdownValue: "custom" });
                  } else {
                    // Set both the dropdown value and the office value
                    onChange({ ...data, office: value, officeDropdownValue: value });
                  }
                }}
              >
                <option value="">Select Office</option>
                {data.officeOptions && data.officeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                <option value="custom">Custom...</option>
              </select>
            </div>
            {(data.officeDropdownValue === "custom") && (
              <input 
                type="text" 
                className="form-control form-control-sm mt-1" 
                placeholder="Enter custom office" 
                value={data.office || ""} 
                onChange={e => onChange({ ...data, office: e.target.value, officeDropdownValue: "custom" })} 
              />
            )}
          </div>
          <div className="col-md-2 mb-2">
            <label className="form-label">Branch:</label>
            <div>
              <select 
                className="form-control form-control-sm" 
                value={data.branchDropdownValue === "custom" ? "custom" : (data.branch || "")} 
                onChange={e => {
                  const value = e.target.value;
                  if (value === "custom") {
                    // Just set the dropdown to custom, keep the existing branch value
                    onChange({ ...data, branchDropdownValue: "custom" });
                  } else {
                    // Set both the dropdown value and the branch value
                    onChange({ ...data, branch: value, branchDropdownValue: value });
                  }
                }}
              >
                <option value="">Select Branch</option>
                {data.branchOptions && data.branchOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                <option value="custom">Custom...</option>
              </select>
            </div>
            {(data.branchDropdownValue === "custom") && (
              <input 
                type="text" 
                className="form-control form-control-sm mt-1" 
                placeholder="Enter custom branch" 
                value={data.branch || ""} 
                onChange={e => onChange({ ...data, branch: e.target.value, branchDropdownValue: "custom" })} 
              />
            )}
          </div>
          <div className="col-md-2 mb-2">
            <label className="form-label">Requester Name:</label>
            <input type="text" className="form-control form-control-sm" value={data.requesterName || ""} readOnly />
          </div>
          <div className="col-md-2 mb-2">
            <label className="form-label">Requester Email:</label>
            <input type="email" className="form-control form-control-sm" value={data.requesterEmail || ""} readOnly />
          </div>
          <div className="col-md-2 mb-2">
            <label className="form-label">Requester Phone:</label>
            <input type="tel" className="form-control form-control-sm" value={data.requesterPhone || ""} readOnly />
          </div>
          <div className="col-md-2 mb-2">
            <label className="form-label">Supervisor Name:</label>
            <select className="form-control form-control-sm" value={data.supervisorName || ""} onChange={e => onChange({ ...data, supervisorName: e.target.value })}>
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
            <input type="email" className="form-control form-control-sm" value={data.supervisorEmail || ""} readOnly />
          </div>
          <div className="col-md-2 mb-2">
            <label className="form-label">Supervisor Phone:</label>
            <input type="tel" className="form-control form-control-sm" value={data.supervisorPhone || ""} readOnly />
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
            <input type="date" className="form-control form-control-sm" value={data.testResultsDueDate || ""} onChange={e => onChange({ ...data, testResultsDueDate: e.target.value })} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RequesterInfo; 