const API_BASE_URL = process?.env?.API_BASE_URL;
async function fetchJson(path, init = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init.headers || {}
    },
    cache: "no-store"
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed with status ${res.status}`);
  }
  return await res.json();
}
const api = {
  get: fetchJson
};

export { api as a };
