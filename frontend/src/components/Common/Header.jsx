import React from "react";
import { useNavigate } from "react-router-dom";

function Header({ showSignOut, onSignOut, userName }) {
  const navigate = useNavigate();

  const handleBrandClick = () => {
    navigate("/");
  };

  return (
    <header className="sticky-site-header fixed-top">
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm border-bottom mb-3 p-0" style={{ minHeight: 72 }}>
        <div className="container-fluid d-flex align-items-center justify-content-between">
          <button
            type="button"
            className="btn btn-link d-flex align-items-center text-decoration-none px-0"
            onClick={handleBrandClick}
            aria-label="Go to homepage"
          >
            <img
              src="/caltrans-logo.svg.png"
              alt="Caltrans Logo"
              style={{ height: "48px", marginRight: "16px" }}
            />
            <span className="fs-4 fw-bold" style={{ color: 'var(--caltrans-blue)' }}>
              Geotechnical Lab Database Management System
            </span>
          </button>
          <div className="d-flex align-items-center ms-auto">
            {showSignOut && userName && (
              <span className="me-3 text-dark fw-medium">
                <i className="bi bi-person-circle me-1"></i>
                {userName}
              </span>
            )}
            {showSignOut && (
              <button
                className="btn btn-danger"
                onClick={onSignOut}
                aria-label="Sign out"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header; 