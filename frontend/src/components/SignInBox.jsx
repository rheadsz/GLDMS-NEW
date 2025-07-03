import React from "react";

function SignInBox({ onSignIn }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add authentication logic here
    onSignIn();
  };

  return (
    <div className="card p-4 shadow-lg" style={{ minWidth: 350, maxWidth: 400, borderRadius: 16 }}>
      <form onSubmit={handleSubmit} className="w-100">
        <div className="mb-3">
          <label htmlFor="username" className="form-label">Username</label>
          <input type="text" className="form-control" id="username" required />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input type="password" className="form-control" id="password" required />
        </div>
        <div className="d-flex justify-content-center">
          <button type="submit" className="btn btn-primary btn-sm px-4">Sign In</button>
        </div>
      </form>
    </div>
  );
}

export default SignInBox; 