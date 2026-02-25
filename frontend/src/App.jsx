import { useEffect, useState, useRef, useCallback } from "react";
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
    const dbRole = (meResponse?.role ?? "").toLowerCase() || null;

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
        picture: meResponse?.avatarUrl || fallbackPicture,
        raw: meResponse,
    };
}

// ✅ FIX: accept setNeedsRegistration in props
function OAuthSuccessHandler({ finishOAuthLogin }) {
    useEffect(() => {
        finishOAuthLogin?.();
    }, [finishOAuthLogin]);

    return null; // or spinner
}

export default function App() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    const [needsRegistration, setNeedsRegistration] = useState(() => {
        try {
            const raw = sessionStorage.getItem("tc_needs_registration");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    const location = useLocation();

    useEffect(() => {
        let cancelled = false;

        fetch("/api/me", { credentials: "include" })
            .then(async (res) => {
                if (!res.ok) throw new Error("not logged in");
                const me = await res.json();
                if (!cancelled) setUser(mapOAuthMeToUser(me));
            })
            .catch(() => {
                if (!cancelled) setUser(null);
                localStorage.removeItem("tc_user");
            });

        return () => { cancelled = true; };
    }, []);

    const finishOAuthLogin = useCallback(async () => {
        try {
            const res = await fetch("/api/me", { credentials: "include" });
            const contentType = res.headers.get("content-type") || "";

            // 409 = logged in with OAuth but no customer profile yet
            if (res.status === 409) {
                const text = await res.text();
                let data = null;
                try { data = JSON.parse(text); } catch {}

                // build a consistent needsRegistration object
                const nr = {
                    status: data?.status || "NEEDS_REGISTRATION",
                    lookupKey: data?.lookupKey,
                    provider: data?.provider,
                    email: data?.email || data?.attributes?.email || "",
                    attributes: data?.attributes || {},
                };

                sessionStorage.setItem("tc_needs_registration", JSON.stringify(nr));
                setNeedsRegistration(nr);
                navigate("/profile", { replace: true });
                return;
            }

            // not logged in / session missing
            if (!res.ok) {
                setUser(null);
                return;
            }

            // logged in + profile exists
            if (!contentType.includes("application/json")) return;
            const me = await res.json();
            setNeedsRegistration(null);
            sessionStorage.removeItem("tc_needs_registration");
            setUser(mapOAuthMeToUser(me));
            navigate("/profile", { replace: true });
        } catch {
            setUser(null);
        }
    }, [navigate]);

    // useEffect(() => {
    //     let cancelled = false;
    //
    //
    //
    //     async function tryRestoreOAuthSession() {
    //         try {
    //
    //             // ✅ skip while OAuth success handler is already doing /api/me
    //             if (location.pathname === "/oauth-success") return;
    //
    //             // ✅ skip if we already know we need registration
    //             if (needsRegistration) return;
    //
    //             const res = await fetch("/api/me", { credentials: "include" });
    //             if (res.status === 401) {
    //                 if (!cancelled) setUser(null);
    //                 return;
    //             }
    //             const contentType = res.headers.get("content-type") || "";
    //
    //             if (res.status === 409) {
    //                 const data = contentType.includes("application/json")
    //                     ? await res.json().catch(() => null)
    //                     : null;
    //
    //                 if (data?.status === "NEEDS_REGISTRATION") {
    //                     const nr = {
    //                         status: data.status,
    //                         lookupKey: data.lookupKey,
    //                         provider: data.provider,
    //                         email: data.email || data.attributes?.email || "",
    //                         attributes: data.attributes || {},
    //                     };
    //                     sessionStorage.setItem("tc_needs_registration", JSON.stringify(nr));
    //                     setNeedsRegistration(nr);
    //                     navigate("/profile", { replace: true });
    //                 }
    //                 return;
    //             }
    //
    //             if (!res.ok) {
    //                 if (!cancelled) setUser(null);
    //                 return;
    //             }
    //             if (!contentType.includes("application/json")) {
    //                 if (!cancelled) setUser(null);
    //                 return;
    //             }
    //             const me = await res.json();
    //             if (!cancelled) setUser(mapOAuthMeToUser(me));
    //         } catch {
    //             // ignore
    //         }
    //     }
    //
    //     tryRestoreOAuthSession();
    //     return () => { cancelled = true; };
    // }, [navigate, location.pathname, needsRegistration]);



    async function logout() {
        try {
            await fetch("/logout", { method: "POST", credentials: "include" });
        } catch {
            // ignore
        } finally {
            setUser(null);
            setNeedsRegistration(null);
            sessionStorage.removeItem("tc_needs_registration");
            localStorage.removeItem("tc_user"); // harmless if you remove usage
            navigate("/", { replace: true });   // optional
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
                            <ProfilePage
                                user={user}
                                onLogout={logout}
                                needsRegistration={needsRegistration}
                                setNeedsRegistration={setNeedsRegistration}
                            />
                        }
                    />

                    <Route path="/plans" element={<PlansPage />} />
                    <Route path="/cart" element={<ShoppingCartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/login" element={<LoginPage setUser={setUser} />} />

                    <Route
                        path="/register"
                        element={<RegisterPage needsRegistration={null} />}
                    />

                    <Route path="/forgetpassword" element={<ForgetPasswordPage />} />
                    <Route path="/resetpassword" element={<ResetPasswordPage />} />

                    {/* ✅ FIX: pass setNeedsRegistration */}
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