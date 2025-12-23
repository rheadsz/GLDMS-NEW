// frontend/components/SamplesDetails.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

export default function SamplesDetails({ requestId, sidebarOpen = true }) {
  const SIDEBAR_OPEN_PX = 640;
  const SIDEBAR_CLOSED_PX = 0;

  const [rows, setRows] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [saveMsg, setSaveMsg] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  // uiByTest[k] = { specimenCount, action, actionDate }
  const [uiByTest, setUiByTest] = useState({});
  // Per-test editability (checkbox-driven). Default is editable (true) until a status
  // is selected, then it becomes locked (false) until user checks the box again.
  const [editableTests, setEditableTests] = useState({});
  const [rejectModal, setRejectModal] = useState({
    open: false,
    key: null,
    prevAction: null,
    qty: false,
    quality: false,
    comment: "",
  });

  // Collapsible details per sample on the right side (allow multiple open)
  const [openSamples, setOpenSamples] = useState({});

  // Track focused editable controls to avoid mid-change autosaves
  const focusCountRef = useRef(0);
  const [hasFocusedEditor, setHasFocusedEditor] = useState(false);
  const debounceRef = useRef(null);

  // Keep a snapshot to support "Cancel"
  const originalUiSnapshotRef = useRef({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    setRows([]);
    setActive(null);
    setUiByTest({});
    setSaveMsg("");
    focusCountRef.current = 0;
    setHasFocusedEditor(false);

    async function load() {
      try {
        const r = await fetch("/api/supervisor/request-samples");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const items = await r.json();
        if (cancelled) return;
        const all = Array.isArray(items) ? items : [];
        const filtered = requestId
          ? all.filter((row) => String(row.RequestID) === String(requestId))
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

  const groupedBySample = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const key = r.SampleID;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
    return map;
  }, [rows]);

  const sampleSummaries = useMemo(() => {
    const arr = [];
    for (const [, list] of groupedBySample) arr.push(list[0]);
    return arr.sort((a, b) => (b.SampleID ?? 0) - (a.SampleID ?? 0));
  }, [groupedBySample]);

  // Unique requests for the left sidebar (one row per RequestID)
  const requestSummaries = useMemo(() => {
    const byReq = new Map();
    for (const s of sampleSummaries) {
      const key = s.RequestID ?? s.RequestId;
      if (!key) continue;
      if (!byReq.has(key)) byReq.set(key, s); // first sample represents the request
    }
    return Array.from(byReq.values()).sort(
      (a, b) =>
        (b.RequestID ?? b.RequestId ?? 0) - (a.RequestID ?? a.RequestId ?? 0)
    );
  }, [sampleSummaries]);

  // All samples that belong to the same request as the active sample
  const samplesForActiveRequest = useMemo(() => {
    if (!active) return [];
    const reqId = active.RequestID ?? active.RequestId;
    if (!reqId) return [];
    return sampleSummaries.filter(
      (s) => String(s.RequestID ?? s.RequestId) === String(reqId)
    );
  }, [sampleSummaries, active]);

  useEffect(() => {
    if (!active && sampleSummaries.length > 0) {
      setActive(sampleSummaries[0]);
    }
  }, [sampleSummaries, active]);

  // Stable key
  const rowKey = (t, idx, sampleId) =>
    t.TestID ??
    t.TestRequestID ??
    `${sampleId ?? "sample"}-${t.TestName ?? "test"}-${idx}`;

  // Seed UI from DB values (not a user edit)
  useEffect(() => {
    originalUiSnapshotRef.current = {};
    // reset focus tracking when data changes
    focusCountRef.current = 0;
    setHasFocusedEditor(false);
  }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps

  const statusTextClass = (status) => {
    if (!status) return "text-muted";
    const s = String(status).toLowerCase();
    if (["not received", "rejected"].includes(s)) return "text-danger";
    if (["accepted"].includes(s)) return "text-success";
    if (["record created"].includes(s)) return "text-primary";
    return "text-primary";
  };

  // Safe date formatter:
  // - If already "YYYY-MM-DD", show as-is (avoids TZ shifts)
  // - Else try to format with Date.
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

  // Reject modal helpers (top-level)
  const openRejectModal = (key, prevAction, test) => {
    setRejectModal({
      open: true,
      key,
      prevAction: prevAction || null,
      test: test || null,
      qty: false,
      quality: false,
      comment: "",
    });
  };
  const closeRejectModal = () => {
    setRejectModal({
      open: false,
      key: null,
      prevAction: null,
      test: null,
      qty: false,
      quality: false,
      comment: "",
    });
  };
  const confirmRejectModal = () => {
    if (!rejectModal.key) return closeRejectModal();
    const reasons = [];
    if (rejectModal.qty) reasons.push("Insufficient Quantity");
    if (rejectModal.quality) reasons.push("Insufficient Quality");
    const comment = String(rejectModal.comment || "").trim();
    if (comment) reasons.push(`Comment: ${comment}`);
    if (reasons.length === 0) return; // require at least one

    // Persist immediately (no edit mode)
    const key = rejectModal.key;
    const test = rejectModal.test;
    setUiByTest((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        action: "Rejected",
        actionDate: new Date().toLocaleDateString("en-CA"),
        rejectReasons: reasons,
      },
    }));
    closeRejectModal();
    void updateSingleTest(key, test, "Rejected");
  };

  // Helpers to track focus/blur for each editable control
  const handleFocus = () => {
    focusCountRef.current += 1;
    setHasFocusedEditor(focusCountRef.current > 0);
    // cancel any pending autosave while focused
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };
  const handleBlur = () => {
    focusCountRef.current = Math.max(0, focusCountRef.current - 1);
    setHasFocusedEditor(focusCountRef.current > 0);
    // no immediate save here — effect will run and debounce after blur
  };

  // Selection/bulk helpers removed (no bulk actions in dropdown-only mode).

  // Inline update (no edit mode): update a single test row immediately
  const updateSingleTest = async (rowKeyStr, test, nextStatus) => {
    if (!test?.TestID) return;

    const today = new Date().toLocaleDateString("en-CA");
    const prevUi = uiByTest[rowKeyStr] || {};

    const updates = [
      {
        TestID: test.TestID,
        TestStatus: nextStatus ?? null,
        NumberOfSpecimen:
          typeof prevUi.specimenCount === "number"
            ? prevUi.specimenCount
            : null,
        DateAssigned: today,
      },
    ];

    setSaving(true);
    setErr(null);
    setSaveMsg("");
    try {
      const r = await fetch("/api/supervisor/request-samples/update-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

      setUiByTest((prev) => ({
        ...prev,
        [rowKeyStr]: {
          ...(prev[rowKeyStr] || {}),
          action: nextStatus,
          actionDate: today,
        },
      }));

      // After a successful update, lock this row again (non-editable)
      setEditableTests((prev) => ({
        ...prev,
        [rowKeyStr]: false,
      }));

      setSaveMsg(`Saved${data.count ? ` (${data.count})` : ""}.`);
    } catch (e) {
      setErr(e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
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
        .tbl-samples { table-layout: fixed; }
        .tbl-samples th, .tbl-samples td {
          padding: 10px 12px !important; vertical-align: middle; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mono {
          font-variant-numeric: tabular-nums;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;
        }
        .linklike { color: var(--bs-primary); text-decoration: none; }
        .linklike:hover { text-decoration: underline; }

        .summary-line {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
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

        /* Tighter tests table */
        .tbl-tests { table-layout: fixed; }
        .tbl-tests th, .tbl-tests td { padding: 6px 8px !important; }

        .cmp-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .cmp-modal {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
          width: 100%;
          max-width: 520px;
          max-height: calc(100vh - 32px);
          overflow: auto;
          border: 1px solid rgba(0, 0, 0, 0.12);
        }
        .cmp-modal .header {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }
        .cmp-modal .body {
          padding: 12px 16px;
        }
        .cmp-modal .footer {
          padding: 12px 16px;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
        }
      `}</style>

      {/* LEFT: Samples list */}
      <aside className="lm-sidebar d-flex flex-column">
        <div className="lm-sticky-head p-3 border-bottom bg-white">
          <h6 className="m-0">Samples</h6>
        </div>

        <div className="flex-grow-1 overflow-auto">
          <table className="table table-sm table-hover table-striped mb-0 align-middle tbl-samples">
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
                    String(active?.RequestID ?? active?.RequestId) ===
                    String(r.RequestID ?? r.RequestId);
                  return (
                    <tr
                      key={r.RequestID ?? `${r.EfisProjectID}-${r.CreatedBy}`}
                      className={isActive ? "table-primary" : ""}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setActive(r);
                        setUiByTest({});
                        setSaveMsg("");
                        focusCountRef.current = 0;
                        setHasFocusedEditor(false);
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActive(r);
                          setUiByTest({});
                          setSaveMsg("");
                          focusCountRef.current = 0;
                          setHasFocusedEditor(false);
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

        <div className="debug-bar">
          endpoint: <code>/api/supervisor/request-samples</code>
          {requestId ? (
            <>
              {" "}
              | filter: <code>RequestID={String(requestId)}</code>
            </>
          ) : null}
        </div>
      </aside>

      {/* RIGHT: details */}
      <section className="lm-content">
        <div className="p-3 h-100 overflow-auto">
          {!active ? (
            <div className="text-muted">
              Select a sample to view its details.
            </div>
          ) : samplesForActiveRequest.length === 0 ? (
            <div className="text-muted">No samples for this request.</div>
          ) : (
            samplesForActiveRequest.map((s) => {
              const sampleId = s.SampleID ?? s.id;
              const isOpen = openSamples[sampleId] ?? false;
              const headerSampleNumber = s.SampleNumber ?? s.SampleID ?? "—";
              const headerDepthFrom = s.DepthFrom ?? "—";
              const headerDepthTo = s.DepthTo ?? "—";
              const headerContainer = s.ContainerType ?? "—";
              const sampleTests = groupedBySample.get(sampleId) || [];

              return (
                <div
                  key={s.SampleID ?? `${s.EfisProjectID}-${s.CreatedBy}`}
                  className="mb-3"
                >
                  {/* Collapsible header for this sample */}
                  <div
                    className="d-flex align-items-center justify-content-between border rounded px-3 py-2 bg-light"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setOpenSamples((prev) => ({
                        ...prev,
                        [sampleId]: !(prev[sampleId] ?? false),
                      }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOpenSamples((prev) => ({
                          ...prev,
                          [sampleId]: !(prev[sampleId] ?? false),
                        }));
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isOpen}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ fontSize: 18 }}>{isOpen ? "▾" : "▸"}</span>
                      <div>
                        <div className="fw-semibold">
                          {`Sample ${headerSampleNumber} (${headerDepthFrom}-${headerDepthTo}) : ${headerContainer}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Only render details for the active + expanded sample */}
                  {isOpen && (
                    <>
                      <div className="d-flex align-items-center mt-3">
                        <span className="ms-auto small text-muted">
                          {saving
                            ? "Saving…"
                            : saveMsg
                            ? saveMsg
                            : loading
                            ? "Loading…"
                            : ""}
                        </span>
                        {err && (
                          <span className="text-danger small ms-2">{err}</span>
                        )}
                      </div>

                      {/* TABLE: Requested tests / check-in status */}
                      <div className="table-responsive mt-3">
                        <table className="table table-bordered table-sm mb-0">
                          <thead className="table-light">
                            <tr>
                              <th
                                style={{
                                  width: "2.25rem",
                                  textAlign: "center",
                                }}
                              ></th>
                              <th>Requested Test</th>
                              <th style={{ width: "6rem" }}>
                                Number of Specimen
                              </th>
                              <th>Status</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sampleTests.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="text-center text-muted"
                                >
                                  No tests for this sample.
                                </td>
                              </tr>
                            ) : (
                              sampleTests.map((t, idx) => {
                                const k = rowKey(t, idx, sampleId);
                                const rowUi = uiByTest[k] || {
                                  specimenCount: 1,
                                  action: "Record Created",
                                  actionDate: null,
                                };

                                const displayDate =
                                  t.DateAssigned || rowUi.actionDate;

                                const rawStatus =
                                  rowUi.action || t.TestStatus || null;

                                const isEditable = editableTests[k] ?? true;

                                return (
                                  <tr key={k}>
                                    <td className="text-center">
                                      <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={isEditable}
                                        onChange={() => {
                                          setEditableTests((prev) => ({
                                            ...prev,
                                            [k]: !(prev[k] ?? true),
                                          }));
                                        }}
                                        aria-label={`Enable editing for test ${
                                          t.TestName ?? ""
                                        }`}
                                      />
                                    </td>
                                    <td>{t.TestName ?? "—"}</td>
                                    <td style={{ maxWidth: 96 }}>
                                      <span className="mono">
                                        {rowUi.specimenCount}
                                      </span>
                                    </td>
                                    <td>
                                      <select
                                        className="form-select form-select-sm"
                                        value={
                                          [
                                            "Accepted",
                                            "Rejected",
                                            "Not Received",
                                          ].includes(String(rawStatus ?? ""))
                                            ? String(rawStatus)
                                            : ""
                                        }
                                        disabled={saving || !isEditable}
                                        onChange={(e) => {
                                          const val = e.target.value || null;
                                          const prevVal = String(
                                            rawStatus ?? ""
                                          );
                                          if (val === "Rejected") {
                                            openRejectModal(k, prevVal, t);
                                            return;
                                          }
                                          void updateSingleTest(k, t, val);
                                        }}
                                      >
                                        <option value="">Requested</option>
                                        <option value="Accepted">
                                          Checked-in
                                        </option>
                                        <option value="Rejected">Reject</option>
                                        <option value="Not Received">
                                          Not Received
                                        </option>
                                      </select>
                                    </td>
                                    <td>
                                      {displayDate ? fmtDate(displayDate) : "—"}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Reject reasons modal */}
                      {rejectModal.open && (
                        <div
                          className="cmp-modal-backdrop"
                          role="dialog"
                          aria-modal="true"
                          onMouseDown={(e) => {
                            if (
                              e.target.classList.contains("cmp-modal-backdrop")
                            )
                              closeRejectModal();
                          }}
                        >
                          <div className="cmp-modal" style={{ maxWidth: 520 }}>
                            <div className="header">
                              <h5 className="m-0">Rejection Reason</h5>
                            </div>
                            <div className="body">
                              <p className="mb-2">
                                Select reason(s) for rejection:
                              </p>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="rejQty"
                                  checked={rejectModal.qty}
                                  onChange={(e) =>
                                    setRejectModal((m) => ({
                                      ...m,
                                      qty: e.target.checked,
                                    }))
                                  }
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="rejQty"
                                >
                                  Insufficient Quantity
                                </label>
                              </div>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="rejQuality"
                                  checked={rejectModal.quality}
                                  onChange={(e) =>
                                    setRejectModal((m) => ({
                                      ...m,
                                      quality: e.target.checked,
                                    }))
                                  }
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="rejQuality"
                                >
                                  Insufficient Quality
                                </label>
                              </div>
                              <div className="form-text mt-2">
                                You may select one or both reasons.
                              </div>
                              <div className="mt-3">
                                <label
                                  className="form-label"
                                  htmlFor="rejComment"
                                >
                                  Comment
                                </label>
                                <textarea
                                  id="rejComment"
                                  className="form-control"
                                  rows={3}
                                  value={rejectModal.comment}
                                  onChange={(e) =>
                                    setRejectModal((m) => ({
                                      ...m,
                                      comment: e.target.value,
                                    }))
                                  }
                                  placeholder="Enter comment (optional)"
                                />
                              </div>
                            </div>
                            <div className="footer d-flex justify-content-end gap-2 mt-3">
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={closeRejectModal}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={confirmRejectModal}
                                disabled={
                                  !rejectModal.qty && !rejectModal.quality
                                }
                              >
                                Confirm Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
