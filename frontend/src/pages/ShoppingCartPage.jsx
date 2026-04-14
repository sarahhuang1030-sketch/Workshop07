import React, { useMemo, useEffect, useState } from "react";
import {
    Container,
    Card,
    Button,
    Alert,
    Row,
    Col,
    Badge,
    Spinner,
} from "react-bootstrap";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, XCircle, Package, Cpu, PlusCircle } from "lucide-react";
import { apiFetch } from "../services/api";
import "../style/style.css";

export default function ShoppingCartPage() {
    const {
        plans,
        addOns,
        devices,
        removeDevice,
        addAddOn,
        removeAddOn,
        removePlanAtIndex,
        clearCart,
    } = useCart();

    const navigate = useNavigate();

    const [allAddOns, setAllAddOns]       = useState([]);
    const [loadingAddOns, setLoadingAddOns] = useState(false);
    const [addOnsError, setAddOnsError]   = useState("");

    const token     = localStorage.getItem("token");
    const isLoggedIn = !!token;

    useEffect(() => {
        if (!isLoggedIn) navigate("/login", { replace: true });
    }, [isLoggedIn, navigate]);

    const primaryPlan = plans[0] || null;

    const planServiceTypeId = useMemo(() => {
        if (!primaryPlan) return null;
        const rawId =
            primaryPlan.serviceTypeId  ?? primaryPlan.ServiceTypeId  ??
            primaryPlan.serviceTypeID  ?? primaryPlan.ServiceTypeID;
        if (rawId != null && !isNaN(Number(rawId))) return Number(rawId);
        const rawText = `${primaryPlan.serviceType ?? ""} ${primaryPlan.name ?? ""}`.toLowerCase();
        if (rawText.includes("internet") || rawText.includes("fibre") || rawText.includes("gigabit")) return 2;
        return 1;
    }, [primaryPlan]);

    useEffect(() => {
        let cancelled = false;
        async function loadAddOns() {
            if (!primaryPlan) return;
            try {
                setLoadingAddOns(true);
                setAddOnsError("");
                const res = await apiFetch("/api/addons");
                if (!res.ok) throw new Error(`AddOns API failed: ${res.status}`);
                const json = await res.json();
                if (!cancelled) setAllAddOns(json ?? []);
            } catch (e) {
                if (!cancelled) setAddOnsError(e?.message || "Failed to load add-ons");
            } finally {
                if (!cancelled) setLoadingAddOns(false);
            }
        }
        loadAddOns();
        return () => { cancelled = true; };
    }, [primaryPlan]);

    const availableAddOns = useMemo(() => {
        if (!primaryPlan) return [];
        const mobileAddOns   = ["Device Protection","Extra 10GB Data","International Calling","Premium Voicemail","Roaming Bundle"];
        const internetAddOns = ["Wi-Fi Extender","Mesh Wi-Fi Kit","Static IP","Parental Controls","Premium Support"];
        if (planServiceTypeId === 1) return allAddOns.filter((a) => mobileAddOns.includes(a.addOnName));
        if (planServiceTypeId === 2) return allAddOns.filter((a) => internetAddOns.includes(a.addOnName));
        return [];
    }, [allAddOns, planServiceTypeId, primaryPlan]);

    const pricing = useMemo(() => {
        const plansTotal   = plans.reduce((sum, p)  => sum + Number(p?.totalPrice   ?? p?.price ?? p?.monthlyPrice ?? 0), 0);
        const addOnsTotal  = addOns.reduce((sum, a)  => sum + Number(a?.monthlyPrice ?? a?.price ?? 0), 0);
        const devicesTotal = devices.reduce((sum, d) => sum + Number(d?.totalPrice   ?? 0), 0);
        return { plansTotal, addOnsTotal, devicesTotal, subtotal: plansTotal + addOnsTotal + devicesTotal };
    }, [plans, addOns, devices]);

    /* ── Service type badge color ── */
    const serviceTypeBg = (type) => {
        if (!type) return { background: "rgba(79,70,229,0.1)", color: "#4f46e5" };
        const t = type.toLowerCase();
        if (t.includes("internet") || t.includes("fibre")) return { background: "rgba(34,211,238,0.12)", color: "#0e7490" };
        return { background: "rgba(79,70,229,0.1)", color: "#4f46e5" };
    };

    /* ── Empty cart ── */
    if (plans.length === 0 && devices.length === 0 && addOns.length === 0) {
        return (
            <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f3ff, #fce7f3, #dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                <div style={{ textAlign: "center", maxWidth: 420 }}>
                    {/* Empty cart icon */}
                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #e0e7ff, #f3e8ff)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                        <ShoppingCart size={36} color="#7c3aed" />
                    </div>
                    <h3 className="fw-bold mb-2">Your cart is empty</h3>
                    <p className="tc-muted-light mb-4" style={{ fontSize: "0.95rem" }}>
                        Add a plan or device to get started.
                    </p>
                    <Button
                        className="rounded-pill px-5 py-2 fw-bold"
                        style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", border: "none", boxShadow: "0 4px 20px rgba(79,70,229,0.35)" }}
                        onClick={() => navigate("/plans")}
                    >
                        Browse Plans
                    </Button>
                </div>
            </div>
        );
    }

    /* ── Section heading helper ── */
    const SectionLabel = ({ icon, children, count }) => (
        <div className="d-flex align-items-center gap-2 mb-3">
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
            </div>
            <h5 className="fw-bold mb-0" style={{ fontSize: "1rem" }}>{children}</h5>
            {count !== undefined && (
                <span style={{ fontSize: "0.72rem", fontWeight: 700, background: "rgba(79,70,229,0.1)", color: "#4f46e5", borderRadius: "999px", padding: "2px 8px" }}>
                    {count}
                </span>
            )}
        </div>
    );

    /* ── Remove button (shared style) ── */
    const RemoveBtn = ({ onClick, label = "Remove" }) => (
        <button
            onClick={onClick}
            style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: "0.78rem", fontWeight: 600,
                color: "#ef4444", background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)", borderRadius: "999px",
                padding: "4px 12px", cursor: "pointer",
                transition: "background 0.15s ease, border-color 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; }}
        >
            <XCircle size={13} /> {label}
        </button>
    );

    /* =========================
       MAIN RENDER
    ========================= */
    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f3ff 0%, #fce7f3 50%, #dbeafe 100%)", padding: "3rem 0 5rem" }}>
            <Container style={{ maxWidth: 920 }}>

                {/* ── Page header ── */}
                <div className="mb-4 d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
                    <div>
                        <div className="tc-section-chip tc-section-chip-light mb-2">Review Order</div>
                        <h1 className="fw-bold d-flex align-items-center gap-2 mb-1" style={{ fontSize: "clamp(1.6rem, 3vw, 2rem)" }}>
                            <ShoppingCart size={28} color="#4f46e5" />
                            Shopping Cart
                        </h1>
                        <p className="tc-muted-light mb-0" style={{ fontSize: "0.9rem" }}>
                            Review your plan and pricing details before checkout.
                        </p>
                    </div>

                    <div className="d-flex gap-2 flex-wrap">
                        <button
                            style={{
                                fontSize: "0.85rem", fontWeight: 600, color: "#ef4444",
                                background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
                                borderRadius: "999px", padding: "6px 18px", cursor: "pointer",
                                transition: "background 0.15s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.14)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.07)"}
                            onClick={clearCart}
                        >
                            Clear Cart
                        </button>
                        <button
                            style={{
                                fontSize: "0.85rem", fontWeight: 600, color: "#6b7280",
                                background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)",
                                borderRadius: "999px", padding: "6px 18px", cursor: "pointer",
                                transition: "background 0.15s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.09)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.05)"}
                            onClick={() => navigate("/plans")}
                        >
                            ← Change Plan
                        </button>
                    </div>
                </div>

                <Row className="g-4 align-items-start">

                    {/* ── LEFT COLUMN: Plans + Devices + Add-ons ── */}
                    <Col lg={7}>

                        {/* Plans */}
                        {plans.map((plan, idx) => (
                            <Card
                                key={`${plan.serviceType}-${idx}`}
                                className="mb-3 border-0 shadow-sm tc-card-hover"
                                style={{ borderRadius: "1rem", overflow: "hidden" }}
                            >
                                {/* Gradient top bar */}
                                <div style={{ height: 4, background: "linear-gradient(90deg, #4f46e5, #7c3aed)" }} />
                                <Card.Body className="p-4">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                            {/* Service type chip */}
                                            <span
                                                style={{
                                                    ...serviceTypeBg(plan.serviceType),
                                                    fontSize: "0.7rem", fontWeight: 700,
                                                    letterSpacing: "1.5px", textTransform: "uppercase",
                                                    borderRadius: "999px", padding: "3px 10px",
                                                    display: "inline-block", marginBottom: "0.5rem",
                                                }}
                                            >
                                                {plan.serviceType || "Plan"}
                                            </span>

                                            <h4 className="fw-bold mb-1" style={{ fontSize: "1.15rem" }}>{plan.name}</h4>

                                            {plan.tagline && (
                                                <p className="tc-muted-light mb-2" style={{ fontSize: "0.85rem" }}>{plan.tagline}</p>
                                            )}

                                            {/* Multi-line subscribers */}
                                            {plan.serviceType === "Mobile" && Number(plan.lines ?? 1) > 1 && (
                                                <div style={{ marginTop: "0.5rem" }}>
                                                    {Array.from({ length: Number(plan.lines) }).map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className="d-flex align-items-center gap-2 mb-1"
                                                            style={{ fontSize: "0.82rem", color: "#6b7280" }}
                                                        >
                                                            <span style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0 }}>
                                                                {i + 1}
                                                            </span>
                                                            {plan.subscribers?.[i]?.fullName || `Line ${i + 1}`}
                                                            <span style={{ marginLeft: "auto", fontWeight: 600, color: "#374151" }}>
                                                                ${Number(plan.pricePerLine ?? 0).toFixed(2)}/mo
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Single line */}
                                            {plan.serviceType === "Mobile" && Number(plan.lines ?? 1) === 1 && (
                                                <div style={{ fontSize: "0.82rem", color: "#6b7280", marginTop: "0.35rem" }}>
                                                    {plan.subscribers?.[0]?.fullName || "Line 1"} &nbsp;·&nbsp;
                                                    ${Number(plan.pricePerLine ?? plan.totalPrice ?? 0).toFixed(2)}/mo
                                                </div>
                                            )}
                                        </div>

                                        {/* Price + remove */}
                                        <div className="text-end ms-3" style={{ flexShrink: 0 }}>
                                            <div
                                                className="fw-bold"
                                                style={{
                                                    fontSize: "1.5rem", lineHeight: 1,
                                                    background: "linear-gradient(90deg,#4f46e5,#7c3aed)",
                                                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                                                }}
                                            >
                                                ${Number(plan.totalPrice ?? plan.price ?? plan.monthlyPrice ?? 0).toFixed(2)}
                                            </div>
                                            <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginBottom: "0.6rem" }}>/mo</div>
                                            <RemoveBtn onClick={() => removePlanAtIndex(idx)} label="Remove Plan" />
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        ))}

                        {/* Devices */}
                        {devices.length > 0 && (
                            <Card className="mb-3 border-0 shadow-sm" style={{ borderRadius: "1rem", overflow: "hidden" }}>
                                <div style={{ height: 4, background: "linear-gradient(90deg, #f97316, #ef4444)" }} />
                                <Card.Body className="p-4">
                                    <SectionLabel icon={<Cpu size={15} color="#fff" />} count={devices.length}>
                                        Devices
                                    </SectionLabel>

                                    <div className="d-flex flex-column gap-3">
                                        {devices.map((device) => (
                                            <div
                                                key={device.cartDeviceId}
                                                className="d-flex align-items-center gap-3 p-3"
                                                style={{ background: "#f9fafb", borderRadius: "0.75rem", border: "1px solid #f3f4f6" }}
                                            >
                                                {/* Device icon placeholder */}
                                                <div style={{ width: 44, height: 44, borderRadius: "0.6rem", background: "linear-gradient(135deg,#f97316,#ef4444)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                    <span style={{ fontSize: "1.2rem" }}>📱</span>
                                                </div>

                                                <div className="flex-grow-1 min-width-0">
                                                    <div className="fw-bold" style={{ fontSize: "0.95rem" }}>
                                                        {device.brand} {device.model}
                                                    </div>
                                                    <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                                                        {device.storage} · {device.color}
                                                    </div>
                                                    <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                                                        Assigned to: <strong style={{ color: "#374151" }}>{device.assignedSubscriberName}</strong>
                                                    </div>
                                                    <div style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
                                                        {device.pricingType === "monthly"
                                                            ? `$${Number(device.monthlyPrice ?? 0).toFixed(2)}/mo financing`
                                                            : `$${Number(device.fullPrice ?? 0).toFixed(2)} one-time`}
                                                    </div>
                                                </div>

                                                <div className="text-end" style={{ flexShrink: 0 }}>
                                                    <div className="fw-bold" style={{ fontSize: "1.1rem", color: "#1f2937" }}>
                                                        ${Number(device.totalPrice ?? 0).toFixed(2)}
                                                    </div>
                                                    <div style={{ marginTop: 6 }}>
                                                        <RemoveBtn onClick={() => removeDevice(device.cartDeviceId)} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Available Add-ons */}
                        <Card className="mb-3 border-0 shadow-sm" style={{ borderRadius: "1rem", overflow: "hidden" }}>
                            <div style={{ height: 4, background: "linear-gradient(90deg, #22d3ee, #3b82f6)" }} />
                            <Card.Body className="p-4">
                                <SectionLabel icon={<PlusCircle size={15} color="#fff" />} count={availableAddOns.length}>
                                    Available Add-ons
                                </SectionLabel>

                                {loadingAddOns && (
                                    <div className="text-center py-3">
                                        <Spinner animation="border" size="sm" variant="primary" />
                                        <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: 6 }}>Loading add-ons…</div>
                                    </div>
                                )}

                                {addOnsError && (
                                    <Alert variant="danger" style={{ fontSize: "0.85rem", borderRadius: "0.6rem" }}>
                                        {addOnsError}
                                    </Alert>
                                )}

                                <Row className="g-2">
                                    {availableAddOns.map((a) => {
                                        const alreadyAdded = addOns.some((x) => x.addOnId === a.addOnId);
                                        return (
                                            <Col key={a.addOnId} md={6}>
                                                <div
                                                    style={{
                                                        padding: "0.85rem 1rem",
                                                        borderRadius: "0.75rem",
                                                        border: `1.5px solid ${alreadyAdded ? "rgba(79,70,229,0.3)" : "#e5e7eb"}`,
                                                        background: alreadyAdded ? "rgba(79,70,229,0.05)" : "#fff",
                                                        display: "flex", flexDirection: "column", gap: 8,
                                                        transition: "border-color 0.2s, background 0.2s",
                                                    }}
                                                >
                                                    <div className="fw-semibold" style={{ fontSize: "0.9rem" }}>{a.addOnName}</div>
                                                    <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                                                        +${Number(a.monthlyPrice).toFixed(2)}/month
                                                    </div>
                                                    <button
                                                        style={{
                                                            fontSize: "0.8rem", fontWeight: 600, borderRadius: "999px",
                                                            padding: "5px 0", cursor: "pointer", border: "none",
                                                            background: alreadyAdded
                                                                ? "rgba(239,68,68,0.08)"
                                                                : "linear-gradient(135deg,#4f46e5,#7c3aed)",
                                                            color: alreadyAdded ? "#ef4444" : "#fff",
                                                            transition: "opacity 0.15s",
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                                                        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                                                        onClick={() => alreadyAdded ? removeAddOn(a.addOnId) : addAddOn(a)}
                                                    >
                                                        {alreadyAdded ? "✕ Remove" : "+ Add"}
                                                    </button>
                                                </div>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            </Card.Body>
                        </Card>

                    </Col>

                    {/* ── RIGHT COLUMN: Order Summary (sticky) ── */}
                    <Col lg={5}>
                        <div style={{ position: "sticky", top: "1.5rem" }}>
                            <Card className="border-0 shadow-sm" style={{ borderRadius: "1rem", overflow: "hidden" }}>
                                <div style={{ height: 4, background: "linear-gradient(90deg, #4f46e5, #7c3aed)" }} />
                                <Card.Body className="p-4">
                                    <SectionLabel icon={<Package size={15} color="#fff" />}>
                                        Order Summary
                                    </SectionLabel>

                                    {/* Line items */}
                                    <div className="d-flex flex-column gap-2 mb-3">
                                        {[
                                            { label: "Plans",    value: pricing.plansTotal,   show: pricing.plansTotal > 0 },
                                            { label: "Add-ons",  value: pricing.addOnsTotal,  show: pricing.addOnsTotal > 0 },
                                            { label: "Devices",  value: pricing.devicesTotal, show: pricing.devicesTotal > 0 },
                                        ].map(({ label, value, show }) => show && (
                                            <div key={label} className="d-flex justify-content-between align-items-center" style={{ fontSize: "0.9rem" }}>
                                                <span className="tc-muted-light">{label}</span>
                                                <span className="fw-semibold">${value.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Added add-ons list */}
                                    {addOns.length > 0 && (
                                        <div
                                            className="mb-3 p-3"
                                            style={{ background: "rgba(79,70,229,0.04)", borderRadius: "0.65rem", border: "1px solid rgba(79,70,229,0.1)" }}
                                        >
                                            {addOns.map((a) => (
                                                <div key={a.addOnId} className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: "0.8rem" }}>
                                                    <span style={{ color: "#4f46e5" }}>✓ {a.addOnName}</span>
                                                    <span style={{ color: "#6b7280" }}>+${Number(a.monthlyPrice ?? a.price ?? 0).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <hr style={{ borderColor: "#f3f4f6", margin: "0.75rem 0" }} />

                                    {/* Total */}
                                    <div
                                        className="d-flex justify-content-between align-items-center p-3"
                                        style={{ background: "linear-gradient(135deg,rgba(79,70,229,0.07),rgba(124,58,237,0.07))", borderRadius: "0.75rem", border: "1px solid rgba(79,70,229,0.12)" }}
                                    >
                                        <span className="fw-bold" style={{ fontSize: "0.95rem" }}>Estimated Total</span>
                                        <span
                                            className="fw-bold"
                                            style={{
                                                fontSize: "1.4rem",
                                                background: "linear-gradient(90deg,#4f46e5,#7c3aed)",
                                                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                                            }}
                                        >
                                            ${pricing.subtotal.toFixed(2)}
                                        </span>
                                    </div>

                                    <div style={{ fontSize: "0.72rem", color: "#9ca3af", textAlign: "center", margin: "0.6rem 0 1.25rem" }}>
                                        Taxes and fees calculated at checkout
                                    </div>

                                    {/* Checkout button */}
                                    <button
                                        style={{
                                            width: "100%", padding: "0.85rem", borderRadius: "999px",
                                            background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                                            border: "none", color: "#fff", fontWeight: 700,
                                            fontSize: "1rem", cursor: "pointer", letterSpacing: "0.3px",
                                            boxShadow: "0 6px 24px rgba(79,70,229,0.4)",
                                            transition: "transform 0.15s, box-shadow 0.15s",
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(79,70,229,0.5)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(79,70,229,0.4)"; }}
                                        onClick={() => { if (!isLoggedIn) { navigate("/login"); return; } navigate("/checkout"); }}
                                    >
                                        🔒 Proceed to Checkout
                                    </button>

                                    {/* Trust row */}
                                    <div className="d-flex justify-content-center gap-3 mt-3" style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                                        <span>🔐 SSL</span>
                                        <span>🛡️ Secure</span>
                                        <span>↩️ Cancel Anytime</span>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    </Col>

                </Row>
            </Container>
        </div>
    );
}