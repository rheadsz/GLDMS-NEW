import React from "react";

function CommentsSection({ data, onChange }) {
  return (
    <div className="card mb-3">
      <div className="card-header bg-light fw-bold">Comments</div>
      <div className="card-body pb-2">
        <textarea
          className="form-control"
          rows={3}
          placeholder="Enter any additional comments here..."
          value={data.comments || ""}
          onChange={e => onChange({ ...data, comments: e.target.value })}
        ></textarea>
      </div>
    </div>
  );
}

export default CommentsSection; 