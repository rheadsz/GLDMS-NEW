import React, { useEffect, useState } from "react";

function AssignmentDetails({ request }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Helper: display only YYYY-MM-DD, never time ---
  function formatDateOnly(value) {
    if (!value) return "—";
    // Handle strings like "2025-09-20 00:00:00" or ISO "2025-09-20T00:00:00.000Z"
    const s = String(value);
    if (s.includes("T")) return s.split("T")[0];
    if (s.includes(" ")) return s.split(" ")[0];
    // If it's already YYYY-MM-DD or any other simple string date
    return s;
  }

  // Fetch summary rows (Requested Test, Borehole ID–Depth, Submission, Due)
  useEffect(() => {
    let mounted = true;
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
        if (mounted) setRows(Array.isArray(data.items) ? data.items : []);
      })
      .catch((e) => {
        console.error("summary fetch error:", e);
        if (mounted) setRows([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [request?.RequestID]);

  if (!request) {
    return <div className="text-muted">Select an assignment to view its details.</div>;
  }

  return (
    <div>
      {/* Top info in one row (unchanged) */}
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
            <th>Assigned Tester</th>
            <th>Assigned Result Due Date</th>
            <th>Assigned Report Due Date</th>
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
            rows.map((r, i) => (
              <tr key={i}>
                <td>{r.RequestedTest ?? "—"}</td>
                <td className="text-danger">{r.BoreholeDepth ?? "—"}</td>
                <td>{formatDateOnly(r.RequestSubmissionDate)}</td>
                <td>{formatDateOnly(r.RequestedDueDate)}</td>

                {/* Placeholders (wire later to testers + assign endpoint) */}
                <td>
                  <select className="form-select form-select-sm" disabled>
                    <option>—</option>
                  </select>
                </td>
                <td>
                  <input type="date" className="form-control form-control-sm" disabled />
                </td>
                <td>
                  <input type="date" className="form-control form-control-sm" disabled />
                </td>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Comments"
                    disabled
                  />
                </td>
                <td>
                  <button className="btn btn-sm btn-outline-primary" disabled>
                    Assign
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AssignmentDetails;
