const DEFAULT_API_URL = "http://localhost:4000";

export const API_URL: string =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL ??
  DEFAULT_API_URL;

export async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.headers) {
    const optHeaders = options.headers as Record<string, string>;
    for (const [key, value] of Object.entries(optHeaders)) {
      baseHeaders[key] = value;
    }
  }

  if (token) {
    baseHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: baseHeaders,
  });

  if (!res.ok) {
    const text = await res.text();
    let message = `Request failed with status ${res.status}`;
    try {
      const json = JSON.parse(text) as { message?: string };
      if (json.message) {
        message = json.message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}
