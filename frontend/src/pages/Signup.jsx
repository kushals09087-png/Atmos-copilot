import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const r = await authApi.signup(form);
      localStorage.setItem("atmos_token", r.token);
      if (r.user) localStorage.setItem("atmos_user", JSON.stringify(r.user));
      window.dispatchEvent(new Event("atmos-auth-change"));
      navigate("/weather");
    } catch (e) {
      setError(e.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Build a personal weather intelligence experience">
      <form className="auth-form" onSubmit={submit}>
        <label>
          Name
          <input
            required
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
          />
        </label>
        <label>
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="user@example.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength="6"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="At least 6 characters"
          />
        </label>
        {error && <div className="error-box">{error}</div>}
        <button className="btn full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-page">
      <div className="auth-card glass">
        <div className="brand auth-brand">☀️ ATMOS <b>COPILOT</b></div>
        <div className="eyebrow">GET STARTED</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
