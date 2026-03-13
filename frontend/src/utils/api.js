// api.js
export const BASE_URL = "http://localhost:8080";

export async function apiFetch(path, options = {}) {
    return fetch(`${BASE_URL}${path}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });
}
