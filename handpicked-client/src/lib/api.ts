const API_BASE_URL =
  (process?.env?.PUBLIC_API_BASE_URL as string);

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

export const api = {
  get: fetchJson,
};
