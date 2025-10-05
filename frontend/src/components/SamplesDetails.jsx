// frontend/components/SamplesDetails.jsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * SamplesDetails
 *
 * Props:
 *  - requestId?: number | string  // optional: filters rows by RequestID (client side)
 *  - sidebarOpen?: boolean        // optional; default true
 *
 * Endpoint used:
 *   GET /api/supervisor/request-samples
 *   Returns one row per (sample x test). We group by SampleID for the left list,
 *   and show all tests for the selected sample on the right.
 */
export default function SamplesDetails({ requestId, sidebarOpen = true }) {
  const SIDEBAR_OPEN_PX = 640;
  const SIDEBAR_CLOSED_PX = 0;

  const [rows, setRows] = useState([]);
  const [active, setActive] = useState(null); // the selected sample (summary)
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // local UI state for the action controls
  const [ui, setUi] = useState({
    specimenCount: 1,
    action: "Record Created",
    actionDate: null,
  });

  useEffect(() => {
    setLoading(true);
    setErr(null);
    setRows([]);
    setActive(null);

    fetch("/api/supervisor/request-samples")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((items) => {
        const all = Array.isArray(items) ? items : [];
        // Optional filter by RequestID (client-side)
        const filtered = requestId
          ? all.filter((r) => String(r.RequestID) === String(requestId))
          : all;
        setRows(filtered);
        setUi({ specimenCount: 1, action: "Record Created", actionDate: null });
      })
      .catch((e) => setErr(e.message || "Failed to load samples"))
      .finally(() => setLoading(false));
  }, [requestId]);

  // Group rows by SampleID (because backend returns one row per test)
  const groupedBySample = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const key = r.SampleID;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
    return map;
  }, [rows]);

  // Unique samples list for the left table (take the first row per SampleID)
  const sampleSummaries = useMemo(() => {
    const arr = [];
    for (const [, list] of groupedBySample) {
      arr.push(list[0]); // first row holds the sample summary fields
    }
    // Keep the original order (desc by SampleID due to backend ORDER BY)
    return arr.sort((a, b) => (b.SampleID ?? 0) - (a.SampleID ?? 0));
  }, [groupedBySample]);

  // Select the first sample by default after data load
  useEffect(() => {
    if (!active && sampleSummaries.length > 0) {
      setActive(sampleSummaries[0]);
    }
  }, [sampleSummaries, active]);

  // Tests for the active sample
  const activeTests = useMemo(() => {
    if (!active) return [];
    return groupedBySample.get(active.SampleID) || [];
  }, [active, groupedBySample]);

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
              ) : sampleSummaries.length === 0 ? (
                <tr><td colSpan={4} className="text-muted text-center py-4">No samples.</td></tr>
              ) : (
                sampleSummaries.map((s) => {
                  const isActive = (active?.SampleID ?? active?.id) === (s.SampleID ?? s.id);
                  return (
                    <tr
                      key={s.SampleID ?? `${s.EfisProjectID}-${s.CreatedBy}`}
                      className={isActive ? "table-primary" : ""}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setActive(s);
                        setUi({ specimenCount: 1, action: "Record Created", actionDate: null });
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
                      <td className="mono text-start">{s.EfisProjectID ?? "—"}</td>
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

        <div className="debug-bar">
          endpoint: <code>/api/supervisor/request-samples</code>
          {requestId ? <> | filter: <code>RequestID={String(requestId)}</code></> : null}
        </div>
      </aside>

      {/* RIGHT: details */}
      <section className="lm-content">
        <div className="p-3 h-100 overflow-auto">
          {!active ? (
            <div className="text-muted">Select a sample to view its details.</div>
          ) : (
            <>
              {/* Summary header */}
              <div className="summary-line">
                <div>
                  <span className="label">Sample ID:</span>
                  <span className="value mono">{active.SampleID ?? "—"}</span>
                </div>
                <div>
                  <span className="label">Project ID:</span>
                  <span className="value mono">{active.EfisProjectID ?? "—"}</span>
                </div>
                <div>
                  <span className="label">Request No.:</span>
                  <span className="value mono">{active.RequestID ?? "—"}</span>
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

              {/* TABLE 1: Borehole / field collection details */}
              <div className="table-responsive">
                <table className="table table-bordered table-sm mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Borehole ID</th>
                      <th>Depth From</th>
                      <th>Depth To</th>
                      <th>Container Type</th>
                      <th>Field Collection Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{active.BoreholeID ?? "—"}</td>
                      <td>{active.DepthFrom ?? "—"}</td>
                      <td>{active.DepthTo ?? "—"}</td>
                      <td>{active.ContainerType ?? "—"}</td>
                      <td>{fmtDate(active.FieldCollectionDate)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* TABLE 2: Requested tests / assignment (all tests for the sample) */}
              <div className="table-responsive mt-3">
                <table className="table table-bordered table-sm mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Requested Test</th>
                      <th>Assigned Tester</th>
                      <th>Due Date</th>
                      <th>Number of Specimen</th>
                      <th>Action</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted">No tests for this sample.</td>
                      </tr>
                    ) : (
                      activeTests.map((t, idx) => (
                        <tr key={`${active.SampleID}-${idx}`}>
                          <td>{t.TestName ?? "—"}</td>
                          <td>{t.AssignedTester ?? "—"}</td>
                          <td>{fmtDate(t.ResultDueDate)}</td>
                          <td style={{ maxWidth: 120 }}>
                            <select
                              className="form-select form-select-sm"
                              value={ui.specimenCount}
                              onChange={(e) =>
                                setUi((s) => ({ ...s, specimenCount: Number(e.target.value) || 1 }))
                              }
                            >
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ maxWidth: 170 }}>
                            <select
                              className="form-select form-select-sm"
                              value={ui.action}
                              onChange={(e) =>
                                setUi((s) => ({ ...s, action: e.target.value, actionDate: new Date().toISOString() }))
                              }
                            >
                              <option>Record Created</option>
                              <option>Not Received</option>
                              <option>Accepted</option>
                              <option>Rejected</option>
                            </select>
                          </td>
                          <td>{ui.actionDate ? fmtDate(ui.actionDate) : "—"}</td>
                        </tr>
                      ))
                    )}
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
