// ═══════════════════════════════════════════════════════════════
// URL del backend de Uzeed en Coolify.
// Esta URL se "quema" en el build. NO necesita .env en el celular.
// Si cambias el dominio del API, cambialo aquí y recompila.
// ═══════════════════════════════════════════════════════════════
const API_BASE = import.meta.env.VITE_API_URL || 'https://api.uzeed.cl';

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message?: string) {
    super(message || code);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = opts;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  const config: RequestInit = {
    method,
    credentials: 'include',
    signal: controller.signal,
    headers: {
      'Accept': 'application/json',
      ...headers,
    },
  };

  if (body && !(body instanceof FormData)) {
    config.headers = { ...config.headers as Record<string, string>, 'Content-Type': 'application/json' };
    config.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    config.body = body;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, config);

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'UNKNOWN' }));
      throw new ApiError(res.status, data.error || 'UNKNOWN', data.message);
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get: <T = unknown>(path: string) => request<T>(path),
  post: <T = unknown>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T = unknown>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T = unknown>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T = unknown>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T = unknown>(path: string, formData: FormData) =>
    request<T>(path, { method: 'POST', body: formData }),
};

export { ApiError, API_BASE };
