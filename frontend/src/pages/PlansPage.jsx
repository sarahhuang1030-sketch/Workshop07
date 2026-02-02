import React, { useEffect, useMemo, useState } from "react";
import {
    Container,
    Card,
    Button,
    Badge,
    Form,
    Spinner,
    Alert,
} from "react-bootstrap";
import { useTheme } from "../context/ThemeContext";
import { Smartphone, Video, Zap, Music, Users, Gift } from "lucide-react";
import "../style/style.css";
import { useCart } from "../context/CartContext";

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

function getDataLabel(plan) {
    const data = (plan.features ?? []).find(
        (f) => (f.name || "").toLowerCase() === "data"
    );
    if (!data) return "";
    if (data.unit) return `${data.value}${data.unit}`;
    return data.value ?? "";
}

export default function PlansPage() {
    const { addPlan, addAddOn, addOns: cartAddOns } = useCart();
    const { darkMode } = useTheme();
    const mutedClass = darkMode ? "tc-muted-dark" : "tc-muted-light";

    const [sortBy, setSortBy] = useState("recommended");
    const [plans, setPlans] = useState([]);
    const [addOns, setAddOns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
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

                const uiPlans = (plansJson ?? []).map((p) => ({
                    id: p.planId,
                    name: p.planName,
                    tagline: p.tagline,
                    price: Number(p.monthlyPrice),
                    perks: p.perks ?? [],
                    features: p.features ?? [],
                    addOnsAllowed: p.addOns ?? [],
                    data: getDataLabel(p) || "—",
                    gradClass: planGradClass(p.planName),
                    icon: ICONS[planIconKey(p.planName)] || Smartphone,
                    badge: null,
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
        return () => {
            cancelled = true;
        };
    }, [serviceType]);

    const sortedPlans = useMemo(() => {
        const copy = [...plans];
        if (sortBy === "priceLow") copy.sort((a, b) => a.price - b.price);
        if (sortBy === "priceHigh") copy.sort((a, b) => b.price - a.price);
        return copy;
    }, [plans, sortBy]);

    return (
        <div className="py-4 py-md-5">
            <Container className="px-4">
                {/* Header */}
                <div className="d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-3 mb-4">
                    <div>
                        <Badge className="tc-badge-hot px-3 py-2 tc-rounded-2xl" style={{ borderRadius: 16 }}>
                            Choose your plan
                        </Badge>
                        <h1
                            className={`mt-3 mb-1 fw-black ${darkMode ? "text-light" : "text-dark"}`}
                            style={{ fontWeight: 900 }}
                        >
                            Plans & Pricing
                        </h1>
                        <p className={`mb-0 ${mutedClass}`}>
                            Pick a plan that matches your lifestyle. Add perks anytime.
                        </p>
                    </div>
                    <div className="d-flex flex-column gap-2 align-items-end">
                        <Form.Select
                            value={serviceType}
                            onChange={(e) => setServiceType(e.target.value)}
                            style={{ maxWidth: 220, marginBottom: 10 }}
                        >
                            <option value="Mobile">Mobile</option>
                            <option value="Internet">Home (Internet)</option>
                        </Form.Select>
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
                        {/* Plans horizontal scroll */}
                        <div className="mb-5">
                            <div className="d-flex gap-3 overflow-x-auto pb-2" style={{ scrollSnapType: "x mandatory" }}>
                                {sortedPlans.map((plan) => (
                                    <Card
                                        key={plan.id}
                                        className="flex-shrink-0"
                                        style={{ width: 300, scrollSnapAlign: "start" }}
                                    >
                                        <div
                                            className={`d-flex align-items-center justify-content-center ${plan.gradClass}`}
                                            style={{ height: 120 }}
                                        >
                                            <plan.icon size={40} color="white" />
                                        </div>
                                        <Card.Body className="d-flex flex-column">
                                            <h5 className="card-title">{plan.name}</h5>
                                            <p className="card-text">{plan.tagline}</p>
                                            <div className="fw-bold mb-2">${plan.price}/mo</div>
                                            <Button
                                                className="mt-auto w-100 fw-bold"
                                                style={{
                                                    borderRadius: 12,
                                                    background:
                                                        plan.gradClass === "tc-grad-cyan"
                                                            ? "linear-gradient(90deg, #22d3ee, #3b82f6)"
                                                            : plan.gradClass === "tc-grad-purple"
                                                                ? "linear-gradient(90deg, #a78bfa, #ec4899)"
                                                                : "linear-gradient(90deg, #fb923c, #ef4444)",
                                                    color: "white",
                                                }}
                                                onClick={() => addPlan(plan)}
                                            >
                                                Add to Cart
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Add-ons horizontal scroll */}
                        <div>
                            <h2 className={`fw-black mb-1 ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900 }}>
                                Add-ons
                            </h2>
                            <p className={`mb-4 ${mutedClass}`}>Optional extras you can attach to any plan.</p>
                            <div className="d-flex gap-3 overflow-x-auto pb-2" style={{ scrollSnapType: "x mandatory" }}>
                                {addOns.map((a) => (
                                    <Card
                                        key={a.addOnId}
                                        className={`flex-shrink-0 tc-card-hover tc-rounded-2xl ${darkMode ? "tc-card-dark" : "bg-white border-0 shadow-sm"}`}
                                        style={{ width: 250, scrollSnapAlign: "start", borderRadius: 18 }}
                                    >
                                        <Card.Body className="p-4 d-flex flex-column">
                                            <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>{a.addOnName}</div>
                                            <div className="d-flex align-items-end gap-2 mt-1">
                                                <div className={`fw-black ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900, fontSize: "1.6rem" }}>
                                                    +${a.monthlyPrice}
                                                </div>
                                                <div className={`small ${mutedClass}`}>/month</div>
                                            </div>
                                            <div className={`small mt-2 ${mutedClass}`}>{a.description}</div>
                                            <Button
                                                className="mt-auto w-100 fw-bold"
                                                style={{ borderRadius: 14 }}
                                                disabled={cartAddOns.some((x) => x.addOnId === a.addOnId)}
                                                onClick={() => addAddOn(a)}
                                            >
                                                {cartAddOns.some((x) => x.addOnId === a.addOnId) ? "Added" : "Add to Cart"}
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </Container>
        </div>
    );
}
