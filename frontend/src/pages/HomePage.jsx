import { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Button, Card, Badge, Stack, Spinner } from "react-bootstrap";
import { useTheme } from "../context/ThemeContext";
import {
    Smartphone, Video, Zap,
    Music, Users, Gift,
    Signal, Headphones, Heart
} from "lucide-react";

import "../style/style.css";

const ICONS = {
    smartphone: Smartphone,
    video: Video,
    zap: Zap,
    music: Music,
    users: Users,
    gift: Gift,
    signal: Signal,
    headphones: Headphones,
    heart: Heart,
};

function planIconKey(planName) {
    const n = (planName || "").toLowerCase();
    if (n.includes("stream")) return "video";
    if (n.includes("power")) return "zap";
    return "smartphone";
}

function planTheme(planName) {
    const n = (planName || "").toLowerCase();
    if (n.includes("stream")) return "tc-grad-purple";
    if (n.includes("power")) return "tc-grad-orange";
    return "tc-grad-cyan";
}

// Extract a "data label" from features (Data row if present)
function getDataLabel(plan) {
    const data = (plan.features ?? []).find(f => (f.name || "").toLowerCase() === "data");
    if (!data) return "";
    if (data.unit) return `${data.value}${data.unit}`;
    return data.value ?? "";
}


export default function HomePage() {
    const { darkMode } = useTheme();
    const [selectedTab, setSelectedTab] = useState("mobile");
    const [mobilePlans, setMobilePlans] = useState([]);
    const [homePlans, setHomePlans] = useState([]);
    const [addOns, setAddOns] = useState([]);
    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(true);
    const heroClass = darkMode ? "tc-hero-dark" : "tc-hero-light";
    const mutedClass = darkMode ? "tc-muted-dark" : "tc-muted-light";


    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);

                const [mRes, hRes, aRes, fRes] = await Promise.all([
                    fetch("/api/plans?type=Mobile&includeAddOns=true"),
                    fetch("/api/plans?type=Internet&includeAddOns=true"),
                    fetch("/api/addons"),
                    fetch("/api/site-features"),
                ]);

                const [m, h, a, f] = await Promise.all([
                    mRes.json(),
                    hRes.json(),
                    aRes.json(),
                    fRes.json(),
                ]);

                if (cancelled) return;
                setMobilePlans(m ?? []);
                setHomePlans(h ?? []);
                setAddOns(a ?? []);
                setFeatures(f ?? []);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, []);

    const currentPlans = useMemo(() => (
        selectedTab === "mobile" ? mobilePlans : homePlans
    ), [selectedTab, mobilePlans, homePlans]);

    if (loading) {
        return (
            <div className="py-5 text-center">
                <Spinner animation="border" />
                <div className={`mt-2 ${mutedClass}`}>Loading from backend…</div>
            </div>
        );
    }

    return (
        <>
            {/* Hero */}
            <section className="py-4 py-md-5">
                <Container>
                    <div className={`p-4 p-md-5 tc-rounded-3xl shadow-lg ${heroClass}`}>
                        <Row className="g-4 align-items-center">
                            <Col md={8}>
                                <Badge bg="light" text="dark" className="px-3 py-2 tc-rounded-2xl">
                                    ✨ New Customer Offer
                                </Badge>

                                <h1 className="text-white fw-black mt-3" style={{ fontWeight: 900 }}>
                                    Stay Connected
                                    <span className="d-block">On Your Terms</span>
                                </h1>

                                <p className="text-white-50 fs-5">
                                    Get 3 months FREE + umlimited data on Canada's fastest 5G network
                                </p>

                                <Stack direction="horizontal" gap={3} className="flex-wrap">
                                    <Button variant="light" className="fw-bold" style={{ borderRadius: 999, color: "#7c3aed" }} onClick={() => setSelectedTab("mobile")}>
                                        See Plans
                                    </Button>
                                    {/*<Button variant="outline-light" className="fw-bold" style={{ borderRadius: 999 }} onClick={() => setSelectedTab("home")}>*/}
                                    {/*    See Home*/}
                                    {/*</Button>*/}
                                </Stack>
                            </Col>

                            <Col md={3}>
                                <Card
                                    className="border-1 shadow-lg tc-rounded-3xl border-white"
                                    style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", color: "white" }}
                                >
                                    <Card.Body className="p-4">
                                        <div className="text-center">
                                            <div className="display-5 fw-black" style={{ fontWeight: 900 }}>
                                                {mobilePlans?.[0]?.monthlyPrice ? `$${mobilePlans[0].monthlyPrice}` : "$--"}
                                            </div>
                                            <div className="text-white-50">starting price</div>
                                            <Badge
                                                bg="warning"
                                                text="dark"
                                                className="mt-3 px-3 py-2 rounded-pill fw-bold"
                                            >
                                                Save $45/month
                                            </Badge>                                        </div>

                                        <div className="mt-4">
                                            {["Plans", "Features", "Perks", "Add-ons"].map(item => (
                                                <div key={item} className="d-flex align-items-center gap-2 mb-2">
                                                    <Badge bg="success" className="rounded-circle" style={{ width: 22, height: 22 }}>✓</Badge>
                                                    <span className="fw-semibold">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <Button
                                            variant="light"
                                            className="w-100 mt-3 fw-bold rounded-pill py-3"
                                            style={{ color: "#7c3aed" }}
                                        >
                                            Claim Offer
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                </Container>
            </section>

            {/* Tabs */}
            <section className="py-3">
                <Container>
                    <div className="d-flex justify-content-center">
                        <div className={`p-2 shadow-sm tc-rounded-2xl d-inline-flex gap-2 ${darkMode ? "tc-card-dark" : "bg-white"}`}>
                            <Button
                                onClick={() => setSelectedTab("mobile")}
                                variant="link"
                                className={`fw-bold ${selectedTab === "mobile" ? "" : darkMode ? "text-light" : "text-dark"}`}
                                style={{ borderRadius: 16, background: selectedTab === "mobile" ? "linear-gradient(90deg,#7c3aed,#ec4899)" : "transparent", color: selectedTab === "mobile" ? "white" : "", textDecoration: "none" }}
                            >
                                📱 Mobile
                            </Button>

                            <Button
                                onClick={() => setSelectedTab("home")}
                                variant="link"
                                className={`fw-bold ${selectedTab === "home" ? "" : darkMode ? "text-light" : "text-dark"}`}
                                style={{ borderRadius: 16, background: selectedTab === "home" ? "linear-gradient(90deg,#7c3aed,#ec4899)" : "transparent", color: selectedTab === "home" ? "white" : "", textDecoration: "none" }}
                            >
                                🏠 Home
                            </Button>
                        </div>
                    </div>
                </Container>
            </section>

            {/* Plans */}
            <section className="py-4">
                <Container>
                    <Row className="g-4">
                        {currentPlans.map((p) => {
                            const Icon = ICONS[planIconKey(p.planName)] || Smartphone;
                            const gradClass = planTheme(p.planName);
                            const dataLabel = getDataLabel(p);

                            return (
                                <Col md={4} key={p.planId}>
                                    <Card className={`tc-card-hover tc-rounded-3xl overflow-hidden ${darkMode ? "tc-card-dark" : "bg-white border-0 shadow-sm"}`}>
                                        <Card.Body className="p-4">
                                            <div className={`d-flex align-items-center justify-content-center mb-3 tc-rounded-2xl ${gradClass}`} style={{ width: 64, height: 64 }}>
                                                <Icon size={30} color="white" />
                                            </div>

                                            <h3 className="fw-black mb-1" style={{ fontWeight: 900 }}>{p.planName}</h3>
                                            <div className={`small mb-3 ${mutedClass}`}>{p.tagline}</div>

                                            <div className="mb-2">
                                                <div className="display-6 fw-black" style={{ fontWeight: 900 }}>${p.monthlyPrice}</div>
                                                <div className={`small ${mutedClass}`}>per month</div>
                                            </div>

                                            {!!dataLabel && (
                                                <div className={`fw-bold mb-3 ${darkMode ? "text-light" : "text-dark"}`}>
                                                    {dataLabel} <span className={`small ${mutedClass}`}>data</span>
                                                </div>
                                            )}

                                            {/* Perks */}
                                            <div className="mb-3">
                                                {(p.perks ?? []).map((perk) => (
                                                    <div key={perk} className="d-flex align-items-center gap-2 mb-2">
                                                        <Badge bg="success" className="rounded-circle" style={{ width: 20, height: 20 }}>✓</Badge>
                                                        <span className={darkMode ? "text-light" : ""}>{perk}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Allowed add-ons */}
                                            <div className={`small ${mutedClass}`}>Allowed add-ons:</div>
                                            <div className="mb-3">
                                                {(p.addOns ?? []).slice(0, 3).map((a) => (
                                                    <Badge key={a.addOnId} bg={darkMode ? "secondary" : "light"} text={darkMode ? "light" : "dark"} className="me-2 mt-2">
                                                        {a.addOnName}
                                                    </Badge>
                                                ))}
                                                {(p.addOns ?? []).length > 3 && (
                                                    <Badge bg="warning" text="dark" className="mt-2">
                                                        +{(p.addOns ?? []).length - 3} more
                                                    </Badge>
                                                )}
                                            </div>

                                            <Button className="w-100 fw-bold border-0"
                                                    style={{
                                                        background:
                                                            gradClass === "tc-grad-cyan" ? "linear-gradient(90deg,#22d3ee,#3b82f6)"
                                                                : gradClass === "tc-grad-purple" ? "linear-gradient(90deg,#a78bfa,#ec4899)"
                                                                    : "linear-gradient(90deg,#fb923c,#ef4444)",
                                                        borderRadius: 14,
                                                    }}>
                                                Choose Plan
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                </Container>
            </section>

            {/* Global Add-ons */}
            <section className="py-5">
                <Container >
                    <h2 className={`text-center fw-black mb-4 ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900 }}>
                        Add-ons
                    </h2>

                    <Row className="g-3">
                        {addOns.map((a) => (
                            <Col md={3} key={a.addOnId}>
                                <Card className={`tc-card-hover tc-rounded-2xl ${darkMode ? "tc-card-dark" : "bg-white border-0 shadow-sm"}`}>
                                    <Card.Body className="p-4">
                                        <div className="fw-bold">{a.addOnName}</div>
                                        <div className="display-6 fw-black text-primary" style={{ fontWeight: 900 }}>
                                            +${a.monthlyPrice}
                                        </div>
                                        <div className={`small ${mutedClass}`}>per month</div>
                                        <div className={`small mt-2 ${mutedClass}`}>{a.description}</div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* Site features */}
            <section className="py-5">
                <Container>
                    <div
                        className="p-4 p-md-5 tc-rounded-3xl shadow-lg"
                        style={{
                            background: darkMode ? "linear-gradient(135deg,#1d4ed8,#4c1d95)" : "linear-gradient(135deg,#3b82f6,#7c3aed)",
                            color: "white",
                        }}
                    >
                        <h2 className="text-center fw-black mb-4" style={{ fontWeight: 900 }}>
                            Why Choose TeleConnect?
                        </h2>

                        <Row className="g-4">
                            {features.map((f) => {
                                const Icon = ICONS[f.iconKey] || Signal;
                                return (
                                    <Col md={3} key={f.title}>
                                        <div className="text-center">
                                            <div className="mx-auto mb-3 d-flex align-items-center justify-content-center tc-rounded-2xl"
                                                 style={{ width: 64, height: 64, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.25)" }}>
                                                <Icon size={30} color="white" />
                                            </div>
                                            <div className="fw-bold">{f.title}</div>
                                            <div className="small text-white-50">{f.desc}</div>
                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>
                    </div>
                </Container>
            </section>


            {/* Stats */}
            <section className="py-5">
                <Container>
                    <Row className="g-4 text-center">
                        {[
                            { value: "10M+", label: "Happy Customers" },
                            { value: "99.9%", label: "Network Uptime" },
                            { value: "#1", label: "5G Coverage" },
                            { value: "24/7", label: "Support" },
                        ].map((s) => (
                            <Col md={3} key={s.label}>
                                <Card className={`tc-rounded-2xl ${darkMode ? "tc-card-dark" : "bg-white border-0 shadow-sm"}`}>
                                    <Card.Body className="p-4">
                                        <div
                                            className="fw-black"
                                            style={{
                                                fontWeight: 900,
                                                fontSize: "2rem",
                                                background: "linear-gradient(90deg, #7c3aed, #ec4899)",
                                                WebkitBackgroundClip: "text",
                                                color: "transparent",
                                            }}
                                        >
                                            {s.value}
                                        </div>
                                        <div className={mutedClass}>{s.label}</div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* CTA */}
            <section className="py-5">
                <Container>
                    <div
                        className="tc-rounded-3xl p-4 p-md-5 text-center shadow-lg"
                        style={{ background: "linear-gradient(90deg, #7c3aed, #ec4899)", color: "white" }}
                    >
                        <h2 className="fw-black" style={{ fontWeight: 900 }}>
                            Ready to Connect?
                        </h2>
                        <p className="text-white-50 fs-5">
                            Join millions who switched and never looked back
                        </p>
                        <Button
                            variant="light"
                            className="fw-black"
                            style={{ borderRadius: 999, padding: "0.9rem 1.6rem", fontWeight: 900 }}
                        >
                            Get Your Plan Now 🎉
                        </Button>
                    </div>
                </Container>
            </section>
        </>
    );
}