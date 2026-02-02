import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Card, Button, Badge, Form, Spinner, Alert } from "react-bootstrap";
import { useTheme } from "../context/ThemeContext";
import { Smartphone, Video, Zap, Music, Users, Gift } from "lucide-react";
import "../style/style.css";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";


const ICONS = {
    smartphone: Smartphone,
    video: Video,
    zap: Zap,
    music: Music,
    users: Users,
    gift: Gift,
};

function planIconKey(planName) {
    const n = (planName || "").toLowerCase();
    if (n.includes("stream")) return "video";
    if (n.includes("power")) return "zap";
    return "smartphone";
}

function planGradClass(planName) {
    const n = (planName || "").toLowerCase();
    if (n.includes("stream")) return "tc-grad-purple";
    if (n.includes("power")) return "tc-grad-orange";
    return "tc-grad-cyan";
}

// Pull a "data label" from backend structured features (Data row)
function getDataLabel(plan) {
    const data = (plan.features ?? []).find(f => (f.name || "").toLowerCase() === "data");
    if (!data) return "";               // fallback if DB doesn’t have it
    if (data.unit) return `${data.value}${data.unit}`;
    return data.value ?? "";
}

export default function PlansPage() {

    const { addPlan, addAddOn } = useCart();
    const navigate = useNavigate();


    const { darkMode } = useTheme();
    const mutedClass = darkMode ? "tc-muted-dark" : "tc-muted-light";

    const [sortBy, setSortBy] = useState("recommended");
    const [selectedPlanId, setSelectedPlanId] = useState(null);

    // ✅ backend data state
    const [plans, setPlans] = useState([]);
    const [addOns, setAddOns] = useState([]);

    // loading/error
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // (optional) later you can add a dropdown: Mobile vs Internet
    const [serviceType, setServiceType] = useState("Mobile");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setError("");
                setLoading(true);

                const [plansRes, addOnsRes] = await Promise.all([
                    fetch(`/api/plans?type=${encodeURIComponent(serviceType)}&includeAddOns=true`),
                    fetch("/api/addons"),
                ]);

                if (!plansRes.ok) throw new Error(`Plans API failed: ${plansRes.status}`);
                if (!addOnsRes.ok) throw new Error(`AddOns API failed: ${addOnsRes.status}`);

                const [plansJson, addOnsJson] = await Promise.all([
                    plansRes.json(),
                    addOnsRes.json(),
                ]);

                if (cancelled) return;

                // ✅ map backend -> UI shape (keep your UI code mostly intact)
                const uiPlans = (plansJson ?? []).map(p => ({
                    id: p.planId,
                    name: p.planName,
                    tagline: p.tagline,
                    price: Number(p.monthlyPrice),
                    perks: p.perks ?? [],
                    features: p.features ?? [],
                    addOnsAllowed: p.addOns ?? [],

                    // UI-only fields
                    data: getDataLabel(p) || "—",
                    gradClass: planGradClass(p.planName),
                    icon: ICONS[planIconKey(p.planName)] || Smartphone,
                    badge: null, // optional: later add in DB
                }));

                setPlans(uiPlans);
                setAddOns(addOnsJson ?? []);
            } catch (e) {
                setError(e.message || "Failed to load plans");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [serviceType]);

    const sortedPlans = useMemo(() => {
        const copy = [...plans];
        if (sortBy === "priceLow") copy.sort((a, b) => a.price - b.price);
        if (sortBy === "priceHigh") copy.sort((a, b) => b.price - a.price);
        return copy;
    }, [plans, sortBy]);

    const selectedPlan = useMemo(
        () => sortedPlans.find((p) => p.id === selectedPlanId) ?? null,
        [sortedPlans, selectedPlanId]
    );

    return (
        <div className="py-4 py-md-5">
            <Container className="px-4">
                {/* Page header */}
                <div className="d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-3 mb-4">
                    <div>
                        <Badge className="tc-badge-hot px-3 py-2 tc-rounded-2xl" style={{ borderRadius: 16 }}>
                            Choose your plan
                        </Badge>

                        <h1 className={`mt-3 mb-1 fw-black ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900 }}>
                            Plans & Pricing
                        </h1>

                        <p className={`mb-0 ${mutedClass}`}>
                            Pick a plan that matches your lifestyle. Add perks anytime.
                        </p>
                    </div>

                    <div className="d-flex flex-column gap-2 align-items-end">
                        {/* Optional: switch service type */}
                        <Form.Select
                            value={serviceType}
                            onChange={(e) => {
                                setSelectedPlanId(null);
                                setServiceType(e.target.value);
                            }}
                            style={{ maxWidth: 220, marginBottom:10 }}
                        >
                            <option value="Mobile">Mobile</option>
                            <option value="Internet">Home (Internet)</option>
                        </Form.Select>


                            {/*<span className={`small ${mutedClass}`}>Sort by:</span>*/}

                            <Form.Select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                style={{ maxWidth: 220 }}
                            >
                                <option value="recommended">Recommended</option>
                                <option value="priceLow">Price: Low → High</option>
                                <option value="priceHigh">Price: High → Low</option>
                            </Form.Select>

                    </div>
                </div>

                {/* Loading / Error */}
                {loading && (
                    <div className="py-5 text-center">
                        <Spinner animation="border" />
                        <div className={`mt-2 ${mutedClass}`}>Loading plans from backend…</div>
                    </div>
                )}

                {!loading && error && (
                    <Alert variant="danger">
                        <div className="fw-bold">Couldn’t load plans</div>
                        <div className="small">{error}</div>
                    </Alert>
                )}

                {!loading && !error && (
                    <>
                        {/* Selected plan banner */}
                        {selectedPlan && (
                            <div
                                className={`p-3 p-md-4 mb-4 tc-rounded-3xl shadow-sm ${darkMode ? "tc-card-dark" : "bg-white"}`}
                                style={{ borderRadius: 24 }}
                            >
                                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                                    <div>
                                        <div className={`small ${mutedClass}`}>Selected plan</div>
                                        <div className={`fw-black ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900, fontSize: "1.4rem" }}>
                                            {selectedPlan.name} • ${selectedPlan.price}/mo • {selectedPlan.data}
                                        </div>
                                        <div className={mutedClass}>{selectedPlan.tagline}</div>
                                    </div>

                                    {/*<Button*/}
                                    {/*    className="fw-bold border-0"*/}
                                    {/*    style={{*/}
                                    {/*        background: "linear-gradient(90deg, #7c3aed, #ec4899)",*/}
                                    {/*        borderRadius: 999,*/}
                                    {/*        padding: "0.75rem 1.25rem",*/}
                                    {/*        whiteSpace: "nowrap",*/}
                                    {/*    }}*/}
                                    {/*    onClick={() => alert(`Checkout flow later: ${selectedPlan.name}`)}*/}
                                    {/*>*/}
                                    {/*    Continue to Checkout*/}
                                    {/*</Button>*/}
                                    <Button
                                        className="fw-bold border-0"
                                        style={{
                                            background: "linear-gradient(90deg, #7c3aed, #ec4899)",
                                            borderRadius: 999,
                                        }}
                                        onClick={() => {
                                            addPlan(selectedPlan);
                                            navigate("/cart");
                                        }}
                                    >
                                        Continue to Checkout
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Plans grid */}
                        <Row className="g-4">
                            {sortedPlans.map((plan) => {
                                const Icon = plan.icon;
                                const isSelected = plan.id === selectedPlanId;

                                return (
                                    <Col md={4} key={plan.id}>
                                        <Card
                                            className={`tc-card-hover tc-rounded-3xl overflow-hidden ${darkMode ? "tc-card-dark" : "bg-white border-0 shadow-sm"}`}
                                            style={{
                                                borderRadius: 24,
                                                outline: isSelected ? "3px solid rgba(124,58,237,0.55)" : "none",
                                            }}
                                        >
                                            {plan.badge && (
                                                <div className="py-2 text-center fw-bold tc-badge-hot">{plan.badge}</div>
                                            )}

                                            <Card.Body className="p-4">
                                                <div className={`d-flex align-items-center justify-content-center mb-3 tc-rounded-2xl ${plan.gradClass}`}
                                                     style={{ width: 64, height: 64, borderRadius: 16 }}>
                                                    <Icon size={30} color="white" />
                                                </div>

                                                <div className="d-flex align-items-center justify-content-between">
                                                    <h3 className={`fw-black mb-0 ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900 }}>
                                                        {plan.name}
                                                    </h3>

                                                    {isSelected && (
                                                        <Badge bg="success" className="tc-rounded-2xl" style={{ borderRadius: 16 }}>
                                                            Selected
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className={`small mb-3 ${mutedClass}`}>{plan.tagline}</div>

                                                <div className="mb-3">
                                                    <div className={`display-6 fw-black ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900 }}>
                                                        ${plan.price}
                                                        <span className={`fs-6 ms-1 ${mutedClass}`}>/month</span>
                                                    </div>

                                                    <div className="mt-2 fw-bold" style={{ fontSize: "1.35rem" }}>
                            <span
                                style={{
                                    background:
                                        plan.gradClass === "tc-grad-cyan"
                                            ? "linear-gradient(90deg, #22d3ee, #3b82f6)"
                                            : plan.gradClass === "tc-grad-purple"
                                                ? "linear-gradient(90deg, #a78bfa, #ec4899)"
                                                : "linear-gradient(90deg, #fb923c, #ef4444)",
                                    WebkitBackgroundClip: "text",
                                    color: "transparent",
                                }}
                            >
                              {plan.data}
                            </span>{" "}
                                                        <span className={`small ${mutedClass}`}>high-speed data</span>
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    {plan.perks.map((perk) => (
                                                        <div key={perk} className="d-flex align-items-center gap-2 mb-2">
                                                            <Badge bg="success" className="rounded-circle" style={{ width: 20, height: 20 }}>
                                                                ✓
                                                            </Badge>
                                                            <span className={`${darkMode ? "text-light" : "text-dark"} ms-1`}>{perk}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <Button
                                                    className="w-100 fw-bold border-0"
                                                    style={{
                                                        background:
                                                            plan.gradClass === "tc-grad-cyan"
                                                                ? "linear-gradient(90deg, #22d3ee, #3b82f6)"
                                                                : plan.gradClass === "tc-grad-purple"
                                                                    ? "linear-gradient(90deg, #a78bfa, #ec4899)"
                                                                    : "linear-gradient(90deg, #fb923c, #ef4444)",
                                                        borderRadius: 14,
                                                        padding: "0.75rem 1rem",
                                                    }}
                                                    onClick={() => setSelectedPlanId(plan.id)}
                                                >
                                                    {isSelected ? "Selected" : "Select Plan"}
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>

                        {/* Add-ons (global list from backend) */}
                        <div className="mt-5">
                            <h2 className={`fw-black mb-1 ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900 }}>
                                Add-ons
                            </h2>
                            <p className={`mb-4 ${mutedClass}`}>Optional extras you can attach to any plan.</p>

                            <Row className="g-3">
                                {addOns.map((a) => (
                                    <Col md={3} key={a.addOnId}>
                                        <Card className={`tc-card-hover tc-rounded-2xl ${darkMode ? "tc-card-dark" : "bg-white border-0 shadow-sm"}`} style={{ borderRadius: 18 }}>
                                            <Card.Body className="p-4">
                                                <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>{a.addOnName}</div>
                                                <div className="d-flex align-items-end gap-2 mt-1">
                                                    <div className={`fw-black ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900, fontSize: "1.6rem" }}>
                                                        +${a.monthlyPrice}
                                                    </div>
                                                    <div className={`small ${mutedClass}`}>/month</div>
                                                </div>
                                                <div className={`small mt-2 ${mutedClass}`}>{a.description}</div>
                                                {/*<Button*/}
                                                {/*    variant={darkMode ? "outline-light" : "outline-secondary"}*/}
                                                {/*    className="w-100 mt-3 fw-bold"*/}
                                                {/*    style={{ borderRadius: 14 }}*/}
                                                {/*    onClick={() => alert(`Addon later: ${a.addOnName}`)}*/}
                                                {/*>*/}
                                                {/*    Add to Plan*/}
                                                {/*</Button>*/}
                                                <Button
                                                    className="w-100 mt-3 fw-bold"
                                                    onClick={() => addAddOn(a)}
                                                >
                                                    Add to Cart
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    </>
                )}
            </Container>
        </div>
    );
}
