import React, { useState } from "react";

function SignInBox({ onSignIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.userType) {
        onSignIn(data.userType, data.userName, data.email, data.phone); // Pass user info up
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div className="card p-4 shadow-lg" style={{ minWidth: 350, maxWidth: 400, borderRadius: 16 }}>
      <form onSubmit={handleSubmit} className="w-100">
        <div className="mb-3">
          <label htmlFor="username" className="form-label">Username</label>
          <input
            type="text"
            className="form-control"
            id="username"
            required
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            id="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        {error && <div className="text-danger mb-2">{error}</div>}
        <div className="d-flex justify-content-center">
          <button type="submit" className="btn btn-primary btn-sm px-4">Sign In</button>
        </div>
      </form>
    </div>
  );
}

export default SignInBox; 