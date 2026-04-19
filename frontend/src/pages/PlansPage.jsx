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
    Modal,
} from "react-bootstrap";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import PlanAdvisorModal from "../components/ai/PlanAdvisorModal";
import {
    Smartphone,
    Gift,
    CheckCircle2,
    Home,
    ShieldCheck,
    RadioTower,
    Headphones,
    MessageSquareText,
    Plus,
    Minus,
    Zap,
    User,
} from "lucide-react";
import { useNavigate, useOutletContext, useLocation } from "react-router-dom";
import { apiFetch } from "../services/api";

function getFeatureIcon(serviceType) {
    return serviceType === "Mobile" ? Smartphone : Home;
}

function getTopIncludeItems(serviceType) {
    if (serviceType === "Mobile") {
        return [
            { icon: RadioTower,        title: "5G+",        text: "5G+ network access" },
            { icon: MessageSquareText, title: "Talk & Text", text: "Unlimited talk and text" },
            { icon: Headphones,        title: "Support",     text: "Live customer service" },
            { icon: ShieldCheck,       title: "Protection",  text: "Spam call detect" },
            { icon: Smartphone,        title: "Hotspot",     text: "Hotspot access" },
        ];
    }
    return [
        { icon: Zap,        title: "Fast Speeds",    text: "Reliable home internet" },
        { icon: Home,       title: "Home Coverage",  text: "Great for connected homes" },
        { icon: Headphones, title: "Support",         text: "Live customer service" },
        { icon: ShieldCheck,title: "Security",        text: "Secure network access" },
        { icon: Smartphone, title: "Easy Setup",      text: "Simple modem setup" },
    ];
}

function getMobilePricing(basePrice, lines) {
    const safeBase  = Number(basePrice) || 0;
    const safeLines = Math.max(1, Number(lines) || 1);
    let discountPerLine = 0;
    if (safeLines === 2) discountPerLine = 5;
    if (safeLines >= 3) discountPerLine = 10;
    const pricePerLine = Math.max(safeBase - discountPerLine, 0);
    return { basePrice: safeBase, lines: safeLines, discountPerLine, pricePerLine, totalPrice: pricePerLine * safeLines };
}

export default function PlansPage() {
    const { addPlan }  = useCart();
    const { darkMode } = useTheme();
    const mutedClass   = darkMode ? "tc-muted-dark" : "tc-muted-light";

    const [plans,       setPlans]       = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState("");
    const [serviceType, setServiceType] = useState("Mobile");
    const [sortBy,      setSortBy]      = useState("recommended");
    const [lineCount,   setLineCount]   = useState(1);
    const [bundlePlans, setBundlePlans] = useState([]);
    const [showAiModal, setShowAiModal] = useState(false);

    const [showLineDetailsModal,  setShowLineDetailsModal]  = useState(false);
    const [selectedPlanForLines,  setSelectedPlanForLines]  = useState(null);
    const [lineNames,             setLineNames]             = useState([]);
    const [lineDetailsError,      setLineDetailsError]      = useState("");

    const navigate = useNavigate();
    const location = useLocation();
    const { reviews } = useOutletContext();

    // Sync serviceType from URL ?type= using useLayoutEffect so it runs
    // synchronously before the data-fetch useEffect, avoiding a double-fetch race.
    React.useLayoutEffect(() => {
        const param = new URLSearchParams(location.search).get("type");
        if (!param) return;
        const normalised =
            param.toLowerCase() === "internet" || param.toLowerCase() === "home"
                ? "Internet"
                : "Mobile";
        setServiceType(normalised);
    }, []); // [] = run once on mount with the correct location from React Router

    const [showReviewsModal,         setShowReviewsModal]         = useState(false);
    const [selectedPlanReviews,      setSelectedPlanReviews]      = useState([]);
    const [selectedPlanReviewTitle,  setSelectedPlanReviewTitle]  = useState("");

    const getPlanReviews = (planId) =>
        (reviews ?? []).filter(
            (r) =>
                String(r.targetType).toLowerCase() === "plan" &&
                String(r.targetId) === String(planId)
        );

    const openPlanReviews = (plan) => {
        setSelectedPlanReviewTitle(plan.name);
        setSelectedPlanReviews(getPlanReviews(plan.id));
        setShowReviewsModal(true);
    };

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                setLoading(true); setError("");
                const res = await apiFetch(`/api/plans?type=${encodeURIComponent(serviceType)}`);
                if (!res.ok) throw new Error(`Plans API failed: ${res.status}`);
                const json = await res.json();
                if (cancelled) return;
                setPlans((json ?? []).map((p) => ({
                    id: p.planId, name: p.planName, tagline: p.tagline,
                    price: Number(p.monthlyPrice), perks: p.perks ?? [], features: p.features ?? [],
                    serviceTypeId: serviceType === "Mobile" ? 1 : 2,
                })));
            } catch (e) {
                if (!cancelled) setError(e.message || "Failed to load plans");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [serviceType]);

    useEffect(() => {
        let cancelled = false;
        async function loadBundles() {
            try {
                const res = await apiFetch("/api/plans?type=Bundle");
                if (!res.ok) throw new Error("Failed to load bundles");
                const data = await res.json();
                if (!cancelled) {
                    setBundlePlans((data ?? []).map((b) => ({
                        id: b.planId, name: b.planName, price: Number(b.monthlyPrice),
                        tagline: b.tagline, perks: b.perks ?? [],
                        features: (b.features ?? []).map((f) => {
                            const n = (f.featureName || "").toLowerCase();
                            if (n === "speed" && f.unit) return `${f.featureValue} ${f.unit} internet`;
                            if (n === "tv")       return `${f.featureValue} TV package`;
                            if (n === "internet") return `${f.featureValue} internet`;
                            if (n === "mobile")   return `${f.featureValue} mobile service`;
                            return f.unit ? `${f.featureValue} ${f.unit}` : `${f.featureValue}`;
                        }),
                    })));
                }
            } catch (e) { console.error("Bundle load failed:", e); }
        }
        loadBundles();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => { if (serviceType !== "Mobile") setLineCount(1); }, [serviceType]);

    // Reset scroll position to top when navigating to this page
    useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);

    const sortedPlans = useMemo(() => {
        const copy = [...plans];
        if (sortBy === "priceLow")  copy.sort((a, b) => a.price - b.price);
        if (sortBy === "priceHigh") copy.sort((a, b) => b.price - a.price);
        return copy;
    }, [plans, sortBy]);

    const finalizeAddPlan = (plan, pricing, subscribers = []) => {
        addPlan({
            id: `${serviceType}-${plan.id}-${Date.now()}`, planId: plan.id,
            name: plan.name, serviceType,
            basePrice: pricing.basePrice, lines: pricing.lines,
            discountPerLine: pricing.discountPerLine, pricePerLine: pricing.pricePerLine,
            totalPrice: pricing.totalPrice, tagline: plan.tagline,
            perks: plan.perks ?? [], features: plan.features ?? [], subscribers,
        });
        navigate("/cart");
    };

    const handlePickPlan = (plan) => {
        const pricing = serviceType === "Mobile"
            ? getMobilePricing(plan.price, lineCount)
            : { basePrice: Number(plan.price)||0, lines:1, discountPerLine:0, pricePerLine: Number(plan.price)||0, totalPrice: Number(plan.price)||0 };
        if (serviceType === "Mobile") {
            setSelectedPlanForLines({ plan, pricing });
            setLineNames(Array.from({ length: pricing.lines }, (_, i) => `Line ${i + 1}`));
            setLineDetailsError("");
            setShowLineDetailsModal(true);
            return;
        }
        finalizeAddPlan(plan, pricing, []);
    };

    const handleLineNameChange = (index, value) =>
        setLineNames((prev) => prev.map((name, i) => (i === index ? value : name)));

    const handleCloseLineModal = () => {
        setShowLineDetailsModal(false); setSelectedPlanForLines(null);
        setLineNames([]); setLineDetailsError("");
    };

    const handleSaveLineDetails = () => {
        if (!selectedPlanForLines) return;
        finalizeAddPlan(
            selectedPlanForLines.plan, selectedPlanForLines.pricing,
            lineNames.map((name, i) => ({ fullName: name.trim() || `Line ${i + 1}` }))
        );
        handleCloseLineModal();
    };

    const handlePickBundle = (bundle) => {
        addPlan({
            id: `Bundle-${bundle.id}`, planId: bundle.id, name: bundle.name,
            serviceType: "Bundle", basePrice: Number(bundle.price)||0, lines:1,
            discountPerLine:0, pricePerLine: Number(bundle.price)||0, totalPrice: Number(bundle.price)||0,
            tagline: bundle.tagline, perks: bundle.perks??[], features: bundle.features??[],
        });
        navigate("/cart");
    };

    const FeatureTypeIcon = getFeatureIcon(serviceType);
    const includeItems   = getTopIncludeItems(serviceType);

    const averageRating = useMemo(() => {
        if (!selectedPlanReviews.length) return 0;
        return (selectedPlanReviews.reduce((s, r) => s + Number(r.rating||0), 0) / selectedPlanReviews.length).toFixed(1);
    }, [selectedPlanReviews]);

    return (
        <>
            <Container className="py-4">
                <div className="mx-auto mb-4" style={{ maxWidth: "1100px", textAlign: "center" }}>

                    <h1 className={`fw-black mb-3 ${darkMode ? "text-light" : "text-dark"}`} style={{ fontSize: "3rem" }}>
                        {serviceType === "Mobile" ? "5G+ mobile plans" : "Home internet plans"}
                    </h1>

                    <p className={`mx-auto mb-4 ${mutedClass}`} style={{ maxWidth: "720px", fontSize: "1.15rem" }}>
                        {serviceType === "Mobile"
                            ? "Our best mobile plans with fast data, reliable coverage, and everyday perks."
                            : "Reliable home internet plans built for browsing, streaming, school, and work from home."}
                    </p>

                    <div className="d-flex justify-content-center mb-2">
                        <Form.Select value={serviceType} onChange={(e) => setServiceType(e.target.value)} style={{ maxWidth: "220px" }}>
                            <option value="Mobile">Mobile</option>
                            <option value="Internet">Home</option>
                        </Form.Select>
                    </div>

                    <div style={{ textAlign: "center", margin: "20px 0" }}>
                        <button className="btn btn-outline-primary" onClick={() => setShowAiModal(true)}>
                            ✨ Find My Best Plan (AI)
                        </button>
                    </div>

                    <div className={`mb-4 ${darkMode ? "text-light" : "text-dark"}`} style={{ fontSize: "1.6rem", fontWeight: 700 }}>
                        All plans include:
                    </div>

                    <Row className="justify-content-center g-4 mb-5">
                        {includeItems.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <Col key={index} xs={6} md={4} lg={2}>
                                    <div className="d-flex flex-column align-items-center">
                                        <div style={{ width:"56px", height:"56px", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background: darkMode ? "#2a2a31" : "#f7ecff", color:"#8b5cf6", marginBottom:"0.8rem" }}>
                                            <Icon size={24} />
                                        </div>
                                        <div className={darkMode ? "text-light" : "text-dark"} style={{ fontWeight:800, fontSize:"1.05rem", marginBottom:"0.2rem" }}>{item.title}</div>
                                        <div className={mutedClass} style={{ fontSize:"0.95rem", lineHeight:1.35 }}>{item.text}</div>
                                    </div>
                                </Col>
                            );
                        })}
                    </Row>

                    {serviceType === "Mobile" && (
                        <div className="mb-4">
                            <div className={`mb-3 ${darkMode ? "text-light" : "text-dark"}`} style={{ fontSize:"1.5rem", fontWeight:700 }}>
                                How many lines do you need?
                            </div>
                            <div className="d-flex justify-content-center align-items-center gap-3 flex-wrap">
                                <div style={{ display:"flex", alignItems:"center", border: darkMode ? "1px solid #444" : "1px solid #d6d6d6", borderRadius:"12px", overflow:"hidden", background: darkMode ? "#222" : "#fff" }}>
                                    <button type="button" onClick={() => setLineCount((p) => Math.max(1, p - 1))} style={{ border:"none", background:"transparent", width:"54px", height:"54px", display:"flex", alignItems:"center", justifyContent:"center", color: darkMode ? "#fff" : "#222", cursor:"pointer" }}>
                                        <Minus size={20} />
                                    </button>
                                    <div style={{ width:"54px", height:"54px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.35rem", fontWeight:800, color: darkMode ? "#fff" : "#111", borderLeft: darkMode ? "1px solid #444" : "1px solid #d6d6d6", borderRight: darkMode ? "1px solid #444" : "1px solid #d6d6d6" }}>
                                        {lineCount}
                                    </div>
                                    <button type="button" onClick={() => setLineCount((p) => Math.min(6, p + 1))} style={{ border:"none", background:"transparent", width:"54px", height:"54px", display:"flex", alignItems:"center", justifyContent:"center", color: darkMode ? "#fff" : "#222", cursor:"pointer" }}>
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ maxWidth:"220px" }}>
                                    <option value="recommended">Recommended</option>
                                    <option value="priceLow">Price Low → High</option>
                                    <option value="priceHigh">Price High → Low</option>
                                </Form.Select>
                            </div>
                        </div>
                    )}

                    {serviceType === "Internet" && (
                        <div className="mb-4 d-flex justify-content-center">
                            <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ maxWidth:"220px" }}>
                                <option value="recommended">Recommended</option>
                                <option value="priceLow">Price Low → High</option>
                                <option value="priceHigh">Price High → Low</option>
                            </Form.Select>
                        </div>
                    )}
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
                        {/* ── Plan cards ── */}
                        <Row className="g-4 mb-4">
                            {sortedPlans.map((p, index) => {
                                const isFeatured = sortedPlans.length >= 3 ? index === 1 : index === 0;
                                const pricing = serviceType === "Mobile"
                                    ? getMobilePricing(p.price, lineCount)
                                    : { basePrice: Number(p.price)||0, lines:1, discountPerLine:0, pricePerLine: Number(p.price)||0, totalPrice: Number(p.price)||0 };
                                return (
                                    <Col key={p.id} md={6} lg={4}>
                                        <Card className="h-100 shadow-sm border-0 overflow-hidden" style={{ borderRadius:"18px", background: darkMode ? "#1f1f24" : "#ffffff", color: darkMode ? "#f5f5f5" : "#1f2430", border: isFeatured ? "2px solid #c86bff" : "1px solid rgba(0,0,0,0.08)" }}>
                                            {isFeatured && (
                                                <div style={{ background:"linear-gradient(90deg,#8b5cf6,#ec4899)", color:"#fff", textAlign:"center", fontSize:"0.8rem", fontWeight:700, letterSpacing:"0.03em", padding:"0.55rem 1rem", textTransform:"uppercase" }}>
                                                    Best Value
                                                </div>
                                            )}
                                            <Card.Body className="d-flex flex-column p-4">
                                                <div className="d-flex align-items-center gap-2 mb-3">
                                                    <div style={{ width:38, height:38, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background: darkMode ? "#2a2a31" : "#f7ecff", color:"#8b5cf6" }}>
                                                        {serviceType === "Mobile" ? <Smartphone size={18} /> : <Home size={18} />}
                                                    </div>
                                                    <Badge bg={serviceType === "Mobile" ? "primary" : "secondary"} pill>
                                                        {serviceType === "Mobile" ? "5G Mobile" : "Home Internet"}
                                                    </Badge>
                                                </div>

                                                <h4 className="fw-bold mb-2">{p.name}</h4>

                                                <div className="d-flex align-items-end gap-1 mb-2">
                                                    <span style={{ fontSize:"2.6rem", fontWeight:800, lineHeight:1 }}>${pricing.pricePerLine}</span>
                                                    <span style={{ fontSize:"1rem", fontWeight:600, color: darkMode ? "#cfcfd6" : "#6b7280", marginBottom:"0.35rem" }}>/mo</span>
                                                </div>

                                                {serviceType === "Mobile" && lineCount > 1 && (
                                                    <div style={{ fontSize:"0.95rem", fontWeight:600, color: darkMode ? "#cfcfd6" : "#6b7280", marginBottom:"0.8rem" }}>
                                                        Total for {lineCount} lines: ${pricing.totalPrice}/mo
                                                    </div>
                                                )}

                                                <p className="mb-3" style={{ color: darkMode ? "#d2d2da" : "#5f6777", minHeight:"48px" }}>{p.tagline}</p>

                                                {p.features?.length > 0 && (
                                                    <div className="mb-3">
                                                        <div style={{ fontSize:"0.78rem", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:700, color: darkMode ? "#a8a8b3" : "#7a8090", marginBottom:"0.75rem" }}>Included</div>
                                                        <div className="d-flex flex-column gap-2">
                                                            {p.features.map((feature, i) => (
                                                                <div key={i} className="d-flex align-items-start gap-2" style={{ fontSize:"0.96rem", fontWeight:500 }}>
                                                                    <FeatureTypeIcon size={16} style={{ color:"#8b5cf6", marginTop:"3px", flexShrink:0 }} />
                                                                    <span>
                                                                      {typeof feature === "string"
                                                                          ? feature
                                                                          : `${feature.featureName ?? ""}${
                                                                              feature.featureValue ? `: ${feature.featureValue}` : ""
                                                                          }${feature.unit ? ` ${feature.unit}` : ""}`}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {p.perks?.length > 0 && (
                                                    <div className="mb-4">
                                                        <div style={{ fontSize:"0.78rem", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:700, color: darkMode ? "#a8a8b3" : "#7a8090", marginBottom:"0.75rem" }}>Perks</div>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {p.perks.map((perk, i) => (
                                                                <span key={i} className="d-inline-flex align-items-center gap-1" style={{ background: darkMode ? "#2c2235" : "#fff2fb", color: darkMode ? "#f3c5ff" : "#9d3f73", border: darkMode ? "1px solid #5d3f71" : "1px solid #f3c6e2", borderRadius:"999px", padding:"0.4rem 0.7rem", fontSize:"0.82rem", fontWeight:600 }}>
                                                                    <Gift size={13} />{perk}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {p.features?.length === 0 && p.perks?.length === 0 && (
                                                    <div className="mb-4 d-flex align-items-center gap-2" style={{ color: darkMode ? "#b8b8c2" : "#6b7280", fontSize:"0.95rem" }}>
                                                        <CheckCircle2 size={16} /><span>More plan details coming soon.</span>
                                                    </div>
                                                )}

                                                <div className="mb-3">
                                                    <Button variant="link" className="p-0 text-decoration-none fw-semibold" onClick={(e) => { e.stopPropagation(); openPlanReviews(p); }}>
                                                        View Reviews ({getPlanReviews(p.id).length})
                                                    </Button>
                                                </div>

                                                <Button className="mt-auto" onClick={() => handlePickPlan(p)} style={{ borderRadius:"12px", fontWeight:700, padding:"0.8rem 1rem" }}>
                                                    Choose Plan
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>

                        {/* ── Bundle section ── */}
                        <div className="mt-5 mb-4">
                            <div className={`text-center mb-3 ${darkMode ? "text-light" : "text-dark"}`} style={{ fontSize:"2rem", fontWeight:800 }}>
                                Bundle and save more
                            </div>
                            <p className={`text-center mx-auto mb-4 ${mutedClass}`} style={{ maxWidth:"760px", fontSize:"1rem" }}>
                                Explore popular home and mobile bundles, including TV options, for more value in one package.
                            </p>
                            <Row className="g-4 mb-5">
                                {bundlePlans.map((bundle, index) => {
                                    const isFeatured = index === 1;
                                    return (
                                        <Col key={bundle.id} md={6} lg={3}>
                                            <Card className="h-100 shadow-sm border-0 overflow-hidden" style={{ borderRadius:"18px", background: darkMode ? "#1f1f24" : "#ffffff", color: darkMode ? "#f5f5f5" : "#1f2430", border: isFeatured ? "2px solid #c86bff" : "1px solid rgba(0,0,0,0.08)" }}>
                                                {isFeatured && (
                                                    <div style={{ background:"linear-gradient(90deg,#8b5cf6,#ec4899)", color:"#fff", textAlign:"center", fontSize:"0.8rem", fontWeight:700, padding:"0.55rem 1rem", textTransform:"uppercase" }}>
                                                        Popular Bundle
                                                    </div>
                                                )}
                                                <Card.Body className="d-flex flex-column p-4">
                                                    <div className="d-flex align-items-center gap-2 mb-3">
                                                        <div style={{ width:38, height:38, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background: darkMode ? "#2a2a31" : "#f7ecff", color:"#8b5cf6" }}>
                                                            <Home size={18} />
                                                        </div>
                                                        <Badge bg="dark" pill>Bundle</Badge>
                                                    </div>
                                                    <h5 className="fw-bold mb-2">{bundle.name}</h5>
                                                    <div className="d-flex align-items-end gap-1 mb-2">
                                                        <span style={{ fontSize:"2.2rem", fontWeight:800 }}>${bundle.price}</span>
                                                        <span style={{ fontSize:"1rem", color: darkMode ? "#cfcfd6" : "#6b7280" }}>/mo</span>
                                                    </div>
                                                    <p className="mb-3" style={{ color: darkMode ? "#d2d2da" : "#5f6777", minHeight:"84px" }}>{bundle.tagline}</p>
                                                    <div className="mb-3">
                                                        {bundle.features.map((f, i) => (
                                                            <div key={i} className="d-flex gap-2 mb-1">
                                                                <CheckCircle2 size={16} color="#8b5cf6" /><span>{f}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {bundle.perks?.length > 0 && (
                                                        <div className="mb-4">
                                                            <div style={{ fontSize:"0.78rem", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:700, color: darkMode ? "#a8a8b3" : "#7a8090", marginBottom:"0.75rem" }}>Perks</div>
                                                            <div className="d-flex flex-wrap gap-2">
                                                                {bundle.perks.map((perk, i) => (
                                                                    <span key={i} className="d-inline-flex align-items-center gap-1" style={{ background: darkMode ? "#2c2235" : "#fff2fb", color: darkMode ? "#f3c5ff" : "#9d3f73", border: darkMode ? "1px solid #5d3f71" : "1px solid #f3c6e2", borderRadius:"999px", padding:"0.4rem 0.7rem", fontSize:"0.82rem", fontWeight:600 }}>
                                                                        <Gift size={13} />{perk}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <Button className="mt-auto" onClick={() => handlePickBundle(bundle)} style={{ borderRadius:"12px", fontWeight:700 }}>
                                                        Choose Bundle
                                                    </Button>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </div>

                        {/* ── Streaming Perks banner (full-width, horizontal) ── */}
                        {/* Phone financing card removed — only streaming perks remains */}
                        <div
                            style={{
                                marginTop: "5rem",
                                borderRadius: "24px",
                                overflow: "hidden",
                                background: darkMode
                                    ? "rgba(255,255,255,0.03)"
                                    : "linear-gradient(135deg, #f8f4ff, #efe7ff)",
                                border: darkMode
                                    ? "1px solid rgba(255,255,255,0.08)"
                                    : "1px solid rgba(139,92,246,0.15)",
                                boxShadow: darkMode
                                    ? "0 10px 30px rgba(0,0,0,0.4)"
                                    : "0 10px 30px rgba(139,92,246,0.08)",
                            }}
                        >
                            <Row className="g-0 align-items-stretch">
                                {/* Left: image */}
                                <Col md={5} className="d-none d-md-block">
                                    <div style={{ height: "100%", minHeight: "300px", overflow: "hidden" }}>
                                        <img
                                            src="/streaming-bundle.jpg"
                                            alt="Streaming perks"
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        />
                                    </div>
                                </Col>

                                {/* Right: text */}
                                <Col md={7}>
                                    <div
                                        className="d-flex flex-column justify-content-center h-100"
                                        style={{ padding: "3rem 2.5rem" }}
                                    >
                                        {/* Eyebrow chip */}
                                        <div style={{ display:"inline-block", fontSize:"0.72rem", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", color:"#ec4899", background:"rgba(236,72,153,0.1)", border:"1px solid rgba(236,72,153,0.25)", borderRadius:"999px", padding:"3px 12px", marginBottom:"1rem", width:"fit-content" }}>
                                            Limited Time
                                        </div>

                                        <h3 className="fw-bold mb-3" style={{ fontSize:"clamp(1.5rem,2.5vw,2rem)", color: darkMode ? "#f9fafb" : "#111827", lineHeight:1.2 }}>
                                            Save more with streaming perks
                                        </h3>

                                        <p style={{ color: darkMode ? "#d2d2da" : "#5f6777", fontSize:"1rem", lineHeight:1.7, marginBottom:"1.75rem" }}>
                                            Enjoy extra value with select premium plans, including entertainment perks,
                                            bundle savings, and limited-time offers.
                                        </p>

                                        {/* Feature pills */}
                                        <div className="d-flex flex-wrap gap-2">
                                            {["Entertainment Perks", "Bundle Savings", "Limited-Time Offers"].map((f) => (
                                                <span key={f} style={{ fontSize:"0.8rem", fontWeight:600, background: darkMode ? "rgba(236,72,153,0.15)" : "rgba(236,72,153,0.08)", color: darkMode ? "#f9a8d4" : "#be185d", border:"1px solid rgba(236,72,153,0.2)", borderRadius:"999px", padding:"4px 12px" }}>
                                                    ✦ {f}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </>
                )}
            </Container>

            {/* ── Line details modal (unchanged) ── */}
            <Modal show={showLineDetailsModal} onHide={handleCloseLineModal} centered backdrop="static">
                <Modal.Header closeButton style={{ background: darkMode ? "#1f1f24" : "#ffffff", color: darkMode ? "#f5f5f5" : "#1f2430", borderBottom: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)" }}>
                    <Modal.Title className="fw-bold">Add line details</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ background: darkMode ? "#1f1f24" : "#ffffff", color: darkMode ? "#f5f5f5" : "#1f2430" }}>
                    {selectedPlanForLines && (
                        <div className="mb-3">
                            <div className="fw-bold">{selectedPlanForLines.plan.name}</div>
                            <div className={mutedClass} style={{ fontSize:"0.95rem" }}>Enter the name for each person using this line.</div>
                        </div>
                    )}
                    {lineDetailsError && <Alert variant="danger">{lineDetailsError}</Alert>}
                    <div className="d-flex flex-column gap-3">
                        {lineNames.map((name, index) => (
                            <Form.Group key={index}>
                                <Form.Label className="fw-semibold">Line {index + 1}</Form.Label>
                                <div style={{ position:"relative" }}>
                                    <User size={16} style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", color: darkMode ? "#b8b8c2" : "#6b7280", pointerEvents:"none" }} />
                                    <Form.Control type="text" value={name} placeholder={`Enter name for Line ${index + 1}`} onChange={(e) => handleLineNameChange(index, e.target.value)} style={{ paddingLeft:"2.2rem", borderRadius:"12px", background: darkMode ? "#2a2a31" : "#ffffff", color: darkMode ? "#f5f5f5" : "#1f2430", border: darkMode ? "1px solid #444" : "1px solid #d6d6d6" }} />
                                </div>
                            </Form.Group>
                        ))}
                    </div>
                </Modal.Body>
                <Modal.Footer style={{ background: darkMode ? "#1f1f24" : "#ffffff", borderTop: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)" }}>
                    <Button variant="outline-secondary" onClick={handleCloseLineModal} style={{ borderRadius:"10px", fontWeight:600 }}>Cancel</Button>
                    <Button onClick={handleSaveLineDetails} style={{ borderRadius:"10px", fontWeight:700, background:"linear-gradient(90deg,#8b5cf6,#ec4899)", border:"none" }}>Save and continue</Button>
                </Modal.Footer>
            </Modal>

            <PlanAdvisorModal show={showAiModal} onHide={() => setShowAiModal(false)} darkMode={darkMode} defaultServiceType={serviceType} defaultLineCount={lineCount} />

            {/* ── Reviews modal (unchanged) ── */}
            <Modal show={showReviewsModal} onHide={() => setShowReviewsModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        {selectedPlanReviewTitle} Reviews
                        {selectedPlanReviews.length > 0 && <Badge bg="warning" text="dark">⭐ {averageRating}</Badge>}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPlanReviews.length === 0 ? (
                        <div className="text-muted">No reviews yet for this plan.</div>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            {selectedPlanReviews.map((review) => (
                                <Card key={review.id} className="border-0 shadow-sm">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <div className="fw-bold">{review.name}</div>
                                                <div className="text-muted small">{review.role}</div>
                                            </div>
                                            <Badge bg="warning" text="dark">{review.rating} Stars</Badge>
                                        </div>
                                        <div>{review.review}</div>
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowReviewsModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}