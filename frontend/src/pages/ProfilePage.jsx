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
import { AvatarCard, BillingCard, BillingModal, PaymentModal, SubscriptionPage, DeleteProfileModal, BillingAddressCard } from "../components";
import { apiFetch } from "../services/api";

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

    const tierInfo = useMemo(() => {
        const points = profile.points || 0;
        const isBronze = points >= BRONZE_REQUIREMENT;
        const progress = Math.min(100, Math.round((points / BRONZE_REQUIREMENT) * 100));
        const remaining = Math.max(0, BRONZE_REQUIREMENT - points);
        return { isBronze, progress, remaining };
    }, [profile.points]);

    const loadAddress = useCallback(async () => {
        try {
            const res = await apiFetch("/api/billing/address");
            if (!res.ok || [204, 404, 409].includes(res.status)) {
                setProfile(prev => ({
                    ...prev,
                    billing: { ...prev.billing, address: {} },
                }));
                return;
            }
            const data = await res.json();
            const address = data?.address ?? data ?? {};
            setProfile(prev => ({
                ...prev,
                billing: { ...prev.billing, address },
            }));
        } catch (err) {
            console.error("Failed to load billing address", err);
        }
    }, []);

    const loadPaymentMethod = useCallback(async () => {
        try {
            const res = await apiFetch("/api/billing/payment/all");

            if (!res.ok) {
                setProfile(prev => ({
                    ...prev,
                    billing: { ...prev.billing, paymentMethod: {} },
                }));
                return;
            }

            const data = await res.json();

            if (!Array.isArray(data) || data.length === 0) {
                setProfile(prev => ({
                    ...prev,
                    billing: { ...prev.billing, paymentMethod: {} },
                }));
                return;
            }

            const pm = data.find(c => c.isDefault) || data[0];

            const paymentMethod = {
                method: pm.method ?? "Card",
                last4: pm.last4 ?? "—",
                displayCard: pm.displayCard ?? `**** **** **** ${pm.last4}`,
                holderName: pm.holderName,
                expiryMonth: pm.expiryMonth,
                expiryYear: pm.expiryYear,
            };

            setProfile(prev => ({
                ...prev,
                billing: { ...prev.billing, paymentMethod },
            }));

        } catch (err) {
            console.error("Failed to load payment method", err);
        }
    }, []);

    useEffect(() => {
        if (!userProp) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const phone =
            userProp.homePhone ??
            userProp.raw?.phone ??
            userProp.raw?.homePhone ??
            userProp.raw?.mobilePhone ??
            userProp.raw?.cellPhone ??
            userProp.raw?.customerPhone ??
            userProp.phone ??
            "—";

        const rawRole = userProp.role ?? null;

        const normalizedRole =
            rawRole === "Manager" ||
            rawRole === "Sales Agent" ||
            rawRole === "Service Technician"
                ? "EMPLOYEE"
                : rawRole === "Customer"
                    ? "CUSTOMER"
                    : userProp.employeeId
                        ? "EMPLOYEE"
                        : userProp.customerId
                            ? "CUSTOMER"
                            : "GUEST";

        const baseProfile = {
            customerId: userProp.customerId ?? null,
            employeeId: userProp.employeeId ?? null,
            firstName: userProp.firstName ?? "—",
            lastName: userProp.lastName ?? "",
            email: userProp.email ?? "—",
            phone,
            avatarUrl: userProp.avatarUrl ?? null,
            oauthPicture: userProp.oauthPicture ?? userProp.raw?.oauthPicture ?? userProp.picture ?? userProp.raw?.picture ?? null,
            role: normalizedRole,
            billing: { nextBillAmount: null, nextBillDate: null, paymentMethod: {}, address: {}, invoices: [] },
        };

        setProfile(prev => ({ ...prev, ...baseProfile }));

        const customerId = userProp.customerId;
        if (customerId) {
            loadAddress();
            loadPaymentMethod();
        }

        setLoading(false);
    }, [userProp, loadAddress, loadPaymentMethod]);

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
            const res = await apiFetch("/api/me/avatar", { method: "DELETE" });
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
            const res = await apiFetch("/api/me", { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            onLogout?.();
            navigate("/", { replace: true });
        } catch (e) {
            setError(e?.message || "Failed to delete profile");
        }
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

    const billingAddress = profile.billing?.address || {};
    const paymentMethod = profile.billing?.paymentMethod || {};

    const hasPlan =
        profile?.plan?.status &&
        profile.plan.status !== "Inactive" &&
        profile.plan.name &&
        profile.plan.name !== "—";

    const hasBillingAddress =
        !isBlank(billingAddress.street1) &&
        !isBlank(billingAddress.city) &&
        !isBlank(billingAddress.province) &&
        !isBlank(billingAddress.postalCode) &&
        !isBlank(billingAddress.country);

    const hasPaymentMethod =
        !isBlank(paymentMethod.method) &&
        !isBlank(paymentMethod.last4);

    const hasCompletedBillingSetup = hasBillingAddress && hasPaymentMethod;

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" />
                <div className={`mt-2 ${mutedClass}`}>Loading your profile…</div>
            </Container>
        );
    }

    const hasAccount = !!userProp.customerId || !!userProp.employeeId;
    if (!hasAccount) return <Navigate to="/login" replace />;

    return (
        <Container className="py-4 py-md-5 px-4">
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

            {error && (
                <Alert variant="danger">
                    <div className="fw-bold">Profile error</div>
                    <div className="small">{error}</div>
                </Alert>
            )}

            {/* ================= BILLING SETUP ALERTS ================= */}
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
                                onClick={() => setShowBillingModal(true)}
                                style={{ borderRadius: 12 }}
                            >
                                Register as Customer
                            </Button>
                        </div>
                    </div>
                </Alert>
            ) : !hasCompletedBillingSetup && (
                <Alert
                    variant="warning"
                    className="d-flex align-items-start gap-2"
                    style={{ borderRadius: 16 }}
                >
                    <AlertTriangle size={18} className="mt-1" />
                    <div>
                        <div className="fw-bold">Complete your billing setup first</div>
                        <div className="small">
                            Please add your billing address and payment method to unlock your plan, billing, and rewards sections.
                        </div>

                        {/* Missing components section */}
                        <div className="mt-3 d-flex gap-2 flex-wrap">

                            {/* Missing billing address */}
                            {!hasBillingAddress && (
                                <Alert
                                    variant="warning"
                                    className="d-flex align-items-start gap-2"
                                    style={{ borderRadius: 16 }}
                                >
                                    <AlertTriangle size={18} className="mt-1" />
                                    <div>
                                        <div className="fw-bold">Missing billing address</div>
                                        <div className="small">
                                            Please add your billing address to continue.
                                        </div>

                                        <div className="mt-2">
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                onClick={() => setShowBillingModal(true)}
                                                style={{ borderRadius: 12 }}
                                            >
                                                Add Billing Address
                                            </Button>
                                        </div>
                                    </div>
                                </Alert>
                            )}

                            {/* Missing payment method */}
                            {!hasPaymentMethod && (
                                <Alert
                                    variant="warning"
                                    className="d-flex align-items-start gap-2"
                                    style={{ borderRadius: 16 }}
                                >
                                    <AlertTriangle size={18} className="mt-1" />
                                    <div>
                                        <div className="fw-bold">Missing payment method</div>
                                        <div className="small">
                                            Please add a valid billing card to continue.
                                        </div>

                                        <div className="mt-2">
                                            <Button
                                                size="sm"
                                                variant="outline-primary"
                                                onClick={() => setShowPaymentModal(true)}
                                                style={{ borderRadius: 12 }}
                                            >
                                                Add Payment Method
                                            </Button>
                                        </div>
                                    </div>
                                </Alert>
                            )}

                            {/* Missing plan */}
                            {!hasPlan && (
                                <Alert
                                    variant="warning"
                                    className="d-flex align-items-start gap-2"
                                    style={{ borderRadius: 16 }}
                                >
                                    <AlertTriangle size={18} className="mt-1" />
                                    <div>
                                        <div className="fw-bold">No active plan</div>
                                        <div className="small">
                                            You don’t have an active subscription plan yet.
                                        </div>

                                        <div className="mt-2">
                                            <Button
                                                size="sm"
                                                variant="dark"
                                                as={Link}
                                                to="/plans"
                                                style={{ borderRadius: 12 }}
                                            >
                                                Choose Plan
                                            </Button>
                                        </div>
                                    </div>
                                </Alert>
                            )}

                        </div>
                    </div>
                </Alert>
            )}

            <Row className="g-4">
                <Col lg={hasCompletedBillingSetup ? 4 : 12}>
                    <AvatarCard
                        profile={profile}
                        darkMode={darkMode}
                        onSaveAvatar={saveAvatar}
                        onDeleteAvatar={deleteAvatar}
                    />

                    {/*{hasCompletedBillingSetup && (*/}
                    {/*    <Card className={`${cardBase} mt-4`} style={{ borderRadius: 22 }}>*/}
                    {/*        <Card.Body className="p-4">*/}
                    {/*            <div className="d-flex align-items-center justify-content-between">*/}
                    {/*                <div className={`fw-black ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900 }}>*/}
                    {/*                    Rewards Points*/}
                    {/*                </div>*/}
                    {/*                <Star size={18} />*/}
                    {/*            </div>*/}

                    {/*            <div className="mt-3">*/}
                    {/*                <div*/}
                    {/*                    className={`fw-black ${darkMode ? "text-light" : "text-dark"}`}*/}
                    {/*                    style={{ fontWeight: 900, fontSize: "2rem" }}*/}
                    {/*                >*/}
                    {/*                    {Number(profile.points ?? 0).toLocaleString()} pts*/}
                    {/*                </div>*/}
                    {/*                <div className={mutedClass}>*/}
                    {/*                    Earn {POINTS_PER_DOLLAR} point per $1 spent • Spend tracked: {formatMoney(profile.totalSpent)}*/}
                    {/*                </div>*/}
                    {/*            </div>*/}

                    {/*            <div className="mt-3">*/}
                    {/*                <div className="d-flex justify-content-between small">*/}
                    {/*    <span className={mutedClass}>*/}
                    {/*        Progress to Bronze ({BRONZE_REQUIREMENT.toLocaleString()} pts)*/}
                    {/*    </span>*/}
                    {/*                    <span className={mutedClass}>{tierInfo.progress}%</span>*/}
                    {/*                </div>*/}

                    {/*                <div className="progress mt-1" style={{ height: 6, borderRadius: 3 }}>*/}
                    {/*                    <div*/}
                    {/*                        className={`progress-bar ${tierInfo.isBronze ? "bg-warning" : "bg-primary"}`}*/}
                    {/*                        style={{ width: `${tierInfo.progress}%` }}*/}
                    {/*                    />*/}
                    {/*                </div>*/}

                    {/*                {!tierInfo.isBronze ? (*/}
                    {/*                    <div className={`small mt-2 ${mutedClass}`}>*/}
                    {/*                        {tierInfo.remaining.toLocaleString()} pts to become Bronze.*/}
                    {/*                    </div>*/}
                    {/*                ) : (*/}
                    {/*                    <div className="small mt-2 text-warning">*/}
                    {/*                        <Crown size={16} className="me-1" />*/}
                    {/*                        Bronze active: 15% discount on first {formatMoney(BRONZE_DISCOUNT_CAP)} spent.*/}
                    {/*                    </div>*/}
                    {/*                )}*/}
                    {/*            </div>*/}
                    {/*        </Card.Body>*/}
                    {/*    </Card>*/}
                    {/*)}*/}

                    <>
                        {/* Plan section */}
                        {hasPlan && (
                            <SubscriptionPage user={profile} darkMode={darkMode} />
                        )}

                        {/* Payment card */}
                        {hasPaymentMethod && (
                            <BillingCard
                                profile={profile}
                                darkMode={darkMode}
                                onEdit={(section) => {
                                    if (section === "payment") setShowPaymentModal(true);
                                    else setShowBillingModal(true);
                                }}
                                className="mt-4"
                            />
                        )}

                        {/* Billing address */}
                        {hasBillingAddress && (
                            <BillingAddressCard
                                address={profile.billing.address}
                                darkMode={darkMode}
                                onEdit={() => setShowBillingModal(true)}
                                className="mt-3"
                            />
                        )}
                    </>
                </Col>

                <Col lg={8}>
                    {hasCompletedBillingSetup && (
                        <>
                            <SubscriptionPage user={profile} darkMode={darkMode} />

                            <BillingCard
                                profile={profile}
                                darkMode={darkMode}
                                onEdit={(section) => {
                                    if (section === "payment") setShowPaymentModal(true);
                                    else setShowBillingModal(true);
                                }}
                                className="mt-4"
                            />

                            <BillingAddressCard
                                address={profile.billing.address}
                                darkMode={darkMode}
                                onEdit={() => setShowBillingModal(true)}
                                className="mt-3"
                            />
                        </>
                    )}
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