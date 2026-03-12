export async function apiFetch(url, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
        ...(options.headers || {}),
        "Content-Type": "application/json",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return fetch(url, {
        ...options,
        headers,
    });
}