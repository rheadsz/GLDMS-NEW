import React, { useEffect, useState } from "react";

function TestManagement({ onJumpToSample }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fmtDate = (v) => {
    if (!v) return "—";
    const s = String(v);
    if (s.includes("T")) return s.split("T")[0];
    if (s.includes(" ")) return s.split(" ")[0];
    return s;
  };

  const statusClassFor = (status) => {
    if (!status) return "text-primary fw-semibold";
    const s = String(status).toLowerCase();
    if (s.includes("not received") || s.includes("not accepted") || s.includes("reject")) return "text-danger fw-semibold";
    if (s.includes("accept")) return "text-success fw-semibold";
    if (s.includes("submitted") || s.includes("in progress")) return "text-warning fw-semibold";
    return "text-primary fw-semibold";
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetch('/api/test-management/tests', { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        if (!mounted) return;
        const items = Array.isArray(data?.items) ? data.items : [];
        setRows(items);
      })
      .catch((e) => {
        if (!mounted) return;
        setRows([]);
        setError('Failed to load tests.');
        console.error('test-management fetch error:', e);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  // Clamp page when data changes
  const totalPages = Math.max(1, Math.ceil((rows?.length || 0) / pageSize));
  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pagedRows = rows.slice(start, end);

  return (
    <div className="container-fluid">
      <style>{`
        .tm-table { table-layout: fixed; }
        .tm-table th, .tm-table td { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      `}</style>

      <h4 className="mb-3">Test Management</h4>
      {error && <div className="alert alert-danger py-2 mb-2">{error}</div>}

      <div className="table-responsive">
        <table className="table table-bordered align-middle tm-table">
          <thead className="table-light">
            <tr>
              <th>Tests</th>
              <th>Sample ID (Borehole -Depth)</th>
              <th>Request No.</th>
              <th>Tester</th>
              <th>Results Due Date</th>
              <th>Report Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="text-center" colSpan={7}>Loading…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="text-center text-muted" colSpan={7}>No tests available.</td>
              </tr>
            ) : (
              pagedRows.map((r, idx) => (
                <tr key={r.TestID ?? r.id ?? idx}>
                  <td>{r.RequestedTest ?? "—"}</td>
                  <td>
                    {r.SampleID ? (
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (typeof onJumpToSample === 'function') onJumpToSample(r.SampleID);
                        }}
                        className={statusClassFor(r.DisplayStatus || r.SampleStatus)}
                        title={(r.DisplayStatus || r.SampleStatus) || undefined}
                      >
                        {(() => {
                          const s = String(r.DisplayStatus || r.SampleStatus || '').toLowerCase();
                          const alert = s.includes('not received') || s.includes('not accepted') || s.includes('reject');
                          return (
                            <>
                              {alert && <span className="me-1" aria-label="alert">!</span>}
                              {r.SampleID}
                            </>
                          );
                        })()}
                      </a>
                    ) : (
                      <span>—</span>
                    )}
                    {r.BoreholeDepth ? (
                      <span className={`${statusClassFor(r.DisplayStatus || r.SampleStatus)} ms-1`}>
                        {`(${r.BoreholeDepth})`}
                      </span>
                    ) : null}
                  </td>
                  <td>{r.RequestID ?? "—"}</td>
                  <td>{r.AssignedTester ?? "—"}</td>
                  <td>{fmtDate(r.AssignedResultDueDate)}</td>
                  <td>{fmtDate(r.AssignedReportDueDate)}</td>
                  <td className="text-muted" title="Read-only status">Waiting for tester table</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Pagination controls */}
        {rows.length > pageSize && (
          <div className="d-flex align-items-center gap-2 mt-2">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              « First
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ‹ Prev
            </button>
            <span className="ms-2 me-2">
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next ›
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              Last »
            </button>
            <span className="ms-auto text-muted small">
              Showing {start + 1}-{Math.min(end, rows.length)} of {rows.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestManagement;
