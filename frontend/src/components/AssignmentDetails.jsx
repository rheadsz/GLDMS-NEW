import React from "react";

function AssignmentDetails({ request }) {
  if (!request) {
    return <div className="text-muted">Select an assignment to view its details.</div>;
  }

  return (
    <div>
      {/* Top info in one row */}
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
          {/* Example static row — replace with mapped data later */}
          <tr>
            <td>{request.TestName ?? "—"}</td>
            <td className="text-danger">{request.SampleId ?? "—"}</td>
            <td>{request.SubmissionDate ?? "—"}</td>
            <td>{request.DueDate ?? "—"}</td>
            <td>
              <select className="form-select form-select-sm">
                <option>Select a Tester</option>
                <option value="staff1">Staff 1</option>
                <option value="staff2">Staff 2</option>
              </select>
            </td>
            <td>
              <input type="date" className="form-control form-control-sm" />
            </td>
            <td>
              <input type="date" className="form-control form-control-sm" />
            </td>
            <td>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Comments"
              />
            </td>
            <td>
              <button className="btn btn-sm btn-outline-primary">Assign</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default AssignmentDetails;
