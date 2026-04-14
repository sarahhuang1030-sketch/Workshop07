import React, { useEffect, useState } from "react";
import { Container, Spinner } from "react-bootstrap";
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

/* ── status badge ── */
const STATUS_CFG = {
    PAID:     { label: "Paid",     bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
    UNPAID:   { label: "Unpaid",   bg: "#fef9c3", color: "#a16207", dot: "#eab308" },
    APPROVED: { label: "Approved", bg: "#dbeafe", color: "#1d4ed8", dot: "#3b82f6" },
    DEFAULT:  { label: "Pending",  bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" },
};
const statusCfg = (s) => STATUS_CFG[String(s || "").toUpperCase()] ?? STATUS_CFG.DEFAULT;

export default function CustomerBillingHistory({ darkMode = false }) {
    const nav = useNavigate();
    const [data,    setData]    = useState([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState("");

    const mutedClass = darkMode ? "tc-muted-dark" : "tc-muted-light";

    useEffect(() => {
        let alive = true;
        async function load() {
            try {
                const res = await apiFetch("/api/invoices/user/all");
                if (!res.ok) throw new Error(`Failed: ${res.status}`);
                const json = await res.json();
                if (alive) setData(Array.isArray(json) ? json : []);
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
                <div className={`mt-2 ${mutedClass}`} style={{ fontSize: "0.85rem" }}>Loading invoices…</div>
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

    /* ── empty ── */
    if (data.length === 0) {
        return (
            <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                <div style={{ textAlign: "center", maxWidth: 400 }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🧾</div>
                    <h4 className="fw-bold mb-2" style={{ color: darkMode ? "#f9fafb" : "#111827" }}>No invoices yet</h4>
                    <p className={`${mutedClass} mb-4`} style={{ fontSize: "0.9rem" }}>Your invoice history will appear here once you subscribe.</p>
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

    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f5f3ff 0%,#fce7f3 50%,#dbeafe 100%)", padding: "3rem 0 5rem" }}>
            <Container style={{ maxWidth: 900 }}>

                {/* ── Page header ── */}
                <div className="mb-4">
                    <div className="tc-section-chip tc-section-chip-light mb-2">Billing</div>
                    <h2 className="fw-bold mb-1" style={{ fontSize: "clamp(1.5rem,3vw,1.9rem)", color: darkMode ? "#f9fafb" : "#111827" }}>
                        Invoice History
                    </h2>
                    <p className={mutedClass} style={{ fontSize: "0.88rem", margin: 0 }}>
                        {data.length} invoice{data.length !== 1 ? "s" : ""} found
                    </p>
                </div>

                {/* ── Invoice cards ── */}
                <div className="d-flex flex-column gap-3">
                    {data.map((inv) => {
                        const cfg      = statusCfg(inv.status);
                        const hasItems = Array.isArray(inv.items) && inv.items.length > 0;

                        // FIX: show plan name from items if available, else fall back gracefully
                        const planName = inv.items?.find(i => i.itemType === "plan")?.description
                            || inv.items?.[0]?.description
                            || null;

                        // All item descriptions for details column
                        const itemsSummary = hasItems
                            ? inv.items.map(i => `${i.description} ×${i.quantity ?? 1}`).join(" · ")
                            : null;

                        return (
                            <div
                                key={inv.invoiceNumber}
                                style={{ background: darkMode ? "#1f2937" : "#fff", borderRadius: "1rem", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", transition: "box-shadow 0.2s ease" }}
                                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.1)"}
                                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"}
                            >
                                {/* Color bar based on status */}
                                <div style={{ height: 3, background: `linear-gradient(90deg, ${cfg.dot}, ${cfg.dot}88)` }} />

                                <div style={{ padding: "1.1rem 1.4rem" }}>
                                    <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">

                                        {/* Left: invoice number + dates */}
                                        <div style={{ flex: 1, minWidth: 160 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "0.3rem" }}>
                                                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#7c3aed", letterSpacing: "1px", textTransform: "uppercase" }}>
                                                    Invoice
                                                </span>
                                                <span style={{ fontWeight: 700, fontSize: "0.9rem", color: darkMode ? "#f9fafb" : "#111827" }}>
                                                    #{inv.invoiceNumber}
                                                </span>
                                            </div>

                                            {/* Plan name — shown even without items */}
                                            {planName ? (
                                                <div style={{ fontSize: "0.88rem", fontWeight: 600, color: darkMode ? "#e0e7ff" : "#3730a3", marginBottom: "0.25rem" }}>
                                                    {planName}
                                                </div>
                                            ) : (
                                                <div className={mutedClass} style={{ fontSize: "0.82rem", marginBottom: "0.25rem" }}>
                                                    Subscription
                                                </div>
                                            )}

                                            <div className={mutedClass} style={{ fontSize: "0.78rem" }}>
                                                Issued {formatDate(inv.issueDate)}
                                                {inv.dueDate ? ` · Due ${formatDate(inv.dueDate)}` : ""}
                                            </div>

                                            {/* Item summary if available */}
                                            {itemsSummary && (
                                                <div className={mutedClass} style={{ fontSize: "0.75rem", marginTop: "0.3rem", maxWidth: 360 }}>
                                                    {itemsSummary}
                                                </div>
                                            )}
                                        </div>

                                        {/* Right: status + total + action */}
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem", flexShrink: 0 }}>
                                            {/* Status pill */}
                                            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.72rem", fontWeight: 700, background: cfg.bg, color: cfg.color, padding: "3px 10px", borderRadius: "999px", border: `1px solid ${cfg.dot}44` }}>
                                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
                                                {cfg.label}
                                            </div>

                                            {/* Total */}
                                            <div style={{ fontSize: "1.1rem", fontWeight: 800, background: "linear-gradient(90deg,#4f46e5,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                                                {formatMoney(inv.total)}
                                            </div>

                                            {/* View detail button */}
                                            <button
                                                style={{ fontSize: "0.75rem", fontWeight: 600, padding: "4px 14px", borderRadius: "999px", border: "none", cursor: "pointer", background: "rgba(79,70,229,0.08)", color: "#4f46e5", transition: "background 0.15s" }}
                                                onMouseEnter={e => e.currentTarget.style.background = "rgba(79,70,229,0.16)"}
                                                onMouseLeave={e => e.currentTarget.style.background = "rgba(79,70,229,0.08)"}
                                                onClick={() => nav(`/customer/invoice/${inv.invoiceNumber}`)}
                                            >
                                                View Detail →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </Container>
        </div>
    );
}