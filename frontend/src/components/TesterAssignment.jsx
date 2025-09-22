import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AssignmentDetails from "./AssignmentDetails"; // your existing component

export default function TesterAssignment() {
  const { requestId } = useParams();
  const [header, setHeader] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!requestId) return;
    setLoading(true);
    setErr("");
    fetch(`/api/assignments/${requestId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setHeader(data.header || { RequestID: requestId }))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [requestId]);

  return (
    <div className="container py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Tester Assignment (dummy)</h5>
        <Link to="/tester" className="btn btn-sm btn-outline-secondary">
          Change Request
        </Link>
      </div>

      {!requestId && <div className="text-muted">No Request ID provided.</div>}
      {err && <div className="alert alert-danger">{err}</div>}
      {loading ? <div>Loading…</div> : <AssignmentDetails request={header} />}
    </div>
  );
}
