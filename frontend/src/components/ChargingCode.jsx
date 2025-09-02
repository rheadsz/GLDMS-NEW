import React from "react";

function ChargingCode({ data, onChange }) {
  return (
    <div className="card mb-3">
      <div className="card-header bg-light fw-bold">Charging Code</div>
      <div className="card-body pb-2">
        <div className="row mb-2">
          <div className="col-md-2 mb-2">
            <label className="form-label">Project ID:</label>
            <input type="text" className="form-control form-control-sm" value={data.chargingProjectID || ""} onChange={e => onChange({ ...data, chargingProjectID: e.target.value })} />
          </div>
          <div className="col-md-1 mb-2">
            <label className="form-label">Unit:</label>
            <input type="text" className="form-control form-control-sm" value={data.chargingUnit || ""} onChange={e => onChange({ ...data, chargingUnit: e.target.value })} />
          </div>
          <div className="col-md-2 mb-2">
            <label className="form-label">Reporting Code:</label>
            <input type="text" className="form-control form-control-sm" value={data.reportingCode || ""} onChange={e => onChange({ ...data, reportingCode: e.target.value })} />
          </div>
          <div className="col-md-1 mb-2">
            <label className="form-label">Phase:</label>
            <input type="text" className="form-control form-control-sm" value={data.phase || ""} onChange={e => onChange({ ...data, phase: e.target.value })} />
          </div>
          <div className="col-md-2 mb-2">
            <label className="form-label">Sub Object:</label>
            <input type="text" className="form-control form-control-sm" value={data.subObject || ""} onChange={e => onChange({ ...data, subObject: e.target.value })} />
          </div>
          <div className="col-md-2 mb-2">
            <label className="form-label">Activity:</label>
            <input type="text" className="form-control form-control-sm" value={data.activity || ""} onChange={e => onChange({ ...data, activity: e.target.value })} />
          </div>
          <div className="col-md-2 mb-2">
            <label className="form-label">Sub Activity:</label>
            <input type="text" className="form-control form-control-sm" value={data.subActivity || ""} onChange={e => onChange({ ...data, subActivity: e.target.value })} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChargingCode; 