import React, { useEffect, useMemo, useState } from "react";

function AssignmentDetails({ request, testers: testersProp }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Testers as usernames (strings)
  const [testers, setTesters] = useState([]);

  // Per-row draft state and “submitting” busy flags (frontend-only for now)
  const [drafts, setDrafts] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // --- Helpers ---
  function formatDateOnly(value) {
    if (!value) return "—";
    const s = String(value);
    if (s.includes("T")) return s.split("T")[0];
    if (s.includes(" ")) return s.split(" ")[0];
    return s;
  }
  const toYMD = (d) => d.toISOString().slice(0, 10);
  const addDays = (start, days) => {
    const d = new Date(start);
    d.setDate(d.getDate() + days);
    return toYMD(d);
  };
  const nextMonday = (start) => {
    const d = new Date(start);
    const day = d.getDay(); // 0 Sun .. 6 Sat
    const delta = ((8 - day) % 7) || 7; // days to next Monday
    d.setDate(d.getDate() + delta);
    return toYMD(d);
  };

  // Prefer a stable row id
  const getItemId = (r, i) => r.ItemID ?? r.DetailID ?? r.SampleTestID ?? r.TestID ?? r.id ?? i;

  // Load summary rows
  useEffect(() => {
    let mounted = true;
    setError(null);
    setNotice(null);

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

        // Initialize drafts from server values if present
        const nextDrafts = {};
        items.forEach((row, i) => {
          const id = getItemId(row, i);
          nextDrafts[id] = {
            // Keep the key name 'testerId' but store USERNAME (string)
            testerId: row.AssignedTesterId ?? row.AssignedStaff ?? "",
            resultDueDate:
              formatDateOnly(row.AssignedResultDueDate) !== "—"
                ? formatDateOnly(row.AssignedResultDueDate)
                : "",
            reportDueDate:
              formatDateOnly(row.AssignedReportDueDate) !== "—"
                ? formatDateOnly(row.AssignedReportDueDate)
                : "",
            comments: row.AssignmentComments ?? row.Notes ?? "",
          };
        });
        setDrafts(nextDrafts);
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

  // Load testers from backend: /api/testers -> { items: ["User1","User2", ...] }
  useEffect(() => {
    let mounted = true;

    // If testers are passed as prop, normalize to usernames (strings)
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
        // Expecting strings; if objects slip through, coerce to string username
        const usernames = items.map((t) =>
          typeof t === "string" ? t : (t?.UserName || t?.name || String(t))
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

  // Frontend-only “Assign”: just shows a toast and marks row as “saved”
  async function handleAssign(itemId) {
    setError(null);
    const d = drafts[itemId] || {};
    if (!d.testerId) {
      setError("Please select a tester.");
      return;
    }
    if (!d.resultDueDate && !d.reportDueDate) {
      setError("Add a result or report due date.");
      return;
    }
    const isYMD = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
    if (d.resultDueDate && !isYMD(d.resultDueDate)) {
      setError("Result due date must be YYYY-MM-DD.");
      return;
    }
    if (d.reportDueDate && !isYMD(d.reportDueDate)) {
      setError("Report due date must be YYYY-MM-DD.");
      return;
    }

    try {
      setSubmitting((s) => ({ ...s, [itemId]: true }));
      await new Promise((r) => setTimeout(r, 400));
      setNotice("Assignment saved locally (frontend demo). Wire backend next.");
    } finally {
      setSubmitting((s) => ({ ...s, [itemId]: false }));
    }
  }

  function QuickSet({ onPick }) {
    const today = toYMD(new Date());
    return (
      <div className="dropdown d-inline-block ms-1">
        <button
          className="btn btn-sm btn-outline-secondary dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          Quick Set
        </button>
        <ul className="dropdown-menu">
          <li><button className="dropdown-item" onClick={() => onPick(today)}>Today</button></li>
          <li><button className="dropdown-item" onClick={() => onPick(addDays(new Date(), 3))}>+3 days</button></li>
          <li><button className="dropdown-item" onClick={() => onPick(addDays(new Date(), 7))}>+7 days</button></li>
          <li><button className="dropdown-item" onClick={() => onPick(addDays(new Date(), 14))}>+14 days</button></li>
          <li><hr className="dropdown-divider" /></li>
          <li><button className="dropdown-item" onClick={() => onPick(nextMonday(new Date()))}>Next Monday</button></li>
          <li><hr className="dropdown-divider" /></li>
          <li><button className="dropdown-item" onClick={() => onPick("")}>Clear</button></li>
        </ul>
      </div>
    );
  }

  const busy = useMemo(
    () => loading || Object.values(submitting).some(Boolean),
    [loading, submitting]
  );

  if (!request) {
    return <div className="text-muted">Select an assignment to view its details.</div>;
  }

  return (
    <div>
      {/* Alerts */}
      {error && <div className="alert alert-danger py-2 mb-2">{error}</div>}
      {notice && <div className="alert alert-success py-2 mb-2">{notice}</div>}

      {/* Top info */}
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
            <strong>Status:</strong>{" "}
            <span className="text-danger">{request.Status ?? "—"}</span>
          </div>
        </div>
      </div>

      {/* Requested Tests Table */}
      <table className="table table-bordered align-middle">
        <thead className="table-light">
          <tr>
            <th>Requested Test</th>
            <th>Sample (Borehole ID-Depth)</th>
            <th>Request Submission Date</th>
            <th>Requested Due Date</th>
            <th style={{ minWidth: 220 }}>Assigned Tester</th>
            <th style={{ minWidth: 240 }}>Assigned Result Due Date</th>
            <th style={{ minWidth: 240 }}>Assigned Report Due Date</th>
            <th>Note/Comments</th>
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
              const itemId = getItemId(r, i);
              const d = drafts[itemId] || {};
              const isSubmitting = !!submitting[itemId];

              return (
                <tr key={itemId}>
                  <td>{r.RequestedTest ?? "—"}</td>
                  <td className="text-danger">{r.BoreholeDepth ?? "—"}</td>
                  <td>{formatDateOnly(r.RequestSubmissionDate)}</td>
                  <td>{formatDateOnly(r.RequestedDueDate)}</td>

                  {/* Tester (value and label are the username strings) */}
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={d.testerId || ""}
                      onChange={(e) => updateDraft(itemId, { testerId: e.target.value })}
                      disabled={isSubmitting || testers.length === 0}
                    >
                      <option value="">— Select tester —</option>
                      {testers.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </td>

                  {/* Result due */}
                  <td>
                    <div className="d-flex align-items-center">
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={d.resultDueDate || ""}
                        onChange={(e) => updateDraft(itemId, { resultDueDate: e.target.value })}
                        disabled={isSubmitting}
                      />
                      <QuickSet onPick={(val) => updateDraft(itemId, { resultDueDate: val })} />
                    </div>
                  </td>

                  {/* Report due */}
                  <td>
                    <div className="d-flex align-items-center">
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={d.reportDueDate || ""}
                        onChange={(e) => updateDraft(itemId, { reportDueDate: e.target.value })}
                        disabled={isSubmitting}
                      />
                      <QuickSet onPick={(val) => updateDraft(itemId, { reportDueDate: val })} />
                    </div>
                  </td>

                  {/* Comments */}
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Comments"
                      value={d.comments || ""}
                      onChange={(e) => updateDraft(itemId, { comments: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </td>

                  {/* Action */}
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleAssign(itemId)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving…" : "Assign"}
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
