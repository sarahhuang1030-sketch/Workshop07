import React, { useEffect, useMemo, useState } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Badge,
    Table,
    Alert,
    Form,
    Spinner,
    ProgressBar,
} from "react-bootstrap";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Crown, CreditCard, Package, Star, ShieldCheck } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

// --------- Business Rules (from your spec) ---------
const POINTS_PER_DOLLAR = 1; // 1 point per $1 spent
const BRONZE_REQUIREMENT = 5000; // membership requirement: 5,000 pts
const BRONZE_DISCOUNT_RATE = 0.15; // 15% discount
const BRONZE_DISCOUNT_CAP = 10000; // on first $10,000 spent after becoming member

function formatMoney(n) {
    if (n == null || Number.isNaN(Number(n))) return "—";
    return Number(n).toLocaleString(undefined, { style: "currency", currency: "CAD" });
}

function initials(name = "") {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "TC";
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/**
 * ProfilePage supports BOTH login flows:
 * 1) Normal login: App passes `user` prop (from /api/auth/login response)
 * 2) Google OAuth: App may not have user yet, so ProfilePage can fetch /api/me
 *
 * IMPORTANT: No early returns before hooks (Rules of Hooks).
 */
export default function ProfilePage({ user: userProp, onLogout }) {
    const { darkMode } = useTheme();
    const navigate = useNavigate();

    const mutedClass = darkMode ? "tc-muted-dark" : "tc-muted-light";
    const cardBase = darkMode ? "tc-card-dark" : "bg-white border-0 shadow-sm";

    // ---- Local UI state (profile picture preview)
    const [avatarUrl, setAvatarUrl] = useState(null);

    // ---- Session user state (either normal login user, or OAuth user from /api/me)
    const [sessionUser, setSessionUser] = useState(userProp ?? null);

    // ---- Loading + error
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ---- Profile data defaults (safe until backend endpoints exist)
    const [profile, setProfile] = useState({
        // identity
        customerId: null,
        firstName: "—",
        lastName: "",
        email: "",

        // program + spend
        totalSpent: 0,
        points: 0,
        customerType: "Guest Customer",

        // subscription/plan
        plan: {
            name: "—",
            monthlyPrice: null,
            status: "Inactive",
            startedAt: null,
            features: [],
            addOns: [],
        },

        // billing
        billing: {
            nextBillDate: null,
            nextBillAmount: null,
            paymentMethod: { brand: "—", last4: "—" },
            address: {
                street1: "—",
                city: "—",
                province: "—",
                postalCode: "—",
                country: "—",
            },
            invoices: [],
        },
    });

    /**
     * Keep sessionUser in sync if App updates the prop (normal login flow).
     * This avoids stale state.
     */
    useEffect(() => {
        if (userProp) setSessionUser(userProp);
    }, [userProp]);

    /**
     * If no userProp (common after OAuth redirect), try /api/me.
     * Your backend returns OAuth2User attributes (or null).
     */
    useEffect(() => {
        let cancelled = false;

        async function loadMeIfNeeded() {
            if (sessionUser) {
                setLoading(false);
                return;
            }

            try {
                setError("");
                setLoading(true);

                const res = await fetch("/api/me", {
                    credentials: "include", // important for session cookie
                });

                if (!res.ok) {
                    // If not logged in, we will redirect below
                    if (!cancelled) setLoading(false);
                    return;
                }

                const me = await res.json();

                if (me) {
                    const attrs = me.attributes || {}; // <-- IMPORTANT (OAuth attributes live here)

                    const mapped = {
                        // ids needed for UI logic
                        employeeId: me.employeeId ?? null,
                        customerId: me.customerId ?? null,
                        role: me.role ?? null,

                        // name/email from oauth attributes OR fallback to principal name
                        firstName: attrs.given_name || attrs.name?.split(" ")?.[0] || "—",
                        lastName: attrs.family_name || attrs.name?.split(" ")?.slice(1)?.join(" ") || "",
                        email: attrs.email || "",
                        username: me.name || attrs.email || attrs.name || "User",

                        oauth: !!me.provider,
                        provider: me.provider || null,
                        raw: me,
                    };

                    setSessionUser(mapped);
                }

                setLoading(false);
            } catch (e) {
                if (!cancelled) setError(e?.message || "Failed to load /api/me");
                if (!cancelled) setLoading(false);
            }
        }

        loadMeIfNeeded();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionUser]);

    /**
     * Whenever we have a sessionUser, update the base profile identity fields.
     * This ensures OAuth users still see the full UI layout.
     */
    useEffect(() => {
        if (!sessionUser) return;

        setProfile((prev) => ({
            ...prev,
            customerId: sessionUser.customerId ?? null,
            firstName: sessionUser.firstName ?? prev.firstName,
            lastName: sessionUser.lastName ?? prev.lastName,
            email: sessionUser.email ?? prev.email,
        }));
    }, [sessionUser]);

    /**
     * Optional: fetch extra profile details (only if you have a backend endpoint).
     * For OAuth users, you might not have customerId in DB yet, so this may not work.
     * That's OK — UI will show defaults.
     */
    useEffect(() => {
        let cancelled = false;

        async function loadProfileDetails() {
            if (!sessionUser) return;

            try {
                setError("");
                // show spinner only if we are still loading initially
                // (don’t force re-spinner if page already rendered)
                // setLoading(true);

                const cid = sessionUser.customerId;
                if (!cid) return;

                // Example endpoint (only works if your backend supports it)
                const res = await fetch(`/api/customers/${cid}/profile`, {
                    credentials: "include",
                });

                if (!res.ok) return;

                const data = await res.json();
                if (cancelled) return;

                const totalSpent = Number(data.totalSpent ?? 0);
                const points = Number(data.points ?? totalSpent * POINTS_PER_DOLLAR);
                const computedType =
                    points >= BRONZE_REQUIREMENT ? "Frequent Traveler (Bronze)" : "Guest Customer";

                setProfile((prev) => ({
                    ...prev,
                    ...data,
                    totalSpent,
                    points,
                    customerType: data.customerType ?? computedType,
                }));
            } catch (e) {
                if (!cancelled) setError(e?.message || "Failed to load profile details");
            } finally {
                // setLoading(false);
            }
        }

        loadProfileDetails();
        return () => {
            cancelled = true;
        };
    }, [sessionUser]);

    //logic for show/hide the Register as Customer button
    const canRegisterAsCustomer = useMemo(() => {
        if (loading) return false;
        if (!sessionUser) return false;

        const hasCustomer = (sessionUser.customerId ?? 0) > 0;
        const isEmployee = (sessionUser.employeeId ?? 0) > 0;

        return isEmployee && !hasCustomer;
    }, [loading, sessionUser]);


    // ---- compute tier/progress
    const tierInfo = useMemo(() => {
        const pts = Number(profile.points ?? 0);
        const isBronze = pts >= BRONZE_REQUIREMENT;
        const progress = Math.min(100, Math.round((pts / BRONZE_REQUIREMENT) * 100));
        const remaining = Math.max(0, BRONZE_REQUIREMENT - pts);
        return { isBronze, progress, remaining };
    }, [profile.points]);

    // ---- avatar upload preview (front-end only)
    const onPickAvatar = (file) => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setAvatarUrl(url);
    };




    // ---- Logout button handler (works for both flows)
    const handleLogout = async () => {
        try {
            // If App provides a logout handler, use it
            if (onLogout) {
                await onLogout();
            } else {
                // fallback: hit backend logout
                await fetch("/logout", { method: "POST", credentials: "include" });
            }
        } finally {
            setSessionUser(null);
            navigate("/login", { replace: true });
        }
    };

    // ✅ after ALL hooks: safe to redirect
    if (!loading && !sessionUser) return <Navigate to="/login" replace />;

    return (
        <Container className="py-4 py-md-5 px-4">
            {/* Header */}
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
                <div>
                    <h1
                        className={`fw-black mb-1 ${darkMode ? "text-light" : "text-dark"}`}
                        style={{ fontWeight: 900 }}
                    >
                        My Profile
                    </h1>

                    <div className={mutedClass}>
                        Customer ID:{" "}
                        <span className={darkMode ? "text-light" : "text-dark"}>
              {profile.customerId ?? "—"}
            </span>
                    </div>
                </div>

                <div className="d-flex gap-2">
                    <Button
                        variant={darkMode ? "outline-light" : "outline-secondary"}
                        as={Link}
                        to="/plans"
                        style={{ borderRadius: 14 }}
                    >
                        Manage Plans
                    </Button>


                </div>
            </div>

            {error && (
                <Alert variant="danger">
                    <div className="fw-bold">Profile error</div>
                    <div className="small">{error}</div>
                </Alert>
            )}

            {loading ? (
                <div className="py-5 text-center">
                    <Spinner animation="border" />
                    <div className={`mt-2 ${mutedClass}`}>Loading your profile…</div>
                </div>
            ) : (
                <Row className="g-4">
                    {/* LEFT: Identity + Program */}
                    <Col lg={4}>
                        <Card className={`${cardBase}`} style={{ borderRadius: 22 }}>
                            <Card.Body className="p-4">
                                <div className="d-flex align-items-center gap-3">
                                    <div
                                        className="d-flex align-items-center justify-content-center"
                                        style={{
                                            width: 72,
                                            height: 72,
                                            borderRadius: 18,
                                            background: avatarUrl
                                                ? `url(${avatarUrl}) center/cover no-repeat`
                                                : "linear-gradient(135deg, #7c3aed, #ec4899)",
                                            color: "white",
                                            fontWeight: 900,
                                            fontSize: 20,
                                        }}
                                        aria-label="Profile picture"
                                        title="Profile picture"
                                    >
                                        {!avatarUrl && initials(`${profile.firstName} ${profile.lastName}`)}
                                    </div>

                                    <div className="flex-grow-1">
                                        <div
                                            className={`fw-black ${darkMode ? "text-light" : "text-dark"}`}
                                            style={{ fontWeight: 900, fontSize: "1.25rem" }}
                                        >
                                            {profile.firstName} {profile.lastName}
                                        </div>

                                        <div className={mutedClass}>
                                            {profile.email || sessionUser?.username || "—"}
                                        </div>

                                        <div className="mt-2">
                                            <Badge
                                                bg={tierInfo.isBronze ? "warning" : "secondary"}
                                                style={{ borderRadius: 999, padding: "0.4rem 0.7rem" }}
                                            >
                                                {tierInfo.isBronze ? "Frequent Traveler (Bronze)" : "Guest Customer"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* avatar upload */}
                                <Form.Group className="mt-3">
                                    <Form.Label className={mutedClass}>Profile picture</Form.Label>
                                    <Form.Control
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => onPickAvatar(e.target.files?.[0])}
                                    />
                                    <div className={`small mt-1 mb-3 ${mutedClass}`}>
                                        (Preview only for now — can be saved to backend later.)
                                    </div>

                                    {canRegisterAsCustomer && (
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => navigate("/register?mode=customer")}
                                        >
                                            Register as Customer
                                        </button>
                                    )}
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        {/* Points + Program Rules */}
                        <Card className={`${cardBase} mt-4`} style={{ borderRadius: 22 }}>
                            <Card.Body className="p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div
                                        className={`fw-black ${darkMode ? "text-light" : "text-dark"}`}
                                        style={{ fontWeight: 900 }}
                                    >
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
                                        Earn {POINTS_PER_DOLLAR} point per $1 spent • Spend tracked:{" "}
                                        {formatMoney(profile.totalSpent)}
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <div className="d-flex justify-content-between small">
                    <span className={mutedClass}>
                      Progress to Bronze ({BRONZE_REQUIREMENT.toLocaleString()} pts)
                    </span>
                                        <span className={mutedClass}>{tierInfo.progress}%</span>
                                    </div>
                                    <ProgressBar now={tierInfo.progress} className="mt-1" />

                                    {!tierInfo.isBronze ? (
                                        <div className={`small mt-2 ${mutedClass}`}>
                                            {tierInfo.remaining.toLocaleString()} pts to become a Frequent Traveler (Bronze).
                                        </div>
                                    ) : (
                                        <div className="small mt-2 text-warning">
                                            <Crown size={16} className="me-1" />
                                            Bronze active: 15% discount on the first {formatMoney(BRONZE_DISCOUNT_CAP)} spent
                                            after joining.
                                        </div>
                                    )}
                                </div>

                                <div className="mt-3">
                                    <Alert variant={tierInfo.isBronze ? "warning" : "secondary"} className="mb-0">
                                        <div className="fw-bold">Customer Types</div>
                                        <ul className="mb-0 mt-2">
                                            <li>
                                                <strong>Guest Customer:</strong> Standard booking access with no additional discounts.
                                            </li>
                                            <li>
                                                <strong>Frequent Traveler (Bronze):</strong> Requires{" "}
                                                {BRONZE_REQUIREMENT.toLocaleString()} pts. After becoming a member, get{" "}
                                                <strong>{Math.round(BRONZE_DISCOUNT_RATE * 100)}%</strong> off the first{" "}
                                                <strong>{formatMoney(BRONZE_DISCOUNT_CAP)}</strong> spent.
                                            </li>
                                        </ul>
                                    </Alert>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* RIGHT: Plan + Subscription + Billing */}
                    <Col lg={8}>
                        {/* Plan / Subscription */}
                        <Card className={`${cardBase}`} style={{ borderRadius: 22 }}>
                            <Card.Body className="p-4">
                                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
                                    <div>
                                        <div
                                            className={`fw-black ${darkMode ? "text-light" : "text-dark"}`}
                                            style={{ fontWeight: 900, fontSize: "1.25rem" }}
                                        >
                                            Subscription & Plan
                                        </div>
                                        <div className={mutedClass}>Your current registered plan and subscription details.</div>
                                    </div>

                                    <Badge
                                        bg={profile.plan.status === "Active" ? "success" : "secondary"}
                                        style={{ borderRadius: 999, padding: "0.45rem 0.75rem", width: "fit-content" }}
                                    >
                                        {profile.plan.status || "Inactive"}
                                    </Badge>
                                </div>

                                <Row className="g-3 mt-3">
                                    <Col md={6}>
                                        <div className={`p-3 ${darkMode ? "tc-card-dark" : "bg-light"}`} style={{ borderRadius: 18 }}>
                                            <div className="d-flex align-items-center gap-2">
                                                <Package size={18} />
                                                <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>Plan</div>
                                            </div>
                                            <div
                                                className={`fw-black mt-2 ${darkMode ? "text-light" : "text-dark"}`}
                                                style={{ fontWeight: 900, fontSize: "1.4rem" }}
                                            >
                                                {profile.plan.name || "—"}
                                            </div>
                                            <div className={mutedClass}>
                                                {profile.plan.monthlyPrice != null ? `${formatMoney(profile.plan.monthlyPrice)}/month` : "—"}
                                            </div>
                                            {profile.plan.startedAt && (
                                                <div className={`small mt-2 ${mutedClass}`}>Started: {String(profile.plan.startedAt)}</div>
                                            )}
                                        </div>
                                    </Col>

                                    <Col md={6}>
                                        <div className={`p-3 ${darkMode ? "tc-card-dark" : "bg-light"}`} style={{ borderRadius: 18 }}>
                                            <div className="d-flex align-items-center gap-2">
                                                <ShieldCheck size={18} />
                                                <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>Included</div>
                                            </div>

                                            {(profile.plan.features?.length ?? 0) > 0 ? (
                                                <ul className={`mt-2 mb-0 ${mutedClass}`}>
                                                    {profile.plan.features.slice(0, 6).map((f, idx) => (
                                                        <li key={idx}>{typeof f === "string" ? f : `${f.name}: ${f.value}${f.unit ?? ""}`}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className={`mt-2 ${mutedClass}`}>No plan features loaded yet.</div>
                                            )}
                                        </div>
                                    </Col>
                                </Row>

                                {/* Add-ons */}
                                <div className="mt-4">
                                    <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>Add-ons</div>
                                    {(profile.plan.addOns?.length ?? 0) > 0 ? (
                                        <Row className="g-2 mt-1">
                                            {profile.plan.addOns.map((a, idx) => (
                                                <Col md={6} key={idx}>
                                                    <div className={`p-3 ${darkMode ? "tc-card-dark" : "bg-light"}`} style={{ borderRadius: 16 }}>
                                                        <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>
                                                            {a.name ?? a.addOnName ?? a}
                                                        </div>
                                                        {a.monthlyPrice != null && <div className={mutedClass}>+{formatMoney(a.monthlyPrice)}/month</div>}
                                                        {a.description && <div className={`small mt-1 ${mutedClass}`}>{a.description}</div>}
                                                    </div>
                                                </Col>
                                            ))}
                                        </Row>
                                    ) : (
                                        <div className={mutedClass}>No add-ons attached.</div>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Billing */}
                        <Card className={`${cardBase} mt-4`} style={{ borderRadius: 22 }}>
                            <Card.Body className="p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <div
                                            className={`fw-black ${darkMode ? "text-light" : "text-dark"}`}
                                            style={{ fontWeight: 900, fontSize: "1.25rem" }}
                                        >
                                            Billing Information
                                        </div>
                                        <div className={mutedClass}>Payment method, next bill, and billing address.</div>
                                    </div>
                                    <CreditCard size={18} />
                                </div>

                                <Row className="g-3 mt-3">
                                    <Col md={6}>
                                        <div className={`p-3 ${darkMode ? "tc-card-dark" : "bg-light"}`} style={{ borderRadius: 18 }}>
                                            <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>Next bill</div>
                                            <div
                                                className={`fw-black mt-2 ${darkMode ? "text-light" : "text-dark"}`}
                                                style={{ fontWeight: 900, fontSize: "1.6rem" }}
                                            >
                                                {profile.billing.nextBillAmount != null ? formatMoney(profile.billing.nextBillAmount) : "—"}
                                            </div>
                                            <div className={mutedClass}>
                                                {profile.billing.nextBillDate ? `Due: ${String(profile.billing.nextBillDate)}` : "No upcoming invoice loaded."}
                                            </div>

                                            <div className="mt-3">
                                                <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>Payment method</div>
                                                <div className={mutedClass}>
                                                    {profile.billing.paymentMethod?.brand ?? "—"} •••• {profile.billing.paymentMethod?.last4 ?? "—"}
                                                </div>
                                            </div>
                                        </div>
                                    </Col>

                                    <Col md={6}>
                                        <div className={`p-3 ${darkMode ? "tc-card-dark" : "bg-light"}`} style={{ borderRadius: 18 }}>
                                            <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>Billing address</div>
                                            <div className={`mt-2 ${mutedClass}`}>
                                                <div>{profile.billing.address?.street1 ?? "—"}</div>
                                                <div>
                                                    {(profile.billing.address?.city ?? "—")},{" "}
                                                    {(profile.billing.address?.province ?? "—")} {(profile.billing.address?.postalCode ?? "")}
                                                </div>
                                                <div>{profile.billing.address?.country ?? "—"}</div>
                                            </div>

                                            <Button
                                                variant={darkMode ? "outline-light" : "outline-secondary"}
                                                className="mt-3 fw-bold"
                                                style={{ borderRadius: 14 }}
                                                onClick={() => alert("Edit billing later")}
                                            >
                                                Edit Billing
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>

                                {/* Invoices (optional) */}
                                <div className="mt-4">
                                    <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>Billing History</div>
                                    {(profile.billing.invoices?.length ?? 0) > 0 ? (
                                        <Table responsive className="mt-2" bordered hover>
                                            <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {profile.billing.invoices.map((inv, idx) => (
                                                <tr key={idx}>
                                                    <td>{inv.date ?? "—"}</td>
                                                    <td>{inv.amount != null ? formatMoney(inv.amount) : "—"}</td>
                                                    <td>{inv.status ?? "—"}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </Table>
                                    ) : (
                                        <div className={mutedClass}>No invoices loaded yet.</div>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
        </Container>
    );
}
