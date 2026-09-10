import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const r = await authApi.login({
        email: form.email.trim().toLowerCase(),
        password: form.password
      });
      localStorage.setItem("atmos_token", r.token);
      if (r.user) localStorage.setItem("atmos_user", JSON.stringify(r.user));
      window.dispatchEvent(new Event("atmos-auth-change"));
      navigate("/weather");
    } catch (e) {
      setError(e.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Continue to your weather intelligence">
      <form className="auth-form" onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            required
            maxLength={100}
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value.trim() })}
            placeholder="user@example.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={8}
            maxLength={128}
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
        </label>
        {error && <div className="error-box">{error}</div>}
        <button className="btn full" disabled={loading}>
          {loading ? "Signing in..." : "Log in"}
        </button>
        <p className="auth-switch">
          New to Atmos? <Link to="/signup">Create account</Link>
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
        <div className="eyebrow">SECURE ACCESS</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
