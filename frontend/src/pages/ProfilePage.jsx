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
import { Container, Row, Col, Card, Button, Spinner, Alert } from "react-bootstrap";
import { Star, Crown, AlertTriangle } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AvatarCard, BillingCard, BillingModal, PaymentModal, SubscriptionPage, DeleteProfileModal } from "../components";

const POINTS_PER_DOLLAR = 1;
const BRONZE_REQUIREMENT = 5000;
const BRONZE_DISCOUNT_CAP = 1000;

const formatMoney = (n) =>
    n == null || Number.isNaN(Number(n))
        ? "—"
        : Number(n).toLocaleString(undefined, { style: "currency", currency: "CAD" });

export default function ProfilePage({ user: userProp, onLogout, darkMode = false, refreshMe }) {
    const navigate = useNavigate();
    const mutedClass = darkMode ? "text-light-50 text-secondary" : "text-muted";
    const cardBase = darkMode ? "bg-dark border-secondary" : "bg-white";

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [profile, setProfile] = useState({
        customerId: null,
        employeeId: null,
        firstName: "—",
        lastName: "",
        email: "—",
        phone: "—",
        points: 0,
        totalSpent: 0,
        avatarUrl: null,
        role: null,
        plan: { status: "Inactive", name: "—", monthlyPrice: null, startedAt: null, features: [], addOns: [] },
        billing: { nextBillAmount: null, nextBillDate: null, paymentMethod: {}, address: {}, invoices: [] },
    });

    const [showBillingModal, setShowBillingModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const loadedBillingForRef = useRef(null);

    // ---- Derived / computed (hooks MUST be above any returns) ----
    const tierInfo = useMemo(() => {
        const points = profile.points || 0;
        const isBronze = points >= BRONZE_REQUIREMENT;
        const progress = Math.min(100, Math.round((points / BRONZE_REQUIREMENT) * 100));
        const remaining = Math.max(0, BRONZE_REQUIREMENT - points);
        return { isBronze, progress, remaining };
    }, [profile.points]);

    // ---- Loaders ----
    const loadAddress = useCallback(async () => {
        try {
            const res = await fetch("/api/billing/address", { credentials: "include" });
            if (res.status === 404 || res.status === 204 || res.status === 409) {
                setProfile((prev) => ({ ...prev, billing: { ...prev.billing, address: {} } }));
                return;
            }
            if (!res.ok) return;
            const data = await res.json();
            const address = data?.address ?? data ?? {};
            setProfile((prev) => ({ ...prev, billing: { ...prev.billing, address } }));
        } catch (err) {
            console.error("Failed to load billing address", err);
        }
    }, []);

    const loadPaymentMethod = useCallback(async () => {
        try {
            const res = await fetch("/api/billing/payment", { credentials: "include" });
            if (res.status === 404 || res.status === 204 || res.status === 409) {
                setProfile((prev) => ({ ...prev, billing: { ...prev.billing, paymentMethod: {} } }));
                return;
            }
            if (!res.ok) return;
            const data = await res.json();
            const paymentMethod = data?.paymentMethod ?? data ?? {};
            setProfile((prev) => ({ ...prev, billing: { ...prev.billing, paymentMethod } }));
        } catch (err) {
            console.error("Failed to load payment method", err);
        }
    }, []);


    // ---- Copy App.user into local profile ----
    useEffect(() => {
        if (!userProp) {
            setLoading(false);
            return;
        }

        const raw = userProp.raw ?? {};
        const phone =
            userProp.homePhone ??
            raw.phone ??
            raw.homePhone ??
            raw.mobilePhone ??
            raw.cellPhone ??
            raw.customerPhone ??
            userProp.phone ??
            "—";

        setProfile((prev) => ({
            ...prev,
            customerId: userProp.customerId ?? null,
            employeeId: userProp.employeeId ?? null,
            firstName: userProp.firstName ?? "—",
            lastName: userProp.lastName ?? "",
            email: userProp.email ?? "—",
            phone,
            avatarUrl:
                userProp.avatarUrl ??
                null,
            oauthPicture:
                userProp.oauthPicture ??
                raw.oauthPicture ??
                userProp.picture ??
                raw.picture ??
                null,
            role:
                userProp.role ??
                (userProp.employeeId ? "EMPLOYEE" : userProp.customerId ? "CUSTOMER" : "GUEST"),
        }));

        setLoading(false);
    }, [userProp]);

    // ---- Load address & payment method ----
    useEffect(() => {
        const customerId = userProp?.customerId;
        if (!customerId) return;

        if (loadedBillingForRef.current === customerId) return;
        loadedBillingForRef.current = customerId;

        loadAddress();
        loadPaymentMethod();
    }, [userProp?.customerId, loadAddress, loadPaymentMethod]);

    const closeBillingEditor = () => setShowBillingModal(false);

    const saveAvatar = async (newUrl) => {
        if (!newUrl) return;
        setError("");
        setProfile((prev) => ({ ...prev, avatarUrl: newUrl }));
    };

    const deleteAvatar = async () => {
        setError("");
        try {
            const res = await fetch("/api/me/avatar", { method: "DELETE", credentials: "include" });
            if (!res.ok) throw new Error("Avatar delete failed");
            const mapped = await refreshMe?.();
            setProfile((prev) => ({
                ...prev,
                avatarUrl: mapped?.avatarUrl ?? null,
                oauthPicture:
                    mapped?.oauthPicture ??
                    mapped?.raw?.oauthPicture ??
                    mapped?.picture ??
                    prev.oauthPicture ??
                    null,
            }));
        } catch (e) {
            setError(e?.message || "Failed to delete avatar");
        }
    };

    const deleteProfile = async () => {
        setError("");
        try {
            const res = await fetch("/api/me", { method: "DELETE", credentials: "include" });
            if (!res.ok) throw new Error("Delete failed");
            onLogout?.();
            navigate("/", { replace: true });
        } catch (e) {
            setError(e?.message || "Failed to delete profile");
        }
    };

    // ---- Top alert for incomplete profile / billing / payment info ----
    const isBlank = (v) => v == null || String(v).trim() === "" || v === "—";

    const needsCustomerRegistration =
        (!!profile.employeeId || String(profile.role).toUpperCase() === "EMPLOYEE") && !profile.customerId;

    const missingFields = useMemo(() => {
        const missing = [];

        // Always check essential profile info
        if (isBlank(profile.email)) missing.push("Email");
        if (isBlank(profile.phone)) missing.push("Phone number");

        // Only check billing/payment AFTER they are a customer
        if (!needsCustomerRegistration) {
            const addr = profile.billing?.address || {};
            if (
                isBlank(addr.street1) ||
                isBlank(addr.city) ||
                isBlank(addr.province) ||
                isBlank(addr.postalCode) ||
                isBlank(addr.country)
            ) missing.push("Billing address");

            const pm = profile.billing?.paymentMethod || {};
            if (isBlank(pm.method) || isBlank(pm.last4)) missing.push("Payment method");
        }

        return missing;
    }, [profile, needsCustomerRegistration]);

    // const missingFields = useMemo(() => {
    //     const missing = [];
    //
    //     // Check essential profile info
    //     if (isBlank(profile.email)) missing.push("Email");
    //     if (isBlank(profile.phone)) missing.push("Phone number");
    //
    //     // Check billing address
    //     const addr = profile.billing?.address || {};
    //     if (
    //         isBlank(addr.street1) ||
    //         isBlank(addr.city) ||
    //         isBlank(addr.province) ||
    //         isBlank(addr.postalCode) ||
    //         isBlank(addr.country)
    //     ) missing.push("Billing address");
    //
    //     // Check payment method
    //     const pm = profile.billing?.paymentMethod || {};
    //     if (
    //         isBlank(pm.method) ||
    //         // isBlank(pm.cardNumber) ||
    //         // isBlank(pm.holderName) ||
    //         // isBlank(pm.expiredDate) ||
    //         isBlank(pm.last4)
    //     ) missing.push("Payment method");
    //
    //     return missing;
    // }, [profile]);

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" />
                <div className={`mt-2 ${mutedClass}`}>Loading your profile…</div>
            </Container>
        );
    }

    // if (!userProp) return <Navigate to="/login" replace />;
    if (!loading && !userProp) {
        return <Navigate to="/login" replace />;
    }

    const hasAccount = !!userProp.customerId || !!userProp.employeeId;
    if (!hasAccount) return <Navigate to="/login" replace />;

    return (
        <Container className="py-4 py-md-5 px-4">
            {/* ---- Page Header ---- */}
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
                <h1 className={`fw-black mb-1 ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900 }}>
                    My Profile
                </h1>

                <div className="d-flex gap-2">
                    <Button
                        variant={darkMode ? "outline-light" : "outline-secondary"}
                        as={Link}
                        to="/plans"
                        style={{ borderRadius: 14 }}
                    >
                        Manage Plans
                    </Button>

                    <Button
                        variant={darkMode ? "outline-danger" : "danger"}
                        onClick={() => setShowDeleteModal(true)}
                        style={{ borderRadius: 14 }}
                    >
                        Delete Profile
                    </Button>
                </div>
            </div>

            {/* ---- Global Error ---- */}
            {error && (
                <Alert variant="danger">
                    <div className="fw-bold">Profile error</div>
                    <div className="small">{error}</div>
                </Alert>
            )}

            {/* ---- Top Alert for incomplete fields ---- */}
            {needsCustomerRegistration ? (
                <Alert
                    variant="info"
                    className="d-flex align-items-start gap-2"
                    style={{ borderRadius: 16 }}
                >
                    <AlertTriangle size={18} className="mt-1" />
                    <div>
                        <div className="fw-bold">Enable customer features</div>
                        <div className="small">
                            You’re logged in as an employee. To manage billing, payment, and subscriptions, please register as a customer.
                        </div>

                        <div className="mt-2">
                            <Button
                                size="sm"
                                variant={darkMode ? "outline-light" : "outline-dark"}
                                onClick={() => navigate("/register-as-customer")}  // or setShowRegisterModal(true)
                                style={{ borderRadius: 12 }}
                            >
                                Register as Customer
                            </Button>
                        </div>
                    </div>
                </Alert>
            ) : (
                missingFields.length > 0 && (
                    <Alert
                        variant="warning"
                        className="d-flex align-items-start gap-2"
                        style={{ borderRadius: 16 }}
                    >
                        <AlertTriangle size={18} className="mt-1" />
                        <div>
                            <div className="fw-bold">Your profile isn’t complete yet</div>
                            <div className="small">
                                Please add: {missingFields.join(", ")}. This helps checkout and billing work properly.
                            </div>
                        </div>
                    </Alert>
                )
            )}

            <Row className="g-4">
                <Col lg={4}>
                    <AvatarCard
                        profile={profile}
                        darkMode={darkMode}
                        onSaveAvatar={saveAvatar}
                        onDeleteAvatar={deleteAvatar}
                    />

                    <Card className={`${cardBase} mt-4`} style={{ borderRadius: 22 }}>
                        <Card.Body className="p-4">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className={`fw-black ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900 }}>
                                    Rewards Points
                                </div>
                                <Star size={18} />
                            </div>

                            <div className="mt-3">
                                <div
                                    className={`fw-black ${darkMode ? "text-light" : "text-dark"}`}
                                    style={{ fontWeight: 900, fontSize: "2rem" }}
                                >
                                    {Number(profile.points ?? 0).toLocaleString()} pts
                                </div>
                                <div className={mutedClass}>
                                    Earn {POINTS_PER_DOLLAR} point per $1 spent • Spend tracked: {formatMoney(profile.totalSpent)}
                                </div>
                            </div>

                            <div className="mt-3">
                                <div className="d-flex justify-content-between small">
                                    <span className={mutedClass}>
                                        Progress to Bronze ({BRONZE_REQUIREMENT.toLocaleString()} pts)
                                    </span>
                                    <span className={mutedClass}>{tierInfo.progress}%</span>
                                </div>

                                <div className="progress mt-1" style={{ height: 6, borderRadius: 3 }}>
                                    <div
                                        className={`progress-bar ${tierInfo.isBronze ? "bg-warning" : "bg-primary"}`}
                                        style={{ width: `${tierInfo.progress}%` }}
                                    />
                                </div>

                                {!tierInfo.isBronze ? (
                                    <div className={`small mt-2 ${mutedClass}`}>
                                        {tierInfo.remaining.toLocaleString()} pts to become Bronze.
                                    </div>
                                ) : (
                                    <div className="small mt-2 text-warning">
                                        <Crown size={16} className="me-1" />
                                        Bronze active: 15% discount on first {formatMoney(BRONZE_DISCOUNT_CAP)} spent.
                                    </div>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={8}>
                    <SubscriptionPage user={profile} darkMode={darkMode} />
                    {/* ---- BillingCard no longer has its own alert ---- */}
                    <BillingCard
                        profile={profile}
                        darkMode={darkMode}
                        onEdit={(section) => {
                            if (section === "payment") setShowPaymentModal(true);
                            else setShowBillingModal(true);
                        }}
                        className="mt-4"
                    />
                </Col>
            </Row>

            <BillingModal
                show={showBillingModal}
                profile={profile}
                onClose={closeBillingEditor}
                onSaved={async (updatedPersonal) => {
                    if (updatedPersonal) {
                        setProfile((prev) => ({
                            ...prev,
                            firstName: updatedPersonal.firstName ?? prev.firstName,
                            lastName: updatedPersonal.lastName ?? prev.lastName,
                            phone: updatedPersonal.phone ?? prev.phone,
                        }));
                    }
                    await loadAddress();
                }}
                backdrop
                keyboard
                centered
            />

            <PaymentModal
                show={showPaymentModal}
                darkMode={darkMode}
                profileBilling={profile.billing.paymentMethod}
                onClose={() => setShowPaymentModal(false)}
                onSaved={(savedPm, cvv) => {
                    setProfile((prev) => ({
                        ...prev,
                        billing: {
                            ...prev.billing,
                            paymentMethod: savedPm ?? {},
                            localCvv: cvv ?? "",
                        },
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
    );
}