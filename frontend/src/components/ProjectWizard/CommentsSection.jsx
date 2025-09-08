import React from "react";

function CommentsSection({ data, onChange }) {
  return (
    <div className="card mb-3">
      <div className="card-header bg-light fw-bold">Additional Comments</div>
      <div className="card-body">
        <div className="mb-3">
          <textarea 
            className="form-control" 
            rows="4" 
            placeholder="Enter any additional comments or special instructions here..."
            value={data.comments || ""}
            onChange={e => onChange({ comments: e.target.value })}
          ></textarea>
        </div>
      </div>
    </div>
  );
}

export default CommentsSection;
