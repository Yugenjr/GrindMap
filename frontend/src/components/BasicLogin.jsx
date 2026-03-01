import React, { useState } from "react";

const BasicLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    // Simulate login success
    setSuccess(true);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f7f7f7" }}>
      <form onSubmit={handleSubmit} style={{ background: "#fff", padding: 32, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", minWidth: 320 }}>
        <h2 style={{ marginBottom: 24, textAlign: "center" }}>Login</h2>
        {error && <div style={{ color: "#e74c3c", marginBottom: 16 }}>{error}</div>}
        {success && <div style={{ color: "#27ae60", marginBottom: 16 }}>Login successful!</div>}
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="email" style={{ display: "block", marginBottom: 4 }}>Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
            autoComplete="username"
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label htmlFor="password" style={{ display: "block", marginBottom: 4 }}>Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
            autoComplete="current-password"
          />
        </div>
        <button type="submit" style={{ width: "100%", padding: 10, background: "#667eea", color: "#fff", border: "none", borderRadius: 4, fontWeight: 600, fontSize: 16, cursor: "pointer" }}>
          Login
        </button>
      </form>
    </div>
  );
};

export default BasicLogin;
