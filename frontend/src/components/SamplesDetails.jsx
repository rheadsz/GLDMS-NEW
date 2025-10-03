// frontend/components/SamplesDetails.jsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * SamplesDetails
 *
 * Props:
 *  - requestId?: number | string   // preferred
 *  - request?: { RequestID?: any } // or pass the whole request object
 *  - sidebarOpen?: boolean         // optional; default true
 *
 * Behavior:
 *  - If requestId (or request.RequestID) is present, it calls:
 *      GET /api/supervisor/request-samples/:requestId
 *  - Otherwise, it calls:
 *      GET /api/supervisor/samples
 */
export default function SamplesDetails({
  requestId,
  request,
  sidebarOpen = true,
}) {
  const SIDEBAR_OPEN_PX = 640;
  const SIDEBAR_CLOSED_PX = 0;

  const effectiveRequestId =
    requestId ??
    (request && (request.RequestID ?? request.RequestId ?? request.requestId)) ??
    null;

  const [rows, setRows] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [lastUrl, setLastUrl] = useState("");

  // Local UI state for the 2nd table
  const [ui, setUi] = useState({
    specimenCount: 1,
    action: "Record Created",
    actionDate: null,
  });

  useEffect(() => {
    setRows([]);
    setActive(null);
    setErr(null);

    let url = "";
    if (effectiveRequestId != null && String(effectiveRequestId).trim() !== "") {
      url = `/api/supervisor/request-samples/${effectiveRequestId}`;
    } else {
      url = `/api/supervisor/samples`;
    }
    setLastUrl(url);

    setLoading(true);
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((items) => {
        const arr = Array.isArray(items) ? items : items.items || [];
        setRows(arr);
        const first = arr[0] || null;
        setActive(first);
        setUi({
          specimenCount: 1,
          action: "Record Created",
          actionDate: null,
        });
      })
      .catch((e) => setErr(e.message || "Failed to load samples"))
      .finally(() => setLoading(false));
  }, [effectiveRequestId]);

  // ---------- helpers ----------
  const statusTextClass = (status) => {
    if (!status) return "text-muted";
    const s = String(status).toLowerCase();
    if (["not received", "rejected"].includes(s)) return "text-danger";
    if (["accepted", "completed", "complete"].includes(s)) return "text-success";
    return "text-primary";
  };

  const fmtDate = (d) => {
    if (!d) return "—";
    try {
      const dt = new Date(d);
      if (Number.isNaN(+dt)) return String(d);
      return dt.toLocaleDateString();
    } catch {
      return String(d);
    }
  };

  const requestNo = useMemo(() => {
    if (!active) return null;
    return active.RequestId ?? active.RequestID ?? active.RequestNo ?? null;
  }, [active]);

  const coordinatesTip = () => {
    const lat =
      active?.Latitude ?? active?.Lat ?? active?.lat ?? active?.Coordinates?.lat;
    const lon =
      active?.Longitude ?? active?.Lon ?? active?.lng ?? active?.Coordinates?.lng;
    return lat != null && lon != null ? `Lat, Lon: ${lat}, ${lon}` : "No coordinates";
  };

  const assignedTip = () =>
    active?.AssignedDate
      ? `Assigned on: ${fmtDate(active.AssignedDate)}`
      : "Not assigned yet";

  const handleChangeCount = (e) =>
    setUi((s) => ({ ...s, specimenCount: Number(e.target.value) || 1 }));

  const handleChangeAction = (e) => {
    const next = e.target.value;
    setUi((s) => ({
      ...s,
      action: next,
      actionDate: new Date().toISOString(),
    }));
  };

  return (
    <div className="lm-main d-flex">
      <style>{`
        .lm-sidebar {
          width: ${sidebarOpen ? `${SIDEBAR_OPEN_PX}px` : `${SIDEBAR_CLOSED_PX}px`};
          transition: width 240ms ease;
          overflow: hidden;
          border-right: 1px solid var(--bs-border-color, #dee2e6);
          background: var(--bs-light);
        }
        .lm-content { flex: 1 1 auto; min-width: 0; }
        .lm-sticky-head { position: sticky; top: 0; z-index: 1; background: #fff; }
        .tbl-samples { table-layout: fixed; }
        .tbl-samples th, .tbl-samples td {
          padding: 10px 12px !important; vertical-align: middle; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mono {
          font-variant-numeric: tabular-nums;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }
        .linklike { color: var(--bs-primary); text-decoration: none; }
        .linklike:hover { text-decoration: underline; }

        .summary-line {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          padding: 10px 12px;
          border: 1px solid var(--bs-border-color, #dee2e6);
          border-bottom: none;
          background: #f8f9fa;
          margin-bottom: 0;
          font-size: 0.95rem;
        }
        .summary-line .label { font-weight: 600; color: #333; margin-right: 6px; }
        .summary-line .value { font-weight: 500; }
        .summary-line .value.status { font-weight: 600; }
        @media (max-width: 1200px) { .summary-line { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 768px)  { .summary-line { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 576px)  { .summary-line { grid-template-columns: 1fr; } }

        .debug-bar { font-size: 12px; color: #6c757d; padding: 4px 8px; }
      `}</style>

      {/* LEFT: Samples list */}
      <aside className="lm-sidebar d-flex flex-column">
        <div className="lm-sticky-head p-3 border-bottom bg-white">
          <h6 className="m-0">Samples</h6>
        </div>

        <div className="flex-grow-1 overflow-auto">
          <table className="table table-sm table-hover table-striped mb-0 align-middle tbl-samples">
            <thead className="table-light sticky-top" style={{ top: 0 }}>
              <tr>
                <th className="text-start">Sample ID</th>
                <th className="text-start">Project ID</th>
                <th className="text-start">Submitter</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-4">Loading…</td></tr>
              ) : err ? (
                <tr><td colSpan={4} className="text-danger text-center py-4">{err}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={4} className="text-muted text-center py-4">No samples.</td></tr>
              ) : (
                rows.map((s) => {
                  const isActive =
                    (active?.SampleID ?? active?.id) === (s.SampleID ?? s.id);
                  return (
                    <tr
                      key={s.SampleID ?? `${s.EfisProjectId}-${s.CreatedBy}`}
                      className={isActive ? "table-primary" : ""}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setActive(s);
                        setUi({
                          specimenCount: 1,
                          action: "Record Created",
                          actionDate: null,
                        });
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActive(s);
                        }
                      }}
                      aria-selected={isActive}
                    >
                      <td className="mono text-start">
                        <span className="linklike">{s.SampleID ?? "—"}</span>
                      </td>
                      <td className="mono text-start">{s.EfisProjectId ?? "—"}</td>
                      <td className="text-start">{s.CreatedBy ?? "—"}</td>
                      <td className={`text-center ${statusTextClass(s.Status)}`}>
                        {s.Status ?? "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="debug-bar">endpoint: <code>{lastUrl}</code></div>
      </aside>

      {/* RIGHT: details */}
      <section className="lm-content">
        <div className="p-3 h-100 overflow-auto">
          {!active ? (
            <div className="text-muted">Select a sample to view its details.</div>
          ) : (
            <>
              {/* Summary header line */}
              <div className="summary-line">
                <div>
                  <span className="label">Sample ID:</span>
                  <span className="value mono">{active.SampleID ?? "—"}</span>
                </div>
                <div>
                  <span className="label">Project ID:</span>
                  <span className="value mono">{active.EfisProjectId ?? "—"}</span>
                </div>
                <div>
                  <span className="label">Request No.:</span>
                  <span className="value mono">{requestNo ?? "—"}</span>
                </div>
                <div>
                  <span className="label">Submitter:</span>
                  <span className="value" style={{ color: "#b30000" }}>
                    {active.CreatedBy ?? "—"}
                  </span>
                </div>
                <div>
                  <span className="label">Status:</span>
                  <span className={`value status ${statusTextClass(active.Status)}`}>
                    {active.Status ?? "—"}
                  </span>
                </div>
              </div>

              {/* TABLE 1: Borehole details (Size column removed) */}
              <div className="table-responsive">
                <table className="table table-bordered table-sm mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Borehole ID</th>
                      <th>Depth From</th>
                      <th>Depth To</th>
                      <th>Type</th>
                      <th>Date sampled in the field</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td title={coordinatesTip()}>
                        {active.BoreholeID ?? active.BoreholeNumber ?? "—"}
                      </td>
                      <td>{active.DepthFrom ?? "—"}</td>
                      <td>{active.DepthTo ?? "—"}</td>
                      <td>{active.Type ?? "—"}</td>
                      <td>{fmtDate(active.DateSampled)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* TABLE 2: Requested tests / assignment */}
              <div className="table-responsive mt-3">
                <table className="table table-bordered table-sm mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Requested Tests</th>
                      <th>Assigned Tester</th>
                      <th>Due Date</th>
                      <th>Number of Specimen</th>
                      <th>Action</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{active.RequestedTests ?? active.TestsRequested ?? "—"}</td>

                      <td title={assignedTip()}>
                        {active.AssignedTester ?? active.Tester ?? "—"}
                      </td>

                      <td title={assignedTip()}>
                        {fmtDate(active.DueDate ?? active.Due ?? null)}
                      </td>

                      <td title="Numbers from 1 to 5">
                        <select
                          className="form-select form-select-sm"
                          value={ui.specimenCount}
                          onChange={handleChangeCount}
                          style={{ maxWidth: 120 }}
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={ui.action}
                          onChange={handleChangeAction}
                          style={{ maxWidth: 170 }}
                        >
                          <option>Record Created</option>
                          <option>Not Received</option>
                          <option>Accepted</option>
                          <option>Rejected</option>
                        </select>
                      </td>

                      <td>
                        {ui.actionDate ? fmtDate(ui.actionDate) : "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
