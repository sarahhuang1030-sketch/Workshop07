import React, { useState } from "react";
import { Container, Row, Col, Card, Button, Badge, Form } from "react-bootstrap";
import { Smartphone, Tablet, Watch, Calculator, Tag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import "../style/style.css";

/* ── Product list with original + 10% promo price ── */
const DEVICE_LIST = [
    { id: 1, name: "iPhone 15 Pro",        type: "Mobile",   original: 1499, promo: 1349, image: "/phone15.png", icon: Smartphone },
    { id: 2, name: "Samsung Galaxy S24",   type: "Mobile",   original: 1299, promo: 1169, image: "/Samsung.png", icon: Smartphone },
    { id: 3, name: "iPad Air",             type: "Tablet",   original: 899,  promo: 809,  image: "/ipad.png",    icon: Tablet },
    { id: 4, name: "Apple Watch Series 9", type: "Wearable", original: 599,  promo: 539,  image: "/watch.png",   icon: Watch },
];

const TYPE_COLOR = {
    Mobile:   { bg: "rgba(79,70,229,0.1)",  color: "#4f46e5" },
    Tablet:   { bg: "rgba(14,165,233,0.1)", color: "#0ea5e9" },
    Wearable: { bg: "rgba(236,72,153,0.1)", color: "#ec4899" },
};

export default function DeviceFinancing() {
    const [months,   setMonths]   = useState(24);
    const { addDevice } = useCart();
    const navigate       = useNavigate();

    const monthlyPrice = (promo) => (promo / months).toFixed(2);
    const savings      = (original, promo) => original - promo;

    const handleSelect = (device) => {
        addDevice({
            cartDeviceId:           `device-${device.id}-${Date.now()}`,
            phoneId:                device.id,
            brand:                  device.name.split(" ")[0],
            model:                  device.name,
            storage:                "",
            color:                  "",
            imageUrl:               device.image,
            pricingType:            "monthly",
            monthlyPrice:           Number(monthlyPrice(device.promo)),
            fullPrice:              device.promo,
            totalPrice:             Number(monthlyPrice(device.promo)),
            assignedLine:           null,
            assignedSubscriberName: "Device only purchase",
        });
        navigate("/cart");
    };

    return (
        <div style={{ overflowX: "hidden" }}>

            {/* ── Hero ── */}
            <section
                className="text-white"
                style={{
                    background: "linear-gradient(135deg, #111827 0%, #4f46e5 55%, #7c3aed 100%)",
                    position: "relative", overflow: "hidden",
                    padding: "5rem 0 4rem",
                }}
            >
                {/* Radial glow */}
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.1), transparent 70%)" }} />

                <Container style={{ position: "relative" }}>
                    <Row className="align-items-center g-4">
                        <Col md={6}>
                            {/* Eyebrow */}
                            <div className="tc-hero-badge mb-4">Limited Time — 10% Off</div>

                            <h1 className="fw-bold mb-3" style={{ fontSize: "clamp(1.9rem, 4vw, 2.8rem)", lineHeight: 1.15 }}>
                                Device Financing<br />Made Simple
                            </h1>

                            <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.7, maxWidth: "420px", marginBottom: "1.75rem" }}>
                                0 down payment · Flexible monthly plans · 10% off all devices for a limited time.
                            </p>

                            {/* Promo pills */}
                            <div className="d-flex flex-wrap gap-2">
                                {["0 Down Payment", "Up to 36 Months", "10% Off Now"].map((f) => (
                                    <span key={f} style={{ fontSize: "0.8rem", fontWeight: 600, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "999px", padding: "4px 14px", color: "rgba(255,255,255,0.9)" }}>
                                        ✦ {f}
                                    </span>
                                ))}
                            </div>
                        </Col>

                        <Col md={6} className="text-center d-none d-md-block">
                            <img src="/banner-phone.png" alt="devices" style={{ maxWidth: "75%", filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.4))" }} />
                        </Col>
                    </Row>
                </Container>
            </section>


            {/* ── Calculator bar ── */}
            <div style={{ background: "linear-gradient(135deg, #f5f3ff, #fce7f3, #dbeafe)", padding: "1.25rem 0", borderBottom: "1px solid rgba(79,70,229,0.1)" }}>
                <Container>
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                        <div className="d-flex align-items-center gap-2">
                            <div style={{ width: 36, height: 36, borderRadius: "0.5rem", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Calculator size={17} color="#fff" />
                            </div>
                            <div>
                                <div className="fw-semibold" style={{ fontSize: "0.9rem", color: "#111827" }}>Monthly Calculator</div>
                                <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Choose your financing term</div>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-3">
                            {[12, 24, 36].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMonths(m)}
                                    style={{
                                        fontSize: "0.85rem", fontWeight: 600, padding: "6px 18px",
                                        borderRadius: "999px", cursor: "pointer",
                                        border: months === m ? "none" : "1px solid rgba(79,70,229,0.25)",
                                        background: months === m ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "transparent",
                                        color: months === m ? "#fff" : "#4f46e5",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    {m} mo
                                </button>
                            ))}
                        </div>
                    </div>
                </Container>
            </div>


            {/* ── Product grid ── */}
            <div style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #fce7f3 50%, #dbeafe 100%)", padding: "3rem 0 5rem" }}>
                <Container>
                    {/* Section header */}
                    <div className="text-center mb-4">
                        <div className="tc-section-chip tc-section-chip-light mb-3">Promo Deals</div>
                        <h2 className="fw-bold mb-1" style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", color: "#111827" }}>
                            All Devices — 10% Off
                        </h2>
                        <p className="tc-muted-light" style={{ fontSize: "0.9rem" }}>
                            Limited-time pricing. Finance with 0 down over {months} months.
                        </p>
                    </div>

                    <Row className="g-4">
                        {DEVICE_LIST.map((device) => {
                            const DevIcon  = device.icon;
                            const typeStyle = TYPE_COLOR[device.type] || TYPE_COLOR.Mobile;
                            const monthly  = monthlyPrice(device.promo);
                            const saved    = savings(device.original, device.promo);

                            return (
                                <Col key={device.id} md={6} lg={3}>
                                    <Card
                                        className="border-0 shadow-sm tc-card-hover h-100"
                                        style={{ borderRadius: "1rem", overflow: "hidden", background: "#fff" }}
                                    >
                                        {/* Sale ribbon */}
                                        <div style={{ height: 4, background: "linear-gradient(90deg,#ef4444,#f97316)" }} />

                                        {/* Promo badge */}
                                        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 2, fontSize: "0.68rem", fontWeight: 700, background: "linear-gradient(90deg,#ef4444,#f97316)", color: "#fff", borderRadius: "999px", padding: "3px 10px", letterSpacing: "0.5px" }}>
                                            10% OFF
                                        </div>

                                        {/* Image */}
                                        <div style={{ height: "180px", background: "#f8f4ff", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem" }}>
                                            <img src={device.image} alt={device.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                                        </div>

                                        <Card.Body className="p-4 d-flex flex-column">
                                            {/* Type chip */}
                                            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", ...typeStyle, borderRadius: "999px", padding: "3px 10px", width: "fit-content", marginBottom: "0.6rem" }}>
                                                <DevIcon size={11} /> {device.type}
                                            </div>

                                            <h5 className="fw-bold mb-3" style={{ fontSize: "1rem", color: "#111827" }}>{device.name}</h5>

                                            {/* Price block */}
                                            <div
                                                style={{ background: "rgba(79,70,229,0.05)", border: "1px solid rgba(79,70,229,0.12)", borderRadius: "0.65rem", padding: "0.75rem 1rem", marginBottom: "0.75rem" }}
                                            >
                                                {/* Promo price */}
                                                <div className="d-flex align-items-baseline gap-2 mb-1">
                                                    <span style={{ fontSize: "1.5rem", fontWeight: 800, background: "linear-gradient(90deg,#4f46e5,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                                                        ${device.promo}
                                                    </span>
                                                    {/* Original crossed out */}
                                                    <span style={{ fontSize: "0.85rem", color: "#9ca3af", textDecoration: "line-through" }}>${device.original}</span>
                                                </div>

                                                {/* Savings badge */}
                                                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#15803d", background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: "999px", padding: "2px 8px", display: "inline-block", marginBottom: "0.5rem" }}>
                                                    Save ${saved}
                                                </div>

                                                {/* Monthly */}
                                                <div style={{ fontSize: "0.82rem", color: "#6b7280" }}>
                                                    <span style={{ fontWeight: 600, color: "#374151" }}>${monthly}/mo</span>
                                                    &nbsp;· {months}-month financing
                                                </div>
                                            </div>

                                            <Button
                                                className="mt-auto rounded-pill fw-bold"
                                                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", border: "none", boxShadow: "0 3px 14px rgba(79,70,229,0.3)", fontSize: "0.9rem" }}
                                                onClick={() => handleSelect(device)}
                                            >
                                                Get Deal
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>

                    {/* Fine print */}
                    <div className="text-center mt-4 tc-muted-light" style={{ fontSize: "0.75rem" }}>
                        *Promotional pricing applies to full device purchase price. Monthly amounts based on selected term. Subject to credit approval.
                    </div>
                </Container>
            </div>

        </div>
    );
}