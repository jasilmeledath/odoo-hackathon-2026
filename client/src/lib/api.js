// Thin fetch wrapper: adds the JWT, parses JSON, and throws ApiError with
// per-field messages so forms can show them next to the right input.
export class ApiError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields ?? {};
  }
}

export const tokenStore = {
  get: () => localStorage.getItem('token'),
  set: (token) => (token ? localStorage.setItem('token', token) : localStorage.removeItem('token')),
};

const toQueryString = (query) => {
  const entries = Object.entries(query ?? {}).filter(([, value]) => value !== '' && value != null);
  return entries.length ? `?${new URLSearchParams(entries)}` : '';
};

export async function api(path, { method = 'GET', body, query } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`/api${path}${toQueryString(query)}`, {
      method,
      headers,
      body: body && JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the API running?');
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event('auth:expired'));
    throw new ApiError(response.status, data.error ?? 'Request failed', data.fields);
  }
  return data;
}
