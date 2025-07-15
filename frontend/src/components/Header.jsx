import React from "react";

function Header({ showSignOut, onSignOut }) {
  return (
    <header className="sticky-site-header">
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm border-bottom mb-3 p-0" style={{ minHeight: 72 }}>
        <div className="container-fluid d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <img
              src="/caltrans-logo.svg.png"
              alt="Caltrans Logo"
              style={{ height: "48px", marginRight: "16px" }}
            />
            <span className="fs-4 fw-bold" style={{ color: 'var(--caltrans-blue)' }}>
              Geotechnical Lab Database Management System
            </span>
          </div>
          {showSignOut && (
            <button
              className="btn btn-danger ms-auto"
              onClick={onSignOut}
              aria-label="Sign out"
            >
              Sign Out
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Header; 