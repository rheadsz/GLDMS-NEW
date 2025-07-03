import React from "react";

function TabsDashboard({ tab, setTab, tabs }) {
  return (
    <main className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-body">
          <ul className="nav nav-tabs mb-4" role="tablist">
            {tabs.map((t, idx) => (
              <li className="nav-item" key={t.label} role="presentation">
                <button
                  className={`nav-link d-flex align-items-center${tab === idx ? " active" : ""}`}
                  id={`tab-${idx}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === idx}
                  aria-controls={`tabpanel-${idx}`}
                  tabIndex={tab === idx ? 0 : -1}
                  onClick={() => setTab(idx)}
                  style={{ cursor: 'pointer' }}
                >
                  {t.icon && <i className={`${t.icon} me-2`} aria-hidden="true"></i>}
                  {t.label.toUpperCase()}
                </button>
              </li>
            ))}
          </ul>
          <div className="tab-content mt-3">
            {tabs.map((t, idx) => (
              <div
                key={t.label}
                role="tabpanel"
                id={`tabpanel-${idx}`}
                aria-labelledby={`tab-${idx}`}
                hidden={tab !== idx}
                className={tab === idx ? "tab-pane fade show active" : "tab-pane fade"}
              >
                {t.content}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default TabsDashboard; 