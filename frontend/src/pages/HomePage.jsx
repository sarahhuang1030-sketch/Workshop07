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

/* ---------- icon map ---------- */
const ICONS = {
    smartphone: Smartphone, video: Video, zap: Zap,
    users: Users, gift: Gift, signal: Signal, headphones: Headphones, heart: Heart
};

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

    /* Use tc-muted-light / tc-muted-dark from style.css instead of inline colors */
    const mutedClass = darkMode ? "tc-muted-dark" : "tc-muted-light";

    const { reviews } = useOutletContext();

    const homeReviews = useMemo(
        () => (reviews ?? []).filter((r) => r.targetType === "company"),
        [reviews]
    );

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

                if (!mRes.ok || !hRes.ok || !aRes.ok) throw new Error("Failed to load homepage catalog");

                const [m, h, a] = await Promise.all([mRes.json(), hRes.json(), aRes.json()]);
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

    const planPageCount  = Math.ceil(plans.length / PLAN_PAGE_SIZE);
    const addonPageCount = Math.ceil(addOns.length / ADDON_PAGE_SIZE);

    const visiblePlans  = plans.slice(planPage * PLAN_PAGE_SIZE, planPage * PLAN_PAGE_SIZE + PLAN_PAGE_SIZE);
    const visibleAddOns = addOns.slice(addonPage * ADDON_PAGE_SIZE, addonPage * ADDON_PAGE_SIZE + ADDON_PAGE_SIZE);

    if (loading) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
                <Spinner animation="border" variant="primary" style={{ width: "2.5rem", height: "2.5rem" }} />
                <div className={`mt-3 fs-6 ${mutedClass}`}>Loading…</div>
            </div>
        );
    }

    return (
        <div style={{ overflowX: "hidden" }}>

            {/* ======================================================
                HERO
                CSS classes: tc-hero-badge
            ====================================================== */}
            <section
                className="text-white text-center"
                style={{
                    background: "linear-gradient(135deg, #111827 0%, #4f46e5 55%, #7c3aed 100%)",
                    position: "relative",
                    overflow: "hidden",
                    padding: "7rem 0 6rem",
                }}
            >
                {/* Radial top-glow */}
                <div style={{
                    position: "absolute", inset: 0, pointerEvents: "none",
                    background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.12), transparent 70%)"
                }} />
                {/* Bottom fade */}
                <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    height: "80px", pointerEvents: "none",
                    background: "linear-gradient(to bottom, transparent, rgba(17,24,39,0.18))"
                }} />

                <Container style={{ position: "relative" }}>
                    {/* tc-hero-badge: frosted glass promo chip defined in style.css */}
                    <div className="tc-hero-badge mb-4">
                        Limited Time Offer
                    </div>

                    <h1
                        className="fw-bold mb-4"
                        style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", lineHeight: 1.15, letterSpacing: "-0.5px" }}
                    >
                        Unlimited 5G.{" "}
                        <span style={{ color: "#a5b4fc" }}>3 Months FREE.</span>
                    </h1>

                    <p className="mx-auto mb-5" style={{ maxWidth: "520px", fontSize: "1.1rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>
                        Switch today and experience Canada's fastest network with premium coverage nationwide.
                    </p>

                    <div className="d-flex gap-3 justify-content-center flex-wrap">
                        <Button
                            variant="light"
                            className="fw-bold px-5 py-2 rounded-pill"
                            style={{ color: "#4f46e5", fontSize: "0.95rem", boxShadow: "0 4px 24px rgba(79,70,229,0.35)", border: "none" }}
                            onClick={() => navigate("/plans")}
                        >
                            View Offers
                        </Button>
                    </div>

                    <div className="mt-4" style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
                        *New activations only. Terms apply.
                    </div>
                </Container>
            </section>


            {/* ======================================================
                AD SECTION — iPhone + Apple Watch promo
                CSS classes: tc-ad-section, tc-section-chip,
                             tc-section-chip-dark, tc-price-block, tc-img-zoom
            ====================================================== */}
            <section
                className="tc-ad-section"
                style={{
                    background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                    borderRadius: "1.25rem",
                    margin: "2.5rem 1.25rem",
                    overflow: "hidden",
                }}
            >
                <Container style={{ padding: "4rem 1.5rem" }}>
                    <Row className="align-items-center g-5">
                        <Col md={7}>
                            <div className="d-flex flex-column gap-3 text-white">
                                {/* tc-section-chip + custom translucent overrides for dark bg */}
                                <div
                                    className="tc-section-chip"
                                    style={{ color: "rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
                                >
                                    Featured Offer
                                </div>

                                <h2 className="fw-bold" style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.5rem)", lineHeight: 1.2 }}>
                                    Pair iPhone 16 with Apple Watch Series 11
                                </h2>

                                <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: "480px", margin: 0 }}>
                                    For a limited time, finance the Apple Watch Series 11 and save $240 over 24 months
                                    and get a smartwatch plan for $43/mo for 24 months. Plus, get Rogers Satellite at no extra cost.
                                </p>

                                {/* tc-price-block: translucent frosted price card from style.css */}
                                <div className="tc-price-block">
                                    <span style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1, color: "#fff" }}>$43</span>
                                    <span style={{ fontSize: "1rem", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>/mo</span>
                                    <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginLeft: "4px" }}>
                                        after bill credit · 24-month financing*
                                    </span>
                                </div>

                                <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
                                    Full price: $1,027.&nbsp;
                                    <strong style={{ color: "rgba(255,255,255,0.75)" }}>iPhone offer ends February 2.</strong>
                                </p>

                                <div>
                                    <Button
                                        variant="light"
                                        className="fw-bold px-5 py-2 rounded-pill"
                                        style={{ color: "#4f46e5", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", border: "none" }}
                                        onClick={() => navigate("/device-financing")}
                                    >
                                        Get Offer
                                    </Button>
                                </div>
                            </div>
                        </Col>

                        {/* tc-img-zoom: image scales smoothly on hover */}
                        <Col md={5}>
                            <div
                                className="ratio ratio-16x9 rounded-4 overflow-hidden tc-img-zoom"
                                style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.35)" }}
                            >
                                <img src="././Iphone.jpg" alt="iPhone + Apple Watch" className="img-fluid" style={{ objectFit: "cover" }} />
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>


            {/* ======================================================
                CARD GROUP — Premium / Family / Business
                CSS classes: tc-card-hover, tc-img-zoom,
                             tc-section-chip, tc-section-chip-light
            ====================================================== */}
            <Container className="my-5 py-2">
                <div className="text-center mb-5">
                    {/* tc-section-chip: small uppercase eyebrow pill */}
                    <div className={`tc-section-chip ${darkMode ? "tc-section-chip-dark" : "tc-section-chip-light"} mb-3`}>
                        Our Plans
                    </div>
                    <h2 className="fw-bold mb-2" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>
                        Plans for Every Lifestyle
                    </h2>
                    <p className={`mb-0 ${mutedClass}`} style={{ maxWidth: "420px", margin: "0 auto" }}>
                        Whether you're an individual, a family, or a business — we have you covered.
                    </p>
                </div>

                <Row className="g-4">
                    {[
                        { img: "././Personal-Use.jpg",   title: "Premium Plan",  text: "Get the best experience with unlimited data and priority support.", badge: "Most Popular", badgeColor: "#4f46e5" },
                        { img: "././Home-Set.jpg",        title: "Family Plan",   text: "Share your plan with the whole family without compromise.",         badge: null },
                        { img: "././Bussiness-Use.jpg",   title: "Business Plan", text: "Advanced features for teams and businesses of all sizes.",          badge: null },
                    ].map((card, idx) => (
                        <Col md={4} key={idx}>
                            {/* tc-card-hover: translateY + scale lift defined in style.css */}
                            <Card className="shadow-lg border-0 h-100 tc-card-hover" style={{ borderRadius: "1rem", overflow: "hidden" }}>
                                {/* tc-img-zoom: image zooms on card hover */}
                                <div className="ratio ratio-16x9 overflow-hidden tc-img-zoom" style={{ borderRadius: "1rem 1rem 0 0" }}>
                                    <img src={card.img} className="img-fluid" alt={card.title} style={{ objectFit: "cover" }} />
                                </div>
                                <Card.Body className="d-flex flex-column p-4">
                                    {card.badge && (
                                        <div
                                            className="mb-2 d-inline-block px-2 py-1 fw-semibold"
                                            style={{
                                                fontSize: "0.7rem", letterSpacing: "1.5px", textTransform: "uppercase",
                                                background: `${card.badgeColor}18`, color: card.badgeColor,
                                                borderRadius: "999px", width: "fit-content",
                                            }}
                                        >
                                            {card.badge}
                                        </div>
                                    )}
                                    <h5 className="card-title fw-bold mb-2" style={{ fontSize: "1.1rem" }}>{card.title}</h5>
                                    <p className={`card-text flex-grow-1 mb-3 ${mutedClass}`} style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
                                        {card.text}
                                    </p>
                                    <Button variant="primary" className="w-100 fw-bold mt-auto rounded-pill">
                                        View Details
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Container>


            {/* HomepageDock — unchanged component */}
            <HomepageDock onSelect={setSelectedTab} />


            {/* ======================================================
                PLAN TAB TOGGLE
                CSS classes: tc-tab-track, tc-tab-track-light/dark
            ====================================================== */}
            <section className="py-4 text-center">
                <Container>
                    {/* tc-tab-track: segmented control background pill from style.css */}
                    <div className={`tc-tab-track ${darkMode ? "tc-tab-track-dark" : "tc-tab-track-light"}`}>
                        <Button
                            className="rounded-pill px-4 py-2 fw-semibold"
                            variant={selectedTab === "mobile" ? "primary" : "link"}
                            style={{
                                fontSize: "0.9rem", textDecoration: "none", border: "none",
                                color: selectedTab === "mobile" ? undefined : (darkMode ? "rgba(255,255,255,0.6)" : "#555"),
                                boxShadow: selectedTab === "mobile" ? "0 2px 8px rgba(79,70,229,0.3)" : "none",
                            }}
                            onClick={() => { setSelectedTab("mobile"); setPlanPage(0); }}
                        >
                            📱 Mobile
                        </Button>
                        <Button
                            className="rounded-pill px-4 py-2 fw-semibold"
                            variant={selectedTab === "home" ? "primary" : "link"}
                            style={{
                                fontSize: "0.9rem", textDecoration: "none", border: "none",
                                color: selectedTab === "home" ? undefined : (darkMode ? "rgba(255,255,255,0.6)" : "#555"),
                                boxShadow: selectedTab === "home" ? "0 2px 8px rgba(79,70,229,0.3)" : "none",
                            }}
                            onClick={() => { setSelectedTab("home"); setPlanPage(0); }}
                        >
                            🏠 Home
                        </Button>
                    </div>
                </Container>
            </section>


            {/* CustomerReviewsSection — unchanged component */}
            <CustomerReviewsSection reviews={homeReviews} darkMode={darkMode} />


            {/* ======================================================
                STATS ROW
                CSS classes: tc-stats-card, text-gradient,
                             tc-section-chip, tc-stats-row
            ====================================================== */}
            <section className="py-5">
                <Container>
                    <div className="text-center mb-5">
                        {/* tc-section-chip: eyebrow label pill */}
                        <div className={`tc-section-chip ${darkMode ? "tc-section-chip-dark" : "tc-section-chip-light"} mb-3`}>
                            By the Numbers
                        </div>
                        <h2 className="fw-bold mb-2" style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)" }}>
                            Trusted by Millions
                        </h2>
                        <p className={`mb-0 ${mutedClass}`} style={{ fontSize: "0.95rem" }}>
                            Numbers that speak for themselves.
                        </p>
                    </div>

                    {/* tc-stats-row: used by responsive media query in style.css */}
                    <Row className="g-4 text-center tc-stats-row">
                        {[
                            { value: "10M+",  label: "Happy Customers", icon: "😊" },
                            { value: "99.9%", label: "Network Uptime",  icon: "📡" },
                            { value: "#1",    label: "5G Coverage",     icon: "🏆" },
                            { value: "24/7",  label: "Support",         icon: "🎧" },
                        ].map(s => (
                            <Col md={3} sm={6} key={s.label}>
                                {/* tc-stats-card: hover lift from style.css */}
                                <Card className="shadow border-0 rounded-4 h-100 tc-stats-card">
                                    <Card.Body className="p-4">
                                        <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem", lineHeight: 1 }}>{s.icon}</div>
                                        {/* text-gradient: purple→pink gradient from style.css */}
                                        <div className="fw-bold text-gradient" style={{ fontSize: "clamp(1.8rem, 3vw, 2.2rem)", lineHeight: 1.1, marginBottom: "0.4rem" }}>
                                            {s.value}
                                        </div>
                                        <div className={mutedClass} style={{ fontSize: "0.9rem" }}>{s.label}</div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>


            {/* ======================================================
                CTA FOOTER BANNER
                CSS classes: tc-cta-accent, tc-section-chip,
                             tc-section-chip-dark
            ====================================================== */}
            <section
                className="text-white text-center"
                style={{
                    background: "linear-gradient(160deg, #1f2937 0%, #111827 100%)",
                    position: "relative",
                    padding: "5rem 0 4rem",
                    marginTop: "1rem",
                }}
            >
                {/* tc-cta-accent: 3px indigo top gradient line from style.css */}
                <div className="tc-cta-accent" />

                <Container>
                    {/* tc-section-chip tc-section-chip-dark: eyebrow chip on dark bg */}
                    <div className="tc-section-chip tc-section-chip-dark mb-3">
                        Why Choose Us
                    </div>

                    <h2 className="fw-bold mb-3" style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", lineHeight: 1.2 }}>
                        Big Savings. Better Network. Switch Today.
                    </h2>

                    <p className="mb-5 mx-auto" style={{ color: "rgba(255,255,255,0.5)", maxWidth: "460px", fontSize: "1rem", lineHeight: 1.7 }}>
                        Join millions of Canadians already enjoying next-generation connectivity.
                    </p>

                    {/* ComparisonTable — unchanged component */}
                    <ComparisonTable />

                    <div className="mt-4" style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)" }}>
                        No contracts. Cancel anytime.
                    </div>
                </Container>
            </section>


            {/* ======================================================
                FLOATING CHAT BUTTON
                CSS classes: tc-chat-btn (pulse animation + hover scale)
            ====================================================== */}
            <Button
                variant="primary"
                className="position-fixed d-flex align-items-center justify-content-center tc-chat-btn"
                style={{
                    bottom: 32, right: 32,
                    borderRadius: "50%",
                    width: "60px", height: "60px",
                    padding: 0, zIndex: 1000, border: "none",
                }}
                onClick={() => alert("Chat with Anna clicked!")}
            >
                <i className="bi bi-chat-dots" style={{ fontSize: "26px", color: "white", lineHeight: 1 }}></i>
            </Button>

        </div>
    );
}