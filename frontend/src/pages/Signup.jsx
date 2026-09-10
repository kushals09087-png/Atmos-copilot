import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

const NAME_STRICT_REGEX = /^[a-zA-Z\s.'-]{2,50}$/;

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleNameChange(e) {
    const raw = e.target.value;
    // Strictly filter out any digits, HTML tags, or forbidden symbols
    const filtered = raw.replace(/[^a-zA-Z\s.'-]/g, "");
    if (raw !== filtered) {
      setNameError("Only alphabetic letters, spaces, dots, and hyphens are permitted.");
      setTimeout(() => setNameError(""), 3000);
    } else {
      setNameError("");
    }
    setForm({ ...form, name: filtered });
  }

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!NAME_STRICT_REGEX.test(form.name.trim())) {
      setError("Name must contain only alphabetic characters, spaces, dots, or hyphens (2 to 50 characters).");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    const hasUpper = /[A-Z]/.test(form.password);
    const hasLower = /[a-z]/.test(form.password);
    const hasDigit = /[0-9]/.test(form.password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(form.password);

    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      setError("Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol.");
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
          Operator Full Name (Letters Only)
          <input
            required
            maxLength={50}
            value={form.name}
            onChange={handleNameChange}
            placeholder="e.g. Dr. Kushal Sharma"
          />
        </label>
        {nameError && <div className="field-hint-warning">{nameError}</div>}

        <label>
          Email Address
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
          Security Key / Password (8+ characters, complex)
          <input
            type="password"
            required
            minLength="8"
            maxLength="128"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="At least 8 chars (A-Z, a-z, 0-9, #$)"
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
        <div className="eyebrow">SECURE ACCESS</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
