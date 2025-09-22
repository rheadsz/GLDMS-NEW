import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TesterHome() {
  const [id, setId] = useState("");
  const navigate = useNavigate();

  const go = (e) => {
    e.preventDefault();
    if (!id) return;
    navigate(`/tester/assignments/${id}`);
  };

  return (
    <div className="container py-3">
      <h5 className="mb-3">Tester Page (dummy)</h5>
      <form className="row g-2 align-items-center" onSubmit={go}>
        <div className="col-auto">
          <label className="col-form-label">Request ID</label>
        </div>
        <div className="col-auto">
          <input
            className="form-control"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="e.g. 123"
          />
        </div>
        <div className="col-auto">
          <button className="btn btn-primary" type="submit">
            Open
          </button>
        </div>
      </form>
    </div>
  );
}
