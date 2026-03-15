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


function getPlanImage(planName, serviceType) {

    const name = (planName || "").toLowerCase().trim();

    if (serviceType === "Mobile") {
        if (name.includes("starter 30")) return "/plans/30.jpg";
        if (name.includes("value 45")) return "/plans/45.jpg";
        if (name.includes("unlimited mobile 50")) return "/plans/50.jpg";
        if (name.includes("plus 65")) return "/plans/65.jpg";
        if (name.includes("premium 85")) return "/plans/85.jpg";

    }

    if (serviceType === "Internet") {
        if (name.includes("internet 100")) return "/plans/home100.jpg";
        if (name.includes("fibre internet 300")) return "/plans/home300a.jpg";
        if (name.includes("fibre 300")) return "/plans/home300b.jpg";
        if (name.includes("internet 500")) return "/plans/home500.jpg";
        if (name.includes("gigabit 1000")) return "/plans/home1000.jpg";
    }


    return "/plans/default.jpg";
}

export default function PlansPage() {
    const { addPlan } = useCart();
    const { darkMode } = useTheme();
    const mutedClass = darkMode ? "tc-muted-dark" : "tc-muted-light";

    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [serviceType, setServiceType] = useState("Mobile");
    const [sortBy, setSortBy] = useState("recommended");

    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError("");

                const plansRes = await fetch(
                    `/api/plans?type=${encodeURIComponent(serviceType)}`
                );

                if (!plansRes.ok) {
                    throw new Error(`Plans API failed: ${plansRes.status}`);
                }

                const plansJson = await plansRes.json();
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
                    serviceTypeId: serviceType === "Mobile" ? 1 : 2,
                }));

                setPlans(uiPlans);
            } catch (e) {
                if (!cancelled) setError(e.message || "Failed to load plans");
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

    const handlePickPlan = (p) => {
        addPlan(p);
        navigate("/cart");
    };

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <Badge className="tc-badge-hot px-3 py-2">Choose your plan</Badge>
                    <h1 className={`mt-3 mb-1 fw-black ${darkMode ? "text-light" : "text-dark"}`}>
                        Plans & Pricing
                    </h1>
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

            {!loading && error && <Alert variant="danger">{error}</Alert>}

            {!loading && !error && (
                <>
                    <h3 className="mb-3">Plans</h3>
                    <Row className="g-3 mb-4">
                        {sortedPlans.map((p) => {
                            console.log("plan:", p.name, "page serviceType:", serviceType);
                            const Icon = p.icon;
                            return (
                                <Col key={p.id} md={4}>
                                    <Card>
                                        <div style={{ height: 200, overflow: "hidden" }}>
                                            <img

                                                src={getPlanImage(p.name, serviceType)}
                                                alt={p.name}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover"
                                                }}
                                            />
                                        </div>

                                        <Card.Body className="d-flex flex-column">
                                            <h5>{p.name}</h5>
                                            <p>{p.tagline}</p>
                                            <div className="fw-bold mb-2">${p.price}/mo</div>

                                            <Button
                                                className="mt-auto"
                                                onClick={() => handlePickPlan(p)}
                                            >
                                                Add to Cart
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                </>
            )}
        </Container>
    );
}