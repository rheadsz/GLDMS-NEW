import React, { useEffect, useMemo, useState } from "react";

export default function CheckInSamples({ requestId, sidebarOpen = true }) {
  const SIDEBAR_OPEN_PX = 640;
  const SIDEBAR_CLOSED_PX = 0;

  const [rows, setRows] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [actionSavingId, setActionSavingId] = useState(null);
  const [actionMsg, setActionMsg] = useState("");
  const [actionEditable, setActionEditable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    setRows([]);

    async function load() {
      try {
        const r = await fetch("/api/checkin/samples");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const items = await r.json();
        if (cancelled) return;

        const all = Array.isArray(items) ? items : [];
        const filtered = requestId
          ? all.filter(
              (row) =>
                String(row.RequestID ?? row.RequestId) === String(requestId)
            )
          : all;
        setRows(filtered);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load samples");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [requestId, refreshTick]);

  const groupedByRequest = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const key = r.RequestID ?? r.RequestId;
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
    return map;
  }, [rows]);

  const requestSummaries = useMemo(() => {
    const arr = [];
    for (const [requestKey, list] of groupedByRequest) {
      if (!list || list.length === 0) continue;
      const first = list[0];
      arr.push({
        ...first,
        RequestID: first.RequestID ?? first.RequestId ?? requestKey,
      });
    }
    return arr.sort((a, b) => (b.RequestID ?? 0) - (a.RequestID ?? 0));
  }, [groupedByRequest]);

  useEffect(() => {
    if (!active && requestSummaries.length > 0) {
      setActive(requestSummaries[0]);
    }
  }, [requestSummaries, active]);

  const fmtDate = (d) => {
    if (!d) return "—";
    if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    try {
      const dt = new Date(d);
      if (Number.isNaN(+dt)) return String(d);
      return dt.toLocaleDateString();
    } catch {
      return String(d);
    }
  };

  const normalizeAction = (label) => {
    if (!label) return null;
    const s = String(label).toLowerCase();
    if (s.includes("checked")) return "Checked in";
    if (s.includes("reject")) return "Rejected";
    if (s.includes("not")) return "Not Received";
    return label;
  };

  const updateSampleAction = async (sampleId, label) => {
    const action = normalizeAction(label);
    if (!action) return;
    setActionSavingId(sampleId);
    setActionMsg("");
    try {
      const r = await fetch("/api/checkin/sample-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ SampleID: sampleId, Action: action }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

      setRows((prev) =>
        prev.map((row) =>
          row.SampleID === sampleId
            ? { ...row, ActionStatus: data.actionStatus ?? action }
            : row
        )
      );

      if (active && active.SampleID === sampleId) {
        setActive((prev) =>
          prev ? { ...prev, ActionStatus: data.actionStatus ?? action } : prev
        );
      }

      setActionMsg(`Sample ${sampleId} set to ${action}.`);
    } catch (e) {
      setActionMsg(e.message || "Update failed.");
    } finally {
      setActionSavingId(null);
    }
  };

  // All samples for the currently active request (right-hand table)
  const samplesForActiveRequest = useMemo(() => {
    if (!active) return [];
    const reqId = active.RequestID ?? active.RequestId;
    if (!reqId) return [];
    return rows.filter(
      (r) => String(r.RequestID ?? r.RequestId) === String(reqId)
    );
  }, [rows, active]);

  // Group samples for the selected request by BoreholeID for collapsible sections
  const groupedByBorehole = useMemo(() => {
    const map = new Map();
    for (const s of samplesForActiveRequest) {
      const key = s.BoreholeID ?? "(no borehole)";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    return map;
  }, [samplesForActiveRequest]);

  const [openBoreholes, setOpenBoreholes] = useState({});

  const toggleBorehole = (key) => {
    setOpenBoreholes((prev) => ({
      ...prev,
      [key]: !(prev && Object.prototype.hasOwnProperty.call(prev, key)
        ? prev[key]
        : true),
    }));
  };

  const handleSelectRequest = (reqRow) => {
    setActive(reqRow);
    setActionEditable(false);
  };

  return (
    <div className="lm-main d-flex">
      <style>{`
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
        .tbl-requests { table-layout: fixed; }
        .tbl-requests th, .tbl-requests td {
          padding: 10px 12px !important; vertical-align: middle; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mono { font-variant-numeric: tabular-nums; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace; }
        .linklike { color: var(--bs-primary); text-decoration: none; }
        .linklike:hover { text-decoration: underline; }
      `}</style>

      {/* LEFT: Requests list */}
      <aside className="lm-sidebar d-flex flex-column">
        <div className="lm-sticky-head p-3 border-bottom bg-white">
          <h6 className="m-0">Check-In: Requests</h6>
        </div>

        <div className="flex-grow-1 overflow-auto">
          <table className="table table-sm table-hover table-striped mb-0 align-middle tbl-requests">
            <colgroup>
              <col style={{ width: "28%" }} />
              <col style={{ width: "36%" }} />
              <col style={{ width: "36%" }} />
            </colgroup>
            <thead className="table-light sticky-top" style={{ top: 0 }}>
              <tr>
                <th className="text-start">Request No.</th>
                <th className="text-start">Project ID</th>
                <th className="text-start">Submitter</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center py-4">
                    Loading…
                  </td>
                </tr>
              ) : err ? (
                <tr>
                  <td colSpan={3} className="text-danger text-center py-4">
                    {err}
                  </td>
                </tr>
              ) : requestSummaries.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-muted text-center py-4">
                    No requests.
                  </td>
                </tr>
              ) : (
                requestSummaries.map((r) => {
                  const isActive =
                    (active?.RequestID ?? active?.id) === (r.RequestID ?? r.id);
                  return (
                    <tr
                      key={r.RequestID ?? `${r.EfisProjectID}-${r.CreatedBy}`}
                      className={isActive ? "table-primary" : ""}
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSelectRequest(r)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelectRequest(r);
                        }
                      }}
                      aria-selected={isActive}
                    >
                      <td className="mono text-start">
                        <span className="linklike">{r.RequestID ?? "—"}</span>
                      </td>
                      <td className="mono text-start">
                        {r.EfisProjectID ?? "—"}
                      </td>
                      <td className="text-start">{r.CreatedBy ?? "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="debug-bar p-2 small border-top">
          endpoint: <code>/api/checkin/samples</code>
          {requestId ? (
            <>
              {" "}
              | filter: <code>RequestID={String(requestId)}</code>
            </>
          ) : null}
          {actionMsg ? (
            <>
              {" "}
              | <span className="text-muted">{actionMsg}</span>
            </>
          ) : null}
        </div>
      </aside>

      {/* RIGHT: details with list of samples for the selected request */}
      <section className="lm-content">
        <div className="p-3 h-100 overflow-auto">
          {!active ? (
            <div className="text-muted">Select a request to view details.</div>
          ) : (
            <>
              <div className="d-flex align-items-center gap-2 mb-2">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setRefreshTick((n) => n + 1)}
                  disabled={loading}
                  title="Refetch latest data"
                >
                  Refresh
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-sm mb-0">
                  <tbody>
                    {samplesForActiveRequest.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted">
                          No samples for this request.
                        </td>
                      </tr>
                    ) : (
                      Array.from(groupedByBorehole.entries()).map(
                        ([boreholeId, list]) => {
                          const key = String(boreholeId);
                          const isOpen =
                            openBoreholes &&
                            Object.prototype.hasOwnProperty.call(
                              openBoreholes,
                              key
                            )
                              ? openBoreholes[key]
                              : true;

                          return (
                            <React.Fragment key={key}>
                              {/* Borehole header row */}
                              <tr className="table-secondary">
                                <td colSpan={7} style={{ cursor: "pointer" }}>
                                  <span
                                    onClick={() => toggleBorehole(key)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        toggleBorehole(key);
                                      }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    aria-expanded={isOpen}
                                  >
                                    <span style={{ marginRight: 8 }}>
                                      {isOpen ? "▾" : "▸"}
                                    </span>
                                    <strong>Borehole ID:</strong>{" "}
                                    {boreholeId ?? "—"}
                                  </span>
                                </td>
                              </tr>
                              {/* Column labels row (per borehole group) */}
                              {isOpen && (
                                <tr className="table-light">
                                  <th>Sample No.</th>
                                  <th>Depth From</th>
                                  <th>Depth To</th>
                                  <th>Container Type</th>
                                  <th>Field Collection Date</th>
                                  <th>Action</th>
                                  <th>Status</th>
                                </tr>
                              )}
                              {/* Sample rows for this borehole */}
                              {isOpen &&
                                list.map((s) => (
                                  <tr key={s.SampleID}>
                                    <td>
                                      {s.SampleNumber ?? s.SampleID ?? "—"}
                                    </td>
                                    <td>{s.DepthFrom ?? "—"}</td>
                                    <td>{s.DepthTo ?? "—"}</td>
                                    <td>{s.ContainerType ?? "—"}</td>
                                    <td>{fmtDate(s.FieldCollectionDate)}</td>
                                    <td>
                                      <select
                                        className="form-select form-select-sm"
                                        value={s.ActionStatus ?? ""}
                                        disabled={actionSavingId === s.SampleID}
                                        onChange={(e) => {
                                          const label = e.target.value;
                                          updateSampleAction(s.SampleID, label);
                                        }}
                                      >
                                        <option value="">— Select —</option>
                                        <option value="Checked in">
                                          Checked in
                                        </option>
                                        <option value="Rejected">
                                          Rejected
                                        </option>
                                        <option value="Not Received">
                                          Not Received
                                        </option>
                                      </select>
                                    </td>
                                    <td>
                                      {s.ActionStatus &&
                                      String(s.ActionStatus).trim() !== ""
                                        ? s.ActionStatus
                                        : "Shipped"}
                                    </td>
                                  </tr>
                                ))}
                            </React.Fragment>
                          );
                        }
                      )
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
