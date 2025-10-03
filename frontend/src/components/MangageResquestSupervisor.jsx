// src/components/AppWithSidebar.jsx
import React, { useEffect, useMemo, useState } from "react";
import AssignmentDetails from "./AssignmentDetails";
import SamplesDetails from "./SamplesDetails";

// API endpoints
const REQUESTS_API = "http://localhost:3001/api/supervisor/requests";
const UPDATE_STATUS_API = "http://localhost:3001/api/supervisor/update-status"; // + /:id
const SAMPLES_API = "http://localhost:3001/api/supervisor/samples";

function AppWithSidebar() {
  // Tabs
  // Keep stable keys for logic, but show new display names.
  const TAB_CONFIG = [
    { key: "assignments", label: "Assignments" },
    { key: "samples", label: "Samples" },
    { key: "tests", label: "Test Management" },   // renamed
    { key: "staff", label: "Lab Management" },    // renamed
    // removed { key: "projects", label: "Projects" }
  ];

  const [activeTab, setActiveTab] = useState("assignments");

  // GLOBAL hamburger for all tabs
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen((s) => !s);
  const SIDEBAR_OPEN_PX = 640;
  const SIDEBAR_CLOSED_PX = 0;

  // ===== Assignments state =====
  const [requests, setRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reqStatusFilter, setReqStatusFilter] = useState("All");
  const [reqSortOrder, setReqSortOrder] = useState("Newest");

  // ===== Samples state =====
  const [samples, setSamples] = useState([]);
  const [samplesLoading, setSamplesLoading] = useState(false);
  const [selectedSample, setSelectedSample] = useState(null);

  // ---------- Initial fetch (ALWAYS, so badges are populated) ----------
  useEffect(() => {
    // requests
    setReqLoading(true);
    fetch(REQUESTS_API)
      .then((r) => r.json())
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch((e) => {
        console.error("Initial requests fetch error:", e);
        setRequests([]);
      })
      .finally(() => setReqLoading(false));

    // samples
    setSamplesLoading(true);
    fetch(SAMPLES_API)
      .then((r) => r.json())
      .then((data) => setSamples(Array.isArray(data) ? data : []))
      .catch((e) => {
        console.error("Initial samples fetch error:", e);
        setSamples([]);
      })
      .finally(() => setSamplesLoading(false));
  }, []);

  // ---------- Optional refresh when entering each tab ----------
  useEffect(() => {
    if (activeTab === "assignments") {
      setReqLoading(true);
      fetch(REQUESTS_API)
        .then((res) => res.json())
        .then((data) => setRequests(Array.isArray(data) ? data : []))
        .catch((err) => {
          console.error("Error loading requests", err);
          setRequests([]);
        })
        .finally(() => setReqLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "samples") {
      setSamplesLoading(true);
      fetch(SAMPLES_API)
        .then((res) => res.json())
        .then((data) => setSamples(Array.isArray(data) ? data : []))
        .catch((err) => {
          console.error("Error loading samples", err);
          setSamples([]);
        })
        .finally(() => setSamplesLoading(false));
    }
  }, [activeTab]);

  // ---------- Assignments helpers ----------
  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${UPDATE_STATUS_API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setRequests((prev) =>
          prev.map((req) =>
            req.RequestID === id ? { ...req, Status: newStatus } : req
          )
        );
        setSelectedRequest((prev) =>
          prev && prev.RequestID === id ? { ...prev, Status: newStatus } : prev
        );
        window.alert(`Assignment updated to "${newStatus}".`);
      } else {
        window.alert("Failed to update assignment status.");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      window.alert("An error occurred while updating status.");
    }
  };

  const filteredRequests = useMemo(() => {
    if (activeTab !== "assignments") return [];
    const list = (requests || []).filter((req) => {
      if (reqStatusFilter !== "All" && req.Status !== reqStatusFilter) return false;
      return true;
    });
    list.sort((a, b) => {
      const aId = Number(a.RequestID) || 0;
      const bId = Number(b.RequestID) || 0;
      return reqSortOrder === "Newest" ? bId - aId : aId - bId;
    });
    return list;
  }, [activeTab, requests, reqStatusFilter, reqSortOrder]);

  // ===== Badges (always computed from state) =====
  const submittedAssignmentsCount = useMemo(
    () => requests.filter((req) => req.Status === "Submitted").length,
    [requests]
  );
  const submittedSamplesCount = useMemo(
    () => samples.filter((s) => s.Status === "Submitted").length,
    [samples]
  );

  // shared status color helper
  const statusTextClass = (status) => {
    if (status === "Submitted" || status === "Rejected") return "text-danger";
    if (
      status === "Assigned" ||
      status === "In Progress" ||
      status === "Received" ||
      status === "In Testing"
    )
      return "text-primary";
    if (status === "Completed" || status === "Complete") return "text-success";
    return "text-muted";
  };

  const activeLabel =
    TAB_CONFIG.find((t) => t.key === activeTab)?.label ?? "Panel";

  return (
    <div className="d-flex flex-column" style={{ height: "100vh" }}>
      {/* Local styles */}
      <style>{`
        .lm-topbar { background: var(--bs-light); border-bottom: 1px solid var(--bs-border-color, #dee2e6); }
        .lm-main { display: flex; min-height: 0; flex: 1 1 auto; }
        .lm-sidebar {
          width: ${sidebarOpen ? `${SIDEBAR_OPEN_PX}px` : `${SIDEBAR_CLOSED_PX}px`};
          transition: width 240ms ease;
          overflow: hidden;
          border-right: 1px solid var(--bs-border-color, #dee2e6);
          background: var(--bs-light);
        }
        .lm-content { flex: 1 1 auto; min-width: 0; }
        .lm-sticky-head { position: sticky; top: 0; z-index: 1; background: #fff; }
        .lm-hamburger {
          width: 40px; height: 36px; display: inline-flex; align-items: center; justify-content: center;
          border: 1px solid var(--bs-border-color, #dee2e6); border-radius: .5rem; background: #fff;
        }
        .lm-hamburger:focus { outline: 2px solid #6ea8fe; outline-offset: 2px; }
        .tbl-assignments, .tbl-samples { table-layout: fixed; }
        .tbl-assignments th, .tbl-assignments td,
        .tbl-samples th, .tbl-samples td {
          padding: 10px 12px !important; vertical-align: middle; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mono {
          font-variant-numeric: tabular-nums;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }
        .linklike { color: var(--bs-primary); text-decoration: none; }
        .linklike:hover { text-decoration: underline; }
        @media (max-width: 768px) {
          .lm-sidebar { position: absolute; z-index: 1040; height: calc(100% - 52px); }
          .lm-content { flex-basis: 100%; }
        }
      `}</style>

      {/* Top Bar: one hamburger for ALL tabs */}
      <div className="lm-topbar px-3 py-2 d-flex align-items-center gap-2">
        <button
          type="button"
          className="lm-hamburger"
          aria-label={sidebarOpen ? "Collapse left panel" : "Expand left panel"}
          aria-pressed={sidebarOpen}
          onClick={toggleSidebar}
          title={sidebarOpen ? "Hide left panel" : "Show left panel"}
        >
          <span className="d-inline-block" style={{ lineHeight: 0, fontSize: 20 }}>☰</span>
        </button>

        <div className="d-flex gap-2 flex-wrap">
          {TAB_CONFIG.map(({ key, label }) => (
            <button
              key={key}
              className={`btn ${activeTab === key ? "btn-primary" : "btn-outline-primary"}`}
              style={{ padding: "10px 18px", fontSize: "16px", fontWeight: "500" }}
              onClick={() => setActiveTab(key)}
            >
              {label}

              {/* Badges */}
              {key === "assignments" && submittedAssignmentsCount > 0 && (
                <span className="badge bg-danger ms-2">{submittedAssignmentsCount}</span>
              )}
              {key === "samples" && submittedSamplesCount > 0 && (
                <span className="badge bg-danger ms-2">{submittedSamplesCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN AREA */}
      {activeTab === "assignments" ? (
        <div className="lm-main">
          {/* LEFT: Assignments */}
          <aside className="lm-sidebar d-flex flex-column">
            <div className="lm-sticky-head p-3 d-flex justify-content-between align-items-center border-bottom bg-white">
              <h5 className="m-0">Assignments</h5>
              {reqLoading && <span className="spinner-border spinner-border-sm" />}
            </div>

            {/* Filters */}
            <div className="px-3 py-3 border-bottom bg-white">
              <div className="row g-3">
                <div className="col-6">
                  <label className="form-label small mb-1">Status</label>
                  <select
                    className="form-select form-select-sm"
                    value={reqStatusFilter}
                    onChange={(e) => setReqStatusFilter(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label small mb-1">Sort by</label>
                  <select
                    className="form-select form-select-sm"
                    value={reqSortOrder}
                    onChange={(e) => setReqSortOrder(e.target.value)}
                  >
                    <option value="Newest">Newest First</option>
                    <option value="Oldest">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-grow-1 overflow-auto">
              <table className="table table-sm table-hover table-striped mb-0 align-middle tbl-assignments">
                <colgroup>
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "28%" }} />
                </colgroup>
                <thead className="table-light sticky-top" style={{ top: 0 }}>
                  <tr>
                    <th className="text-center">Request No.</th>
                    <th className="text-start">Project ID</th>
                    <th className="text-start">Requester</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-muted text-center py-4">
                        {reqLoading ? "Loading..." : "No assignments found."}
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => {
                      const isActive = selectedRequest?.RequestID === req.RequestID;
                      return (
                        <tr
                          key={req.RequestID}
                          className={isActive ? "table-primary" : ""}
                          style={{ cursor: "pointer" }}
                          onClick={() => setSelectedRequest(req)}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedRequest(req);
                            }
                          }}
                          aria-selected={isActive}
                        >
                          <td className="mono text-center">
                            <span className="linklike">{req.RequestID}</span>
                          </td>
                          <td className="mono text-start">
                            <span className="linklike">{req.EfisProjectId ?? "—"}</span>
                          </td>
                          <td className="text-start">
                            <span className="linklike">{req.CreatedBy ?? "—"}</span>
                          </td>
                          <td className={`text-center ${statusTextClass(req.Status)}`}>
                            {req.Status || "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </aside>

          {/* RIGHT: Assignment Details */}
          <section className="lm-content">
            <div className="p-4 h-100 overflow-auto">
              <AssignmentDetails request={selectedRequest} onUpdateStatus={() => {}} />
            </div>
          </section>
        </div>
      ) : activeTab === "samples" ? (
        // Samples layout handled inside SamplesDetails
        <SamplesDetails
          samples={samples}
          selectedSample={selectedSample}
          onSelectSample={setSelectedSample}
          sidebarOpen={sidebarOpen}
        />
      ) : (
        <div className="p-4">
          <h4>{activeLabel} Panel</h4>
          <p className="text-muted">This tab is under construction.</p>
        </div>
      )}
    </div>
  );
}

export default AppWithSidebar;
