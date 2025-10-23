import React, { useEffect, useMemo, useRef, useState } from "react";

function AssignmentDetails({ request, testers: testersProp }) {
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
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Editable rows: on load -> only UNASSIGNED are editable
  const [editing, setEditing] = useState(() => new Set());

  // Row actions dropdown
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRefs = useRef({});

  // Helpers
  function formatDateOnly(value) {
    if (!value) return "—";
    const s = String(value);
    if (s.includes("T")) return s.split("T")[0];
    if (s.includes(" ")) return s.split(" ")[0];
    return s;
  }
  const getItemId = (r, i) =>
    r.ItemID ?? r.DetailID ?? r.SampleTestID ?? r.TestID ?? r.id ?? i;

  // Close dropdown on outside/Esc
  useEffect(() => {
    function onDocClick(e) {
      if (!openMenuId) return;
      const ref = menuRefs.current[openMenuId];
      if (ref && !ref.contains(e.target)) setOpenMenuId(null);
    }
    function onEsc(e) { if (e.key === "Escape") setOpenMenuId(null); }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [openMenuId]);

  // Load rows
  useEffect(() => {
    let mounted = true;
    setError(null);
    setNotice(null);
    setAssignedRows(new Set());
    setSelected(new Set());
    setEditing(new Set());
    setOpenMenuId(null);

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

    return () => { mounted = false; };
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
      return () => { mounted = false; };
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
    return () => { mounted = false; };
  }, [request?.RequestID, testersProp]);

  function updateDraft(itemId, patch) {
    setDrafts((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || {}), ...patch },
    }));
  }

  // Assign single row
  async function handleAssign(testId) {
    const d = drafts[testId] || {};
    if (!d.testerId) { setError("Please select a tester."); return; }
    if (!d.resultDueDate && !d.reportDueDate) {
      setError("Add a result or report due date."); return;
    }

    try {
      setSubmitting((s) => ({ ...s, [testId]: true }));
      const res = await fetch(`/api/assignments/${testId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedTester: d.testerId,
          resultDueDate: d.resultDueDate || null,
          reportDueDate: d.reportDueDate || null,
          notes: d.comments || null,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();

      // Mark assigned + make row read-only after save
      setAssignedRows((prev) => new Set([...prev, testId]));
      setEditing((prev) => { const next = new Set(prev); next.delete(testId); return next; });
      setSelected((prev) => { const next = new Set(prev); next.delete(testId); return next; });

      setNotice("Assignment saved ✅");
    } catch {
      setError("Couldn’t save assignment.");
    } finally {
      setSubmitting((s) => ({ ...s, [testId]: false }));
      setOpenMenuId(null);
    }
  }

  // Bulk assign
  async function handleBulkAssign() {
    setError(null);
    setNotice(null);

    const ids = Array.from(selected);
    if (ids.length === 0) { setError("Select at least one test."); return; }

    const valid = [], invalid = [];
    ids.forEach((id) => {
      const d = drafts[id] || {};
      if (!d?.testerId || (!d?.resultDueDate && !d?.reportDueDate)) invalid.push(id);
      else valid.push({ id, d });
    });

    if (valid.length === 0) {
      setError("Selected rows are missing required fields. Each needs a tester and at least one due date.");
      return;
    }

    setBulkSubmitting(true);
    try {
      const results = await Promise.allSettled(
        valid.map(({ id, d }) =>
          fetch(`/api/assignments/${id}/assign`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              assignedTester: d.testerId,
              resultDueDate: d.resultDueDate || null,
              reportDueDate: d.reportDueDate || null,
              notes: d.comments || null,
            }),
          }).then(async (r) => {
            if (!r.ok) throw new Error(await r.text());
            return r.json();
          })
        )
      );

      const succeeded = [], failed = [];
      results.forEach((res, i) => (res.status === "fulfilled" ? succeeded : failed).push(valid[i].id));

      if (succeeded.length > 0) {
        setAssignedRows((prev) => new Set([...prev, ...succeeded]));
        // Make those rows read-only after success
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

      if (succeeded.length && (failed.length || invalid.length)) {
        setNotice(`Assigned ${succeeded.length} test(s) ✅`);
        setError(
          [
            failed.length ? `${failed.length} failed to save` : null,
            invalid.length ? `${invalid.length} missing tester or due date` : null,
          ].filter(Boolean).join(". ") + "."
        );
      } else if (succeeded.length) {
        setNotice(`Assigned ${succeeded.length} test(s) ✅`);
      } else {
        setError(invalid.length ? "No assignments made. Selected rows are missing tester or due date." : "Bulk assignment failed.");
      }
    } catch {
      setError("Bulk assignment failed.");
    } finally {
      setBulkSubmitting(false);
    }
  }

  // Which rows are allowed to be selected for "Assign Selected"?
  // ✅ Unassigned rows: always selectable
  // ✅ Assigned rows: selectable ONLY when in Edit mode
  const selectableIds = useMemo(() => {
    return rows.map((r, i) => {
      const id = getItemId(r, i);
      const isAssigned = assignedRows.has(id);
      const isEditing = editing.has(id);
      return (!isAssigned || isEditing) ? id : null;
    }).filter(Boolean);
  }, [rows, assignedRows, editing]);

  const allSelectableChecked =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggleOne(id) {
    // Guard: ignore clicks for non-selectable rows
    const isAssigned = assignedRows.has(id);
    const isEditing = editing.has(id);
    if (isAssigned && !isEditing) return;

    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
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

  // Edit toggle (lets you enable selection & editing for assigned rows)
  function toggleEdit(id) {
    setEditing((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setOpenMenuId(null);
  }

  const assignedCount = useMemo(() => rows.filter((r) => !!r.AssignedTester).length, [rows]);
  const totalCount = useMemo(() => rows.length, [rows]);
  const selectedCount = selected.size;
  const busy = loading || bulkSubmitting || Object.values(submitting).some(Boolean);

  if (!request) {
    return <div className="text-muted">Select an assignment to view its details.</div>;
  }

  return (
    <div className="assignment-blue">
      {/* Only table body background tweak (kept from earlier) */}
      <style>{`
        .assignment-blue .table tbody > tr > * { background-color: #EAF2FF !important; }
        .assignment-blue .table tbody > tr:hover > * { background-color: #D6E6FF !important; }
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
            <span className="badge rounded-pill text-bg-primary me-2">Assigned: {assignedCount}</span>
            <span className="badge rounded-pill text-bg-secondary">No. of Test: {totalCount}</span>
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
            <th style={{ width: "6.5rem" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={11} className="text-center">Loading…</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={11} className="text-center">No items.</td></tr>
          ) : (
            rows.map((r, i) => {
              const testId = getItemId(r, i);
              const d = drafts[testId] || {};
              const isAssigned = assignedRows.has(testId);
              const isEditing = editing.has(testId);
              const checked = selected.has(testId);
              const isSubmitting = !!submitting[testId];

              if (!menuRefs.current[testId]) menuRefs.current[testId] = null;

              const viewTester = d.testerId || "—";
              const viewResultDue = d.resultDueDate || "—";
              const viewReportDue = d.reportDueDate || "—";
              const viewComments = d.comments || "—";

              return (
                <tr key={testId} className={isEditing ? "table-active" : undefined}>
                  {/* Select: disabled for Assigned unless editing */}
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
                  <td className="text-primary fw-semibold">{r.BoreholeDepth ?? "—"}</td>
                  <td>{formatDateOnly(r.RequestSubmissionDate)}</td>
                  <td>{formatDateOnly(r.RequestedDueDate)}</td>

                  {/* Editable only when in editing set */}
                  <td>
                    {isEditing ? (
                      <select
                        className="form-select"
                        style={{ fontSize: "1rem" }}
                        value={d.testerId || ""}
                        onChange={(e) => updateDraft(testId, { testerId: e.target.value })}
                      >
                        <option value="">— Select tester —</option>
                        {testers.map((name) => (
                          <option key={name} value={name}>{name}</option>
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
                        onChange={(e) => updateDraft(testId, { resultDueDate: e.target.value })}
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
                        onChange={(e) => updateDraft(testId, { reportDueDate: e.target.value })}
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
                        onChange={(e) => updateDraft(testId, { comments: e.target.value })}
                      />
                    ) : (
                      <span>{viewComments}</span>
                    )}
                  </td>

                  {/* Status */}
                  <td>
                    {isAssigned ? (
                      <span className="badge rounded-pill text-bg-success">Assigned</span>
                    ) : (
                      <span className="badge rounded-pill text-bg-secondary">Unassigned</span>
                    )}
                    {isSubmitting && <span className="ms-2 small text-muted">Saving…</span>}
                  </td>

                  {/* Actions */}
                  <td ref={(el) => (menuRefs.current[testId] = el)}>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId((prev) => (prev === testId ? null : testId));
                        }}
                        aria-haspopup="menu"
                        aria-expanded={openMenuId === testId}
                      >
                        Actions ▾
                      </button>

                      {openMenuId === testId && (
                        <div
                          role="menu"
                          style={{
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            zIndex: 1000,
                            minWidth: "10rem",
                            padding: "0.25rem 0",
                            marginTop: "0.25rem",
                            backgroundColor: "#fff",
                            border: "1px solid rgba(0,0,0,.12)",
                            borderRadius: "12px",
                            boxShadow: "0 12px 24px rgba(0,0,0,.08)"
                          }}
                        >
                          <button
                            type="button"
                            style={{ display: "block", width: "100%", padding: "0.5rem 0.875rem", background: "transparent", border: 0, textAlign: "left" }}
                            onClick={() => handleAssign(testId)}
                          >
                            {isSubmitting ? "Saving…" : "Assign"}
                          </button>
                          <button
                            type="button"
                            style={{ display: "block", width: "100%", padding: "0.5rem 0.875rem", background: "transparent", border: 0, textAlign: "left" }}
                            onClick={() => toggleEdit(testId)}
                            title={isEditing ? "Make read-only" : "Make editable"}
                          >
                            {isEditing ? "Done Editing" : "Edit"}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Bottom bar: Assign Selected */}
      <div className="d-flex justify-content-end mt-3">
        <button
          className="btn btn-primary px-4"
          onClick={handleBulkAssign}
          title={
            selectedCount === 0
              ? "Select at least one test"
              : "Assign using each selected row's inputs"
          }
          disabled={busy || selectedCount === 0}
        >
          {bulkSubmitting ? "Assigning…" : `Assign Selected (${selectedCount})`}
        </button>
      </div>
    </div>
  );
}

export default AssignmentDetails;
