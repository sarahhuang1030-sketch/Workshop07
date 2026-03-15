export const BASE_URL = import.meta.env.VITE_API_URL || "";

export async function apiFetch(url, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
        ...(options.headers || {}),
        "Content-Type": "application/json",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return fetch(`${BASE_URL}${url}`, {
        ...options,
        headers,
    });
}