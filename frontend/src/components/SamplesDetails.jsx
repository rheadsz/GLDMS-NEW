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
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [rejectModal, setRejectModal] = useState({
    open: false,
    key: null,
    prevAction: null,
    qty: false,
    quality: false,
  });

  // Edit flow + autosave
  const [isEditing, setIsEditing] = useState(false);
  const [userEdited, setUserEdited] = useState(false);

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
    setIsEditing(false);
    setUserEdited(false);
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

  useEffect(() => {
    if (!active && sampleSummaries.length > 0) {
      setActive(sampleSummaries[0]);
    }
  }, [sampleSummaries, active]);

  const activeTests = useMemo(() => {
    if (!active) return [];
    return groupedBySample.get(active.SampleID) || [];
  }, [active, groupedBySample]);

  // Stable key
  const rowKey = (t, idx) =>
    t.TestID ??
    t.TestRequestID ??
    `${active?.SampleID ?? "sample"}-${t.TestName ?? "test"}-${idx}`;

  // Seed UI from DB values (not a user edit)
  const seedUiFromDB = () => {
    setUiByTest((prev) => {
      const next = {};
      activeTests.forEach((t, idx) => {
        const k = rowKey(t, idx);
        next[k] = prev[k] ?? {
          specimenCount:
            typeof t.NumberOfSpecimen === "number" ? t.NumberOfSpecimen : 1,
          action: t.TestStatus ?? "Record Created",
          actionDate: null, // set only when user changes action
        };
      });
      return next;
    });
    setUserEdited(false);
    setSaveMsg("");
  };

  useEffect(() => {
    seedUiFromDB();
    originalUiSnapshotRef.current = {};
    // reset focus tracking when sample/tests change
    focusCountRef.current = 0;
    setHasFocusedEditor(false);
    setSelectedKeys(new Set());
  }, [activeTests]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // AUTOSAVE: only when editing, there are changes, and no editor is focused
  useEffect(() => {
    if (!isEditing || !userEdited || activeTests.length === 0) return;
    if (hasFocusedEditor) return; // don't save mid-interaction

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void saveActiveSample(/*fromAutosave*/ true);
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiByTest, userEdited, isEditing, hasFocusedEditor, active?.SampleID]);

  // Save current edits (manual or autosave)
  const saveActiveSample = async (fromAutosave = false) => {
    if (!active) return;
    if (!userEdited) {
      if (!fromAutosave) {
        setIsEditing(false);
        setSaveMsg("No changes.");
      }
      return;
    }

    const updates = activeTests
      .map((t, idx) => {
        const k = rowKey(t, idx);
        const u = uiByTest[k] || {};
        return {
          TestID: t.TestID,
          TestStatus: u.action ?? null,
          NumberOfSpecimen:
            typeof u.specimenCount === "number" ? u.specimenCount : null,
          // If Action changed in this session, we have a local YYYY-MM-DD; else keep DB value
          DateAssigned: u.actionDate ? u.actionDate : t.DateAssigned ?? null,
        };
      })
      .filter((u) => typeof u.TestID !== "undefined" && u.TestID !== null);

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

      setSaveMsg(`All changes saved${data.count ? ` (${data.count})` : ""}.`);
      setUserEdited(false);

      // Per your flow: after autosave completes, show display (view) again
      setIsEditing(false);

      // Optionally fetch updated rows if you want to re-pull DateAssigned from DB
      // const reload = await fetch("/api/supervisor/request-samples");
      // const all = await reload.json();
      // const filtered = requestId
      //   ? all.filter((r) => String(r.RequestID) === String(requestId))
      //   : all;
      // setRows(filtered);
    } catch (e) {
      setErr(e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  // Begin/Cancel edit
  const beginEdit = () => {
    originalUiSnapshotRef.current = JSON.parse(JSON.stringify(uiByTest));
    setIsEditing(true);
    setSaveMsg("");
    setErr(null);
    setUserEdited(false);
  };
  const cancelEdit = () => {
    const snap = originalUiSnapshotRef.current || {};
    if (Object.keys(snap).length) setUiByTest(snap);
    else seedUiFromDB();
    setIsEditing(false);
    setUserEdited(false);
    setSaveMsg("Changes discarded.");
    // clear any pending autosave
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  // Reject modal helpers (top-level)
  const openRejectModal = (key, prevAction) => {
    setRejectModal({
      open: true,
      key,
      prevAction: prevAction || null,
      qty: false,
      quality: false,
    });
  };
  const closeRejectModal = () => {
    setRejectModal({
      open: false,
      key: null,
      prevAction: null,
      qty: false,
      quality: false,
    });
  };
  const confirmRejectModal = () => {
    if (!rejectModal.key) return closeRejectModal();
    const reasons = [];
    if (rejectModal.qty) reasons.push("Insufficient Quantity");
    if (rejectModal.quality) reasons.push("Insufficient Quality");
    if (reasons.length === 0) return; // require at least one
    const today = new Date().toLocaleDateString("en-CA");
    setUiByTest((prev) => ({
      ...prev,
      [rejectModal.key]: {
        ...(prev[rejectModal.key] || {}),
        action: "Rejected",
        actionDate: today,
        rejectReasons: reasons,
      },
    }));
    setUserEdited(true);
    setSaveMsg("");
    closeRejectModal();
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

  // Selection helpers
  const allRowKeys = useMemo(
    () => activeTests.map((t, idx) => rowKey(t, idx)),
    [activeTests]
  );
  const allSelected = useMemo(
    () => allRowKeys.length > 0 && allRowKeys.every((k) => selectedKeys.has(k)),
    [allRowKeys, selectedKeys]
  );
  const toggleAll = () => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      const every = allRowKeys.every((k) => next.has(k));
      if (every) allRowKeys.forEach((k) => next.delete(k));
      else allRowKeys.forEach((k) => next.add(k));
      return next;
    });
  };
  const toggleOne = (k) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  // Bulk apply action to selected
  const applyBulkAction = (label) => {
    if (!isEditing || selectedKeys.size === 0) return;
    const today = new Date().toLocaleDateString("en-CA");
    setUiByTest((prev) => {
      const next = { ...prev };
      selectedKeys.forEach((k) => {
        next[k] = {
          ...(next[k] || {}),
          action: label,
          actionDate: today,
        };
      });
      return next;
    });
    setUserEdited(true);
    setSaveMsg("");
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
                <th className="text-start">Sample ID</th>
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
              ) : sampleSummaries.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-muted text-center py-4">
                    No samples.
                  </td>
                </tr>
              ) : (
                sampleSummaries.map((s) => {
                  const isActive =
                    (active?.SampleID ?? active?.id) === (s.SampleID ?? s.id);
                  return (
                    <tr
                      key={s.SampleID ?? `${s.EfisProjectID}-${s.CreatedBy}`}
                      className={isActive ? "table-primary" : ""}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setActive(s);
                        setUiByTest({});
                        setSaveMsg("");
                        setIsEditing(false);
                        setUserEdited(false);
                        focusCountRef.current = 0;
                        setHasFocusedEditor(false);
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActive(s);
                          setUiByTest({});
                          setSaveMsg("");
                          setIsEditing(false);
                          setUserEdited(false);
                          focusCountRef.current = 0;
                          setHasFocusedEditor(false);
                        }
                      }}
                      aria-selected={isActive}
                    >
                      <td className="mono text-start">
                        <span className="linklike">{s.SampleID ?? "—"}</span>
                      </td>
                      <td className="mono text-start">
                        {s.EfisProjectID ?? "—"}
                      </td>
                      <td className="text-start">{s.CreatedBy ?? "—"}</td>
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
                  <span className="value mono">
                    {active.EfisProjectID ?? "—"}
                  </span>
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
              </div>

              {/* Controls + status */}
              <div className="d-flex align-items-center gap-2 mt-3">
                {!isEditing ? (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={beginEdit}
                    disabled={saving || selectedKeys.size === 0}
                    title={
                      selectedKeys.size === 0
                        ? "Select at least one test to enable editing"
                        : "Enter edit mode"
                    }
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={cancelEdit}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <div className="ms-2 d-inline-flex gap-2">
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => applyBulkAction("Accepted")}
                        disabled={saving || selectedKeys.size === 0}
                        title={
                          selectedKeys.size === 0
                            ? "Select tests to accept"
                            : "Mark selected tests as Accepted"
                        }
                      >
                        Accept
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => applyBulkAction("Rejected")}
                        disabled={saving || selectedKeys.size === 0}
                        title={
                          selectedKeys.size === 0
                            ? "Select tests to reject"
                            : "Mark selected tests as Rejected"
                        }
                      >
                        Reject
                      </button>
                    </div>
                  </>
                )}
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setRefreshTick((n) => n + 1)}
                  disabled={loading || saving}
                  title="Refetch latest tests for samples"
                >
                  Refresh
                </button>
                <span className="text-muted small">
                  {saving
                    ? "Saving…"
                    : isEditing && (userEdited || hasFocusedEditor)
                    ? "Editing…"
                    : saveMsg
                    ? saveMsg
                    : isEditing
                    ? "Edit mode"
                    : loading
                    ? "Loading…"
                    : "View mode"}
                </span>
                {err && <span className="text-danger small">{err}</span>}
              </div>

              {/* TABLE 1: Borehole / field collection details */}
              <div className="table-responsive mt-3">
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

              {/* TABLE 2: Requested tests / assignment */}
              <div className="table-responsive mt-3">
                <table className="table table-bordered table-sm mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "2.25rem", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={allSelected}
                          onChange={toggleAll}
                          aria-label="Select all tests"
                        />
                      </th>
                      <th>Requested Test</th>
                      <th style={{ width: "6rem" }}>Number of Specimen</th>
                      <th>Status</th>
                      <th>Action</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted">
                          No tests for this sample.
                        </td>
                      </tr>
                    ) : (
                      activeTests.map((t, idx) => {
                        const k = rowKey(t, idx);
                        const rowUi = uiByTest[k] || {
                          specimenCount: 1,
                          action: "Record Created",
                          actionDate: null,
                        };

                        // Prefer DB DateAssigned (YYYY-MM-DD), fallback to local actionDate (YYYY-MM-DD)
                        const displayDate = t.DateAssigned || rowUi.actionDate;

                        return (
                          <tr key={k}>
                            <td className="text-center">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={selectedKeys.has(k)}
                                onChange={() => toggleOne(k)}
                                aria-label={`Select test ${t.TestName ?? ""}`}
                              />
                            </td>
                            <td>{t.TestName ?? "—"}</td>

                            <td style={{ maxWidth: 96 }}>
                              {isEditing ? (
                                <select
                                  className="form-select form-select-sm"
                                  value={rowUi.specimenCount}
                                  onFocus={handleFocus}
                                  onBlur={handleBlur}
                                  onChange={(e) => {
                                    setUiByTest((prev) => ({
                                      ...prev,
                                      [k]: {
                                        ...prev[k],
                                        specimenCount:
                                          Number(e.target.value) || 1,
                                      },
                                    }));
                                    setUserEdited(true);
                                    setSaveMsg("");
                                  }}
                                >
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <option key={n} value={n}>
                                      {n}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="mono">
                                  {rowUi.specimenCount}
                                </span>
                              )}
                            </td>

                            {/* Status (from DB) */}
                            <td>
                              <span className={statusTextClass(t.TestStatus)}>
                                {t.TestStatus ?? "—"}
                              </span>
                            </td>

                            {/* Action (edit control) */}
                            <td style={{ maxWidth: 200 }}>
                              {isEditing ? (
                                <select
                                  className="form-select form-select-sm"
                                  value={
                                    [
                                      "Accepted",
                                      "Rejected",
                                      "Not Received",
                                    ].includes(
                                      String(rowUi.action || t.TestStatus || "")
                                    )
                                      ? String(rowUi.action || t.TestStatus)
                                      : ""
                                  }
                                  onFocus={handleFocus}
                                  onBlur={handleBlur}
                                  onChange={(e) => {
                                    const val = e.target.value || null;
                                    const prevVal = String(
                                      rowUi.action || t.TestStatus || ""
                                    );
                                    if (
                                      val === "Rejected" ||
                                      val === "Reject"
                                    ) {
                                      // Open modal, do not apply change yet
                                      openRejectModal(k, prevVal);
                                      return;
                                    }
                                    setUiByTest((prev) => ({
                                      ...prev,
                                      [k]: {
                                        ...prev[k],
                                        action: val,
                                        actionDate:
                                          new Date().toLocaleDateString(
                                            "en-CA"
                                          ),
                                        // clear reject reasons if not rejected
                                        ...(val !== "Rejected"
                                          ? { rejectReasons: [] }
                                          : {}),
                                      },
                                    }));
                                    setUserEdited(true);
                                    setSaveMsg("");
                                  }}
                                >
                                  <option value="">— Select —</option>
                                  <option>Accepted</option>
                                  <option>Reject</option>
                                  <option>Not Received</option>
                                </select>
                              ) : (
                                <span>—</span>
                              )}
                            </td>

                            <td>{displayDate ? fmtDate(displayDate) : "—"}</td>
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
                    if (e.target.classList.contains("cmp-modal-backdrop"))
                      closeRejectModal();
                  }}
                >
                  <div className="cmp-modal" style={{ maxWidth: 520 }}>
                    <div className="header">
                      <h5 className="m-0">Rejection Reason</h5>
                    </div>
                    <div className="body">
                      <p className="mb-2">Select reason(s) for rejection:</p>
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
                        <label className="form-check-label" htmlFor="rejQty">
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
                        You can choose one or both options.
                      </div>
                    </div>
                    <div className="footer">
                      <button
                        className="btn btn-light"
                        onClick={closeRejectModal}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={confirmRejectModal}
                        disabled={!rejectModal.qty && !rejectModal.quality}
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
      </section>
    </div>
  );
}
