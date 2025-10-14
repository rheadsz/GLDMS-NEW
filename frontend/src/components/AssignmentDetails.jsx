import React, { useEffect, useMemo, useState } from "react";

function AssignmentDetails({ request, testers: testersProp }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testers, setTesters] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [assignedRows, setAssignedRows] = useState(() => new Set());

  // --- Helpers ---
  function formatDateOnly(value) {
    if (!value) return "—";
    const s = String(value);
    if (s.includes("T")) return s.split("T")[0];
    if (s.includes(" ")) return s.split(" ")[0];
    return s;
  }
  const getItemId = (r, i) =>
    r.ItemID ?? r.DetailID ?? r.SampleTestID ?? r.TestID ?? r.id ?? i;

  // Submitted heuristic: tweak here if you have a canonical field for "submitted"
  const isSubmitted = (r) => {
    const s =
      r?.Status ?? r?.TestStatus ?? r?.SampleStatus ?? r?.RequestStatus ?? null;
    if (s && String(s).toLowerCase().includes("submitted")) return true;
    if (r?.IsSubmitted === true) return true;
    if (r?.Submitted === true) return true;
    if (r?.SubmissionDate || r?.SubmittedAt) return true;
    if (r?.ResultSubmittedDate || r?.ReportSubmittedDate) return true;
    return false;
  };

  // Load summary rows
  useEffect(() => {
    let mounted = true;
    setError(null);
    setNotice(null);
    setAssignedRows(new Set());

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
        items.forEach((row, i) => {
          const id = getItemId(row, i);
          if (row.AssignedTester) nextAssigned.add(id);
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

  function updateDraft(itemId, patch) {
    setDrafts((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || {}), ...patch },
    }));
  }

  // --- REAL Assign submit ---
  async function handleAssign(testId) {
    setError(null);
    setNotice(null);
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
        body: JSON.stringify({
          assignedTester: d.testerId,
          resultDueDate: d.resultDueDate || null,
          reportDueDate: d.reportDueDate || null,
          notes: d.comments || null,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      await res.json();
      setNotice("Assignment saved ✅");
      setAssignedRows((prev) => new Set([...prev, testId]));
    } catch (e) {
      console.error("assign error:", e);
      setError("Couldn’t save assignment.");
    } finally {
      setSubmitting((s) => ({ ...s, [testId]: false }));
    }
  }

  const busy = useMemo(
    () => loading || Object.values(submitting).some(Boolean),
    [loading, submitting]
  );

  // ---- NEW: per-request status counts (Assigned / Submitted) ----
  const assignedCount = useMemo(
    () => rows.filter((r) => !!r.AssignedTester).length,
    [rows]
  );

  const submittedCount = useMemo(
    () => rows.filter((r) => isSubmitted(r)).length,
    [rows]
  );

  if (!request) {
    return (
      <div className="text-muted">Select an assignment to view its details.</div>
    );
  }

  return (
    <div className="fs-5">
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
          {/* SPLIT STATUS: show counts for this RequestID */}
          <div className="col-md-3 col-sm-6 mb-2">
            <strong>Status:</strong>{" "}
            <span className="badge bg-primary me-2" title="Items with an assigned tester">
              Assigned: {assignedCount}
            </span>
            <span className="badge bg-success" title="Items marked as submitted">
              Submitted: {submittedCount}
            </span>
          </div>
        </div>
      </div>

      <table className="table table-bordered align-middle fs-6">
        <thead className="table-light">
          <tr>
            <th>Requested Test</th>
            <th>Sample (Borehole ID-Depth)</th>
            <th>Request Submission Date</th>
            <th>Requested Due Date</th>
            <th>Assigned Tester</th>
            <th>Result Due</th>
            <th>Report Due</th>
            <th>Comments</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={9} className="text-center">Loading…</td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center">No items.</td>
            </tr>
          ) : (
            rows.map((r, i) => {
              const testId = getItemId(r, i);
              const d = drafts[testId] || {};
              const isSubmitting = !!submitting[testId];
              const assigned = assignedRows.has(testId);

              return (
                <tr key={testId}>
                  <td>{r.RequestedTest ?? "—"}</td>
                  <td className="text-danger">{r.BoreholeDepth ?? "—"}</td>
                  <td>{formatDateOnly(r.RequestSubmissionDate)}</td>
                  <td>{formatDateOnly(r.RequestedDueDate)}</td>

                  <td>
                    <select
                      className="form-select"
                      style={{ fontSize: "1rem" }}
                      value={d.testerId || ""}
                      onChange={(e) =>
                        updateDraft(testId, { testerId: e.target.value })
                      }
                      disabled={isSubmitting || testers.length === 0 || assigned}
                    >
                      <option value="">— Select tester —</option>
                      {testers.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <input
                      type="date"
                      className="form-control"
                      style={{ fontSize: "1rem" }}
                      value={d.resultDueDate || ""}
                      onChange={(e) =>
                        updateDraft(testId, { resultDueDate: e.target.value })
                      }
                      disabled={isSubmitting || assigned}
                    />
                  </td>

                  <td>
                    <input
                      type="date"
                      className="form-control"
                      style={{ fontSize: "1rem" }}
                      value={d.reportDueDate || ""}
                      onChange={(e) =>
                        updateDraft(testId, { reportDueDate: e.target.value })
                      }
                      disabled={isSubmitting || assigned}
                    />
                  </td>

                  <td>
                    <input
                      type="text"
                      className="form-control"
                      style={{ fontSize: "1rem" }}
                      placeholder="Comments"
                      value={d.comments || ""}
                      onChange={(e) =>
                        updateDraft(testId, { comments: e.target.value })
                      }
                      disabled={isSubmitting || assigned}
                    />
                  </td>

                  <td>
                    <button
                      className="btn btn-lg btn-outline-primary w-100"
                      onClick={() => handleAssign(testId)}
                      disabled={isSubmitting || assigned}
                      style={{ fontSize: "1rem" }}
                    >
                      {assigned ? "Assigned" : isSubmitting ? "Saving…" : "Assign"}
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AssignmentDetails;
