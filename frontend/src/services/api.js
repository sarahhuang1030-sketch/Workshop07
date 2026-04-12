export const BASE_URL = import.meta.env.VITE_API_URL || "";

export async function apiFetch(url, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
        ...(options.headers || {}),
    };

    // Only set Content-Type for normal JSON requests
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers,
    });

    // If token is expired/invalid, remove it so the app stops reusing it
    if (response.status === 401) {
        console.warn("Unauthorized - token may be invalid");
    }

    return response;
}