import React, { useState, useEffect } from "react";
import SimpleProjectsTable from "./SimpleProjectsTable";

function RequestMenu({ onMain, onRaiseRequest }) {
  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card shadow p-4">
            <h4 className="mb-3">Quick Actions</h4>
            <div className="d-flex flex-column gap-3">
              <button className="btn btn-primary" style={{ height: 48 }} onClick={onRaiseRequest}>
                Raise Request
              </button>
              <button className="btn btn-secondary" style={{ height: 48 }}>
                View Requests
              </button>
              <button className="btn btn-outline-dark" style={{ height: 48 }} onClick={onMain}>
                Main
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-white py-3">
              <h4 className="m-0">Projects</h4>
            </div>
            <div className="card-body p-0">
              <SimpleProjectsTable />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RequestMenu; 