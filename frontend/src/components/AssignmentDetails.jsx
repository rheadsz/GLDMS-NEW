import React, { useEffect, useMemo, useState } from "react";

function AssignmentDetails({
  request,
  testers: testersProp,
  onRequestAttentionChange,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testers, setTesters] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Track assigned rows + selection + bulk state
  const [assignedRows, setAssignedRows] = useState(() => new Set());
  const [selected, setSelected] = useState(() => new Set());

  // Editable rows: on load -> only UNASSIGNED are editable
  const [editing, setEditing] = useState(() => new Set());

  // Assign modal (single row)
  const [assignModal, setAssignModal] = useState({
    open: false,
    testId: null,
    form: { testerId: "", resultDueDate: "", reportDueDate: "", comments: "" },
  });

  // NEW: Bulk assign modal (for many rows)
  const [bulkModal, setBulkModal] = useState({
    open: false,
    form: { testerId: "", resultDueDate: "", reportDueDate: "", comments: "" },
    busy: false,
  });

  // History modal
  const [historyModal, setHistoryModal] = useState({
    open: false,
    testId: null,
    loading: false,
    error: null,
    items: [],
  });

  // Helpers
  function formatDateOnly(value) {
    if (!value) return "—";
    const s = String(value);
    if (s.includes("T")) return s.split("T")[0];
    if (s.includes(" ")) return s.split(" ")[0];
    return s;
  }
  function formatDateTimeLocal(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      if (Number.isNaN(+d)) return String(iso);
      return d.toLocaleString();
    } catch {
      return String(iso);
    }
  }
  function renderValue(v) {
    if (v === null || v === undefined || v === "") return "—";
    return String(v);
  }

  const FIELD_LABELS = {
    AssignedTester: "Assigned Tester",
    ResultDueDate: "Result Due Date",
    ReportDueDate: "Report Due Date",
    Comments: "Comments",
    Notes: "Comments",
    Status: "Status",
    RequestedDueDate: "Requested Due Date",
    RequestSubmissionDate: "Request Submission Date",
  };

  const getItemId = (r, i) =>
    r.ItemID ?? r.DetailID ?? r.SampleTestID ?? r.TestID ?? r.id ?? i;

  // Load rows
  useEffect(() => {
    let mounted = true;
    setError(null);
    setNotice(null);
    setAssignedRows(new Set());
    setSelected(new Set());
    setEditing(new Set());

    if (!request?.RequestID) {
      setRows([]);
      return;
    }

    setLoading(true);
    fetch(`/api/assignments/${request.RequestID}/summary`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!mounted) return;
        const items = Array.isArray(data.items) ? data.items : [];
        setRows(items);

        const nextDrafts = {};
        const nextAssigned = new Set();
        const unassignedIds = [];

        items.forEach((row, i) => {
          const id = getItemId(row, i);
          const isAssigned = !!row.AssignedTester;
          if (isAssigned) nextAssigned.add(id);
          else unassignedIds.push(id);

          nextDrafts[id] = {
            testerId: row.AssignedTester ?? "",
            resultDueDate:
              formatDateOnly(row.AssignedResultDueDate) !== "—"
                ? formatDateOnly(row.AssignedResultDueDate)
                : "",
            reportDueDate:
              formatDateOnly(row.AssignedReportDueDate) !== "—"
                ? formatDateOnly(row.AssignedReportDueDate)
                : "",
            comments: row.Notes ?? "",
          };
        });

        setDrafts(nextDrafts);
        setAssignedRows(nextAssigned);
        // On load: only UNASSIGNED rows are editable
        setEditing(new Set(unassignedIds));
      })
      .catch((e) => {
        console.error("summary fetch error:", e);
        if (mounted) {
          setRows([]);
          setError("Couldn’t load assignment summary.");
        }
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [request?.RequestID]);

  // Load testers
  useEffect(() => {
    let mounted = true;
    if (Array.isArray(testersProp) && testersProp.length) {
      const normalized =
        typeof testersProp[0] === "string"
          ? testersProp
          : testersProp.map((t) => t?.name || t?.UserName).filter(Boolean);
      setTesters(normalized);
      return () => {
        mounted = false;
      };
    }
    if (!request?.RequestID) return;
    fetch(`/api/testers`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!mounted) return;
        const items = Array.isArray(data?.items) ? data.items : [];
        const usernames = items.map((t) =>
          typeof t === "string" ? t : t?.UserName || t?.name || String(t)
        );
        setTesters(usernames);
      })
      .catch((e) => {
        console.error("testers fetch error:", e);
        if (mounted) setError("Couldn’t load testers.");
      });
    return () => {
      mounted = false;
    };
  }, [request?.RequestID, testersProp]);

  // Derived: has any unassigned rows?
  const hasUnassigned = useMemo(() => {
    if (!rows?.length) return false;
    return rows.some((r, i) => {
      const id = getItemId(r, i);
      const isAssigned = assignedRows.has(id) || !!r.AssignedTester;
      return !isAssigned;
    });
  }, [rows, assignedRows]);

  // Notify parent whenever unassigned status changes
  useEffect(() => {
    if (!request?.RequestID) return;
    if (typeof onRequestAttentionChange === "function") {
      onRequestAttentionChange(request.RequestID, hasUnassigned);
    }
  }, [request?.RequestID, hasUnassigned, onRequestAttentionChange]);

  function updateDraft(itemId, patch) {
    setDrafts((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || {}), ...patch },
    }));
  }

  // Assign single row or save edits for an assigned row
  async function handleAssign(testId) {
    const isEditing = editing.has(testId);
    if (assignedRows.has(testId) && !isEditing) {
      setError("This test is already assigned. Use Edit to make changes.");
      return;
    }

    const d = drafts[testId] || {};
    if (!d.testerId) {
      setError("Please select a tester.");
      return;
    }
    if (!d.resultDueDate && !d.reportDueDate) {
      setError("Add a result or report due date.");
      return;
    }

    try {
      setSubmitting((s) => ({ ...s, [testId]: true }));
      const res = await fetch(`/api/assignments/${testId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          assignedTester: d.testerId,
          resultDueDate: d.resultDueDate || null,
          reportDueDate: d.reportDueDate || null,
          notes: d.comments || null,
        }),
      });
      if (!res.ok) {
        let msg = "";
        try { const data = await res.json(); msg = data?.error || ""; } catch { msg = await res.text(); }
        throw new Error(msg || `HTTP ${res.status}`);
      }
      await res.json();

      setAssignedRows((prev) => new Set([...prev, testId]));
      setEditing((prev) => {
        const next = new Set(prev);
        next.delete(testId);
        return next;
      });
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(testId);
        return next;
      });

      setNotice(isEditing ? "Changes saved " : "Assignment saved ");
    } catch (e) {
      setError(e?.message || "Couldn’t save assignment.");
    } finally {
      setSubmitting((s) => ({ ...s, [testId]: false }));
    }
  }

  // Selectable ids (only unassigned or currently-editing assigned rows)
  const selectableIds = useMemo(() => {
    return rows
      .map((r, i) => {
        const id = getItemId(r, i);
        const isAssigned = assignedRows.has(id);
        const isEditing = editing.has(id);
        return !isAssigned || isEditing ? id : null;
      })
      .filter(Boolean);
  }, [rows, assignedRows, editing]);

  const allSelectableChecked =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggleOne(id) {
    const isAssigned = assignedRows.has(id);
    const isEditing = editing.has(id);
    if (isAssigned && !isEditing) return; // cannot select locked assigned rows

    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      const everyChecked = selectableIds.every((id) => next.has(id));
      if (everyChecked) selectableIds.forEach((id) => next.delete(id));
      else selectableIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function toggleEdit(id) {
    setEditing((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Assign Modal (single)
  function openAssignModal(testId) {
    const d = drafts[testId] || {
      testerId: "",
      resultDueDate: "",
      reportDueDate: "",
      comments: "",
    };
    setAssignModal({ open: true, testId, form: { ...d } });
  }
  function closeAssignModal() {
    setAssignModal({
      open: false,
      testId: null,
      form: {
        testerId: "",
        resultDueDate: "",
        reportDueDate: "",
        comments: "",
      },
    });
  }
  function setAssignField(field, value) {
    setAssignModal((m) => ({ ...m, form: { ...m.form, [field]: value } }));
  }
  async function confirmAssignFromModal() {
    const { testId, form } = assignModal;
    setDrafts((prev) => ({
      ...prev,
      [testId]: { ...(prev[testId] || {}), ...form },
    }));
    if (!form.testerId) {
      setError("Please select a tester.");
      return;
    }
    if (!form.resultDueDate && !form.reportDueDate) {
      setError("Add a result or report due date.");
      return;
    }
    await handleAssign(testId);
    closeAssignModal();
  }

  // NEW: Bulk assign modal control
  function openBulkModal() {
    if (selectableIds.length === 0 || selected.size === 0) {
      setError("Select at least one test.");
      return;
    }
    setBulkModal({
      open: true,
      busy: false,
      form: {
        testerId: "",
        resultDueDate: "",
        reportDueDate: "",
        comments: "",
      },
    });
  }
  function closeBulkModal() {
    setBulkModal({
      open: false,
      busy: false,
      form: {
        testerId: "",
        resultDueDate: "",
        reportDueDate: "",
        comments: "",
      },
    });
  }
  function setBulkField(field, value) {
    setBulkModal((m) => ({ ...m, form: { ...m.form, [field]: value } }));
  }

  // NEW: Bulk assign using ONE set of values for ALL selected rows
  async function confirmBulkAssign() {
    const ids = Array.from(selected);
    const { testerId, resultDueDate, reportDueDate, comments } = bulkModal.form;

    if (!testerId) {
      setError("Bulk assign needs a tester.");
      return;
    }
    if (!resultDueDate && !reportDueDate) {
      setError("Bulk assign needs at least one due date.");
      return;
    }

    // apply common values into drafts (so UI reflects immediately)
    setDrafts((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = {
          ...(next[id] || {}),
          testerId,
          resultDueDate: resultDueDate || "",
          reportDueDate: reportDueDate || "",
          comments: comments || "",
        };
      });
      return next;
    });

    setBulkModal((m) => ({ ...m, busy: true }));
    setError(null);
    setNotice(null);

    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/assignments/${id}/assign`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              assignedTester: testerId,
              resultDueDate: resultDueDate || null,
              reportDueDate: reportDueDate || null,
              notes: comments || null,
            }),
          }).then(async (r) => {
            if (!r.ok) {
              let msg = "";
              try { const d = await r.json(); msg = d?.error || ""; } catch { msg = await r.text(); }
              throw new Error(msg || `HTTP ${r.status}`);
            }
            return r.json();
          })
        )
      );

      const succeeded = [],
        failed = [];
      results.forEach((res, i) =>
        (res.status === "fulfilled" ? succeeded : failed).push(ids[i])
      );

      if (succeeded.length > 0) {
        setAssignedRows((prev) => new Set([...prev, ...succeeded]));
        setEditing((prev) => {
          const next = new Set(prev);
          succeeded.forEach((id) => next.delete(id));
          return next;
        });
        setSelected((prev) => {
          const next = new Set(prev);
          succeeded.forEach((id) => next.delete(id));
          return next;
        });
      }

      if (succeeded.length && failed.length) {
        setNotice(`Assigned ${succeeded.length} test(s) `);
        setError(`${failed.length} failed to save.`);
      } else if (succeeded.length) {
        setNotice(`Assigned ${succeeded.length} test(s) `);
      } else {
        setError("Bulk assignment failed.");
      }
    } catch (e) {
      setError(e?.message || "Bulk assignment failed.");
    } finally {
      setBulkModal((m) => ({ ...m, busy: false }));
      closeBulkModal();
    }
  }

  // History modal helpers
  function openHistoryModal(testId) {
    setHistoryModal({
      open: true,
      testId,
      loading: true,
      error: null,
      items: [],
    });
    fetch(`/api/assignments/${testId}/history`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        items.sort((a, b) => new Date(b.ChangedAt) - new Date(a.ChangedAt));
        setHistoryModal((m) => ({ ...m, loading: false, items }));
      })
      .catch((e) => {
        console.error("history fetch error:", e);
        setHistoryModal((m) => ({
          ...m,
          loading: false,
          error: "Couldn’t load change history.",
        }));
      });
  }
  function closeHistoryModal() {
    setHistoryModal({
      open: false,
      testId: null,
      loading: false,
      error: null,
      items: [],
    });
  }

  const assignedCount = useMemo(
    () => rows.filter((r) => !!r.AssignedTester).length,
    [rows]
  );
  const totalCount = useMemo(() => rows.length, [rows]);
  const unassignedCount = totalCount - assignedCount;
  const selectedCount = selected.size;
  const busyAnyRow = Object.values(submitting).some(Boolean);
  const busy = loading || busyAnyRow || bulkModal.busy;

  if (!request)
    return (
      <div className="text-muted">
        Select an assignment to view its details.
      </div>
    );

  return (
    <div className="assignment-blue">
      <style>{`
        .assignment-blue .table tbody > tr > * { background-color: #EAF2FF !important; }
        .assignment-blue .table tbody > tr:hover > * { background-color: #D6E6FF !important; }
        .btn-pill { border-radius: 999px; padding: .25rem .7rem; }
        .btn-ghost { background: #fff; border: 1px solid rgba(0,0,0,.12); }
        /* Modal styles */
        .cmp-modal-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,.45);
          display: flex; align-items: center; justify-content: center; z-index: 1050;
        }
        .cmp-modal {
          width: 640px; max-width: calc(100vw - 2rem);
          background: #fff; border-radius: 14px; box-shadow: 0 18px 48px rgba(0,0,0,.18);
          overflow: hidden;
        }
        .cmp-modal header {
          padding: .9rem 1.1rem; border-bottom: 1px solid rgba(0,0,0,.08);
          display: flex; align-items: center; justify-content: space-between;
        }
        .cmp-modal header h5 { margin: 0; font-weight: 700; }
        .cmp-modal .body { padding: 1rem 1.1rem; max-height: 65vh; overflow: auto; }
        .cmp-modal .footer { padding: .9rem 1.1rem; border-top: 1px solid rgba(0,0,0,.08); display: flex; gap: .5rem; justify-content: flex-end; }
        .history-event { border: 1px solid rgba(0,0,0,.08); border-radius: 10px; padding: .75rem .9rem; margin-bottom: .75rem; background: #f9fbff; }
        .history-header { display:flex; gap:.75rem; align-items:center; margin-bottom: .5rem; }
        .history-grid { display:grid; grid-template-columns: 1fr 1fr 1fr; gap:.5rem .75rem; }
        @media (max-width: 520px) { .history-grid { grid-template-columns: 1fr; } }
        .chip { display:inline-block; font-size:.8rem; padding:.15rem .5rem; border-radius: 999px; background:#eef3ff; color:#2f4b90; }
        .diff { display:flex; gap:.35rem; align-items:center; }
        .diff .arrow { opacity:.6; }
      `}</style>

      {error && <div className="alert alert-danger py-2 mb-2">{error}</div>}
      {notice && <div className="alert alert-success py-2 mb-2">{notice}</div>}

      <div className="mb-3">
        <div className="row text-start">
          <div className="col-md-3 col-sm-6 mb-2">
            <strong>Request No.:</strong> {request.RequestID}
          </div>
          <div className="col-md-3 col-sm-6 mb-2">
            <strong>Project ID:</strong>{" "}
            <span className="mono">{request.EfisProjectId ?? "—"}</span>
          </div>
          <div className="col-md-3 col-sm-6 mb-2">
            <strong>Requester:</strong>{" "}
            <span className="text-danger">{request.CreatedBy ?? "—"}</span>
          </div>
          <div className="col-md-3 col-sm-6 mb-2">
            <strong>Summary:</strong>{" "}
            <span className="badge rounded-pill text-bg-primary me-2">
              Assigned: {assignedCount}
            </span>
            <span className="badge rounded-pill text-bg-secondary">
              Unassigned Requests: {unassignedCount}
            </span>
          </div>
        </div>
      </div>

      <table className="table table-bordered table-hover align-middle fs-6">
        <thead className="table-light">
          <tr>
            <th style={{ width: "2.75rem", textAlign: "center" }}>
              <input
                type="checkbox"
                className="form-check-input"
                checked={allSelectableChecked}
                onChange={toggleAll}
                aria-label="Select all"
              />
            </th>
            <th>Requested Test</th>
            <th>Sample (Borehole ID-Depth)</th>
            <th>Request Submission Date</th>
            <th>Requested Due Date</th>
            <th>Assigned Tester</th>
            <th>Result Due</th>
            <th>Report Due</th>
            <th>Comments</th>
            <th>Status</th>
            <th style={{ width: "10.5rem" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={11} className="text-center">
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={11} className="text-center">
                No items.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => {
              const testId = getItemId(r, i);
              const d = drafts[testId] || {};
              const isAssigned = assignedRows.has(testId);
              const isEditing = editing.has(testId);
              const checked = selected.has(testId);
              const isSubmitting = !!submitting[testId];

              const viewTester = d.testerId || "—";
              const viewResultDue = d.resultDueDate || "—";
              const viewReportDue = d.reportDueDate || "—";
              const viewComments = d.comments || "—";

              return (
                <tr
                  key={testId}
                  className={isEditing ? "table-active" : undefined}
                >
                  <td className="text-center">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={checked}
                      onChange={() => toggleOne(testId)}
                      disabled={isAssigned && !isEditing}
                      aria-label={`Select test ${testId}`}
                    />
                  </td>

                  <td>{r.RequestedTest ?? "—"}</td>
                  <td className="text-primary fw-semibold">
                    {r.BoreholeDepth ?? "—"}
                  </td>
                  <td>{formatDateOnly(r.RequestSubmissionDate)}</td>
                  <td>{formatDateOnly(r.RequestedDueDate)}</td>

                  <td>
                    {isEditing ? (
                      <select
                        className="form-select"
                        style={{ fontSize: "1rem" }}
                        value={d.testerId || ""}
                        onChange={(e) =>
                          updateDraft(testId, { testerId: e.target.value })
                        }
                      >
                        <option value="">— Select tester —</option>
                        {testers.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>{viewTester}</span>
                    )}
                  </td>

                  <td>
                    {isEditing ? (
                      <input
                        type="date"
                        className="form-control"
                        style={{ fontSize: "1rem" }}
                        value={d.resultDueDate || ""}
                        onChange={(e) =>
                          updateDraft(testId, { resultDueDate: e.target.value })
                        }
                      />
                    ) : (
                      <span>{viewResultDue}</span>
                    )}
                  </td>

                  <td>
                    {isEditing ? (
                      <input
                        type="date"
                        className="form-control"
                        style={{ fontSize: "1rem" }}
                        value={d.reportDueDate || ""}
                        onChange={(e) =>
                          updateDraft(testId, { reportDueDate: e.target.value })
                        }
                      />
                    ) : (
                      <span>{viewReportDue}</span>
                    )}
                  </td>

                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control"
                        style={{ fontSize: "1rem" }}
                        placeholder="Comments"
                        value={d.comments || ""}
                        onChange={(e) =>
                          updateDraft(testId, { comments: e.target.value })
                        }
                      />
                    ) : (
                      <span>{viewComments}</span>
                    )}
                  </td>

                  <td>
                    {isAssigned ? (
                      <span className="badge rounded-pill text-bg-success">
                        Assigned
                      </span>
                    ) : (
                      <span className="badge rounded-pill text-bg-secondary">
                        Unassigned
                      </span>
                    )}
                    {isSubmitting && (
                      <span className="ms-2 small text-muted">Saving…</span>
                    )}
                  </td>

                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: ".4rem",
                        alignItems: "center",
                      }}
                    >
                      {/* Record */}
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost btn-pill"
                        onClick={() => openHistoryModal(testId)}
                        title="View change history"
                      >
                        Record
                      </button>

                      {/* Primary action: Assign… or Edit/Done */}
                      {!isAssigned ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary btn-pill"
                          onClick={() => openAssignModal(testId)}
                          title="Assign tester and due dates"
                        >
                          Assign…
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`btn btn-sm btn-${
                            isEditing ? "secondary" : "primary"
                          } btn-pill`}
                          onClick={() => (isEditing ? handleAssign(testId) : toggleEdit(testId))}
                          disabled={isEditing && isSubmitting}
                          title={isEditing ? (isSubmitting ? "Saving…" : "Save changes and stop editing") : "Edit this row"}
                        >
                          {isEditing ? "Done" : "Edit"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Bottom bar: Assign Selected (opens bulk modal) */}
      <div className="d-flex justify-content-end mt-3">
        <button
          className="btn btn-primary px-4"
          onClick={openBulkModal}
          title={
            selectedCount === 0
              ? "Select at least one test"
              : "Bulk-assign same values to all selected rows"
          }
          disabled={busy || selectedCount === 0}
        >
          {bulkModal.busy ? "Assigning…" : `Assign Selected (${selectedCount})`}
        </button>
      </div>

      {/* Assign Modal (single row) */}
      {assignModal.open && (
        <div
          className="cmp-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assignModalTitle"
          onMouseDown={(e) => {
            if (e.target.classList.contains("cmp-modal-backdrop"))
              closeAssignModal();
          }}
        >
          <div className="cmp-modal" onMouseDown={(e) => e.stopPropagation()}>
            <header>
              <h5 id="assignModalTitle">Assign Tester</h5>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={closeAssignModal}
                aria-label="Close"
              >
                ✕
              </button>
            </header>
            <div className="body">
              <div className="mb-3">
                <label className="form-label">Tester</label>
                <select
                  className="form-select"
                  value={assignModal.form.testerId}
                  onChange={(e) => setAssignField("testerId", e.target.value)}
                >
                  <option value="">— Select tester —</option>
                  {testers.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="row">
                <div className="col-sm-6 mb-3">
                  <label className="form-label">Result Due</label>
                  <input
                    type="date"
                    className="form-control"
                    value={assignModal.form.resultDueDate}
                    onChange={(e) =>
                      setAssignField("resultDueDate", e.target.value)
                    }
                  />
                </div>
                <div className="col-sm-6 mb-3">
                  <label className="form-label">Report Due</label>
                  <input
                    type="date"
                    className="form-control"
                    value={assignModal.form.reportDueDate}
                    onChange={(e) =>
                      setAssignField("reportDueDate", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="mb-1">
                <label className="form-label">Comments</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Optional"
                  value={assignModal.form.comments}
                  onChange={(e) => setAssignField("comments", e.target.value)}
                />
              </div>

              <div className="form-text">
                * A tester and at least one due date (Result or Report) are
                required.
              </div>
            </div>
            <div className="footer">
              <button className="btn btn-light" onClick={closeAssignModal}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={confirmAssignFromModal}
                disabled={!!submitting[assignModal.testId]}
              >
                {submitting[assignModal.testId] ? "Saving…" : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Bulk Assign Modal */}
      {bulkModal.open && (
        <div
          className="cmp-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulkAssignTitle"
          onMouseDown={(e) => {
            if (e.target.classList.contains("cmp-modal-backdrop"))
              closeBulkModal();
          }}
        >
          <div className="cmp-modal" onMouseDown={(e) => e.stopPropagation()}>
            <header>
              <h5 id="bulkAssignTitle">
                Bulk Assign ({selectedCount} selected)
              </h5>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={closeBulkModal}
                aria-label="Close"
              >
                ✕
              </button>
            </header>
            <div className="body">
              <div className="mb-3">
                <label className="form-label">Tester</label>
                <select
                  className="form-select"
                  value={bulkModal.form.testerId}
                  onChange={(e) => setBulkField("testerId", e.target.value)}
                >
                  <option value="">— Select tester —</option>
                  {testers.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="row">
                <div className="col-sm-6 mb-3">
                  <label className="form-label">Result Due</label>
                  <input
                    type="date"
                    className="form-control"
                    value={bulkModal.form.resultDueDate}
                    onChange={(e) =>
                      setBulkField("resultDueDate", e.target.value)
                    }
                  />
                </div>
                <div className="col-sm-6 mb-3">
                  <label className="form-label">Report Due</label>
                  <input
                    type="date"
                    className="form-control"
                    value={bulkModal.form.reportDueDate}
                    onChange={(e) =>
                      setBulkField("reportDueDate", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="mb-1">
                <label className="form-label">Comments</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Optional"
                  value={bulkModal.form.comments}
                  onChange={(e) => setBulkField("comments", e.target.value)}
                />
              </div>

              <div className="form-text">
                * All selected rows will be assigned using these values.
              </div>
            </div>
            <div className="footer">
              <button
                className="btn btn-light"
                onClick={closeBulkModal}
                disabled={bulkModal.busy}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={confirmBulkAssign}
                disabled={bulkModal.busy}
              >
                {bulkModal.busy ? "Assigning…" : "Assign All"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModal.open && (
        <div
          className="cmp-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="historyModalTitle"
          onMouseDown={(e) => {
            if (e.target.classList.contains("cmp-modal-backdrop"))
              closeHistoryModal();
          }}
        >
          <div className="cmp-modal" onMouseDown={(e) => e.stopPropagation()}>
            <header>
              <h5 id="historyModalTitle">Change History</h5>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={closeHistoryModal}
                aria-label="Close"
              >
                ✕
              </button>
            </header>
            <div className="body">
              {historyModal.loading ? (
                <div className="text-muted">Loading history…</div>
              ) : historyModal.error ? (
                <div className="alert alert-danger py-2">
                  {historyModal.error}
                </div>
              ) : historyModal.items.length === 0 ? (
                <div className="text-muted">
                  No changes recorded for this test.
                </div>
              ) : (
                historyModal.items.map((ev) => {
                  const changes =
                    ev.Changes && typeof ev.Changes === "object"
                      ? ev.Changes
                      : {};
                  const fields = Object.keys(changes);
                  return (
                    <div
                      key={ev.HistoryID ?? ev.ChangedAt + ev.ChangedBy}
                      className="history-event"
                    >
                      <div className="history-header">
                        <span className="chip">
                          {ev.ChangedBy || "Unknown user"}
                        </span>
                        <span className="text-muted small">
                          {formatDateTimeLocal(ev.ChangedAt)}
                        </span>
                      </div>
                      {fields.length === 0 ? (
                        <div className="text-muted">
                          No detailed field changes provided.
                        </div>
                      ) : (
                        <div className="history-grid">
                          {fields.map((k) => {
                            const label = FIELD_LABELS[k] || k;
                            const diff = changes[k] || {};
                            return (
                              <div
                                key={k}
                                className="border rounded p-2 bg-white"
                              >
                                <div className="small text-uppercase text-muted fw-semibold mb-1">
                                  {label}
                                </div>
                                <div className="diff">
                                  <span className="text-muted">
                                    {renderValue(diff.from)}
                                  </span>
                                  <span className="arrow">→</span>
                                  <span className="fw-semibold">
                                    {renderValue(diff.to)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div className="footer">
              <button className="btn btn-primary" onClick={closeHistoryModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssignmentDetails;
