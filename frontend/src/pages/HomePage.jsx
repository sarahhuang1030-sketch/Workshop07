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
                DEVICE PROMO BANNER — single ad, click to /device-financing
            ====================================================== */}
            <section
                style={{
                    background: darkMode
                        ? "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)"
                        : "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 40%, #fce7f3 100%)",
                    padding: "3.5rem 0",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Soft glow accents */}
                <div style={{ position: "absolute", bottom: "-60px", right: "-60px", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.12), transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: "-40px", left: "-40px", width: "240px", height: "240px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.14), transparent 70%)", pointerEvents: "none" }} />

                <Container style={{ position: "relative" }}>
                    <div
                        onClick={() => navigate("/device-financing")}
                        style={{
                            cursor: "pointer",
                            background: darkMode ? "rgba(255,255,255,0.05)" : "#fff",
                            border: darkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(79,70,229,0.15)",
                            borderRadius: "1.25rem",
                            overflow: "hidden",
                            boxShadow: darkMode ? "0 8px 40px rgba(0,0,0,0.3)" : "0 8px 40px rgba(79,70,229,0.1)",
                            transition: "transform 0.2s ease, box-shadow 0.2s ease",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = darkMode ? "0 14px 48px rgba(0,0,0,0.4)" : "0 14px 48px rgba(79,70,229,0.18)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = darkMode ? "0 8px 40px rgba(0,0,0,0.3)"  : "0 8px 40px rgba(79,70,229,0.1)"; }}
                    >
                        {/* Top accent bar */}
                        <div style={{ height: 4, background: "linear-gradient(90deg, #4f46e5, #ec4899, #f97316)" }} />

                        <Row className="g-0 align-items-center">
                            {/* Left: product images strip */}
                            <Col md={5} className="d-none d-md-flex align-items-center justify-content-center gap-2"
                                 style={{ padding: "2rem 1.5rem", background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(79,70,229,0.03)" }}
                            >
                                {["/phone15.png", "/Samsung.png", "/ipad.png", "/watch.png"].map((img, i) => (
                                    <div key={i} style={{ width: "20%", maxWidth: 72, flexShrink: 0 }}>
                                        <img src={img} alt="" style={{ width: "100%", objectFit: "contain", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.15))" }} />
                                    </div>
                                ))}
                            </Col>

                            {/* Right: text + CTA */}
                            <Col md={7}>
                                <div style={{ padding: "2.25rem 2rem" }}>
                                    {/* Eyebrow */}
                                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#c2410c", background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.3)", borderRadius: "999px", padding: "3px 12px", marginBottom: "0.85rem" }}>
                                        🔥 Limited Time
                                    </div>

                                    <h2 className="fw-bold mb-2" style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", lineHeight: 1.2, color: darkMode ? "#f9fafb" : "#111827" }}>
                                        Device Financing —{" "}
                                        <span style={{ background: "linear-gradient(90deg,#f97316,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                                            10% Off All Devices
                                        </span>
                                    </h2>

                                    <p style={{ fontSize: "0.92rem", color: darkMode ? "rgba(255,255,255,0.55)" : "#6b7280", lineHeight: 1.65, marginBottom: "1.5rem", maxWidth: "400px" }}>
                                        Finance the latest smartphones, tablets and wearables with 0 down.
                                        Limited-time 10% discount across all models — up to 36-month terms.
                                    </p>

                                    {/* Perks row */}
                                    <div className="d-flex flex-wrap gap-2 mb-2">
                                        {["0 Down Payment", "Up to 36 Months", "4 Devices On Sale"].map((f) => (
                                            <span key={f} style={{ fontSize: "0.75rem", fontWeight: 600, background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(79,70,229,0.07)", color: darkMode ? "rgba(255,255,255,0.75)" : "#4f46e5", border: darkMode ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(79,70,229,0.18)", borderRadius: "999px", padding: "3px 11px" }}>
                                                ✦ {f}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        {/* Bottom CTA bar */}
                        <div style={{ background: "linear-gradient(90deg,#4f46e5,#7c3aed)", padding: "0.85rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
                                iPhone 15 Pro · Samsung Galaxy S24 · iPad Air · Apple Watch Series 9
                            </span>
                            <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 4 }}>
                                View All Deals →
                            </span>
                        </div>
                    </div>
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
                    <h2 className="fw-bold mb-2" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", color: darkMode ? "#f9fafb" : "#111827" }}>
                        Plans for Every Lifestyle
                    </h2>
                    <p className={`mb-0 ${mutedClass}`} style={{ maxWidth: "420px", margin: "0 auto" }}>
                        Whether you're an individual, a family, or a business — we have you covered.
                    </p>
                </div>

                <Row className="g-4">
                    {[
                        { img: "/phone-financing.jpg",   title: "Finance a Phone",  text: "Get a new phone with flexible monthly financing and save more when paired with eligible mobile plans.", badge: "Most Popular", badgeColor: "#4f46e5", link: "/phones" },
                        { img: "/streaming-bundle.jpg",  title: "Streaming Perks & Bundles", text: "Enjoy extra value with select premium plans — entertainment perks, bundle savings, and limited-time offers including TV options.", badge: "New", badgeColor: "#ec4899", link: "/plans", wide: true },
                    ].map((card, idx) => (
                        <Col md={card.wide ? 8 : 4} key={idx}>
                            {/* tc-card-hover: translateY + scale lift defined in style.css */}
                            <Card className="shadow-lg border-0 h-100 tc-card-hover" style={{ borderRadius: "1rem", overflow: "hidden", background: darkMode ? "#1f2937" : "#fff" }}>
                                {/* tc-img-zoom: image zooms on card hover */}
                                <div
                                    className="tc-img-zoom"
                                    style={{
                                        borderRadius: "1rem 1rem 0 0",
                                        height: "220px",
                                        overflow: "hidden",
                                        background: darkMode ? "#1f2937" : "#f8f4ff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <img
                                        src={card.img}
                                        alt={card.title}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "contain",
                                            padding: "0.75rem",
                                        }}
                                    />
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
                                    <h5 className="card-title fw-bold mb-2" style={{ fontSize: "1.1rem", color: darkMode ? "#f9fafb" : "#111827" }}>{card.title}</h5>
                                    <p className={`card-text flex-grow-1 mb-3 ${mutedClass}`} style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
                                        {card.text}
                                    </p>
                                    <Button
                                        variant="primary"
                                        className="w-100 fw-bold mt-auto rounded-pill"
                                        onClick={() => card.link && navigate(card.link)}
                                    >
                                        {card.link === "/phones" ? "Browse Phones"
                                            : card.link === "/plans" ? "Explore Plans"
                                                : "Learn More"}
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Container>


            {/* HomepageDock — unchanged component */}
            <HomepageDock onSelect={setSelectedTab} />


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
                        <h2 className="fw-bold mb-2" style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", color: darkMode ? "#f9fafb" : "#111827" }}>
                            Trusted by Millions
                        </h2>
                        <p className={`mb-0 ${mutedClass}`} style={{ fontSize: "0.95rem" }}>
                            Numbers that speak for themselves.
                        </p>
                    </div>

                    {/* tc-stats-row: used by responsive media query in style.css */}
                    <Row className="g-4 text-center tc-stats-row">
                        {[
                            { value: "10M+",  label: "Happy Customers", icon: "😊", link: null },
                            { value: "99.9%", label: "Network Uptime",  icon: "📡", link: null },
                            { value: "#1",    label: "5G Coverage",     icon: "🏆", link: null },
                            { value: "24/7",  label: "Support",         icon: "🎧", link: "/customer/support" },
                        ].map(s => (
                            <Col md={3} sm={6} key={s.label}>
                                {/* tc-stats-card: hover lift from style.css — clickable when link present */}
                                <Card
                                    className="shadow border-0 rounded-4 h-100 tc-stats-card"
                                    style={{
                                        background: darkMode ? "#1f2937" : "#fff",
                                        border: darkMode ? "1px solid rgba(255,255,255,0.08)" : undefined,
                                        cursor: s.link ? "pointer" : "default",
                                    }}
                                    onClick={() => s.link && navigate(s.link)}
                                >
                                    <Card.Body className="p-4">
                                        <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem", lineHeight: 1 }}>{s.icon}</div>
                                        <div className="fw-bold text-gradient" style={{ fontSize: "clamp(1.8rem, 3vw, 2.2rem)", lineHeight: 1.1, marginBottom: "0.4rem" }}>
                                            {s.value}
                                        </div>
                                        <div className={mutedClass} style={{ fontSize: "0.9rem" }}>
                                            {s.label}
                                            {s.link && (
                                                <span style={{ marginLeft: 4, fontSize: "0.7rem", opacity: 0.6 }}>→</span>
                                            )}
                                        </div>
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