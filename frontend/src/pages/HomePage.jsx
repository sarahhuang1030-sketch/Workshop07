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
import { useNavigate, useOutletContext } from "react-router-dom";
import HomepageDock from "../components/HomepageDock";
import { apiFetch } from "../services/api";
import CustomerReviewsSection from "../pages/CustomerReviewsSection";
import ReviewModal from "../components/common/ReviewModal";
import ComparisonTable from "../components/ComparisonTable";

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
    const mutedClass = darkMode ? "text-light opacity-75" : "text-muted";

    const { reviews } = useOutletContext();

    /* =========================
       LOAD DATA
    ========================== */
    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            try {
                const [mRes, hRes, aRes] = await Promise.all([
                    apiFetch("/api/plans?type=Mobile"),
                    apiFetch("/api/plans?type=Internet"),
                    apiFetch("/api/addons")
                ]);

                if (!mRes.ok || !hRes.ok || !aRes.ok) {
                    throw new Error("Failed to load homepage catalog");
                }

                const [m, h, a] = await Promise.all([
                    mRes.json(),
                    hRes.json(),
                    aRes.json()
                ]);

                if (cancelled) return;

                setMobilePlans(m ?? []);
                setHomePlans(h ?? []);
                setAddOns(a ?? []);
            } catch (err) {
                console.error("Failed to load homepage catalog", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
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

            {/* ======================================================
                HERO (AD BANNER STYLE - Rogers-like telecom promo)
            ====================================================== */}
            <section
                className="py-5 text-white text-center"
                style={{
                    background: "linear-gradient(135deg, #111827, #4f46e5, #7c3aed)",
                    position: "relative",
                    overflow: "hidden"
                }}
            >
                {/* subtle glow overlay */}
                <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "radial-gradient(circle at top, rgba(255,255,255,0.15), transparent 60%)"
                }} />

                <Container style={{ position: "relative" }}>
                    <div className="mb-2 text-uppercase fw-bold" style={{ letterSpacing: "2px", opacity: 0.8 }}>
                        Limited Time Offer
                    </div>

                    <h1 className="display-4 fw-bold mb-3">
                        Unlimited 5G. 3 Months FREE.
                    </h1>

                    <p className="mb-4 fs-5 text-white-50">
                        Switch today and experience Canada’s fastest network with premium coverage nationwide.
                    </p>

                    <div className="d-flex gap-3 justify-content-center flex-wrap">
                        <Button
                            variant="light"
                            className="fw-bold px-4 py-2 rounded-pill"
                            style={{ color: "#4f46e5" }}
                            onClick={() => navigate("/plans")}
                        >
                            View Offers
                        </Button>

                        <Button
                            variant="outline-light"
                            className="fw-bold px-4 py-2 rounded-pill"
                            onClick={() => window.open("https://www.rogers.com", "_blank")}
                        >
                            Learn More
                        </Button>
                    </div>

                    <div className="mt-3 text-white-50 small">
                        *New activations only. Terms apply.
                    </div>
                </Container>
            </section>


            {/* AD SECTION (UNCHANGED) */}
            <section className="py-5" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", borderRadius: "1rem", margin: "2rem 0" }}>
                <Container>
                    <Row className="align-items-center g-4">
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
                                    className="fw-bold px-5 py-3 rounded-pill"
                                    style={{ color: "#4f46e5" }}
                                    onClick={() => navigate("/device-financing")}
                                >
                                    Get Offer
                                </Button>
                            </div>
                        </Col>

                        <Col md={5}>
                            <div className="ratio ratio-16x9 shadow-lg rounded">
                                <img src="././Iphone.jpg" alt="iPhone + Apple Watch" className="img-fluid rounded" />
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>


            {/* =========================
               ALL OTHER SECTIONS UNCHANGED
            ========================== */}

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
                                    <img src={card.img} className="card-img-top img-fluid" alt={card.title} style={{ objectFit: "cover" }} />
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

            <HomepageDock onSelect={setSelectedTab} />

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

            <CustomerReviewsSection reviews={reviews} darkMode={darkMode} />

            {/* STATS */}
            <section className="py-5">
                <Container>
                    <Row className="g-4 text-center">
                        {[
                            { value: "10M+", label: "Happy Customers" },
                            { value: "99.9%", label: "Network Uptime" },
                            { value: "#1", label: "5G Coverage" },
                            { value: "24/7", label: "Support" },
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

            {/* ======================================================
                CTA (AD STYLE FOOTER BANNER - Rogers-like)
            ====================================================== */}
            <section
                className="py-5 text-white text-center"
                style={{
                    background: "linear-gradient(135deg, #1f2937, #111827)",
                    position: "relative"
                }}
            >
                <Container>
                    <h2 className="fw-bold mb-3">
                        Big Savings. Better Network. Switch Today.
                    </h2>

                    <p className="mb-4 text-white-50">
                        Join millions of Canadians already enjoying next-generation connectivity.
                    </p>

                    {/*<Button*/}
                    {/*    variant="light"*/}
                    {/*    className="fw-bold px-5 py-3 rounded-pill"*/}
                    {/*    style={{ color: "#111827" }}*/}
                    {/*    onClick={() => navigate("/plans")}*/}
                    {/*>*/}
                    {/*    Explore Plans*/}
                    {/*</Button>*/}
                    {/* Comparison Table replaces CTA button */}
                    <ComparisonTable />

                    <div className="mt-3 text-white-50 small">
                        No contracts. Cancel anytime.
                    </div>
                </Container>
            </section>

            {/* FLOATING CHAT BUTTON (UNCHANGED) */}
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
                <i className="bi bi-chat-dots" style={{ fontSize: "28px", color: "white" }}></i>
            </Button>
        </>
    );
}