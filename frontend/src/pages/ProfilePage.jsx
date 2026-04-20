/**
 * Description: Profile page, showing user info, rewards points, subscription status,
 * and billing details. Allows editing of profile, managing subscription, and
 * updating billing info. Displays a top alert if profile/billing/payment info is incomplete.
 * Created by: Sarah
 * Created on: February 2026
 *
 * Modified by: Sherry
 * Modified on: March 2026
 **/

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Container, Row, Col, Card, Button, Spinner, Alert, Toast, ToastContainer } from "react-bootstrap";
import { Star, Crown, AlertTriangle, MapPin, CreditCard, Package } from "lucide-react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import {
    AvatarCard,
    BillingCard,
    BillingModal,
    PaymentModal,
    SubscriptionPage,
    DeleteProfileModal,
    BillingAddressCard
} from "../components";
import { apiFetch } from "../services/api";
import CustomerQuotes from "../pages/customer/CustomerQuotes";
import "../style/style.css";

const POINTS_PER_DOLLAR   = 1;
const BRONZE_REQUIREMENT  = 5000;
const BRONZE_DISCOUNT_CAP = 1000;

const formatMoney = (n) =>
    n == null || Number.isNaN(Number(n))
        ? "—"
        : Number(n).toLocaleString(undefined, { style: "currency", currency: "CAD" });

export default function ProfilePage({ user: userProp, onLogout, darkMode = false, refreshMe }) {
    const navigate = useNavigate();
    const location = useLocation();

    /* ── dynamic class helpers ── */
    const mutedClass = darkMode ? "tc-muted-dark" : "tc-muted-light";
    const cardBase   = darkMode ? "tc-card-dark"  : "bg-white";

    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState("");

    const [showInactiveToast, setShowInactiveToast] = useState(false);
    const [inactiveMessage,   setInactiveMessage]   = useState("");

    const [profile, setProfile] = useState({
        customerId: null, employeeId: null,
        firstName: "—", lastName: "", email: "—", phone: "—",
        points: 0, totalSpent: 0, avatarUrl: null, role: null,
        plan:    { status: "Inactive", name: "—", monthlyPrice: null, startedAt: null, features: [], addOns: [] },
        billing: { nextBillAmount: null, nextBillDate: null, paymentMethod: {}, address: {}, invoices: [] },
    });

    const [quotes,          setQuotes]          = useState([]);
    const [currentPlan,     setCurrentPlan]     = useState(null); // loaded from /api/plans/my
    const [showBillingModal,  setShowBillingModal]  = useState(false);
    const [showDeleteModal,   setShowDeleteModal]   = useState(false);
    const [showPaymentModal,  setShowPaymentModal]  = useState(false);
    const loadedBillingForRef = useRef(null);

    /* ── computed points & tier ── */
    const computedPoints = useMemo(() => {
        const invoices = profile.billing?.invoices || [];
        const totalSpentFromInvoices = invoices.reduce((sum, inv) => {
            if (inv.status !== "PAID") return sum;
            return sum + (Number(inv.total) || 0);
        }, 0);
        return Math.floor(totalSpentFromInvoices * POINTS_PER_DOLLAR);
    }, [profile.billing?.invoices]);

    const tierInfo = useMemo(() => {
        const points    = computedPoints || 0;
        const isBronze  = points >= BRONZE_REQUIREMENT;
        const progress  = Math.min(100, Math.round((points / BRONZE_REQUIREMENT) * 100));
        const remaining = Math.max(0, BRONZE_REQUIREMENT - points);
        return { isBronze, progress, remaining };
    }, [computedPoints]);

    /* ── data loaders (unchanged) ── */
    const loadInvoices = useCallback(async () => {
        try {
            const res = await apiFetch("/api/invoices/user/all");
            if (res.status === 401 || !res.ok) return;
            const data = await res.json();
            setProfile(prev => ({ ...prev, billing: { ...prev.billing, invoices: Array.isArray(data) ? data : [] } }));
        } catch (err) { console.error("Failed to load invoices", err); }
    }, []);

    const loadQuotes = useCallback(async () => {
        try {
            const res = await apiFetch("/api/quotes/my");
            if (!res.ok) return;
            const data = await res.json();
            setQuotes(Array.isArray(data) ? data : []);
        } catch (err) { console.error("Failed to load quotes", err); }
    }, []);

    const loadCurrentPlan = useCallback(async () => {
        try {
            // Fetch the current user's active subscription plan
            const res = await apiFetch("/api/plans/my");
            if (res.status === 404 || res.status === 204) { setCurrentPlan(null); return; }
            if (!res.ok) return;
            const data = await res.json();
            // Support both single object and array response shapes
            const plan = Array.isArray(data) ? data[0] : data;
            setCurrentPlan(plan ?? null);
        } catch (err) {
            console.error("Failed to load current plan", err);
            // Fallback: derive hasPlan from invoices (any invoice = had a plan)
            setCurrentPlan("fallback");
        }
    }, []);

    const loadAddress = useCallback(async () => {
        try {
            const res = await apiFetch("/api/billing/address");
            if (res.status === 401) return;
            if ([404, 409].includes(res.status)) { setProfile(prev => ({ ...prev, billing: { ...prev.billing, address: {} } })); return; }
            if (!res.ok) return;
            const data = await res.json();
            const address = { street1: data.street1, street2: data.street2, city: data.city, province: data.province, postalCode: data.postalCode, country: data.country };
            setProfile(prev => ({ ...prev, billing: { ...prev.billing, address } }));
        } catch (err) { console.error("Failed to load billing address", err); }
    }, []);

    const loadPaymentMethod = useCallback(async () => {
        try {
            const res = await apiFetch("/api/billing/payment/all");
            if (res.status === 401) return;
            if (!res.ok) { setProfile(prev => ({ ...prev, billing: { ...prev.billing, paymentMethod: {} } })); return; }
            const data = await res.json();
            if (!Array.isArray(data) || data.length === 0) { setProfile(prev => ({ ...prev, billing: { ...prev.billing, paymentMethod: {} } })); return; }
            const pm = data.find(c => c.isDefault) || data[0];
            const paymentMethod = { method: pm.method ?? "Card", last4: pm.last4 ?? "—", displayCard: pm.displayCard ?? `**** **** **** ${pm.last4}`, holderName: pm.holderName, expiryMonth: pm.expiryMonth, expiryYear: pm.expiryYear };
            setProfile(prev => ({ ...prev, billing: { ...prev.billing, paymentMethod } }));
        } catch (err) { console.error("Failed to load payment method", err); }
    }, []);

    useEffect(() => {
        const stateMessage = location.state?.inactiveMessage;
        const savedMessage = sessionStorage.getItem("inactive_dashboard_message");
        const message = stateMessage || savedMessage;
        if (message) {
            setInactiveMessage(message);
            setShowInactiveToast(true);
            sessionStorage.removeItem("inactive_dashboard_message");
            if (stateMessage) navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    useEffect(() => {
        if (!userProp) { setLoading(false); return; }
        setLoading(true);
        const phone =
            userProp.homePhone ?? userProp.raw?.phone ?? userProp.raw?.homePhone ??
            userProp.raw?.mobilePhone ?? userProp.raw?.cellPhone ?? userProp.raw?.customerPhone ??
            userProp.phone ?? "—";
        const rawRole = userProp.role ?? null;
        const normalizedRole =
            rawRole === "Manager" || rawRole === "Sales Agent" || rawRole === "Service Technician" ? "EMPLOYEE"
                : rawRole === "Customer" ? "CUSTOMER"
                    : userProp.employeeId ? "EMPLOYEE"
                        : userProp.customerId ? "CUSTOMER"
                            : "GUEST";
        const baseProfile = {
            customerId: userProp.customerId ?? null, employeeId: userProp.employeeId ?? null,
            firstName: userProp.firstName ?? "—", lastName: userProp.lastName ?? "",
            email: userProp.email ?? userProp.raw?.email ?? userProp.raw?.employeeEmail ?? userProp.raw?.customerEmail ?? "—",
            phone, avatarUrl: userProp.avatarUrl ?? null,
            oauthPicture: userProp.oauthPicture ?? userProp.raw?.oauthPicture ?? userProp.picture ?? userProp.raw?.picture ?? null,
            role: normalizedRole,
            billing: { nextBillAmount: null, nextBillDate: null, paymentMethod: {}, address: {}, invoices: [] },
        };
        setProfile(prev => ({ ...prev, ...baseProfile }));
        const customerId = userProp.customerId;
        if (customerId) { loadAddress(); loadPaymentMethod(); loadInvoices(); loadQuotes(); loadCurrentPlan(); }
        setLoading(false);
    }, [userProp, loadAddress, loadPaymentMethod, loadInvoices, loadQuotes, loadCurrentPlan]);

    useEffect(() => {
        const customerId = userProp?.customerId;
        if (!customerId) return;
        if (loadedBillingForRef.current === customerId) return;
        loadedBillingForRef.current = customerId;
        loadAddress(); loadPaymentMethod();
    }, [userProp?.customerId, loadAddress, loadPaymentMethod]);

    /* ── handlers (unchanged) ── */
    const closeBillingEditor = () => setShowBillingModal(false);

    const saveAvatar = async (newUrl) => {
        if (!newUrl) return;
        setError("");
        setProfile((prev) => ({ ...prev, avatarUrl: newUrl }));
    };

    const deleteAvatar = async () => {
        setError("");
        try {
            const res = await apiFetch("/api/me/avatar", { method: "DELETE" });
            if (!res.ok) throw new Error("Avatar delete failed");
            const mapped = await refreshMe?.();
            setProfile((prev) => ({
                ...prev,
                avatarUrl: mapped?.avatarUrl ?? null,
                oauthPicture: mapped?.oauthPicture ?? mapped?.raw?.oauthPicture ?? mapped?.picture ?? prev.oauthPicture ?? null,
            }));
        } catch (e) { setError(e?.message || "Failed to delete avatar"); }
    };

    const deleteProfile = async () => {
        setError("");
        try {
            const res = await apiFetch("/api/me", { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            onLogout?.();
            navigate("/", { replace: true });
        } catch (e) { setError(e?.message || "Failed to delete profile"); }
    };

    const isBlank = (v) => v == null || String(v).trim() === "" || v === "—";

    const needsCustomerRegistration =
        (!!profile.employeeId || String(profile.role).toUpperCase() === "EMPLOYEE") && !profile.customerId;

    const missingFields = useMemo(() => {
        const missing = [];
        if (isBlank(profile.email)) missing.push("Email");
        if (isBlank(profile.phone)) missing.push("Phone number");
        if (!needsCustomerRegistration) {
            const addr = profile.billing?.address || {};
            if (isBlank(addr.street1) || isBlank(addr.city) || isBlank(addr.province) || isBlank(addr.postalCode) || isBlank(addr.country)) missing.push("Billing address");
            const pm = profile.billing?.paymentMethod || {};
            if (isBlank(pm.method) || isBlank(pm.last4)) missing.push("Payment method");
        }
        return missing;
    }, [profile, needsCustomerRegistration]);

    const billingAddress  = profile.billing?.address       || {};
    const paymentMethod   = profile.billing?.paymentMethod || {};
    // hasPlan: true when we have a real plan object, OR as fallback when any invoice exists

    const hasPlan = currentPlan != null
        ? currentPlan !== null
        : (profile.billing?.invoices?.length > 0);

    const hasBillingAddress =
        !isBlank(billingAddress.street1) && !isBlank(billingAddress.city) &&
        !isBlank(billingAddress.province) && !isBlank(billingAddress.postalCode) &&
        !isBlank(billingAddress.country);

    const hasPaymentMethod       = !isBlank(paymentMethod.method) && !isBlank(paymentMethod.last4);
    // const hasCompletedBillingSetup = hasBillingAddress && hasPaymentMethod;
    const hasCompletedBillingSetup =
        hasBillingAddress && hasPaymentMethod && hasPlan;
    /* ── loading ── */
    if (loading) {
        return (
            <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <Spinner animation="border" variant="primary" style={{ width: "2.5rem", height: "2.5rem" }} />
                <div className={`mt-3 ${mutedClass}`} style={{ fontSize: "0.9rem" }}>Loading your profile…</div>
            </div>
        );
    }

    const hasAccount = !!userProp?.customerId || !!userProp?.employeeId;
    if (!hasAccount) return <Navigate to="/login" replace />;

    /* ── setup-item card (missing billing / payment / plan) ── */
    const SetupItem = ({ icon, title, desc, btnLabel, btnVariant = "primary", onClick, asLink, to }) => (
        <div
            style={{
                display: "flex", alignItems: "flex-start", gap: "0.75rem",
                padding: "1rem 1.25rem",
                background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.8)",
                border: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(251,191,36,0.35)"}`,
                borderRadius: "0.85rem",
                flex: "1 1 220px",
            }}
        >
            <div style={{ width: 36, height: 36, borderRadius: "0.6rem", background: "rgba(251,191,36,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
            </div>
            <div style={{ flex: 1 }}>
                <div className="fw-semibold" style={{ fontSize: "0.88rem", marginBottom: "0.2rem" }}>{title}</div>
                <div className={mutedClass} style={{ fontSize: "0.78rem", marginBottom: "0.6rem" }}>{desc}</div>
                {asLink ? (
                    <Link to={to}>
                        <button style={{ fontSize: "0.78rem", fontWeight: 600, padding: "4px 14px", borderRadius: "999px", border: "none", cursor: "pointer", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff" }}>
                            {btnLabel}
                        </button>
                    </Link>
                ) : (
                    <button
                        onClick={onClick}
                        style={{ fontSize: "0.78rem", fontWeight: 600, padding: "4px 14px", borderRadius: "999px", border: "none", cursor: "pointer", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff" }}
                    >
                        {btnLabel}
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* ── Inactive toast ── */}
            <ToastContainer position="top-end" className="p-3" style={{ zIndex: 2000 }}>
                <Toast show={showInactiveToast} onClose={() => setShowInactiveToast(false)} delay={5000} autohide bg="danger">
                    <Toast.Header closeButton>
                        <strong className="me-auto">Access Restricted</strong>
                    </Toast.Header>
                    <Toast.Body className="text-white">{inactiveMessage}</Toast.Body>
                </Toast>
            </ToastContainer>

            {/* ── Page wrapper ── */}
            <div
                className={darkMode ? "tc-bg-dark" : "tc-bg-light"}
                style={{ minHeight: "100vh", padding: "3rem 0 5rem" }}
            >
                <Container className="px-3 px-md-4" style={{ maxWidth: 1060 }}>

                    {/* ── Page header ── */}
                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
                        <div>
                            <div className={`tc-section-chip ${darkMode ? "tc-section-chip-dark" : "tc-section-chip-light"} mb-2`}>
                                Account
                            </div>
                            <h1 className="fw-bold mb-0" style={{ fontSize: "clamp(1.6rem, 3vw, 2rem)", color: darkMode ? "#f9fafb" : "#111827" }}>
                                My Profile
                            </h1>
                        </div>

                        <div className="d-flex gap-2">
                            <Link to="/plans">
                                <button
                                    style={{
                                        fontSize: "0.85rem", fontWeight: 600, padding: "7px 18px",
                                        borderRadius: "999px", cursor: "pointer",
                                        background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                                        border: `1px solid ${darkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}`,
                                        color: darkMode ? "#e5e7eb" : "#374151",
                                        transition: "background 0.15s",
                                    }}
                                >
                                    Manage Plans
                                </button>
                            </Link>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                style={{
                                    fontSize: "0.85rem", fontWeight: 600, padding: "7px 18px",
                                    borderRadius: "999px", cursor: "pointer",
                                    background: "rgba(239,68,68,0.08)",
                                    border: "1px solid rgba(239,68,68,0.22)",
                                    color: "#ef4444",
                                    transition: "background 0.15s",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                            >
                                Delete Profile
                            </button>
                        </div>
                    </div>

                    {/* ── Error alert ── */}
                    {error && (
                        <div
                            className="mb-4 p-3 d-flex align-items-start gap-2"
                            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "0.85rem" }}
                        >
                            <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <div className="fw-semibold" style={{ fontSize: "0.9rem", color: "#ef4444" }}>Profile error</div>
                                <div style={{ fontSize: "0.82rem", color: darkMode ? "#fca5a5" : "#b91c1c" }}>{error}</div>
                            </div>
                        </div>
                    )}

                    {/* ── Employee registration notice ── */}
                    {needsCustomerRegistration && (
                        <div
                            className="mb-4 p-4 d-flex align-items-start gap-3"
                            style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.22)", borderRadius: "1rem" }}
                        >
                            <div style={{ width: 38, height: 38, borderRadius: "0.6rem", background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <AlertTriangle size={18} color="#3b82f6" />
                            </div>
                            <div>
                                <div className="fw-semibold mb-1" style={{ color: "#1d4ed8" }}>Enable customer features</div>
                                <div style={{ fontSize: "0.85rem", color: darkMode ? "#93c5fd" : "#1e40af" }}>
                                    You're logged in as an employee. To manage billing, payment, and subscriptions, please register as a customer.
                                </div>
                                <button
                                    onClick={() => setShowBillingModal(true)}
                                    className="mt-3"
                                    style={{ fontSize: "0.82rem", fontWeight: 600, padding: "5px 16px", borderRadius: "999px", border: "none", cursor: "pointer", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff" }}
                                >
                                    Register as Customer
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Incomplete billing setup notice ── */}
                    {!needsCustomerRegistration && !hasCompletedBillingSetup && (
                        <div
                            className="mb-4 p-4"
                            style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "1rem" }}
                        >
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <AlertTriangle size={18} color="#d97706" />
                                <div className="fw-semibold" style={{ fontSize: "0.95rem", color: "#d97706" }}>
                                    Complete your billing setup
                                </div>
                            </div>
                            <div className={mutedClass} style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
                                Please add your billing address and payment method to unlock your plan, billing, and rewards sections.
                            </div>

                            {/* Setup item cards — only render what's missing */}
                            <div className="d-flex flex-wrap gap-3">
                                {!hasBillingAddress && (
                                    <SetupItem
                                        icon={<MapPin size={16} color="#d97706" />}
                                        title="Billing address missing"
                                        desc="Required before proceeding to checkout."
                                        btnLabel="Add Address"
                                        onClick={() => setShowBillingModal(true)}
                                    />
                                )}
                                {!hasPaymentMethod && (
                                    <SetupItem
                                        icon={<CreditCard size={16} color="#d97706" />}
                                        title="Payment method missing"
                                        desc="Add a valid card to enable billing."
                                        btnLabel="Add Card"
                                        onClick={() => setShowPaymentModal(true)}
                                    />
                                )}
                                {!hasPlan && (
                                    <SetupItem
                                        icon={<Package size={16} color="#d97706" />}
                                        title="No active plan"
                                        desc="Choose a plan to start your subscription."
                                        btnLabel="Browse Plans"
                                        asLink
                                        to="/plans"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Main content grid ── */}
                    <Row className="g-4">

                        {/* ── LEFT: Avatar + Rewards ── */}
                        <Col lg={hasCompletedBillingSetup ? 4 : 12}>

                            {/* AvatarCard — unchanged component */}
                            <AvatarCard
                                profile={profile}
                                darkMode={darkMode}
                                onSaveAvatar={saveAvatar}
                                onDeleteAvatar={deleteAvatar}
                            />

                            {/* Rewards card — only shown when points > 0 */}
                            {computedPoints > 0 && (
                                <Card
                                    className={`${cardBase} border-0 shadow-sm mt-4`}
                                    style={{ borderRadius: "1rem", overflow: "hidden" }}
                                >
                                    {/* Gradient top bar — gold for rewards */}
                                    <div style={{ height: 4, background: "linear-gradient(90deg, #f59e0b, #d97706)" }} />

                                    <Card.Body className="p-4">
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <div className="d-flex align-items-center gap-2">
                                                <div style={{ width: 32, height: 32, borderRadius: "0.5rem", background: "linear-gradient(135deg,#f59e0b,#d97706)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <Star size={15} color="#fff" />
                                                </div>
                                                <span className="fw-bold" style={{ fontSize: "0.95rem", color: darkMode ? "#f9fafb" : "#111827" }}>
                                                    Rewards Points
                                                </span>
                                            </div>
                                            {tierInfo.isBronze && (
                                                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", fontWeight: 700, color: "#d97706", background: "rgba(245,158,11,0.12)", padding: "3px 10px", borderRadius: "999px", border: "1px solid rgba(245,158,11,0.25)" }}>
                                                    <Crown size={12} /> Bronze
                                                </div>
                                            )}
                                        </div>

                                        {/* Big point count */}
                                        <div
                                            style={{
                                                fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 800, lineHeight: 1,
                                                background: "linear-gradient(90deg, #f59e0b, #d97706)",
                                                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                                                marginBottom: "0.25rem",
                                            }}
                                        >
                                            {(computedPoints || 0).toLocaleString()}
                                        </div>
                                        <div className={mutedClass} style={{ fontSize: "0.78rem", marginBottom: "1rem" }}>
                                            pts &nbsp;·&nbsp; {POINTS_PER_DOLLAR} pt per $1 spent &nbsp;·&nbsp; tracked: {formatMoney(computedPoints)}
                                        </div>

                                        {/* Progress bar */}
                                        <div className="d-flex justify-content-between mb-1" style={{ fontSize: "0.75rem" }}>
                                            <span className={mutedClass}>Bronze ({BRONZE_REQUIREMENT.toLocaleString()} pts)</span>
                                            <span className={mutedClass}>{tierInfo.progress}%</span>
                                        </div>
                                        <div style={{ height: 7, borderRadius: "999px", background: darkMode ? "rgba(255,255,255,0.1)" : "#f3f4f6", overflow: "hidden" }}>
                                            <div style={{ height: "100%", borderRadius: "999px", width: `${tierInfo.progress}%`, background: tierInfo.isBronze ? "linear-gradient(90deg,#f59e0b,#d97706)" : "linear-gradient(90deg,#4f46e5,#7c3aed)", transition: "width 0.4s ease" }} />
                                        </div>

                                        {!tierInfo.isBronze ? (
                                            <div className={mutedClass} style={{ fontSize: "0.78rem", marginTop: "0.5rem" }}>
                                                {tierInfo.remaining.toLocaleString()} pts to Bronze
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: "0.78rem", color: "#d97706", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: 5 }}>
                                                <Crown size={13} />
                                                Bronze active: 15% discount on first {formatMoney(BRONZE_DISCOUNT_CAP)} spent.
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            )}
                            {/* BillingAddressCard — only when hasBillingAddress, shown below rewards */}
                            {hasBillingAddress && (
                                <Card
                                    className={`${cardBase} border-0 shadow-sm mt-4`}
                                    style={{ borderRadius: "1rem", overflow: "hidden" }}
                                >
                                    <div style={{ height: 4, background: "linear-gradient(90deg, #4f46e5, #7c3aed)" }} />
                                    <Card.Body className="p-4">
                                        <div className="d-flex align-items-center gap-2 mb-3">
                                            <div style={{ width: 32, height: 32, borderRadius: "0.5rem", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <MapPin size={15} color="#fff" />
                                            </div>
                                            <span className="fw-bold" style={{ fontSize: "0.95rem", color: darkMode ? "#f9fafb" : "#111827" }}>
                                                Billing Address
                                            </span>
                                        </div>
                                        <BillingAddressCard
                                            address={profile.billing.address}
                                            darkMode={darkMode}
                                            onEdit={() => setShowBillingModal(true)}
                                        />
                                    </Card.Body>
                                </Card>
                            )}

                        </Col>

                        {/* ── RIGHT: Subscription + Billing + Quotes ── */}
                        <Col lg={8}>

                            {/* SubscriptionPage — only when hasPlan */}
                            {hasPlan && (
                                // Pass currentPlan so SubscriptionPage has real plan data
                                <SubscriptionPage
                                    user={profile}
                                    plan={currentPlan !== "fallback" ? currentPlan : null}
                                    darkMode={darkMode}
                                />
                            )}

                            {/* BillingCard — only when hasPaymentMethod */}
                            {hasPaymentMethod && (
                                <div className={hasPlan ? "mt-4" : ""}>
                                    <BillingCard
                                        profile={profile}
                                        darkMode={darkMode}
                                        onEdit={(section) => {
                                            if (section === "payment") setShowPaymentModal(true);
                                            else setShowBillingModal(true);
                                        }}
                                    />
                                </div>
                            )}

                            {/* CustomerQuotes — only when CUSTOMER role + quotes */}
                            {profile.role === "CUSTOMER" && quotes.length > 0 && (
                                <Card
                                    className={`mt-4 ${cardBase} border-0 shadow-sm`}
                                    style={{ borderRadius: "1rem", overflow: "hidden" }}
                                >
                                    <div style={{ height: 4, background: "linear-gradient(90deg, #22d3ee, #3b82f6)" }} />
                                    <Card.Body className="p-4">
                                        <div className="d-flex align-items-center gap-2 mb-3">
                                            <div style={{ width: 32, height: 32, borderRadius: "0.5rem", background: "linear-gradient(135deg,#22d3ee,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <Package size={15} color="#fff" />
                                            </div>
                                            <span className="fw-bold" style={{ fontSize: "0.95rem" }}>My Quotes</span>
                                        </div>
                                        <CustomerQuotes />
                                    </Card.Body>
                                </Card>
                            )}

                        </Col>
                    </Row>

                    {/* ── Modals (all unchanged) ── */}
                    <BillingModal
                        show={showBillingModal}
                        profile={profile}
                        onClose={closeBillingEditor}
                        onSaved={async (updatedPersonal) => {
                            if (updatedPersonal) {
                                setProfile((prev) => ({
                                    ...prev,
                                    firstName:  updatedPersonal.firstName  ?? prev.firstName,
                                    lastName:   updatedPersonal.lastName   ?? prev.lastName,
                                    phone:      updatedPersonal.homePhone  ?? updatedPersonal.phone ?? prev.phone,
                                    email:      updatedPersonal.email      ?? prev.email,
                                    customerId: updatedPersonal.customerId ?? prev.customerId,
                                    employeeId: updatedPersonal.employeeId ?? prev.employeeId,
                                    role:       updatedPersonal.role       ?? "CUSTOMER",
                                }));
                            }
                            await loadAddress();
                        }}
                        backdrop keyboard centered
                    />

                    <PaymentModal
                        show={showPaymentModal}
                        darkMode={darkMode}
                        profileBilling={profile.billing.paymentMethod}
                        onClose={() => setShowPaymentModal(false)}
                        onSaved={(savedPm, cvv) => {
                            setProfile((prev) => ({
                                ...prev,
                                billing: { ...prev.billing, paymentMethod: savedPm ?? {}, localCvv: cvv ?? "" },
                            }));
                            setShowPaymentModal(false);
                        }}
                    />

                    <DeleteProfileModal
                        show={showDeleteModal}
                        onClose={() => setShowDeleteModal(false)}
                        onDelete={deleteProfile}
                    />

                </Container>
            </div>
        </>
    );
}