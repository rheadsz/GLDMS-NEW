import React from "react";

function RequesterInfoTab({ selectedRequest }) {
  return (
    <table className="table table-sm">
      <tbody>
        <tr><th>Requester Name</th><td>{selectedRequest.RequesterName}</td></tr>
        <tr><th>Test Result Notes</th><td>{selectedRequest.Comments || "—"}</td></tr>
      </tbody>
    </table>
  );
}

export default RequesterInfoTab;
