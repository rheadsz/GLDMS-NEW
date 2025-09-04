import React, { useEffect, useState } from "react";
import LabManagerTab from "./LabManagerTab";

function AppWithSidebar() {
  const [activeTab, setActiveTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("Newest");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/api/supervisor/requests")
      .then((res) => res.json())
      .then((data) => {
        setRequests(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading requests", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedRequest) {
      fetch(`http://localhost:3001/api/supervisor/due-date/${selectedRequest.RequestID}`)
        .then((res) => res.json())
        .then((data) => {
          setDueDate(data?.DueDate?.split("T")[0] || "");
        })
        .catch((err) => {
          console.error("Error fetching due date:", err);
        });
    }
  }, [selectedRequest]);

  const handleDueDateChange = async (e) => {
    const newDate = e.target.value;
    setDueDate(newDate);

    try {
      const res = await fetch(`http://localhost:3001/api/supervisor/due-date/${selectedRequest.RequestID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: newDate }),
      });

      if (!res.ok) throw new Error("Update failed");
    } catch (err) {
      console.error("Failed to update due date:", err);
      window.alert("Error updating due date.");
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(
        `http://localhost:3001/api/supervisor/update-status/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (res.ok) {
        setRequests((prev) =>
          prev.map((req) =>
            req.RequestID === id ? { ...req, Status: newStatus } : req
          )
        );
        setSelectedRequest((prev) => ({
          ...prev,
          Status: newStatus,
        }));
        window.alert(`Request ${newStatus} successfully.`);
      } else {
        window.alert("Failed to update request status.");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      window.alert("An error occurred while updating status.");
    }
  };

  const filteredRequests = requests
    .filter((req) => {
      if (
        statusFilter !== "All" &&
        req.Status?.toLowerCase() !== statusFilter.toLowerCase()
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) =>
      sortOrder === "Newest" ? b.RequestID - a.RequestID : a.RequestID - b.RequestID
    );

  return (
    <div className="d-flex flex-column" style={{ height: "100vh" }}>
      {/* Top Horizontal Navigation Bar */}
      <div className="bg-light border-bottom d-flex gap-3 px-3 py-2">
        {["requests", "samples", "tests", "staff", "projects"].map((tab) => (
          <button
            key={tab}
            className={`btn btn-sm ${
              activeTab === tab ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "staff" ? "Resources/Staff" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 overflow-auto">
        {activeTab === "requests" && (
          <div className="container-fluid h-100">
            <div className="row h-100 shadow border rounded mt-3">
              {/* 🟡 Narrower Request List Sidebar */}
              <div className="col-md-3 p-0 bg-light border-end d-flex flex-column h-100">
                <div className="p-3 border-bottom bg-white">
                  <h5 className="m-0">Requests</h5>
                </div>

                {/* Filters */}
                <div className="px-3 py-2 border-bottom bg-white">
                  <label className="form-label small mb-1">Status</label>
                  <select
                    className="form-select form-select-sm mb-2"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <label className="form-label small mb-1">Sort by</label>
                  <select
                    className="form-select form-select-sm"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <option value="Newest">Newest First</option>
                    <option value="Oldest">Oldest First</option>
                  </select>
                </div>

                {/* Request List */}
                <div className="flex-grow-1 overflow-auto">
                  <ul className="list-group list-group-flush">
                    {filteredRequests.length === 0 ? (
                      <li className="list-group-item text-muted">No requests found.</li>
                    ) : (
                      filteredRequests.map((req) => {
                        const isActive = selectedRequest?.RequestID === req.RequestID;
                        return (
                          <li
                            key={req.RequestID}
                            className={`list-group-item list-group-item-action ${
                              isActive ? "active text-white" : ""
                            }`}
                            style={{ cursor: "pointer" }}
                            onClick={() => setSelectedRequest(req)}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="fw-bold">Request {req.RequestID}</div>
                              <span
                                className={`badge bg-${
                                  req.Status?.toLowerCase() === "approved"
                                    ? "success"
                                    : req.Status?.toLowerCase() === "pending"
                                    ? "warning"
                                    : req.Status?.toLowerCase() === "rejected"
                                    ? "danger"
                                    : "secondary"
                                }`}
                              >
                                {req.Status || "—"}
                              </span>
                            </div>
                            <div className="text-muted small">{req.ProjectID}</div>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>
              </div>

              {/* 🟢 Wider Request Details Panel */}
              <div className="col-md-9 p-0 h-100">
                <div className="p-4 h-100 overflow-auto">
                  {selectedRequest ? (
                    <>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5 className="mb-0">
                          Request Details - PJT-{selectedRequest.ProjectID}
                        </h5>

                        {/* Compact Due Date Picker */}
                        <div className="d-flex align-items-center gap-2">
                          <label className="form-label mb-0 small">Due Date:</label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            style={{ width: "140px" }}
                            value={dueDate}
                            onChange={handleDueDateChange}
                          />
                        </div>
                      </div>

                      <hr className="my-2" />

                      <LabManagerTab selectedRequest={selectedRequest} />

                      <div className="mt-3 d-flex gap-2">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => updateStatus(selectedRequest.RequestID, "approved")}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => updateStatus(selectedRequest.RequestID, "rejected")}
                        >
                          Reject
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-muted">Select a request to view its details.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab !== "requests" && (
          <div className="p-4">
            <h4>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Panel</h4>
            <p>This tab is under construction. Add your content here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AppWithSidebar;
