// ProfilePage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert } from "react-bootstrap";
import { Star, Crown } from "lucide-react";
// const [billingDraft, setBillingDraft] = useState(null);
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AvatarCard, BillingCard, BillingModal, SubscriptionPage, DeleteProfileModal } from "../components";

// Reward system constants
const POINTS_PER_DOLLAR = 1;
const BRONZE_REQUIREMENT = 5000;
const BRONZE_DISCOUNT_CAP = 1000;

// Helper to format numbers as currency
const formatMoney = (n) =>
    n == null || Number.isNaN(Number(n))
        ? "—"
        : Number(n).toLocaleString(undefined, { style: "currency", currency: "CAD" });

export default function ProfilePage({ user: userProp, onLogout, darkMode = false }) {
    const navigate = useNavigate();
    const mutedClass = darkMode ? "text-light-50 text-secondary" : "text-muted";
    const cardBase = darkMode ? "bg-dark border-secondary" : "bg-white";

    // ---------------- State ----------------
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [profile, setProfile] = useState({
        customerId: null,
        firstName: "—",
        lastName: "",
        email: "—",
        phone: "—",
        points: 0,
        totalSpent: 0,
        avatarUrl: null,
        plan: {
            status: "Inactive",
            name: "—",
            monthlyPrice: null,
            startedAt: null,
            features: [],
            addOns: [],
        },
        billing: {
            nextBillAmount: null,
            nextBillDate: null,
            paymentMethod: {},
            address: {},
            invoices: [],
        },
    });

    const [showBillingModal, setShowBillingModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // ---------------- Load profile data ----------------
    useEffect(() => {
        let cancelled = false;

        async function loadProfile() {
            try {
                if (userProp) {
                    if (!cancelled) {
                        setProfile(prev => ({
                            ...prev,
                            ...userProp,
                            phone: userProp.phone ?? prev.phone,
                        }));
                        setLoading(false);
                    }
                    return;
                }

                const res = await fetch("/api/me", { credentials: "include" });

                if (res.status === 401) {
                    if (!cancelled) setLoading(false);
                    return;
                }

                const me = await res.json();

                if (!cancelled) {
                    const phoneNumber =
                        me.phone ??
                        me.homePhone ??
                        me.HomePhone ??
                        me.home_phone ??
                        me.customer?.homePhone ??
                        "—";

                    setProfile(prev => ({
                        ...prev,
                        customerId: me.customerId ?? prev.customerId,
                        firstName: me.firstName ?? prev.firstName,
                        lastName: me.lastName ?? prev.lastName,
                        email: me.email ?? prev.email,
                        phone: phoneNumber,
                        points: me.points ?? prev.points,
                        totalSpent: me.totalSpent ?? prev.totalSpent,
                        avatarUrl: me.avatarUrl ?? prev.avatarUrl,
                        plan: me.plan ?? prev.plan,
                        billing: {
                            ...prev.billing,
                            address: me.address ?? prev.billing.address,
                            paymentMethod: me.paymentMethod ?? prev.billing.paymentMethod,
                            nextBillAmount: me.nextBillAmount ?? prev.billing.nextBillAmount,
                            nextBillDate: me.nextBillDate ?? prev.billing.nextBillDate,
                            invoices: me.invoices ?? prev.billing.invoices,
                        },
                    }));

                    setLoading(false);
                }
            } catch {
                if (!cancelled) {
                    setError("Failed to load profile.");
                    setLoading(false);
                }
            }
        }

        loadProfile();
        return () => { cancelled = true; };
    }, [userProp]);

    // ---------------- Derived values ----------------
    const tierInfo = useMemo(() => {
        const points = profile.points || 0;
        const isBronze = points >= BRONZE_REQUIREMENT;
        const progress = Math.min(100, Math.round((points / BRONZE_REQUIREMENT) * 100));
        const remaining = Math.max(0, BRONZE_REQUIREMENT - points);
        return { isBronze, progress, remaining };
    }, [profile.points]);

    // ---------------- Handlers ----------------
    const closeBillingEditor = () => setShowBillingModal(false);

    const saveAvatar = async (file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append("avatar", file);
        try {
            const res = await fetch("/api/me/avatar", {
                method: "PUT",
                credentials: "include",
                body: formData,
            });
            const data = await res.json();
            setProfile(prev => ({ ...prev, avatarUrl: data.avatarUrl }));
        } catch {
            setError("Failed to save avatar");
        }
    };

    const deleteAvatar = async () => {
        try {
            await fetch("/api/me/avatar", {
                method: "DELETE",
                credentials: "include",
            });
            setProfile(prev => ({ ...prev, avatarUrl: null }));
        } catch {
            setError("Failed to delete avatar");
        }
    };

    const deleteProfile = async () => {
        try {
            await fetch("/api/me", {
                method: "DELETE",
                credentials: "include",
            });
            if (onLogout) onLogout();
            navigate("/");
        } catch {
            setError("Failed to delete profile");
        }
    };

    // ---------------- Loading / Redirect ----------------
    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" />
                <div className={`mt-2 ${mutedClass}`}>Loading your profile…</div>
            </Container>
        );
    }

    if (!profile.customerId) {
        return <Navigate to="/" replace />;
    }

    // ---------------- Render ----------------
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
                                <div className={`fw-black ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900, fontSize: "2rem" }}>
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
                    <BillingCard
                        profile={profile}
                        darkMode={darkMode}
                        onEdit={() => setShowBillingModal(true)}
                        className="mt-4"
                    />
                </Col>
            </Row>

            <BillingModal
                show={showBillingModal}
                profile={profile}
                onClose={closeBillingEditor}
                backdrop={true}
                keyboard={true}
                centered
            />

            <DeleteProfileModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onDelete={deleteProfile}
            />
        </Container>
    );
}
