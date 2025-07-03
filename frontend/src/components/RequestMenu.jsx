import React from "react";

function RequestMenu({ onMain, onRaiseRequest }) {
  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 72px)' }}>
      <div className="card shadow-lg p-4 d-flex align-items-center" style={{ width: 350, borderRadius: 16 }}>
        <div className="w-100 d-flex flex-column gap-3">
          <button className="btn btn-primary w-100" style={{ height: 48 }} onClick={onRaiseRequest}>
            Raise Request
          </button>
          <button className="btn btn-secondary w-100" style={{ height: 48 }}>
            View Requests
          </button>
          <button className="btn btn-outline-dark w-100" style={{ height: 48 }} onClick={onMain}>
            Main
          </button>
        </div>
      </div>
    </div>
  );
}

export default RequestMenu; 