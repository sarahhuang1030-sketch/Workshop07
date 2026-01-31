import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Card, Button, Badge, Table, Alert, Form, Spinner, ProgressBar } from "react-bootstrap";
import { Navigate, Link } from "react-router-dom";
import { User, Crown, CreditCard, Package, Star, ShieldCheck } from "lucide-react";
import { useTheme } from "../context/ThemeContext"; // adjust path if needed

// --------- Business Rules (from your spec) ---------
const POINTS_PER_DOLLAR = 1;               // 1 point per $1 spent
const BRONZE_REQUIREMENT = 5000;           // membership requirement: 5,000 pts
const BRONZE_DISCOUNT_RATE = 0.15;         // 15% discount
const BRONZE_DISCOUNT_CAP = 10000;         // on first $10,000 spent after becoming member

function formatMoney(n) {
    if (n == null || Number.isNaN(Number(n))) return "—";
    return Number(n).toLocaleString(undefined, { style: "currency", currency: "CAD" });
}

function initials(name = "") {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "TC";
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function ProfilePage({ user }) {
    const { darkMode } = useTheme();
    const mutedClass = darkMode ? "tc-muted-dark" : "tc-muted-light";
    const cardBase = darkMode ? "tc-card-dark" : "bg-white border-0 shadow-sm";

    // If not logged in, send to login
    if (!user) return <Navigate to="/login" replace />;

    // ---- Local UI state (profile picture preview)
    const [avatarUrl, setAvatarUrl] = useState(null);

    // ---- Profile data (from backend) - safe defaults until backend exists
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [profile, setProfile] = useState({
        // identity
        customerId: user.customerId,
        firstName: user.firstName ?? "—",
        lastName: user.lastName ?? "",
        email: user.email ?? "",

        // program + spend
        totalSpent: 0,               // dollars spent
        points: 0,                   // points (1 per $1)
        customerType: "Guest",       // "Guest" or "Frequent Traveler (Bronze)" etc.

        // subscription/plan
        plan: {
            name: "—",
            monthlyPrice: null,
            status: "Inactive",        // Active / Paused / Cancelled
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
            invoices: [], // optional list
        },
    });

    // ---- fetch profile details from backend (optional)
    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setError("");
                setLoading(true);

                // Adjust these endpoints to your backend when ready:
                // Example:
                // GET /api/customers/{id}/profile
                // GET /api/subscriptions/customer/{id}
                // GET /api/billing/customer/{id}

                // For now: try one endpoint; if it fails, we keep defaults.
                const res = await fetch(`/api/customers/${user.customerId}/profile`);
                if (!res.ok) {
                    // no backend yet -> no hard fail, just show defaults
                    if (!cancelled) setLoading(false);
                    return;
                }

                const data = await res.json();
                if (cancelled) return;

                // Expecting something like:
                // {
                //   firstName, lastName, email,
                //   totalSpent,
                //   plan: { name, monthlyPrice, status, startedAt, features:[], addOns:[] },
                //   billing: {...}
                // }
                const totalSpent = Number(data.totalSpent ?? 0);
                const points = Number(data.points ?? totalSpent * POINTS_PER_DOLLAR);

                const computedType = points >= BRONZE_REQUIREMENT
                    ? "Frequent Traveler (Bronze)"
                    : "Guest Customer";

                setProfile((prev) => ({
                    ...prev,
                    ...data,
                    totalSpent,
                    points,
                    customerType: data.customerType ?? computedType,
                }));

            } catch (e) {
                if (!cancelled) setError(e.message || "Failed to load profile");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [user.customerId]);

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

    return (
        <Container className="py-4 py-md-5 px-4">
            {/* Header */}
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
                <div>
                    <h1 className={`fw-black mb-1 ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900 }}>
                        My Profile
                    </h1>
                    <div className={mutedClass}>
                        Customer ID: <span className={darkMode ? "text-light" : "text-dark"}>{profile.customerId}</span>
                    </div>
                </div>

                <div className="d-flex gap-2">
                    <Button variant={darkMode ? "outline-light" : "outline-secondary"} as={Link} to="/plans" style={{ borderRadius: 14 }}>
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
                                        <div className={`fw-black ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900, fontSize: "1.25rem" }}>
                                            {profile.firstName} {profile.lastName}
                                        </div>
                                        <div className={mutedClass}>{profile.email || user.username}</div>

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
                                    <div className={`small mt-1 ${mutedClass}`}>
                                        (Preview only for now — can be saved to backend later.)
                                    </div>
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        {/* Points + Program Rules */}
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
                                        <span className={mutedClass}>Progress to Bronze ({BRONZE_REQUIREMENT.toLocaleString()} pts)</span>
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
                                            Bronze active: 15% discount on the first {formatMoney(BRONZE_DISCOUNT_CAP)} spent after joining.
                                        </div>
                                    )}
                                </div>

                                <div className="mt-3">
                                    <Alert variant={tierInfo.isBronze ? "warning" : "secondary"} className="mb-0">
                                        <div className="fw-bold">Customer Types</div>
                                        <ul className="mb-0 mt-2">
                                            <li><strong>Guest Customer:</strong> Standard booking access with no additional discounts.</li>
                                            <li>
                                                <strong>Frequent Traveler (Bronze):</strong> Requires {BRONZE_REQUIREMENT.toLocaleString()} pts.
                                                After becoming a member, get <strong>{Math.round(BRONZE_DISCOUNT_RATE * 100)}%</strong> off the first{" "}
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
                                        <div className={`fw-black ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900, fontSize: "1.25rem" }}>
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
                                            <div className={`fw-black mt-2 ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900, fontSize: "1.4rem" }}>
                                                {profile.plan.name || "—"}
                                            </div>
                                            <div className={mutedClass}>
                                                {profile.plan.monthlyPrice != null ? `${formatMoney(profile.plan.monthlyPrice)}/month` : "—"}
                                            </div>
                                            {profile.plan.startedAt && <div className={`small mt-2 ${mutedClass}`}>Started: {String(profile.plan.startedAt)}</div>}
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
                                                        {(a.monthlyPrice != null) && (
                                                            <div className={mutedClass}>+{formatMoney(a.monthlyPrice)}/month</div>
                                                        )}
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
                                        <div className={`fw-black ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900, fontSize: "1.25rem" }}>
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
                                            <div className={`fw-black mt-2 ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900, fontSize: "1.6rem" }}>
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
                                                    {(profile.billing.address?.province ?? "—")}{" "}
                                                    {(profile.billing.address?.postalCode ?? "")}
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
