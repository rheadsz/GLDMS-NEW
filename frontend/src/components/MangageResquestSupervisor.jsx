// src/components/AppWithSidebar.jsx
import React, { useEffect, useMemo, useState } from "react";
import AssignmentDetails from "./AssignmentDetails";
import SamplesDetails from "./SamplesDetails";
import TestManagement from "./TestManagement";
import CheckInSamples from "./CheckInSamples";

// API endpoints
const REQUESTS_API = "http://localhost:3001/api/supervisor/requests";
const UPDATE_STATUS_API = "http://localhost:3001/api/supervisor/update-status"; // + /:id
const SAMPLES_API = "http://localhost:3001/api/supervisor/samples";
// NEW: base for summaries used to detect unassigned tests per request (left panel pre-check)
const ASSIGNMENTS_API_BASE = "http://localhost:3001/api/assignments"; // will call `${BASE}/${id}/summary`

function AppWithSidebar() {
  // Tabs
  const TAB_CONFIG = [
    { key: "checkins", label: "Check in Samples" },
    { key: "samples", label: "Check in Requests" },
    { key: "assignments", label: "Assign Tests" },
    { key: "tests", label: "Test Management" }, // renamed
    { key: "staff", label: "Lab Management" }, // renamed
  ];

  const ACTIVE_TAB_STORAGE_KEY = "gldms_manage_requests_active_tab";
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const raw = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
      const key = raw == null ? "samples" : String(raw);
      const ok = TAB_CONFIG.some((t) => t.key === key);
      return ok ? key : "samples";
    } catch {
      return "samples";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, String(activeTab));
    } catch {
      // ignore storage errors
    }
  }, [activeTab]);

  // GLOBAL hamburger for all tabs
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen((s) => !s);
  const SIDEBAR_OPEN_PX = 640;
  const SIDEBAR_CLOSED_PX = 0;

  // ===== Assignments state =====
  const SELECTED_REQUEST_STORAGE_KEY = "gldms_assign_tests_selected_request";
  const [requests, setRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reqStatusFilter, setReqStatusFilter] = useState("All");
  const [reqSortOrder, setReqSortOrder] = useState("Newest");

  // Restore selected request from localStorage when requests load
  useEffect(() => {
    if (requests.length === 0) return;
    try {
      const savedId = localStorage.getItem(SELECTED_REQUEST_STORAGE_KEY);
      if (savedId != null) {
        const id = Number(savedId);
        const found = requests.find((r) => r.RequestID === id);
        if (found && !selectedRequest) {
          setSelectedRequest(found);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, [requests]);

  // Save selected request to localStorage when it changes
  useEffect(() => {
    try {
      if (selectedRequest?.RequestID != null) {
        localStorage.setItem(
          SELECTED_REQUEST_STORAGE_KEY,
          String(selectedRequest.RequestID),
        );
      }
    } catch {
      // ignore storage errors
    }
  }, [selectedRequest?.RequestID]);

  // NEW: left-panel highlight state (requestId -> boolean)
  const [needsAttention, setNeedsAttention] = useState({});
  const [needsAttentionLoading, setNeedsAttentionLoading] = useState(false);

  // ===== Samples state =====
  const [samples, setSamples] = useState([]);
  const [samplesLoading, setSamplesLoading] = useState(false);
  const [selectedSample, setSelectedSample] = useState(null);

  // ---------- Initial fetch (ALWAYS) ----------
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

  // ---------- Proactively compute which requests have unassigned tests ----------
  // Helper to ask the backend for a request's summary and decide if any items are unassigned
  async function fetchHasUnassigned(requestId) {
    try {
      const res = await fetch(`${ASSIGNMENTS_API_BASE}/${requestId}/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      // treat "unassigned" as !AssignedTester
      return items.some((it) => !it?.AssignedTester);
    } catch (e) {
      console.error(`Summary check failed for ${requestId}:`, e);
      // On failure, don't block UI—assume no highlight
      return false;
    }
  }

  // Fetch attention map whenever the assignments tab loads/refreshes or the list changes
  useEffect(() => {
    let cancelled = false;
    async function refreshAttention(list) {
      if (!Array.isArray(list) || list.length === 0) {
        if (!cancelled) setNeedsAttention({});
        return;
      }
      setNeedsAttentionLoading(true);

      // OPTIONAL: simple concurrency control to avoid hammering the API
      const CONCURRENCY = 5;
      let idx = 0;
      const resultMap = {};
      async function worker() {
        while (idx < list.length && !cancelled) {
          const myIndex = idx++;
          const req = list[myIndex];
          const hasUnassigned = await fetchHasUnassigned(req.RequestID);
          resultMap[req.RequestID] = hasUnassigned;
        }
      }
      const workers = Array.from(
        { length: Math.min(CONCURRENCY, list.length) },
        () => worker(),
      );
      await Promise.all(workers);

      if (!cancelled) {
        setNeedsAttention(resultMap);
        setNeedsAttentionLoading(false);
      }
    }

    if (activeTab === "assignments") {
      refreshAttention(requests);
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, requests]);

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
            req.RequestID === id ? { ...req, Status: newStatus } : req,
          ),
        );
        setSelectedRequest((prev) =>
          prev && prev.RequestID === id ? { ...prev, Status: newStatus } : prev,
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

  // Filter + sort
  const filteredRequests = useMemo(() => {
    if (activeTab !== "assignments") return [];
    const list = (requests || []).filter((req) => {
      if (reqStatusFilter !== "All" && req.Status !== reqStatusFilter)
        return false;
      return true;
    });
    list.sort((a, b) => {
      const aId = Number(a.RequestID) || 0;
      const bId = Number(b.RequestID) || 0;
      return reqSortOrder === "Newest" ? bId - aId : aId - bId;
    });
    return list;
  }, [activeTab, requests, reqStatusFilter, reqSortOrder]);

  const activeLabel =
    TAB_CONFIG.find((t) => t.key === activeTab)?.label ?? "Panel";

  // Keep map in sync when right panel changes a single request
  const handleAttentionChange = (requestId, hasUnassigned) => {
    setNeedsAttention((prev) => {
      if (prev[requestId] === hasUnassigned) return prev;
      return { ...prev, [requestId]: hasUnassigned };
    });
  };

  return (
    <div className="d-flex flex-column" style={{ height: "100vh" }}>
      {/* Local styles */}
      <style>{`
        .lm-topbar { background: var(--bs-light); border-bottom: 1px solid var(--bs-border-color, #dee2e6); }
        .lm-main { display: flex; min-height: 0; flex: 1 1 auto; }
        .lm-sidebar {
          width: ${
            sidebarOpen ? `${SIDEBAR_OPEN_PX}px` : `${SIDEBAR_CLOSED_PX}px`
          };
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
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;
        }
        .linklike { color: var(--bs-primary); text-decoration: none; }
        .linklike:hover { text-decoration: underline; }
        @media (max-width: 768px) {
          .lm-sidebar { position: absolute; z-index: 1040; height: calc(100% - 52px); }
          .lm-content { flex-basis: 100%; }
        }

        /* Left-row attention styling */
        .needs-attention-row { border-left: 4px solid #dc3545; }
        .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; background: #dc3545; }
      `}</style>

      {/* Top Bar */}
      <div className="lm-topbar px-3 py-2 d-flex align-items-center gap-2">
        <button
          type="button"
          className="lm-hamburger"
          aria-label={sidebarOpen ? "Collapse left panel" : "Expand left panel"}
          aria-pressed={sidebarOpen}
          onClick={toggleSidebar}
          title={sidebarOpen ? "Hide left panel" : "Show left panel"}
        >
          <span
            className="d-inline-block"
            style={{ lineHeight: 0, fontSize: 20 }}
          >
            ☰
          </span>
        </button>

        <div className="d-flex gap-2 flex-wrap">
          {TAB_CONFIG.map(({ key, label }) => (
            <button
              key={key}
              className={`btn ${
                activeTab === key ? "btn-primary" : "btn-outline-primary"
              }`}
              style={{
                padding: "10px 18px",
                fontSize: "16px",
                fontWeight: "500",
              }}
              onClick={() => setActiveTab(key)}
            >
              {label}
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
              {(reqLoading || needsAttentionLoading) && (
                <span
                  className="spinner-border spinner-border-sm"
                  title="Loading"
                />
              )}
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
                    {/* Map new labels to existing backend status values */}
                    <option value="Submitted">Requested</option>
                    <option value="Assigned">Checked in</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Complete</option>
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

            {/* Table (Status column removed) */}
            <div className="flex-grow-1 overflow-auto">
              <table className="table table-sm table-hover table-striped mb-0 align-middle tbl-assignments">
                <colgroup>
                  <col style={{ width: "26%" }} />
                  <col style={{ width: "37%" }} />
                  <col style={{ width: "37%" }} />
                </colgroup>
                <thead className="table-light sticky-top" style={{ top: 0 }}>
                  <tr>
                    <th className="text-center">Request No.</th>
                    <th className="text-start">Project ID</th>
                    <th className="text-start">Requester</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-muted text-center py-4">
                        {reqLoading ? "Loading..." : "No assignments found."}
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => {
                      const isActive =
                        selectedRequest?.RequestID === req.RequestID;
                      const needs = !!needsAttention[req.RequestID];
                      return (
                        <tr
                          key={req.RequestID}
                          className={`${isActive ? "table-primary" : ""} ${
                            needs ? "needs-attention-row" : ""
                          }`}
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
                          title={
                            needs
                              ? "This request has unassigned tests"
                              : undefined
                          }
                        >
                          <td className="mono text-center">
                            <span className="linklike">{req.RequestID}</span>
                            {needs && (
                              <span className="ms-2 align-middle dot" />
                            )}
                          </td>
                          <td className="mono text-start">
                            <span className="linklike">
                              {req.EfisProjectId ?? "—"}
                            </span>
                          </td>
                          <td className="text-start">
                            <span className="linklike">
                              {req.CreatedBy ?? "—"}
                            </span>
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
              <AssignmentDetails
                request={selectedRequest}
                onUpdateStatus={() => {}}
                // Right panel still reports changes live for the selected request
                onRequestAttentionChange={handleAttentionChange}
              />
            </div>
          </section>
        </div>
      ) : activeTab === "checkins" ? (
        // Check in Samples: exact replica of Check in Requests behavior
        <CheckInSamples
          samples={samples}
          selectedSample={selectedSample}
          onSelectSample={setSelectedSample}
          sidebarOpen={sidebarOpen}
        />
      ) : activeTab === "samples" ? (
        // Samples layout handled inside SamplesDetails
        <SamplesDetails
          samples={samples}
          selectedSample={selectedSample}
          onSelectSample={setSelectedSample}
          sidebarOpen={sidebarOpen}
        />
      ) : activeTab === "tests" ? (
        <section className="lm-content">
          <div className="p-4 h-100 overflow-auto">
            <TestManagement
              onJumpToSample={(sampleId) => {
                const s = (samples || []).find((x) => x.SampleID === sampleId);
                if (s) setSelectedSample(s);
                setActiveTab("samples");
              }}
            />
          </div>
        </section>
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
