import React, { useEffect, useState, useMemo } from "react";
import LabManagerTab from "./LabManagerTab";

function AppWithSidebar() {
  // Tabs
  const [activeTab, setActiveTab] = useState("assignments");

  // Data for assignments
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("Newest");

  // Sidebar (Assignments only)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen((s) => !s);

  useEffect(() => {
    if (activeTab !== "assignments") return;
    fetch("http://localhost:3001/api/supervisor/requests")
      .then((res) => res.json())
      .then((data) => {
        setRequests(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading requests", err);
        setLoading(false);
      });
  }, [activeTab]);

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(
        `http://localhost:3001/api/supervisor/update-status/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

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
      if (statusFilter !== "All" && req.Status !== statusFilter) return false;
      return true;
    });
    list.sort((a, b) => {
      const aId = Number(a.RequestID) || 0;
      const bId = Number(b.RequestID) || 0;
      return sortOrder === "Newest" ? bId - aId : aId - bId;
    });
    return list;
  }, [activeTab, requests, statusFilter, sortOrder]);

  const statusTextClass = (status) => {
    if (status === "Submitted") return "text-danger";
    if (status === "Assigned" || status === "In Progress") return "text-primary";
    if (status === "Completed" || status === "Complete") return "text-success";
    if (status === "Rejected") return "text-danger";
    return "text-muted";
  };

  const SIDEBAR_OPEN_PX = 640;  // a touch wider for breathing room
  const SIDEBAR_CLOSED_PX = 0;

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

        /* Hamburger */
        .lm-hamburger {
          width: 40px; height: 36px; display: inline-flex; align-items: center; justify-content: center;
          border: 1px solid var(--bs-border-color, #dee2e6); border-radius: .5rem; background: #fff;
        }
        .lm-hamburger:focus { outline: 2px solid #6ea8fe; outline-offset: 2px; }

        /* Table polish */
        .tbl-assignments {
          table-layout: fixed;
        }
        .tbl-assignments th,
        .tbl-assignments td {
          padding: 10px 12px !important;
          vertical-align: middle;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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

      {/* Top Bar */}
      <div className="lm-topbar px-3 py-2 d-flex align-items-center gap-2">
        {activeTab === "assignments" && (
          <button
            type="button"
            className="lm-hamburger"
            aria-label={sidebarOpen ? "Collapse assignments table" : "Expand assignments table"}
            aria-pressed={sidebarOpen}
            onClick={toggleSidebar}
            title={sidebarOpen ? "Hide assignments table" : "Show assignments table"}
          >
            <span className="d-inline-block" style={{ lineHeight: 0, fontSize: 20 }}>☰</span>
          </button>
        )}

        <div className="d-flex gap-2 flex-wrap">
          {["assignments", "samples", "tests", "staff", "projects"].map((tab) => (
            <button
              key={tab}
              className={`btn btn-sm ${
                activeTab === tab ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "staff" ? "Resources/Staff" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN AREA */}
      {activeTab === "assignments" ? (
        <div className="lm-main">
          {/* LEFT: Table */}
          <aside className="lm-sidebar d-flex flex-column">
            <div className="lm-sticky-head p-3 d-flex justify-content-between align-items-center border-bottom bg-white">
              <h5 className="m-0">Assignments</h5>
              {loading && <span className="spinner-border spinner-border-sm" />}
            </div>

            {/* Filters */}
            <div className="px-3 py-3 border-bottom bg-white">
              <div className="row g-3">
                <div className="col-6">
                  <label className="form-label small mb-1">Status</label>
                  <select
                    className="form-select form-select-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
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
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
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
                {/* Fixed column widths */}
                <colgroup>
                  <col style={{ width: "16%" }} /> {/* Request No. */}
                  <col style={{ width: "28%" }} /> {/* Project ID */}
                  <col style={{ width: "28%" }} /> {/* Requester */}
                  <col style={{ width: "28%" }} /> {/* Status */}
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
                        {loading ? "Loading..." : "No assignments found."}
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

          {/* RIGHT: Details */}
          <section className="lm-content">
            <div className="p-4 h-100 overflow-auto">
              {selectedRequest ? (
                <>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="mb-1">
                        Assignment #{selectedRequest.RequestID} — EFIS&nbsp;
                        <span className="mono">{selectedRequest.EfisProjectId ?? "—"}</span>
                      </h5>
                      <div className="text-muted small">
                        Requester: {selectedRequest.CreatedBy ?? "—"}
                      </div>
                    </div>

                    {/* Status quick actions */}
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => updateStatus(selectedRequest.RequestID, "In Progress")}
                        disabled={
                          selectedRequest.Status === "In Progress" ||
                          selectedRequest.Status === "Completed"
                        }
                      >
                        Start (In Progress)
                      </button>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => updateStatus(selectedRequest.RequestID, "Completed")}
                        disabled={selectedRequest.Status === "Completed"}
                      >
                        Mark Completed
                      </button>
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => updateStatus(selectedRequest.RequestID, "Rejected")}
                        disabled={selectedRequest.Status === "Rejected"}
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  <hr className="my-2" />
                  <LabManagerTab selectedRequest={selectedRequest} />
                </>
              ) : (
                <div className="text-muted">Select an assignment to view its details.</div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="p-4">
          <h4>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Panel</h4>
          <p>This tab is under construction. Add your content here.</p>
        </div>
      )}
    </div>
  );
}

export default AppWithSidebar;
