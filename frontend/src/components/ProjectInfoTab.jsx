import React from "react";

function ProjectInfoTab({ selectedRequest }) {
  return (
    <form className="row g-3">
      <div className="col-md-4">
        <label className="form-label fw-bold">Project ID</label>
        <input type="text" className="form-control form-control-sm" value={selectedRequest.ProjectID || ""} readOnly />
      </div>
      <div className="col-md-2">
        <label className="form-label fw-bold">EA</label>
        <input type="text" className="form-control form-control-sm" value={selectedRequest.EA_Part1 || ""} readOnly />
      </div>
      <div className="col-md-2">
        <label className="form-label d-none">&nbsp;</label>
        <input type="text" className="form-control form-control-sm mt-2" value={selectedRequest.EA_Part2 || ""} readOnly />
      </div>

      <div className="col-12">
        <label className="form-label fw-bold">Project Name</label>
        <input type="text" className="form-control form-control-sm" value={selectedRequest.ProjectName || ""} readOnly />
      </div>

      <div className="col-md-2">
        <label className="form-label fw-bold">Dist</label>
        <input type="text" className="form-control form-control-sm" value={selectedRequest.Dist || ""} readOnly />
      </div>
      <div className="col-md-2">
        <label className="form-label fw-bold">Co</label>
        <input type="text" className="form-control form-control-sm" value={selectedRequest.Co || ""} readOnly />
      </div>
      <div className="col-md-2">
        <label className="form-label fw-bold">Rte</label>
        <input type="text" className="form-control form-control-sm" value={selectedRequest.Rte || ""} readOnly />
      </div>
      <div className="col-md-2">
        <label className="form-label fw-bold">PM</label>
        <input type="text" className="form-control form-control-sm" value={selectedRequest.PM || ""} readOnly />
      </div>

      <div className="col-12">
        <label className="form-label fw-bold">Project Component</label>
        <input type="text" className="form-control form-control-sm" value={selectedRequest.ProjectComponent || ""} readOnly />
      </div>

      <div className="col-md-2">
        <label className="form-label fw-bold">Structure No.</label>
        <input type="text" className="form-control form-control-sm" value={selectedRequest.StructureNo1 || ""} readOnly />
      </div>
      <div className="col-md-3">
        <label className="form-label d-none">&nbsp;</label>
        <input type="text" className="form-control form-control-sm mt-2" value={selectedRequest.StructureNo2 || ""} readOnly />
      </div>
    </form>
  );
}

export default ProjectInfoTab;
