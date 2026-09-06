const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

async function request(path, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("atmos_token") : null;
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const weatherApi = {
  forecast: (lat, lon) =>
    request(`/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`),
  reverse: (lat, lon) =>
    request(`/location/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`),
  search: (q) =>
    request(`/location/search?q=${encodeURIComponent(q)}`)
};

export const authApi = {
  signup: (payload) => request("/auth/signup", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) })
};

export const aiApi = {
  ask: (message, weatherContext) =>
    request("/ai/ask", {
      method: "POST",
      body: JSON.stringify({ message, weatherContext })
    })
};
