/**
 Description: This is the main App component that sets up routing and user session management for the
 application. It handles OAuth login flow, session hydration, and role-based access control for different
 pages. The app uses React Router for navigation and Context API for cart state management.
 Created by: Sarah
 Created on: February 2026

 **/

import { useEffect, useState, useCallback, useRef } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

import PhonesPage from "./pages/PhonesPage";
import PhoneDetailsPage from "./pages/PhoneDetailsPage";
import Layout from "./components/layout/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import PlansPage from "./pages/PlansPage";
import ShoppingCartPage from "./pages/ShoppingCartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ForgetPasswordPage from "./pages/ForgetPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import ChangePasswordFirstLogin from "./pages/ChangePasswordFirstLogin";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style/style.css";
import DeviceFinancing from "./pages/DeviceFinancing";

// Customer
import CustomerPlan from "./pages/customer/CustomerPlan";
import CustomerBilling from "./pages/customer/CustomerBilling";
import CustomerSupport from "./pages/customer/CustomerSupport";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerInvoice from "./pages/customer/CustomerInvoice";
import CustomerQuotes from "./pages/customer/CustomerQuotes.jsx";
import CustomerBillingHistory from "./pages/customer/CustomerBillingHistory.jsx";

// Sales
import SalesDashboard from "./pages/sales/SalesDashboard";
import SalesCustomers from "./pages/sales/SalesCustomers";
import SalesQuotes from "./pages/sales/SalesQuotes.jsx";
import EditQuote from "./pages/sales/EditQuote";
import SalesActivations from "./pages/sales/SalesActivations";
import SalesBilling from "./pages/sales/SalesBilling";
import SalesSubscriptions from "./pages/sales/SalesSubscription";
import SalesAddons from "./pages/sales/SalesAddon";
import SalesPlanFeatures from "./pages/sales/SalesPlanFeature";
import SalesAudit from "./pages/sales/SalesAudit";
import SalesEmployeeSales from "./pages/sales/SalesEmployeeSales";
import SalesLocation from "./pages/sales/SalesLocation";
// import SalesPastDue from "./pages/sales/SalesPastDue";
import CreateBundle from "./pages/sales/CreateBundle";
import SalesService from "./pages/sales/SalesServices.jsx";

// Service
import ServiceWorkOrders from "./pages/service/ServiceWorkOrders";
import ServiceTickets from "./pages/service/ServiceTickets";
import ServiceDashboard from "./pages/service/ServiceDashboard";

// Manager
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerUsers from "./pages/manager/ManagerUsers";
import ManagerEmployee from "./pages/manager/ManagerEmployee";
import ManagerPlan from "./pages/manager/ManagerPlan";
import ManagerAddon from "./pages/manager/ManagerAddon";
import ManagerReport from "./pages/manager/ManagerReport";
import ManagerSubscription from "./pages/manager/ManagerSubscription";
import ManagerAudit from "./pages/manager/ManagerAudit";
import ManagerPlanFeature from "./pages/manager/ManagerPlanFeature";
import ManagerLocation from "./pages/manager/ManagerLocation";
import ManagerServices from "./pages/manager/ManagerServices";
import ManagerEmployeeSales from "./pages/manager/ManagerEmployeeSales";

import RequireRole from "./components/auth/RequireRole";
import { apiFetch } from "./services/api";
import RequireAuth from "./components/auth/RequireAuth";


function mapMeToUser(meResponse) {
    const isOAuth = !!meResponse?.provider || !!meResponse?.attributes;

    const dbCustomerId = meResponse?.customerId ?? null;
    const dbEmployeeId = meResponse?.employeeId ?? null;
    const dbFirstName = meResponse?.firstName ?? null;
    const dbLastName = meResponse?.lastName ?? null;
    const dbEmail = meResponse?.email ?? null;
    const dbUsername =
        meResponse?.lookupKey ??
        meResponse?.username ??
        meResponse?.name ??
        null;

    const dbRoleRaw =
        meResponse?.uaRole?.roleName ??
        meResponse?.uaRole ??
        meResponse?.role?.roleName ??
        meResponse?.role ??
        meResponse?.authorities?.[0]?.authority ??
        meResponse?.raw?.role?.roleName ??
        meResponse?.raw?.role ??
        null;

    const dbRole = dbRoleRaw
        ? String(dbRoleRaw)
            .replace(/^ROLE_/i, "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "")
        : null;

    const attrs = meResponse?.attributes ?? {};
    const fullName = attrs.name || meResponse?.name || "";

    const fallbackFirst =
        attrs.given_name ||
        attrs.first_name ||
        (fullName ? fullName.split(" ")[0] : null) ||
        "";

    const fallbackLast =
        attrs.family_name ||
        attrs.last_name ||
        (fullName ? fullName.split(" ").slice(1).join(" ") : "") ||
        "";

    const fallbackEmail = attrs.email || "";
    const fallbackUsername = attrs.email || attrs.login || fullName || dbUsername || "";
    const fallbackPicture =
        attrs.picture || attrs.avatar_url || attrs.picture?.data?.url || null;

    return {
        authType: isOAuth ? "oauth" : "local",
        provider: isOAuth ? meResponse?.provider || null : null,
        customerId: dbCustomerId,
        employeeId: dbEmployeeId,
        role: dbRole,
        firstName: dbFirstName || fallbackFirst,
        lastName: dbLastName || fallbackLast,
        email: dbEmail || fallbackEmail,
        username: dbUsername || fallbackUsername,
        picture: meResponse?.avatarUrl || meResponse?.oauthPicture || fallbackPicture,
        raw: meResponse,
    };
}

function OAuthSuccessHandler({ finishOAuthLogin }) {
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get("token");

        if (token) {
            localStorage.setItem("token", token);
        }

        finishOAuthLogin?.();
    }, [finishOAuthLogin, location.search]);

    return null;
}

export default function App() {
    const navigate = useNavigate();
    const location = useLocation();
    const didHydrateRef = useRef(false);
    const refreshInFlightRef = useRef(null);

    const [user, setUser] = useState(() => {
        try {
            const raw = localStorage.getItem("tc_user");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [authReady, setAuthReady] = useState(false);
    const [needsRegistration, setNeedsRegistration] = useState(() => {
        try {
            const raw = sessionStorage.getItem("tc_needs_registration");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    const refreshMe = useCallback(async ({ force = false } = {}) => {
        if (isLoggingOut) return null;

        if (!force && refreshInFlightRef.current) {
            return refreshInFlightRef.current;
        }

        const request = (async () => {
            try {
                const res = await apiFetch("/api/me");

                if (res.status === 401) {
                    setUser(null);
                    localStorage.removeItem("tc_user");
                    localStorage.removeItem("token");
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
                    localStorage.removeItem("tc_user");
                    return null;
                }

                if (!res.ok) {
                    setUser(null);
                    return null;
                }

                const me = await res.json();
                const mapped = mapMeToUser(me);

                setUser(mapped);
                localStorage.setItem("tc_user", JSON.stringify(mapped));

                setNeedsRegistration(null);
                sessionStorage.removeItem("tc_needs_registration");

                return mapped;
            } catch {
                setUser(null);
                localStorage.removeItem("tc_user");
                return null;
            } finally {
                refreshInFlightRef.current = null;
            }
        })();

        refreshInFlightRef.current = request;
        return request;
    }, [isLoggingOut]);

    useEffect(() => {
        if (didHydrateRef.current) return;
        didHydrateRef.current = true;

        (async () => {
            await refreshMe();
            setAuthReady(true);
        })();
    }, [refreshMe]);

    useEffect(() => {
        if (!user) return;
        if (location.pathname !== "/login") return;

        const shouldOpenReview = localStorage.getItem("openReviewAfterLogin");

        if (shouldOpenReview === "true") {
            navigate("/", { replace: true, state: { openReviewModal: true } });
            return;
        }

        if (user.role === "manager") {
            navigate("/manager", { replace: true });
        } else if (user.role === "salesagent") {
            navigate("/sales", { replace: true });
        } else if (user.role === "servicetechnician") {
            navigate("/service", { replace: true });
        } else if (user.customerId) {
            navigate("/profile", { replace: true });
        }
    }, [user, location.pathname, navigate]);

    const finishOAuthLogin = useCallback(async () => {
        await refreshMe();

        const shouldOpenReview = localStorage.getItem("openReviewAfterLogin");

        if (shouldOpenReview === "true") {
            navigate("/", { replace: true, state: { openReviewModal: true } });
        } else {
            navigate("/profile", { replace: true });
        }
    }, [refreshMe, navigate]);

    async function logout() {
        setIsLoggingOut(true);

        try {
            await apiFetch("/api/auth/logout", { method: "POST" });
        } catch {
        } finally {
            setUser(null);
            setNeedsRegistration(null);
            sessionStorage.removeItem("tc_needs_registration");
            localStorage.removeItem("tc_user");
            localStorage.removeItem("token");
            navigate("/", { replace: true });
            setTimeout(() => setIsLoggingOut(false), 300);
        }
    }

    return (
        <Routes>
            <Route element={<Layout user={user} setUser={setUser} onLogout={logout} />}>
                <Route path="/" element={<HomePage />} />

                <Route path="/device-financing" element={<DeviceFinancing />} />

                <Route
                    path="/profile"
                    element={
                        <RequireAuth user={user} authReady={authReady}>
                            <ProfilePage
                                user={user}
                                onLogout={logout}
                                needsRegistration={needsRegistration}
                                setNeedsRegistration={setNeedsRegistration}
                                refreshMe={refreshMe}
                            />
                        </RequireAuth>
                    }
                />

                <Route path="/plans" element={<PlansPage />} />
                <Route path="/phones" element={<PhonesPage />} />
                <Route path="/phones/:id" element={<PhoneDetailsPage />} />
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

                <Route
                    path="/customer"
                    element={
                        <RequireRole user={user} allow={["customer"]} authReady={authReady}>
                            <CustomerDashboard />
                        </RequireRole>
                    }
                />
                <Route
                    path="/customer/billing/history"
                    element={<CustomerBillingHistory />}
                />
                <Route
                    path="/customer/quotes"
                    element={
                        <RequireRole user={user} allow={["customer"]} authReady={authReady}>
                            <CustomerQuotes />
                        </RequireRole>
                    }
                />
                <Route
                    path="/customer/plan"
                    element={
                        <RequireRole user={user} allow={["customer"]} authReady={authReady}>
                            <CustomerPlan />
                        </RequireRole>
                    }
                />
                <Route
                    path="/customer/billing"
                    element={
                        <RequireRole user={user} allow={["customer"]} authReady={authReady}>
                            <CustomerBilling />
                        </RequireRole>
                    }
                />
                <Route
                    path="/customer/support"
                    element={
                        <RequireRole user={user} allow={["customer"]} authReady={authReady}>
                            <CustomerSupport />
                        </RequireRole>
                    }
                />
                <Route
                    path="/customer/invoice/:invoiceNumber"
                    element={
                        <RequireRole user={user} allow={["customer"]} authReady={authReady}>
                            <CustomerInvoice />
                        </RequireRole>
                    }
                />

                <Route
                    path="/sales"
                    element={
                        <RequireRole user={user} allow={["salesagent", "manager"]} authReady={authReady}>
                            <SalesDashboard />
                        </RequireRole>
                    }
                />
                <Route
                    path="/sales/history"
                    element={
                        <RequireRole user={user} allow={["salesagent", "manager"]} authReady={authReady}>
                            <SalesBilling />
                        </RequireRole>
                    }
                />
                <Route
                    path="/sales/customers"
                    element={
                        <RequireRole user={user} allow={["salesagent", "manager"]} authReady={authReady}>
                            <SalesCustomers />
                        </RequireRole>
                    }
                />
                <Route
                    path="/sales/quotes/new"
                    element={
                        <RequireRole user={user} allow={["salesagent", "manager"]} authReady={authReady}>
                            <SalesQuotes />
                        </RequireRole>
                    }
                />
                <Route path="/sales/quotes/:id/edit" element={<EditQuote />} />
                <Route
                    path="/sales/activations"
                    element={
                        <RequireRole user={user} allow={["salesagent", "manager"]} authReady={authReady}>
                            <SalesActivations />
                        </RequireRole>
                    }
                />

                <Route
                    path="/sales/quotes"
                    element={
                        <RequireRole user={user} allow={["salesagent", "manager"]} authReady={authReady}>
                            <SalesQuotes />
                        </RequireRole>
                    }
                />
                <Route
                    path="/sales/bundle/create"
                    element={
                        <RequireRole user={user} allow={["salesagent", "manager"]} authReady={authReady}>
                            <CreateBundle />
                        </RequireRole>
                    }
                />
                <Route
                    path="/sales/services"
                    element={
                        <RequireRole user={user} allow={["salesagent", "manager"]} authReady={authReady}>
                            <SalesService />
                        </RequireRole>
                    }
                />
                <Route
                    path="/sales/subscriptions"
                    element={
                        <RequireRole user={user} allow={["salesagent", "manager"]} authReady={authReady}>
                            <SalesSubscriptions />
                        </RequireRole>
                    }
                />

                <Route
                    path="/sales/addons"
                    element={
                        <RequireRole user={user} allow={["salesagent", "manager"]} authReady={authReady}>
                            <SalesAddons />
                        </RequireRole>
                    }
                />

                <Route
                    path="/sales/planfeatures"
                    element={
                        <RequireRole user={user} allow={["salesagent", "manager"]} authReady={authReady}>
                            <SalesPlanFeatures />
                        </RequireRole>
                    }
                />

                <Route
                    path="/sales/audit"
                    element={
                        <RequireRole user={user} allow={["salesagent", "manager"]} authReady={authReady}>
                            <SalesAudit />
                        </RequireRole>
                    }
                />

                <Route
                    path="/sales/employee-sales"
                    element={
                        <RequireRole user={user} allow={["salesagent", "manager"]} authReady={authReady}>
                            <SalesEmployeeSales />
                        </RequireRole>
                    }
                />

                <Route
                    path="/sales/location"
                    element={
                        <RequireRole user={user} allow={["salesagent", "manager"]} authReady={authReady}>
                            <SalesLocation />
                        </RequireRole>
                    }
                />

                <Route
                    path="/service"
                    element={
                        <RequireRole user={user} allow={["servicetechnician", "manager"]} authReady={authReady}>
                            <ServiceDashboard />
                        </RequireRole>
                    }
                />
                <Route
                    path="/service/work-orders"
                    element={
                        <RequireRole user={user} allow={["servicetechnician", "manager"]} authReady={authReady}>
                            <ServiceWorkOrders />
                        </RequireRole>
                    }
                />
                <Route
                    path="/service/tickets"
                    element={
                        <RequireRole user={user} allow={["servicetechnician", "manager"]} authReady={authReady}>
                            <ServiceTickets />
                        </RequireRole>
                    }
                />

                <Route
                    path="/manager"
                    element={
                        <RequireRole user={user} allow={["manager"]} authReady={authReady}>
                            <ManagerDashboard />
                        </RequireRole>
                    }
                />
                <Route
                    path="/manager/users"
                    element={
                        <RequireRole user={user} allow={["manager"]} authReady={authReady}>
                            <ManagerUsers />
                        </RequireRole>
                    }
                />
                <Route
                    path="/manager/employee"
                    element={
                        <RequireRole user={user} allow={["manager"]} authReady={authReady}>
                            <ManagerEmployee />
                        </RequireRole>
                    }
                />
                <Route
                    path="/manager/plan"
                    element={
                        <RequireRole user={user} allow={["manager"]} authReady={authReady}>
                            <ManagerPlan />
                        </RequireRole>
                    }
                />
                <Route
                    path="/manager/addons"
                    element={
                        <RequireRole user={user} allow={["manager"]} authReady={authReady}>
                            <ManagerAddon />
                        </RequireRole>
                    }
                />
                <Route
                    path="/manager/reports"
                    element={
                        <RequireRole user={user} allow={["manager"]} authReady={authReady}>
                            <ManagerReport />
                        </RequireRole>
                    }
                />
                <Route
                    path="/manager/subscriptions"
                    element={
                        <RequireRole user={user} allow={["manager"]} authReady={authReady}>
                            <ManagerSubscription />
                        </RequireRole>
                    }
                />
                <Route
                    path="/manager/audit"
                    element={
                        <RequireRole user={user} allow={["manager"]} authReady={authReady}>
                            <ManagerAudit />
                        </RequireRole>
                    }
                />
                <Route
                    path="/manager/planfeatures"
                    element={
                        <RequireRole user={user} allow={["manager"]} authReady={authReady}>
                            <ManagerPlanFeature />
                        </RequireRole>
                    }
                />
                <Route
                    path="/manager/location"
                    element={
                        <RequireRole user={user} allow={["manager"]} authReady={authReady}>
                            <ManagerLocation />
                        </RequireRole>
                    }
                />
                <Route
                    path="/manager/services"
                    element={
                        <RequireRole user={user} allow={["manager"]} authReady={authReady}>
                            <ManagerServices />
                        </RequireRole>
                    }
                />
                <Route
                    path="/manager/employee-sales"
                    element={
                        <RequireRole user={user} allow={["manager"]} authReady={authReady}>
                            <ManagerEmployeeSales />
                        </RequireRole>
                    }
                />

                <Route
                    path="/change-password-first-login"
                    element={<ChangePasswordFirstLogin refreshMe={refreshMe} />}
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
    );
}