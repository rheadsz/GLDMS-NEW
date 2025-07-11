// components/ManageRequestsSupervisor.jsx
import React, { useEffect, useState } from 'react';

function ManageRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3001/api/supervisor/requests")
      .then(res => res.json())
      .then(data => {
        setRequests(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading requests", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center mt-5">Loading requests...</div>;

  return (
    <div className="container py-4">
      <h3 className="mb-4">Test Requests</h3>
      {requests.map(req => (
        <div key={req.RequestID} className="card mb-4 shadow-sm">
          <div className="card-header bg-light d-flex justify-content-between align-items-center">
            <strong>Request ID: {req.RequestID}</strong>
            <span>Status: <span className="badge bg-secondary">{req.Status}</span></span>
          </div>
          <div className="card-body">
            <p><strong>Requester:</strong> {req.RequesterName} ({req.RequesterEmail})</p>
            <p><strong>Project ID:</strong> {req.ProjectID} | <strong>County:</strong> {req.County} | <strong>Route:</strong> {req.Route}</p>
            <p><strong>Date:</strong> {req.DateOfRequest?.split('T')[0]}</p>

            <h6>Test Samples:</h6>
            <table className="table table-bordered small">
              <thead>
                <tr>
                  <th>Sample</th><th>Borehole</th><th>Depth</th><th>TL101</th><th>Jar</th><th>Qty</th><th>Test ID</th>
                </tr>
              </thead>
              <tbody>
                {req.details.map((d, i) => (
                  <tr key={i}>
                    <td>{d.SampleNumber}</td>
                    <td>{d.BoreholeID}</td>
                    <td>{d.DepthFrom}–{d.DepthTo}</td>
                    <td>{d.TL101No}</td>
                    <td>{d.TubeJar}</td>
                    <td>{d.Quantity}</td>
                    <td>{d.TestTypeID}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Buttons for CRUD */}
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-sm btn-outline-primary">Edit</button>
              <button className="btn btn-sm btn-outline-danger">Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ManageRequests;
