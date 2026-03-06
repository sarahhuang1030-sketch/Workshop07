/**
 Description: This is the main App component that sets up routing and user session management for the
 application. It handles OAuth login flow, session hydration, and role-based access control for different
 pages. The app uses React Router for navigation and Context API for cart state management.
 Created by: Sarah
 Created on: February 2026

 **/

import { useEffect, useState, useCallback, useRef } from "react";
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
    const attrs = meResponse?.attributes ?? {};

    const dbCustomerId = meResponse?.customerId ?? null;
    const dbEmployeeId = meResponse?.employeeId ?? null;
    const dbFirstName = meResponse?.firstName ?? null;
    const dbLastName = meResponse?.lastName ?? null;
    const dbEmail = meResponse?.email ?? null;
    const dbUsername = meResponse?.lookupKey ?? meResponse?.username ?? null;
    const dbRoleRaw =
        meResponse?.uaRole ??
        meResponse?.role ??
        meResponse?.authorities?.[0]?.authority ??
        meResponse?.raw?.role ??
        null;

    const dbRole = dbRoleRaw
        ? String(dbRoleRaw)
            .replace(/^ROLE_/i, "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "")
        : null;

    const fullName = attrs.name || "";
    const fallbackFirst =
        attrs.given_name ||
        attrs.first_name ||
        (fullName ? fullName.split(" ")[0] : null) ||
        "—";

    const fallbackLast =
        attrs.family_name ||
        attrs.last_name ||
        (fullName ? fullName.split(" ").slice(1).join(" ") : "") ||
        "";

    const fallbackEmail = attrs.email || "";
    const fallbackUsername = attrs.email || attrs.login || fullName || `${provider} user`;

    const fallbackPicture =
        attrs.picture || attrs.avatar_url || attrs.picture?.data?.url || null;


    return {
        authType: "oauth",
        provider,
        customerId: dbCustomerId,
        employeeId: dbEmployeeId,
        role: dbRole,
        firstName: dbFirstName || fallbackFirst,
        lastName: dbLastName || fallbackLast,
        email: dbEmail || fallbackEmail,
        username: dbUsername || fallbackUsername,
        // prefer backend avatarUrl, then oauth fallbacks
        picture: meResponse?.avatarUrl || meResponse?.oauthPicture || fallbackPicture,
        raw: meResponse,
    };
}

// Calls finishOAuthLogin once when user lands on /oauth-success
function OAuthSuccessHandler({ finishOAuthLogin }) {
    useEffect(() => {
        finishOAuthLogin?.();
    }, [finishOAuthLogin]);
    return null;
}

export default function App() {
    const navigate = useNavigate();
    const location = useLocation();
    const didHydrateRef = useRef(false);
    const refreshInFlightRef = useRef(null);
    const [user, setUser] = useState(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const [needsRegistration, setNeedsRegistration] = useState(() => {
        try {
            const raw = sessionStorage.getItem("tc_needs_registration");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    // ---- Single source of truth: hydrate / refresh session user ----
    const refreshMe = useCallback(async ({ force = false } = {}) => {
        if (isLoggingOut) return null;

        if (!force && refreshInFlightRef.current) {
            return refreshInFlightRef.current;
        }

        const request = (async () => {
            try {
                const res = await fetch("/api/me", { credentials: "include" });

                if (res.status === 401) {
                    setUser(null);
                    return null;
                }

                if (res.status === 409) {
                    const text = await res.text();
                    let data = null;
                    try {
                        data = JSON.parse(text);
                    } catch {}

                    const nr = {
                        status: data?.status || "NEEDS_REGISTRATION",
                        lookupKey: data?.lookupKey,
                        provider: data?.provider,
                        email: data?.email || data?.attributes?.email || "",
                        attributes: data?.attributes || {},
                    };

                    sessionStorage.setItem("tc_needs_registration", JSON.stringify(nr));
                    setNeedsRegistration(nr);
                    setUser(null);
                    return null;
                }

                if (!res.ok) {
                    setUser(null);
                    return null;
                }

                const me = await res.json();
                const mapped = mapOAuthMeToUser(me);
                setUser(mapped);

                setNeedsRegistration(null);
                sessionStorage.removeItem("tc_needs_registration");

                return mapped;
            } catch {
                setUser(null);
                return null;
            } finally {
                refreshInFlightRef.current = null;
            }
        })();

        refreshInFlightRef.current = request;
        return request;
    }, [isLoggingOut]);

    // ---- On initial app load, attempt to hydrate session ----
    useEffect(() => {
        if (didHydrateRef.current) return;
        didHydrateRef.current = true;
        refreshMe();
    }, [refreshMe]);

    // ---- KEY FIX: when navigating to /profile, re-hydrate if user is missing ----
    // This removes the need for manual refresh if the first /api/me call raced.
    useEffect(() => {
        if (location.pathname !== "/profile") return;
        if (user) return;
        if (isLoggingOut) return;

        refreshMe();
    }, [location.pathname, user, isLoggingOut, refreshMe]);

    // Redirect away from /login or /register once we have user
    useEffect(() => {
        if (!user) return;
        if (location.pathname === "/login" || location.pathname === "/register") {
            navigate("/profile", { replace: true });
        }
    }, [user, location.pathname, navigate]);

    const finishOAuthLogin = useCallback(async () => {
        // For OAuth, the session cookie might be set right around redirect time.
        // Running refreshMe() here is the cleanest.
        await refreshMe();
        navigate("/profile", { replace: true });
    }, [refreshMe, navigate]);

    async function logout() {
        setIsLoggingOut(true);

        try {
            await fetch("/logout", { method: "POST", credentials: "include" });
        } catch {}
            setUser(null);
            setNeedsRegistration(null);
            sessionStorage.removeItem("tc_needs_registration");
            localStorage.removeItem("tc_user"); // harmless if unused
            navigate("/", { replace: true });

        setTimeout(() => setIsLoggingOut(false), 300);

    }

    return (
        <CartProvider>
            <Routes>
                <Route element={<Layout user={user} setUser={setUser} onLogout={logout} />}>
                    <Route path="/" element={<HomePage />} />

                    <Route
                        path="/profile"
                        element={
                            <ProfilePage
                                user={user}
                                onLogout={logout}
                                needsRegistration={needsRegistration}
                                setNeedsRegistration={setNeedsRegistration}
                                refreshMe={refreshMe}
                            />
                        }
                    />

                    <Route path="/plans" element={<PlansPage />} />
                    <Route path="/cart" element={<ShoppingCartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/login" element={<LoginPage refreshMe={refreshMe} />} />

                    <Route
                        path="/register"
                        element={<RegisterPage needsRegistration={null} refreshMe={refreshMe} />}
                    />

                    <Route path="/forgetpassword" element={<ForgetPasswordPage />} />
                    <Route path="/resetpassword" element={<ResetPasswordPage />} />

                    <Route
                        path="/oauth-success"
                        element={<OAuthSuccessHandler finishOAuthLogin={finishOAuthLogin} />}
                    />

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

                    {/* Sales */}
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

                    {/* Service */}
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

                    {/* Manager */}
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

                    <Route
                        path="*"
                        element={
                            <div className="container py-4">
                                <h2>Not Found</h2>
                            </div>
                        }
                    />
                </Route>
            </Routes>
        </CartProvider>
    );
}