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

// Customer
import CustomerPlan from "./pages/customer/CustomerPlan";
import CustomerBilling from "./pages/customer/CustomerBilling";
import CustomerSupport from "./pages/customer/CustomerSupport";
import CustomerDashboard from "./pages/customer/CustomerDashboard";


// Sales
import SalesDashboard from "./pages/sales/SalesDashboard";
import SalesCustomers from "./pages/sales/SalesCustomers";
import SalesCreateQuote from "./pages/sales/SalesCreateQuote";
import SalesActivations from "./pages/sales/SalesActivations";

// Service
import ServiceWorkOrders from "./pages/service/ServiceWorkOrders";
import ServiceTickets from "./pages/service/ServiceTickets";
import ServiceDashboard from "./pages/service/ServiceDashboard";
// Manager
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerUsers from "./pages/manager/ManagerUsers";
import ManagerReports from "./pages/manager/ManagerReports";
import ManagerPromotions from "./pages/manager/ManagerPromotions";

import RequireRole from "./components/auth/RequireRole";


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

    // on FIRST LOAD, restore user from localStorage and/or cookie session
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

    useEffect(() => {
        if (user) localStorage.setItem("tc_user", JSON.stringify(user));
        else localStorage.removeItem("tc_user");
    }, [user]);

    async function logout() {
        try {
            await fetch("/logout", { method: "POST", credentials: "include" });
            localStorage.removeItem("tc_user");
            setUser(null);
        } catch {
            // ignore
        } finally {
            setUser(null);
            localStorage.removeItem("tc_user");
        }
    }


    return (
        <CartProvider>
            <Routes>
                <Route element={<Layout user={user} setUser={setUser} />}>
                    <Route path="/" element={<HomePage />} />
                    <Route
                        path="/profile"
                        element={
                            <RequireRole user={user} allow={["customer","salesagent","servicetechnician","manager"]}>
                                <ProfilePage user={user} setUser={setUser} onLogout={logout} />
                            </RequireRole>
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

                    {/* Customer */}
                    <Route
                        path="/customer"
                        element={
                            <RequireRole user={user} allow={["customer"]}>
                                <CustomerDashboard />
                            </RequireRole>
                        }
                    />
                    <Route
                        path="/customer/plan"
                        element={
                            <RequireRole user={user} allow={["customer"]}>
                                <CustomerPlan />
                            </RequireRole>
                        }
                    />
                    <Route
                        path="/customer/billing"
                        element={
                            <RequireRole user={user} allow={["customer"]}>
                                <CustomerBilling />
                            </RequireRole>
                        }
                    />
                    <Route
                        path="/customer/support"
                        element={
                            <RequireRole user={user} allow={["customer"]}>
                                <CustomerSupport />
                            </RequireRole>
                        }
                    />

                    {/* Sales (SalesAgent OR Manager) */}
                    <Route
                        path="/sales"
                        element={
                            <RequireRole user={user} allow={["salesagent", "manager"]}>
                                <SalesDashboard />
                            </RequireRole>
                        }
                    />
                    <Route
                        path="/sales/customers"
                        element={
                            <RequireRole user={user} allow={["salesagent", "manager"]}>
                                <SalesCustomers />
                            </RequireRole>
                        }
                    />
                    <Route
                        path="/sales/quotes/new"
                        element={
                            <RequireRole user={user} allow={["salesagent", "manager"]}>
                                <SalesCreateQuote />
                            </RequireRole>
                        }
                    />
                    <Route
                        path="/sales/activations"
                        element={
                            <RequireRole user={user} allow={["salesagent", "manager"]}>
                                <SalesActivations />
                            </RequireRole>
                        }
                    />

                    {/* Service (ServiceTechnician OR Manager) */}
                    <Route
                        path="/service"
                        element={
                            <RequireRole user={user} allow={["servicetechnician", "manager"]}>
                                <ServiceDashboard />
                            </RequireRole>
                        }
                    />
                    <Route
                        path="/service/work-orders"
                        element={
                            <RequireRole user={user} allow={["servicetechnician", "manager"]}>
                                <ServiceWorkOrders />
                            </RequireRole>
                        }
                    />
                    <Route
                        path="/service/tickets"
                        element={
                            <RequireRole user={user} allow={["servicetechnician", "manager"]}>
                                <ServiceTickets />
                            </RequireRole>
                        }
                    />

                    {/* Manager only */}
                    <Route
                        path="/manager"
                        element={
                            <RequireRole user={user} allow={["manager"]}>
                                <ManagerDashboard />
                            </RequireRole>
                        }
                    />
                    <Route
                        path="/manager/users"
                        element={
                            <RequireRole user={user} allow={["manager"]}>
                                <ManagerUsers />
                            </RequireRole>
                        }
                    />
                    <Route
                        path="/manager/reports"
                        element={
                            <RequireRole user={user} allow={["manager"]}>
                                <ManagerReports />
                            </RequireRole>
                        }
                    />
                    <Route
                        path="/manager/promotions"
                        element={
                            <RequireRole user={user} allow={["manager"]}>
                                <ManagerPromotions />
                            </RequireRole>
                        }
                    />

                    {/* Not Found */}
                    <Route path="*" element={<div className="container py-4"><h2>Not Found</h2></div>} />

                </Route>
            </Routes>
        </CartProvider>
    );
}
