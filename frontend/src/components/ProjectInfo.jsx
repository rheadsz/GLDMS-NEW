import React, { useEffect, useState } from "react";

function ProjectInfo({ data, onChange }) {
  const [districtOptions, setDistrictOptions] = useState([]);
  const [countyOptions, setCountyOptions] = useState([]);
  const [routeOptions, setRouteOptions] = useState([]);

  useEffect(() => {
    fetch("/api/project-info-options")
      .then(res => res.json())
      .then(options => {
        setDistrictOptions(options.districts || []);
        setCountyOptions(options.counties || []);
        setRouteOptions(options.routes || []);
      });
  }, []);

  return (
    <div className="card mb-3">
      <div className="card-header bg-light fw-bold">Project Information</div>
      <div className="card-body pb-2">
        <div className="row mb-2">
          <div className="col-md-2 mb-2">
            <label className="form-label">EFIS (Project ID):</label>
            <input type="text" className="form-control form-control-sm" value={data.projectID || ""} onChange={e => onChange({ ...data, projectID: e.target.value })} />
          </div>
          <div className="col-md-1 mb-2">
            <label className="form-label">EA:</label>
            <input type="text" className="form-control form-control-sm" value={data.ea || ""} onChange={e => onChange({ ...data, ea: e.target.value })} />
          </div>
          <div className="col-md-2 mb-2">
            <label className="form-label">Structure No.:</label>
            <input type="text" className="form-control form-control-sm" value={data.structureNo || ""} onChange={e => onChange({ ...data, structureNo: e.target.value })} />
          </div>
          <div className="col-md-1 mb-2">
            <label className="form-label">District:</label>
            <select className="form-control form-control-sm" value={data.district || ""} onChange={e => onChange({ ...data, district: e.target.value })}>
              <option value="">Select District</option>
              {districtOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="col-md-2 mb-2">
            <label className="form-label">County:</label>
            <select className="form-control form-control-sm" value={data.county || ""} onChange={e => onChange({ ...data, county: e.target.value })}>
              <option value="">Select County</option>
              {countyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="col-md-1 mb-2">
            <label className="form-label">Route:</label>
            <select className="form-control form-control-sm" value={data.route || ""} onChange={e => onChange({ ...data, route: e.target.value })}>
              <option value="">Select Route</option>
              {routeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="col-md-2 mb-2">
            <label className="form-label">PM Start:</label>
            <input type="text" className="form-control form-control-sm" value={data.pmStart || ""} onChange={e => onChange({ ...data, pmStart: e.target.value })} />
          </div>
          <div className="col-md-2 mb-2">
            <label className="form-label">PM End:</label>
            <input type="text" className="form-control form-control-sm" value={data.pmEnd || ""} onChange={e => onChange({ ...data, pmEnd: e.target.value })} />
          </div>
          <div className="col-md-2 mb-2">
            <label className="form-label">Project Component:</label>
            <input type="text" className="form-control form-control-sm" value={data.projectComponent || ""} onChange={e => onChange({ ...data, projectComponent: e.target.value })} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectInfo; 