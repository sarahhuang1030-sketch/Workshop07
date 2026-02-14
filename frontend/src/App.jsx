import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

import Layout from "./components/layout/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import PlansPage from "./pages/PlansPage";
import ShoppingCartPage from "./pages/ShoppingCartPage";
import CheckoutPage from "./pages/CheckoutPage";
import { CartProvider } from "./context/CartContext";
import ForgetPasswordPage from "./pages/ForgetPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style/style.css";

function mapOAuthMeToUser(meResponse) {
    const provider = meResponse?.provider || "google";
    const a = meResponse?.attributes ?? meResponse ?? {};

    if (provider === "google") {
        const fullName = a.name || "";
        return {
            authType: "oauth",
            provider,
            customerId: a.sub || null,
            firstName: a.given_name || fullName.split(" ")[0] || "—",
            lastName: a.family_name || fullName.split(" ").slice(1).join(" ") || "",
            email: a.email || "",
            username: a.email || fullName || "Google User",
            picture: a.picture || null,
            raw: meResponse,
        };
    }

    if (provider === "github") {
        const fullName = a.name || a.login || "";
        return {
            authType: "oauth",
            provider,
            customerId: String(a.id ?? ""),
            firstName: (a.name || a.login || "—").split(" ")[0],
            lastName: (a.name || "").split(" ").slice(1).join(" "),
            email: a.email || "",
            username: a.login || a.name || "GitHub User",
            picture: a.avatar_url || null,
            raw: meResponse,
        };
    }

    if (provider === "facebook") {
        const fullName = a.name || "";
        return {
            authType: "oauth",
            provider,
            customerId: String(a.id ?? ""),
            firstName: a.first_name || fullName.split(" ")[0] || "—",
            lastName: a.last_name || fullName.split(" ").slice(1).join(" ") || "",
            email: a.email || "",
            username: a.email || fullName || "Facebook User",
            picture: a.picture?.data?.url || null,
            raw: meResponse,
        };
    }

    return { authType: "oauth", provider, raw: meResponse };
}

function OAuthSuccessHandler({ setUser }) {
    const navigate = useNavigate();
    const location = useLocation();

    const redirectTo =
        sessionStorage.getItem("post_login_redirect") ||
        location.state?.from?.pathname ||
        "/";

    useEffect(() => {
        let cancelled = false;

        async function finishOAuthLogin() {
            try {
                const res = await fetch("/api/me", { credentials: "include" });
                const contentType = res.headers.get("content-type") || "";
                if (!res.ok || !contentType.includes("application/json")) {
                    throw new Error("Not logged in (no /api/me JSON).");
                }

                const me = await res.json();
                if (cancelled) return;

                setUser(mapOAuthMeToUser(me));
                sessionStorage.removeItem("post_login_redirect");
                navigate(redirectTo, { replace: true });
            } catch (e) {
                console.error("OAuth success handler failed:", e);
                if (!cancelled) navigate("/login", { replace: true });
            }
        }

        finishOAuthLogin();
        return () => {
            cancelled = true;
        };
    }, [navigate, setUser, redirectTo]);

    return (
        <div style={{ padding: 24 }}>
            <h2>Signing you in…</h2>
            <p>Please wait.</p>
        </div>
    );
}

export default function App() {
    const [user, setUser] = useState(null);
    const [usersList, setUsersList] = useState([]);

    // ✅ Effect 1: on FIRST LOAD, restore user from localStorage and/or cookie session
    useEffect(() => {
        let cancelled = false;

        const saved = localStorage.getItem("tc_user");
        if (saved) {
            try {
                setUser(JSON.parse(saved));
            } catch {
                localStorage.removeItem("tc_user");
            }
        }

        async function tryRestoreOAuthSession() {
            try {
                // if localStorage already had a user, don't overwrite it here
                if (saved) return;

                const res = await fetch("/api/me", { credentials: "include" });
                const contentType = res.headers.get("content-type") || "";
                if (!res.ok || !contentType.includes("application/json")) return;

                const me = await res.json();
                if (cancelled) return;

                setUser(mapOAuthMeToUser(me));
            } catch {
                // ignore
            }
        }

        tryRestoreOAuthSession();

        return () => {
            cancelled = true;
        };
    }, []);

    // ✅ Effect 2: ONLY load /api/users AFTER you are logged in
    useEffect(() => {
        let cancelled = false;

        async function loadUsersListSafely() {
            try {
                const res = await fetch("/api/users", { credentials: "include" });

                if (res.status === 401 || res.status === 403) {
                    if (!cancelled) setUsersList([]);
                    return;
                }

                if (!res.ok) return;

                const ct = res.headers.get("content-type") || "";
                if (!ct.includes("application/json")) return;

                const data = await res.json();
                if (!cancelled) setUsersList(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
            }
        }

        if (user) loadUsersListSafely();
        else setUsersList([]);

        return () => {
            cancelled = true;
        };
    }, [user]);

    return (
        <CartProvider>
            <Routes>
                <Route element={<Layout user={user} setUser={setUser} />}>
                    <Route path="/" element={<HomePage />} />
                    <Route
                        path="/profile"
                        element={
                            <ProfilePage user={user} setUser={setUser} onLogout={() => setUser(null)} />
                        }
                    />
                    <Route path="/plans" element={<PlansPage />} />
                    <Route path="/cart" element={<ShoppingCartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/login" element={<LoginPage setUser={setUser} />} />
                    <Route path="/register" element={<RegisterPage setUser={setUser} />} />
                    <Route path="/forgetpassword" element={<ForgetPasswordPage />} />
                    <Route path="/resetpassword" element={<ResetPasswordPage />} />

                    <Route path="/oauth-success" element={<OAuthSuccessHandler setUser={setUser} />} />
                </Route>
            </Routes>
        </CartProvider>
    );
}
