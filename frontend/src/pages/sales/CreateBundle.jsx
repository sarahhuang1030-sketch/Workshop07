import React, { useEffect, useState } from "react";
import { Container, Form, Row, Col, Alert } from "react-bootstrap";
import { apiFetch } from "../../services/api";
import { Package, Users, Plus, Minus, CheckCircle2, Send, ShoppingBag } from "lucide-react";
import "../../style/style.css";

export default function CreateBundle({ darkMode = false }) {

    const [customers,           setCustomers]           = useState([]);
    const [plans,               setPlans]               = useState([]);
    const [addons,              setAddons]              = useState([]);
    const [selectedCustomer,    setSelectedCustomer]    = useState("");
    const [selectedServiceType, setSelectedServiceType] = useState("Internet");
    const [selectedItems,       setSelectedItems]       = useState([]);
    const [total,               setTotal]               = useState(0);
    const [success,             setSuccess]             = useState("");
    const [error,               setError]               = useState("");

    const mutedClass = darkMode ? "tc-muted-dark" : "tc-muted-light";

    useEffect(() => { load(); }, [selectedServiceType]);

    async function load() {
        try {
            setError("");
            const typeQuery = selectedServiceType === "Home" ? "Internet" : selectedServiceType;
            const [cRes, planRes, addonRes] = await Promise.all([
                apiFetch("/api/customers/all"),
                apiFetch(`/api/plans?type=${typeQuery}`),
                apiFetch("/api/manager/addons"),
            ]);
            const customersData = cRes.ok     ? await cRes.json()     : [];
            const plansData     = planRes.ok  ? await planRes.json()  : [];
            const addonsData    = addonRes.ok ? await addonRes.json() : [];

            setCustomers(Array.isArray(customersData) ? customersData : []);
            setPlans((Array.isArray(plansData) ? plansData : []).map(p => ({
                key: `plan-${p.planId}`, id: p.planId, name: p.planName,
                price: Number(p.monthlyPrice || 0), type: "plan",
            })));
            setAddons((Array.isArray(addonsData) ? addonsData : [])
                .filter(a => a.serviceTypeName === typeQuery)
                .map(a => ({
                    key: `addon-${a.addOnId}`, id: a.addOnId, name: a.addOnName,
                    price: Number(a.monthlyPrice || 0), type: "addon",
                }))
            );
        } catch (err) {
            console.error("Load bundle failed:", err);
            setError("Failed to load data");
        }
    }

    function toggleItem(item) {
        const updated = selectedItems.find(x => x.key === item.key)
            ? selectedItems.filter(x => x.key !== item.key)
            : [...selectedItems, item];
        setSelectedItems(updated);
        setTotal(updated.reduce((sum, x) => sum + Number(x.price || 0), 0));
    }

    async function createBundle() {
        try {
            setError(""); setSuccess("");
            const res = await apiFetch("/api/quotes", {
                method: "POST",
                body: JSON.stringify({
                    customerId: Number(selectedCustomer),
                    items: selectedItems.map(x => ({ id: x.id, type: x.type, name: x.name, price: x.price, quantity: 1 })),
                    total, status: "PENDING",
                }),
            });
            if (!res.ok) throw new Error("Create quote failed");
            setSuccess("Quote created successfully and sent for customer approval.");
            setSelectedItems([]); setTotal(0);
        } catch (err) {
            console.error(err);
            setError("Failed to create bundle");
        }
    }

    const isSelected = (item) => selectedItems.some(x => x.key === item.key);

    /* ── shared card style ── */
    const cardStyle = {
        borderRadius: "1rem", overflow: "hidden",
        background: darkMode ? "#1f2937" : "#fff",
        border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(79,70,229,0.1)",
        boxShadow: darkMode ? "0 4px 24px rgba(0,0,0,0.2)" : "0 4px 24px rgba(79,70,229,0.06)",
        marginBottom: "1.25rem",
    };

    /* ── section header helper ── */
    const SectionLabel = ({ icon, children, accent = "#4f46e5" }) => (
        <div className="d-flex align-items-center gap-2 mb-3">
            <div style={{ width: 30, height: 30, borderRadius: "0.5rem", background: `linear-gradient(135deg,${accent},${accent}bb)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
            </div>
            <span className="fw-bold" style={{ fontSize: "0.92rem", color: darkMode ? "#f9fafb" : "#111827" }}>
                {children}
            </span>
        </div>
    );

    /* ── selectable item card ── */
    const ItemCard = ({ item }) => {
        const selected = isSelected(item);
        return (
            <div
                onClick={() => toggleItem(item)}
                style={{
                    padding: "0.75rem 1rem", borderRadius: "0.65rem", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem",
                    background: selected
                        ? (darkMode ? "rgba(79,70,229,0.15)" : "rgba(79,70,229,0.06)")
                        : (darkMode ? "rgba(255,255,255,0.03)" : "#f9fafb"),
                    border: `1.5px solid ${selected ? "#4f46e5" : (darkMode ? "rgba(255,255,255,0.07)" : "#f3f4f6")}`,
                    transition: "all 0.15s ease",
                }}
                onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = "rgba(79,70,229,0.3)"; e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.06)" : "#f3f0ff"; } }}
                onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = darkMode ? "rgba(255,255,255,0.07)" : "#f3f4f6"; e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.03)" : "#f9fafb"; } }}
            >
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.88rem", fontWeight: 600, color: darkMode ? "#f9fafb" : "#111827" }}>{item.name}</div>
                    <div style={{ fontSize: "0.75rem", color: darkMode ? "#9ca3af" : "#6b7280" }}>${item.price}/mo</div>
                </div>
                <div style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: selected ? "#4f46e5" : "transparent",
                    border: `2px solid ${selected ? "#4f46e5" : (darkMode ? "rgba(255,255,255,0.2)" : "#d1d5db")}`,
                    transition: "all 0.15s",
                }}>
                    {selected && <CheckCircle2 size={13} color="#fff" />}
                </div>
            </div>
        );
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: darkMode
                ? "linear-gradient(135deg,#0b1220,#1a103a,#0b1220)"
                : "linear-gradient(135deg,#f5f3ff,#fce7f3,#dbeafe)",
            padding: "3rem 0 5rem",
        }}>
            <Container style={{ maxWidth: 860 }}>

                {/* ── Page header ── */}
                <div className="mb-4">
                    <div className={`tc-section-chip ${darkMode ? "tc-section-chip-dark" : "tc-section-chip-light"} mb-2`}>
                        Sales Tools
                    </div>
                    <h1 className="fw-bold mb-1" style={{ fontSize: "clamp(1.6rem,3vw,2rem)", color: darkMode ? "#f9fafb" : "#111827" }}>
                        Personalize Plans
                    </h1>
                    <p className={mutedClass} style={{ fontSize: "0.9rem", margin: 0 }}>
                        Build a custom plan bundle for a customer and send it for approval.
                    </p>
                </div>

                {/* ── Alerts ── */}
                {success && (
                    <div className="d-flex align-items-center gap-2 p-3 mb-4" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "0.85rem" }}>
                        <CheckCircle2 size={17} color="#16a34a" />
                        <span style={{ fontSize: "0.88rem", color: "#16a34a", fontWeight: 600 }}>{success}</span>
                    </div>
                )}
                {error && (
                    <div className="d-flex align-items-start gap-2 p-3 mb-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "0.85rem" }}>
                        <span style={{ fontSize: "0.88rem", color: "#ef4444" }}>{error}</span>
                        <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "1rem" }}>×</button>
                    </div>
                )}

                <Row className="g-4">
                    {/* ── LEFT: Configuration ── */}
                    <Col lg={7}>

                        {/* Service Type */}
                        <div style={cardStyle}>
                            <div style={{ height: 4, background: "linear-gradient(90deg,#4f46e5,#7c3aed)" }} />
                            <div style={{ padding: "1.5rem" }}>
                                <SectionLabel icon={<Package size={14} color="#fff" />}>Service Type</SectionLabel>
                                <div className="d-flex gap-3">
                                    {["Mobile", "Internet"].map(type => {
                                        const active = selectedServiceType === type;
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => { setSelectedServiceType(type); setSelectedItems([]); setTotal(0); }}
                                                style={{
                                                    flex: 1, padding: "0.65rem 0", borderRadius: "0.65rem",
                                                    cursor: "pointer", fontWeight: 700, fontSize: "0.88rem",
                                                    background: active ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "transparent",
                                                    border: `1.5px solid ${active ? "#4f46e5" : (darkMode ? "rgba(255,255,255,0.12)" : "#e5e7eb")}`,
                                                    color: active ? "#fff" : (darkMode ? "#9ca3af" : "#6b7280"),
                                                    transition: "all 0.15s",
                                                }}
                                            >
                                                {type === "Mobile" ? "📱 Mobile" : "🏠 Internet"}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Customer */}
                        <div style={cardStyle}>
                            <div style={{ height: 4, background: "linear-gradient(90deg,#22d3ee,#3b82f6)" }} />
                            <div style={{ padding: "1.5rem" }}>
                                <SectionLabel icon={<Users size={14} color="#fff" />} accent="#0ea5e9">Customer</SectionLabel>
                                <Form.Select
                                    value={selectedCustomer}
                                    onChange={e => setSelectedCustomer(e.target.value)}
                                    style={{ borderRadius: "0.65rem", border: darkMode ? "1.5px solid rgba(255,255,255,0.12)" : "1.5px solid #e5e7eb", background: darkMode ? "#2a2a35" : "#fff", color: darkMode ? "#f9fafb" : "#111827", fontSize: "0.9rem" }}
                                >
                                    <option value="">Select a customer…</option>
                                    {customers.map(c => (
                                        <option key={c.customerId} value={c.customerId}>
                                            {c.firstName} {c.lastName} ({c.email})
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>
                        </div>

                        {/* Plans */}
                        <div style={cardStyle}>
                            <div style={{ height: 4, background: "linear-gradient(90deg,#8b5cf6,#ec4899)" }} />
                            <div style={{ padding: "1.5rem" }}>
                                <SectionLabel icon={<ShoppingBag size={14} color="#fff" />} accent="#8b5cf6">Plans</SectionLabel>
                                {plans.length === 0 ? (
                                    <div className={mutedClass} style={{ fontSize: "0.85rem" }}>No plans available.</div>
                                ) : (
                                    <div className="d-flex flex-column gap-2">
                                        {plans.map(p => <ItemCard key={p.key} item={p} />)}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Add-ons */}
                        <div style={cardStyle}>
                            <div style={{ height: 4, background: "linear-gradient(90deg,#f97316,#ef4444)" }} />
                            <div style={{ padding: "1.5rem" }}>
                                <SectionLabel icon={<Plus size={14} color="#fff" />} accent="#f97316">Add-ons</SectionLabel>
                                {addons.length === 0 ? (
                                    <div className={mutedClass} style={{ fontSize: "0.85rem" }}>No add-ons available for this service type.</div>
                                ) : (
                                    <div className="d-flex flex-column gap-2">
                                        {addons.map(a => <ItemCard key={a.key} item={a} />)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Col>

                    {/* ── RIGHT: Summary (sticky) ── */}
                    <Col lg={5}>
                        <div style={{ position: "sticky", top: "1.5rem" }}>
                            <div style={cardStyle}>
                                <div style={{ height: 4, background: "linear-gradient(90deg,#4f46e5,#ec4899,#f97316)" }} />
                                <div style={{ padding: "1.5rem" }}>
                                    <SectionLabel icon={<Package size={14} color="#fff" />}>Bundle Summary</SectionLabel>

                                    {selectedItems.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "2rem 0" }}>
                                            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📦</div>
                                            <div className={mutedClass} style={{ fontSize: "0.85rem" }}>
                                                No items selected yet.<br />Pick plans and add-ons from the left.
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="d-flex flex-column gap-2 mb-3">
                                            {selectedItems.map(item => (
                                                <div
                                                    key={item.key}
                                                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.85rem", borderRadius: "0.5rem", background: darkMode ? "rgba(255,255,255,0.04)" : "#f9fafb", fontSize: "0.85rem" }}
                                                >
                                                    <div>
                                                        <span style={{ fontWeight: 600, color: darkMode ? "#f9fafb" : "#111827" }}>{item.name}</span>
                                                        <span style={{ fontSize: "0.72rem", marginLeft: 6, color: "#7c3aed", background: "rgba(124,58,237,0.08)", borderRadius: "999px", padding: "1px 7px" }}>
                                                            {item.type}
                                                        </span>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span style={{ fontWeight: 600, color: darkMode ? "#f9fafb" : "#374151" }}>${item.price}</span>
                                                        <button
                                                            onClick={() => toggleItem(item)}
                                                            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#ef4444", fontSize: "0.8rem", padding: 0 }}
                                                        >
                                                            <Minus size={10} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Divider + Total */}
                                    <div style={{ borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.08)" : "#f3f4f6"}`, paddingTop: "0.85rem", marginBottom: "1.25rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", background: darkMode ? "rgba(79,70,229,0.1)" : "rgba(79,70,229,0.05)", border: "1px solid rgba(79,70,229,0.15)", borderRadius: "0.65rem" }}>
                                            <span className="fw-bold" style={{ fontSize: "0.9rem", color: darkMode ? "#f9fafb" : "#111827" }}>Total / mo</span>
                                            <span style={{ fontSize: "1.3rem", fontWeight: 800, background: "linear-gradient(90deg,#4f46e5,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                                                ${total.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Submit */}
                                    <button
                                        disabled={!selectedCustomer || selectedItems.length === 0}
                                        onClick={createBundle}
                                        style={{
                                            width: "100%", padding: "0.8rem", borderRadius: "999px", border: "none",
                                            cursor: (!selectedCustomer || selectedItems.length === 0) ? "not-allowed" : "pointer",
                                            background: (!selectedCustomer || selectedItems.length === 0)
                                                ? (darkMode ? "rgba(255,255,255,0.08)" : "#e5e7eb")
                                                : "linear-gradient(135deg,#4f46e5,#7c3aed)",
                                            color: (!selectedCustomer || selectedItems.length === 0) ? (darkMode ? "#6b7280" : "#9ca3af") : "#fff",
                                            fontWeight: 700, fontSize: "0.9rem",
                                            boxShadow: (!selectedCustomer || selectedItems.length === 0) ? "none" : "0 4px 16px rgba(79,70,229,0.35)",
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                            transition: "opacity 0.15s",
                                        }}
                                        onMouseEnter={e => { if (selectedCustomer && selectedItems.length > 0) e.currentTarget.style.opacity = "0.88"; }}
                                        onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                                    >
                                        <Send size={15} />
                                        Send to Customer
                                    </button>

                                    <div className={mutedClass} style={{ fontSize: "0.72rem", textAlign: "center", marginTop: "0.6rem" }}>
                                        Creates a quote pending customer approval
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}