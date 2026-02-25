import React, { useEffect, useState, useMemo } from "react";
import {
    Container,
    Card,
    Button,
    Spinner,
    Alert,
    Row,
    Col,
    Badge,
    Form,
} from "react-bootstrap";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import {
    Smartphone,
    Video,
    Zap,
    Music,
    Users,
    Gift,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const ICONS = { smartphone: Smartphone, video: Video, zap: Zap, music: Music, users: Users, gift: Gift };

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

export default function PlansPage() {
    // const { addPlan, addAddOn, plan, addOns, clearCart, total } = useCart();
    const { addPlan, addAddOn, addOns } = useCart();
    const { darkMode } = useTheme();
    const mutedClass = darkMode ? "tc-muted-dark" : "tc-muted-light";

    const [plans, setPlans] = useState([]);
    const [addOnsList, setAddOnsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [serviceType, setServiceType] = useState("Mobile");
    const [sortBy, setSortBy] = useState("recommended");

    const navigate = useNavigate();

    // Load plans & add-ons
    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError("");

                const [plansRes, addOnsRes] = await Promise.all([
                    fetch(`/api/plans?type=${encodeURIComponent(serviceType)}`),
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
                    gradClass: planGradClass(p.planName),
                    icon: ICONS[planIconKey(p.planName)] || Smartphone,
                }));

                setPlans(uiPlans);
                setAddOnsList(addOnsJson ?? []);
            } catch (e) {
                if (!cancelled) setError(e.message || "Failed to load plans");
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

    // const handleCheckout = () => {
    //     navigate("/checkout");
    // };
    const handleCheckout = () => {
        console.log("navigate triggered");
        navigate("/checkout");
    };

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <Badge className="tc-badge-hot px-3 py-2">Choose your plan</Badge>
                    <h1 className={`mt-3 mb-1 fw-black ${darkMode ? "text-light" : "text-dark"}`}>Plans & Pricing</h1>
                </div>
                <div className="d-flex gap-2">
                    <Form.Select
                        value={serviceType}
                        onChange={(e) => setServiceType(e.target.value)}
                    >
                        <option value="Mobile">Mobile</option>
                        <option value="Internet">Home</option>
                    </Form.Select>
                    <Form.Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="recommended">Recommended</option>
                        <option value="priceLow">Price Low → High</option>
                        <option value="priceHigh">Price High → Low</option>
                    </Form.Select>
                </div>
            </div>

            {loading && (
                <div className="py-5 text-center">
                    <Spinner animation="border" />
                    <div className={`mt-2 ${mutedClass}`}>Loading plans…</div>
                </div>
            )}

            {!loading && error && (
                <Alert variant="danger">{error}</Alert>
            )}

            {!loading && !error && (
                <>
                    <h3 className="mb-3">Plans</h3>
                    <Row className="g-3 mb-4">
                        {sortedPlans.map((p) => {
                            const Icon = p.icon;
                            return (
                                <Col key={p.id} md={4}>
                                    <Card>
                                        <div className={`${p.gradClass} d-flex align-items-center justify-content-center`} style={{height: 120}}>
                                            <Icon size={40} color="white" />
                                        </div>
                                        <Card.Body className="d-flex flex-column">
                                            <h5>{p.name}</h5>
                                            <p>{p.tagline}</p>
                                            <div className="fw-bold mb-2">${p.price}/mo</div>
                                            <Button className="mt-auto" onClick={() => addPlan(p)}>Add to Cart</Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>

                    <h3 className="mb-3">Add-ons</h3>
                    <Row className="g-3 mb-4">
                        {addOnsList.map((a) => (
                            <Col key={a.addOnId} md={3}>
                                <Card>
                                    <Card.Body className="d-flex flex-column">
                                        <div className="fw-bold">{a.addOnName}</div>
                                        <div className="mb-2">${a.monthlyPrice}/mo</div>
                                        <div className="small mb-2">{a.description}</div>
                                        <Button
                                            disabled={addOns.some((x) => x.addOnId === a.addOnId)}
                                            onClick={() => addAddOn(a)}
                                        >
                                            {addOns.some((x) => x.addOnId === a.addOnId) ? "Added" : "Add to Cart"}
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    <div className="text-end">
                        <Button onClick={handleCheckout} className="fw-bold px-4 py-2">Checkout</Button>
                    </div>
                </>
            )}
        </Container>
    );
}