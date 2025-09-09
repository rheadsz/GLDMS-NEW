import React from "react";

function ChargingCode({ data, onChange }) {
  return (
    <div className="card mb-3">
      <div className="card-header bg-light fw-bold">Charging Code Information</div>
      <div className="card-body pb-2">
        <div className="row mb-2">
          <div className="col-md-6 mb-2">
            <label className="form-label">Charging Code:</label>
            <input 
              type="text" 
              className="form-control form-control-sm" 
              value={data.chargingCode || ""} 
              onChange={e => onChange({ ...data, chargingCode: e.target.value })}
            />
          </div>
          <div className="col-md-6 mb-2">
            <label className="form-label">Task Order:</label>
            <input 
              type="text" 
              className="form-control form-control-sm" 
              value={data.taskOrder || ""} 
              onChange={e => onChange({ ...data, taskOrder: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChargingCode;
