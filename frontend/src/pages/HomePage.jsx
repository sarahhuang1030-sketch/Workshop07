import React, { useEffect, useMemo, useState } from "react";
import {
    Container,
    Row,
    Col,
    Button,
    Card,
    Spinner
} from "react-bootstrap";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import {
    Smartphone, Video, Zap,
    Users, Gift, Signal, Headphones, Heart,
    ChevronLeft, ChevronRight
} from "lucide-react";
import "../style/style.css";
import { useNavigate } from "react-router-dom";
import HomepageDock from "../components/HomepageDock";

/* ---------- icons ---------- */
const ICONS = { smartphone: Smartphone, video: Video, zap: Zap, users: Users, gift: Gift, signal: Signal, headphones: Headphones, heart: Heart };

function planIconKey(name = "") {
    const n = name.toLowerCase();
    if (n.includes("stream")) return "video";
    if (n.includes("power")) return "zap";
    return "smartphone";
}

function planTheme(name = "") {
    const n = name.toLowerCase();
    if (n.includes("stream")) return "tc-grad-purple";
    if (n.includes("power")) return "tc-grad-orange";
    return "tc-grad-cyan";
}

export default function HomePage() {
    const { darkMode } = useTheme();
    const { addPlan, addAddOn } = useCart();
    const navigate = useNavigate();

    const [selectedTab, setSelectedTab] = useState("mobile");
    const [mobilePlans, setMobilePlans] = useState([]);
    const [homePlans, setHomePlans] = useState([]);
    const [addOns, setAddOns] = useState([]);
    const [loading, setLoading] = useState(true);

    const PLAN_PAGE_SIZE = 3;
    const ADDON_PAGE_SIZE = 4;
    const [planPage, setPlanPage] = useState(0);
    const [addonPage, setAddonPage] = useState(0);

    const heroClass = darkMode ? "bg-dark text-white" : "bg-primary text-white";
    const mutedClass = darkMode ? "text-muted" : "text-white-50";

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            const [m, h, a] = await Promise.all([
                fetch("/api/plans?type=Mobile").then(r => r.json()),
                fetch("/api/plans?type=Internet").then(r => r.json()),
                fetch("/api/addons").then(r => r.json())
            ]);
            if (cancelled) return;
            setMobilePlans(m ?? []);
            setHomePlans(h ?? []);
            setAddOns(a ?? []);
            setLoading(false);
        }
        load();
        return () => (cancelled = true);
    }, []);

    const plans = useMemo(() => {
        const raw = selectedTab === "mobile" ? mobilePlans : homePlans;
        return raw.map(p => ({
            ...p,
            price: p.monthlyPrice,
            gradClass: planTheme(p.name),
            icon: ICONS[planIconKey(p.name)] || Smartphone
        }));
    }, [selectedTab, mobilePlans, homePlans]);

    const planPageCount = Math.ceil(plans.length / PLAN_PAGE_SIZE);
    const addonPageCount = Math.ceil(addOns.length / ADDON_PAGE_SIZE);
    const visiblePlans = plans.slice(planPage * PLAN_PAGE_SIZE, planPage * PLAN_PAGE_SIZE + PLAN_PAGE_SIZE);
    const visibleAddOns = addOns.slice(addonPage * ADDON_PAGE_SIZE, addonPage * ADDON_PAGE_SIZE + ADDON_PAGE_SIZE);

    if (loading) {
        return (
            <div className="py-5 text-center">
                <Spinner animation="border" />
                <div className={`mt-2 ${mutedClass}`}>Loading…</div>
            </div>
        );
    }

    return (
        <>
            {/* HERO */}
            <section className={`py-5 ${heroClass} text-center`}>
                <Container>
                    <h1 className="display-4 fw-bold mb-3">Stay Connected on Your Terms</h1>
                    <p className="mb-4 fs-5 text-white-50">
                        Get 3 months FREE + unlimited data on Canada’s fastest 5G network
                    </p>
                    <Button
                        variant="light"
                        className="fw-bold px-4 py-2 rounded-pill"
                        style={{ color: "#7c3aed" }}
                        onClick={() => navigate("/plans")}
                    >
                        See Plans
                    </Button>
                </Container>
            </section>
            {/* AD SECTION */}
            <section className="py-5" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", borderRadius: "1rem", margin: "2rem 0" }}>
                <Container>
                    <Row className="align-items-center g-4">
                        {/* Left content */}
                        <Col md={7}>
                            <div className="d-flex flex-column gap-3 text-white">
                                <h2 className="fw-bold display-5">
                                    Pair iPhone 16 with Apple Watch Series 11
                                </h2>
                                <p className="fs-5 text-white-50">
                                    For a limited time, finance the Apple Watch Series 11 and save $240 over 24 months and get a smartwatch plan for $43/mo for 24 months. Plus, get Rogers Satellite at no extra cost.
                                </p>
                                <div className="d-flex align-items-baseline gap-2">
                                    <span className="fs-3 fw-bold">$43/mo</span>
                                    <small className="text-white-50">after bill credit with 24-month financing*</small>
                                </div>
                                <p className="mb-3 text-white-50">
                                    Full price: $1,027. <b>iPhone offer ends February 2.</b>
                                </p>
                                <Button
                                    variant="light"
                                    className="fw-bold px-5 py-3 rounded-pill text-gradient"
                                    style={{
                                        background: "linear-gradient(90deg, #fff 0%, #e0e0ff 100%)",
                                        color: "#4f46e5",
                                        fontWeight: 700,
                                        transition: "transform 0.2s, box-shadow 0.2s"
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.3)"; }}
                                    onMouseOut={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
                                    onClick={() => window.open("https://www.rogers.com/phones/iphone-16?icid=R_WIR_5AO_WE6CZL", "_blank")}
                                >
                                    Get Offer
                                </Button>
                            </div>
                        </Col>

                        {/* Right image */}
                        <Col md={5}>
                            <div className="ratio ratio-16x9 shadow-lg rounded">
                                <img src="././Iphone.jpg" alt="iPhone + Apple Watch" className="img-fluid rounded" />
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>


            {/* CARD GROUP */}
            <Container className="my-5">
                <Row className="g-4">
                    {[
                        {
                            img: "././Personal-Use.jpg",
                            title: "Premium Plan",
                            text: "Get the best experience with unlimited data and priority support."
                        },
                        {
                            img: "././Home-Set.jpg",
                            title: "Family Plan",
                            text: "Share your plan with the whole family without compromise."
                        },
                        {
                            img: "././Bussiness-Use.jpg",
                            title: "Business Plan",
                            text: "Advanced features for teams and businesses of all sizes."
                        }
                    ].map((card, idx) => (
                        <Col md={4} key={idx}>
                            <Card className="shadow-lg border-0 h-100 tc-card-hover">
                                <div className="ratio ratio-16x9 overflow-hidden rounded-top">
                                    <img src={card.img} className="card-img-top img-fluid" alt={card.title} style={{objectFit: "cover"}}/>
                                </div>
                                <Card.Body className="d-flex flex-column">
                                    <h5 className="card-title fw-bold">{card.title}</h5>
                                    <p className="card-text text-muted flex-grow-1">{card.text}</p>
                                    <Button variant="primary" className="w-100 fw-bold mt-auto">View Details</Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Container>


            {/* DOCK */}
            <HomepageDock onSelect={setSelectedTab}/>

            {/* TABS */}
            <section className="py-3 text-center">
                <Container>
                    <Button className="me-2" variant={selectedTab === "mobile" ? "primary" : "outline-primary"} onClick={() => { setSelectedTab("mobile"); setPlanPage(0); }}>
                        📱 Mobile
                    </Button>
                    <Button variant={selectedTab === "home" ? "primary" : "outline-primary"} onClick={() => { setSelectedTab("home"); setPlanPage(0); }}>
                        🏠 Home
                    </Button>
                </Container>
            </section>

            {/* PLANS */}
            <section className="py-5">
                <Container>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="fw-bold">Plans</h2>
                        <div>
                            <Button variant="light" disabled={planPage === 0} onClick={() => setPlanPage(p => p - 1)}><ChevronLeft/></Button>
                            <Button variant="light" className="ms-2" disabled={planPage >= planPageCount - 1} onClick={() => setPlanPage(p => p + 1)}><ChevronRight/></Button>
                        </div>
                    </div>
                    <Row className="g-4">
                        {visiblePlans.map(plan => {
                            const Icon = plan.icon;
                            return (
                                <Col md={4} key={plan.id}>
                                    <Card className="h-100 shadow-lg border-0 tc-card-hover">
                                        <div className={`${plan.gradClass} text-center py-4 rounded-top`}>
                                            <Icon size={40} color="white"/>
                                        </div>
                                        <Card.Body className="d-flex flex-column">
                                            <h5>{plan.name}</h5>
                                            <div className="fw-bold fs-4 mb-2">${plan.price}/mo</div>
                                            <Button className="mt-auto fw-bold" onClick={() => addPlan(plan)}>Add to Cart</Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                </Container>
            </section>

            {/* ADD-ONS */}
            <section className={` ${darkMode ? "tc-bg-dark" : "tc-bg-light"}`}>
                <Container className="px-0">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="fw-bold">Add-ons</h2>
                        <div>
                            <Button variant="light" disabled={addonPage === 0} onClick={() => setAddonPage(p => p - 1)}><ChevronLeft/></Button>
                            <Button variant="light" className="ms-2" disabled={addonPage >= addonPageCount - 1} onClick={() => setAddonPage(p => p + 1)}><ChevronRight/></Button>
                        </div>
                    </div>
                    <Row className="g-3">
                        {visibleAddOns.map(a => (
                            <Col md={3} key={a.addOnId}>
                                <Card className="h-100 shadow-lg border-0 tc-card-hover">
                                    <Card.Body>
                                        <div className="fw-bold">{a.addOnName}</div>
                                        <div className="fs-4 fw-bold text-primary">+${a.monthlyPrice}</div>
                                        <div className={`small ${mutedClass}`}>{a.description}</div>
                                        <Button size="sm" className="mt-3" onClick={() => addAddOn(a)}>Add to Cart</Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* STATS */}
            <section className="py-5">
                <Container>
                    <Row className="g-4 text-center">
                        {[
                            {value: "10M+", label: "Happy Customers"},
                            {value: "99.9%", label: "Network Uptime"},
                            {value: "#1", label: "5G Coverage"},
                            {value: "24/7", label: "Support"},
                        ].map(s => (
                            <Col md={3} key={s.label}>
                                <Card className="shadow-lg border-0 rounded-4">
                                    <Card.Body className="p-4">
                                        <div className="fw-bold fs-2 text-gradient">{s.value}</div>
                                        <div className={mutedClass}>{s.label}</div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* CTA */}
            <section className="py-5 bg-gradient-primary text-white text-center">
                <Container>
                    <h2 className="fw-bold mb-3">Ready to Connect?</h2>
                    <p className="mb-4 text-white-50">Join millions who switched and never looked back</p>
                    <Button variant="light" className="fw-bold px-5 py-3 rounded-pill" style={{color: "#7c3aed"}}
                            onClick={() => navigate("/plans")}
                    >
                        Get Your Plan Now 🎉
                    </Button>
                </Container>
            </section>

            {/* CHAT FLOATING BUTTON */}
            <Button
                variant="primary"
                className="position-fixed d-flex align-items-center justify-content-center shadow-lg"
                style={{
                    bottom: 30,
                    right: 30,
                    borderRadius: "50%",
                    width: "60px",
                    height: "60px",
                    padding: 0,
                    zIndex: 1000,
                }}
                onClick={() => alert("Chat with Anna clicked!")}
            >
                <i className="bi bi-chat-dots" style={{fontSize: "28px", color: "white"}}></i>
            </Button>
        </>
    );
}
