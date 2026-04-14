import React, { useState, useEffect } from "react";
import { Container, Spinner } from "react-bootstrap";
import { FileText, CalendarDays, Receipt, ArrowRight, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";
import "../../style/style.css";

/* ── helpers ── */
const formatMoney = (n) =>
    n == null || Number.isNaN(Number(n))
        ? "—"
        : Number(n).toLocaleString(undefined, { style: "currency", currency: "CAD" });

const formatDate = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? String(v) : d.toISOString().split("T")[0];
};

/* ── status badge config ── */
const STATUS_CFG = {
    PAID:     { label: "Paid",     bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
    UNPAID:   { label: "Unpaid",   bg: "#fef9c3", color: "#a16207", dot: "#eab308" },
    APPROVED: { label: "Approved", bg: "#dbeafe", color: "#1d4ed8", dot: "#3b82f6" },
    DEFAULT:  { label: "Pending",  bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" },
};
const statusCfg = (s) => STATUS_CFG[String(s || "").toUpperCase()] ?? STATUS_CFG.DEFAULT;

export default function CustomerBilling({ darkMode = false }) {
    const nav = useNavigate();

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState("");

    const mutedClass = darkMode ? "tc-muted-dark" : "tc-muted-light";

    useEffect(() => {
        let alive = true;
        async function load() {
            try {
                const res = await apiFetch("/api/invoices/latest");

                // 404 means no invoice yet — not an error
                if (res.status === 404) { if (alive) setLoading(false); return; }
                if (!res.ok) throw new Error(`Failed: ${res.status}`);

                const data = await res.json();
                if (alive) setInvoice(data);
            } catch (err) {
                if (alive) setError(err.message);
            } finally {
                if (alive) setLoading(false);
            }
        }
        load();
        return () => { alive = false; };
    }, []);

    /* ── loading ── */
    if (loading) {
        return (
            <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <Spinner animation="border" variant="primary" style={{ width: "2rem", height: "2rem" }} />
                <div className={`mt-2 ${mutedClass}`} style={{ fontSize: "0.85rem" }}>Loading invoice…</div>
            </div>
        );
    }

    /* ── error ── */
    if (error) {
        return (
            <Container className="py-5">
                <div style={{ padding: "1.25rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "0.85rem", color: "#ef4444", fontSize: "0.9rem" }}>
                    ⚠ {error}
                </div>
            </Container>
        );
    }

    /* ── no invoice at all ── */
    // FIX: check invoice object exists, NOT invoice.items.length
    if (!invoice) {
        return (
            <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                <div style={{ textAlign: "center", maxWidth: 400 }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📄</div>
                    <h4 className="fw-bold mb-2" style={{ color: darkMode ? "#f9fafb" : "#111827" }}>No invoices yet</h4>
                    <p className={`${mutedClass} mb-4`} style={{ fontSize: "0.9rem" }}>Subscribe to a plan to generate your first invoice.</p>
                    <button
                        style={{ fontSize: "0.9rem", fontWeight: 600, padding: "8px 24px", borderRadius: "999px", border: "none", cursor: "pointer", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", boxShadow: "0 4px 16px rgba(79,70,229,0.35)" }}
                        onClick={() => nav("/plans")}
                    >
                        Browse Plans
                    </button>
                </div>
            </div>
        );
    }

    /* ── derive display values — works even when items is empty ── */
    const cfg      = statusCfg(invoice.status);
    const hasItems = Array.isArray(invoice.items) && invoice.items.length > 0;
    const mainPlan = invoice.items?.find(i => i.itemType === "plan") || invoice.items?.[0] || null;
    const addOns   = invoice.items?.filter(i => i.itemType === "addon") || [];
    const devices  = invoice.items?.filter(i => i.itemType === "device") || [];

    /* ── info row helper ── */
    const InfoRow = ({ icon, label, value }) => (
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0", borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "#f3f4f6"}` }}>
            <span style={{ color: "#7c3aed", flexShrink: 0 }}>{icon}</span>
            <span className={mutedClass} style={{ fontSize: "0.82rem", minWidth: 90 }}>{label}</span>
            <span style={{ fontSize: "0.88rem", fontWeight: 600, color: darkMode ? "#f9fafb" : "#111827", marginLeft: "auto" }}>{value}</span>
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f5f3ff 0%,#fce7f3 50%,#dbeafe 100%)", padding: "3rem 0 5rem" }}>
            <Container style={{ maxWidth: 720 }}>

                {/* ── Page header ── */}
                <div className="d-flex align-items-start justify-content-between mb-4 flex-wrap gap-3">
                    <div>
                        <div className="tc-section-chip tc-section-chip-light mb-2">Billing</div>
                        <h2 className="fw-bold mb-1" style={{ fontSize: "clamp(1.5rem,3vw,1.9rem)", color: darkMode ? "#f9fafb" : "#111827" }}>
                            Latest Invoice
                        </h2>
                        <p className={mutedClass} style={{ fontSize: "0.88rem", margin: 0 }}>Your most recent billing details</p>
                    </div>

                    <button
                        style={{ fontSize: "0.85rem", fontWeight: 600, padding: "7px 18px", borderRadius: "999px", border: "none", cursor: "pointer", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", boxShadow: "0 3px 14px rgba(79,70,229,0.3)", transition: "transform 0.15s", alignSelf: "center" }}
                        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                        onClick={() => nav("/customer/billing/history")}
                    >
                        View All Invoices
                    </button>
                </div>

                {/* ── Invoice card ── */}
                <div style={{ background: darkMode ? "#1f2937" : "#fff", borderRadius: "1rem", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
                    {/* Top gradient bar */}
                    <div style={{ height: 4, background: "linear-gradient(90deg,#4f46e5,#7c3aed)" }} />

                    <div style={{ padding: "1.75rem" }}>

                        {/* ── Invoice header row ── */}
                        <div className="d-flex align-items-start justify-content-between gap-3 mb-4 flex-wrap">
                            <div className="d-flex align-items-center gap-3">
                                <div style={{ width: 44, height: 44, borderRadius: "0.65rem", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <FileText size={20} color="#fff" />
                                </div>
                                <div>
                                    <div className="fw-bold" style={{ fontSize: "1.05rem", color: darkMode ? "#f9fafb" : "#111827" }}>
                                        Invoice #{invoice.invoiceNumber}
                                    </div>
                                    <div className={mutedClass} style={{ fontSize: "0.8rem" }}>
                                        {invoice.customerName || "—"}
                                    </div>
                                </div>
                            </div>

                            {/* Status badge */}
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.75rem", fontWeight: 700, background: cfg.bg, color: cfg.color, padding: "5px 14px", borderRadius: "999px", border: `1px solid ${cfg.dot}44`, flexShrink: 0 }}>
                                <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
                                {cfg.label}
                            </div>
                        </div>

                        {/* ── Info rows ── */}
                        <div style={{ marginBottom: "1.5rem" }}>
                            <InfoRow icon={<CalendarDays size={14} />} label="Issue date" value={formatDate(invoice.issueDate)} />
                            <InfoRow icon={<CalendarDays size={14} />} label="Due date"   value={formatDate(invoice.dueDate)} />
                        </div>

                        {/* ── Items (only shown when present) ── */}
                        {hasItems && (
                            <div style={{ marginBottom: "1.5rem" }}>
                                <div className={`mb-2 ${mutedClass}`} style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
                                    Line Items
                                </div>

                                {/* Main plan */}
                                {mainPlan && (
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", background: darkMode ? "rgba(79,70,229,0.1)" : "rgba(79,70,229,0.05)", border: "1px solid rgba(79,70,229,0.15)", borderRadius: "0.65rem", marginBottom: "0.5rem" }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: darkMode ? "#e0e7ff" : "#3730a3" }}>{mainPlan.description}</div>
                                            <div className={mutedClass} style={{ fontSize: "0.75rem" }}>
                                                {mainPlan.serviceType || mainPlan.itemType || "plan"} · qty {mainPlan.quantity ?? 1}
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 700, color: darkMode ? "#a5b4fc" : "#4f46e5" }}>{formatMoney(mainPlan.lineTotal)}</div>
                                    </div>
                                )}

                                {/* Add-ons */}
                                {addOns.map((item, i) => (
                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.55rem 1rem", background: darkMode ? "rgba(255,255,255,0.04)" : "#f9fafb", borderRadius: "0.5rem", marginBottom: "0.35rem", fontSize: "0.85rem" }}>
                                        <span style={{ color: darkMode ? "#e5e7eb" : "#374151" }}>✦ {item.description}</span>
                                        <span style={{ fontWeight: 600, color: darkMode ? "#d1d5db" : "#4b5563" }}>{formatMoney(item.lineTotal)}</span>
                                    </div>
                                ))}

                                {/* Devices */}
                                {devices.map((item, i) => (
                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.55rem 1rem", background: darkMode ? "rgba(255,255,255,0.04)" : "#f9fafb", borderRadius: "0.5rem", marginBottom: "0.35rem", fontSize: "0.85rem" }}>
                                        <span style={{ color: darkMode ? "#e5e7eb" : "#374151" }}>📱 {item.description}</span>
                                        <span style={{ fontWeight: 600, color: darkMode ? "#d1d5db" : "#4b5563" }}>{formatMoney(item.lineTotal)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── No items notice (invoice exists but items empty) ── */}
                        {!hasItems && (
                            <div style={{ padding: "0.85rem 1rem", background: darkMode ? "rgba(255,255,255,0.04)" : "#f9fafb", border: `1px dashed ${darkMode ? "rgba(255,255,255,0.12)" : "#d1d5db"}`, borderRadius: "0.65rem", marginBottom: "1.5rem", fontSize: "0.83rem" }} className={mutedClass}>
                                No line item details available for this invoice.
                            </div>
                        )}

                        {/* ── Totals ── */}
                        <div style={{ borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "#f3f4f6"}`, paddingTop: "1rem", marginBottom: "1.5rem" }}>
                            {[
                                { label: "Subtotal", value: formatMoney(invoice.subtotal) },
                                { label: "Tax",      value: formatMoney(invoice.taxTotal) },
                            ].map(({ label, value }) => (
                                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", marginBottom: "0.35rem" }}>
                                    <span className={mutedClass}>{label}</span>
                                    <span style={{ fontWeight: 600, color: darkMode ? "#f9fafb" : "#374151" }}>{value}</span>
                                </div>
                            ))}

                            {/* Total highlight */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem", padding: "0.85rem 1rem", background: darkMode ? "rgba(79,70,229,0.1)" : "rgba(79,70,229,0.06)", border: "1px solid rgba(79,70,229,0.15)", borderRadius: "0.65rem" }}>
                                <span className="fw-bold" style={{ fontSize: "0.95rem", color: darkMode ? "#f9fafb" : "#111827" }}>Total</span>
                                <span style={{ fontSize: "1.3rem", fontWeight: 800, background: "linear-gradient(90deg,#4f46e5,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                                    {formatMoney(invoice.total)}
                                </span>
                            </div>
                        </div>

                        {/* ── CTA ── */}
                        {/*<button*/}
                        {/*    style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.85rem", fontWeight: 600, padding: "7px 18px", borderRadius: "999px", border: "none", cursor: "pointer", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", boxShadow: "0 3px 14px rgba(79,70,229,0.3)", transition: "transform 0.15s, box-shadow 0.15s" }}*/}
                        {/*    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(79,70,229,0.4)"; }}*/}
                        {/*    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "0 3px 14px rgba(79,70,229,0.3)"; }}*/}
                        {/*    onClick={() => nav("/customer/billing/history")}*/}
                        {/*>*/}
                        {/*    View All Invoices <ArrowRight size={14} />*/}
                        {/*</button>*/}
                    </div>
                </div>

            </Container>
        </div>
    );
}