// Komunikacja frontendu z backendem przez REST API (JSON)
const BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function request(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Brak połączenia z serwerem. Sprawdź, czy backend jest uruchomiony.");
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `Błąd serwera (${response.status})`);
  }
  return data;
}

const query = (params) => {
  const search = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""));
  const text = search.toString();
  return text ? `?${text}` : "";
};

export const api = {
  me: () => request("/users/me"),

  tasks: {
    list: (params = {}) => request(`/tasks${query(params)}`),
    forDay: (date) => request(`/tasks/today${query({ date })}`),
    create: (task) => request("/tasks", { method: "POST", body: task }),
    update: (id, changes) => request(`/tasks/${id}`, { method: "PUT", body: changes }),
    setStatus: (id, status) => request(`/tasks/${id}/status`, { method: "PATCH", body: { status } }),
    remove: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
  },

  blocks: {
    list: (date) => request(`/time-blocks${query({ date })}`),
    create: (block) => request("/time-blocks", { method: "POST", body: block }),
    update: (id, changes) => request(`/time-blocks/${id}`, { method: "PUT", body: changes }),
    remove: (id) => request(`/time-blocks/${id}`, { method: "DELETE" }),
  },

  sessions: {
    list: (date) => request(`/focus-sessions${query({ date })}`),
    create: (session) => request("/focus-sessions", { method: "POST", body: session }),
    remove: (id) => request(`/focus-sessions/${id}`, { method: "DELETE" }),
  },

  habits: {
    list: (date) => request(`/habits${query({ date })}`),
    create: (habit) => request("/habits", { method: "POST", body: habit }),
    update: (id, changes) => request(`/habits/${id}`, { method: "PUT", body: changes }),
    log: (id, date, completed) => request(`/habits/${id}/log`, { method: "POST", body: { date, completed } }),
    remove: (id) => request(`/habits/${id}`, { method: "DELETE" }),
  },

  summary: (date) => request(`/summary${query({ date })}`),
};
