import React, { useState, useEffect } from "react";
import { Card, Spinner } from "react-bootstrap";
import { Package, CalendarDays, Receipt, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";
import "../style/style.css";

/* ── helpers ── */
const formatMoney = (n) =>
    n == null || Number.isNaN(Number(n))
        ? "—"
        : Number(n).toLocaleString(undefined, { style: "currency", currency: "CAD" });

const formatDate = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? "—" : d.toISOString().split("T")[0];
};

const addMonthsToDate = (v, months) => {
    if (!v || !months) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return null;
    const day = d.getDate();
    d.setMonth(d.getMonth() + Number(months));
    if (d.getDate() < day) d.setDate(0);
    return d.toISOString().split("T")[0];
};

const isExpired = (endDateVal) => {
    if (!endDateVal || endDateVal === "—") return false;
    return new Date(endDateVal) < new Date();
};

/* ── status badge config ── */
const STATUS_CONFIG = {
    PAID:     { label: "Paid",     bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
    UNPAID:   { label: "Unpaid",   bg: "#fef9c3", color: "#a16207", dot: "#eab308" },
    APPROVED: { label: "Approved", bg: "#dbeafe", color: "#1d4ed8", dot: "#3b82f6" },
    PENDING:  { label: "Pending",  bg: "#fef9c3", color: "#a16207", dot: "#eab308" },
    ACTIVE:   { label: "Active",   bg: "#ede9fe", color: "#6d28d9", dot: "#7c3aed" },
    DEFAULT:  { label: "Active",   bg: "#ede9fe", color: "#6d28d9", dot: "#7c3aed" },
};
const statusCfg = (s) => STATUS_CONFIG[String(s).toUpperCase()] ?? STATUS_CONFIG.DEFAULT;

const isValidInvoice = (data) => {
    if (!data) return false;
    const status = String(data?.status || "").toUpperCase();
    const validStatuses = ["PAID", "APPROVED", "ACTIVE"];
    if (!validStatuses.includes(status)) return false;

    const endDateVal = data?.endDate || null;
    return !isExpired(endDateVal);   // 没有 endDate 也视为有效
};

const isValidPlan = (p) => {
    if (!p) return false;
    const status = String(p.status || "").toUpperCase();
    const validStatuses = ["PAID", "APPROVED", "ACTIVE"];
    if (!validStatuses.includes(status)) return false;

    const planEnd =
        p.endDate ||
        addMonthsToDate(p.startDate, p.contractTermMonths || p.plan?.contractTermMonths);
    return !isExpired(planEnd);
};

export default function SubscriptionPage({ darkMode = false }) {
    const [loading,       setLoading]       = useState(true);
    const [latestInvoice, setLatestInvoice] = useState(null);
    const [currentPlan,   setCurrentPlan]   = useState(null);
    const navigate = useNavigate();

    const mutedClass = darkMode ? "tc-muted-dark" : "tc-muted-light";

    useEffect(() => {
        let alive = true;

        async function loadData() {
            try {
                /* ── 1. Latest invoice ── */
                const invoiceRes = await apiFetch("/api/invoices/latest");
                if (invoiceRes.ok) {
                    const data = await invoiceRes.json();
                    if (alive && isValidInvoice(data)) {
                        setLatestInvoice(data);
                    } else if (alive && data) {
                        setLatestInvoice(data);
                    }
                }

                /* ── 2. Current plan (optional) ── */
                try {
                    const plansRes = await apiFetch("/api/me/plans");
                    if (plansRes.ok) {
                        const plansData = await plansRes.json();
                        const list = Array.isArray(plansData)
                            ? plansData
                            : [plansData].filter(Boolean);

                        const activePlan =
                            list.find(isValidPlan) ||
                            list[0] ||
                            null;

                        if (alive) setCurrentPlan(activePlan);
                    }
                } catch (_) {}

            } catch (err) {
                console.error("Failed to load subscription data:", err);
            } finally {
                if (alive) setLoading(false);
            }
        }

        loadData();
        return () => { alive = false; };
    }, []);

    /* ── loading ── */
    if (loading) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 0" }}>
                <Spinner animation="border" variant="primary" style={{ width: "2rem", height: "2rem" }} />
                <div className={`mt-2 ${mutedClass}`} style={{ fontSize: "0.85rem" }}>Loading subscription…</div>
            </div>
        );
    }

    /* ── derive display data ── */
    const hasInvoice = latestInvoice != null;

    const mainPlan    = latestInvoice?.items?.find(i => i.itemType === "plan") || null;
    const addOnsItems = latestInvoice?.items?.filter(i => i.itemType === "addon") || [];
    const otherItems  = latestInvoice?.items?.filter(i => i.itemType !== "plan" && i.itemType !== "addon") || [];

    const planName =
        mainPlan?.description ||
        currentPlan?.name ||
        currentPlan?.planName ||
        latestInvoice?.items?.[0]?.description ||
        "Subscribed Plan";

    const planPrice =
        mainPlan?.lineTotal ??
        currentPlan?.monthlyPrice ??
        latestInvoice?.subtotal ??
        null;

    const startDate =
        currentPlan?.startDate ||
        latestInvoice?.startDate ||
        latestInvoice?.invoiceDate ||
        null;

    const contractTermMonths =
        currentPlan?.contractTermMonths ||
        currentPlan?.plan?.contractTermMonths ||
        null;

    const endDate =
        currentPlan?.endDate ||
        latestInvoice?.endDate ||
        addMonthsToDate(startDate, contractTermMonths) ||
        "—";

    const invoiceStatus = latestInvoice?.status || null;
    const cfg = invoiceStatus ? statusCfg(invoiceStatus) : STATUS_CONFIG.DEFAULT;

    /* ── info row helper ── */
    const InfoRow = ({ icon, label, value }) => (
        <div style={{
            display: "flex", alignItems: "center", gap: "0.6rem",
            padding: "0.5rem 0",
            borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "#f3f4f6"}`
        }}>
            <div style={{ color: "#7c3aed", flexShrink: 0 }}>{icon}</div>
            <span className={mutedClass} style={{ fontSize: "0.82rem", minWidth: 80 }}>{label}</span>
            <span style={{ fontSize: "0.88rem", fontWeight: 600, color: darkMode ? "#f9fafb" : "#111827", marginLeft: "auto" }}>
                {value}
            </span>
        </div>
    );

    return (
        <Card
            className={`mt-4 border-0 shadow-sm ${darkMode ? "tc-card-dark" : "bg-white"}`}
            style={{ borderRadius: "1rem", overflow: "hidden" }}
        >
            {/* Gradient top bar */}
            <div style={{ height: 4, background: "linear-gradient(90deg, #4f46e5, #7c3aed)" }} />

            <Card.Body className="p-4">
                {/* ── Header ── */}
                <div className="d-flex align-items-start justify-content-between gap-2 mb-4">
                    <div className="d-flex align-items-center gap-2">
                        <div style={{
                            width: 32, height: 32, borderRadius: "0.5rem",
                            background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                            <Package size={15} color="#fff" />
                        </div>
                        <div>
                            <div className="fw-bold" style={{ fontSize: "0.95rem", color: darkMode ? "#f9fafb" : "#111827" }}>
                                Your Current Plan
                            </div>
                            <div className={mutedClass} style={{ fontSize: "0.78rem" }}>
                                Plan and add-ons overview
                            </div>
                        </div>
                    </div>

                    {/* Status badge */}
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: "0.75rem", fontWeight: 700,
                        background: cfg.bg, color: cfg.color,
                        padding: "4px 12px", borderRadius: "999px",
                        border: `1px solid ${cfg.dot}44`, flexShrink: 0,
                    }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
                        {hasInvoice ? cfg.label : "No Plan"}
                    </div>
                </div>

                {hasInvoice ? (
                    <>
                        {/* ── Plan name + price ── */}
                        <div style={{
                            padding: "1rem 1.25rem",
                            background: darkMode ? "rgba(79,70,229,0.1)" : "rgba(79,70,229,0.05)",
                            border: "1px solid rgba(79,70,229,0.18)",
                            borderRadius: "0.75rem",
                            marginBottom: "1rem",
                        }}>
                            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: darkMode ? "#e0e7ff" : "#3730a3", marginBottom: "0.15rem" }}>
                                {planName}
                            </div>
                            {planPrice != null && (
                                <div style={{ fontSize: "0.85rem", color: darkMode ? "#a5b4fc" : "#6d28d9" }}>
                                    {formatMoney(planPrice)}
                                    <span style={{ fontSize: "0.72rem", marginLeft: 3, opacity: 0.75 }}>/billing period</span>
                                </div>
                            )}
                        </div>

                        {/* ── Add-ons ── */}
                        {addOnsItems.length > 0 && (
                            <div className="mb-3">
                                <div className={`mb-2 ${mutedClass}`} style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
                                    Add-ons
                                </div>
                                {addOnsItems.map((item, idx) => (
                                    <div key={idx} style={{
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                        padding: "0.45rem 0.85rem", marginBottom: "0.35rem",
                                        background: darkMode ? "rgba(255,255,255,0.04)" : "#f9fafb",
                                        borderRadius: "0.5rem", fontSize: "0.85rem",
                                    }}>
                                        <span style={{ color: darkMode ? "#e5e7eb" : "#374151" }}>✦ {item.description}</span>
                                        <span style={{ fontWeight: 600, color: darkMode ? "#a5b4fc" : "#4f46e5" }}>{formatMoney(item.lineTotal)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Other items ── */}
                        {otherItems.length > 0 && (
                            <div className="mb-3">
                                <div className={`mb-2 ${mutedClass}`} style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
                                    Other Items
                                </div>
                                {otherItems.map((item, idx) => (
                                    <div key={idx} style={{
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                        padding: "0.45rem 0.85rem", marginBottom: "0.35rem",
                                        background: darkMode ? "rgba(255,255,255,0.04)" : "#f9fafb",
                                        borderRadius: "0.5rem", fontSize: "0.85rem",
                                    }}>
                                        <span style={{ color: darkMode ? "#e5e7eb" : "#374151" }}>{item.description}</span>
                                        <span style={{ fontWeight: 600, color: darkMode ? "#d1d5db" : "#374151" }}>{formatMoney(item.lineTotal)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Date + invoice info rows ── */}
                        <div style={{ marginBottom: "1.25rem" }}>
                            <InfoRow icon={<CalendarDays size={14} />} label="Start date"   value={formatDate(startDate)} />
                            <InfoRow icon={<CalendarDays size={14} />} label="End date"     value={formatDate(endDate)} />
                            {latestInvoice?.invoiceNumber && (
                                <InfoRow icon={<Receipt size={14} />}  label="Invoice"      value={latestInvoice.invoiceNumber} />
                            )}
                            {latestInvoice?.total != null && (
                                <InfoRow icon={<Receipt size={14} />}  label="Total billed" value={formatMoney(latestInvoice.total)} />
                            )}
                        </div>

                        {/* ── CTA ── */}
                        <button
                            style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                fontSize: "0.85rem", fontWeight: 600,
                                padding: "7px 18px", borderRadius: "999px", border: "none", cursor: "pointer",
                                background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                                color: "#fff", boxShadow: "0 3px 14px rgba(79,70,229,0.3)",
                                transition: "transform 0.15s, box-shadow 0.15s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(79,70,229,0.4)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "0 3px 14px rgba(79,70,229,0.3)"; }}
                            onClick={() => navigate("/customer/billing")}
                        >
                            View Full Invoice <ArrowRight size={14} />
                        </button>
                    </>
                ) : (
                    /* ── No plan state ── */
                    <div style={{
                        textAlign: "center", padding: "2rem 1rem",
                        background: darkMode ? "rgba(255,255,255,0.04)" : "#f9fafb",
                        borderRadius: "0.75rem",
                        border: `1px dashed ${darkMode ? "rgba(255,255,255,0.15)" : "#d1d5db"}`,
                    }}>
                        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📦</div>
                        <div className="fw-semibold mb-1" style={{ color: darkMode ? "#f9fafb" : "#111827" }}>
                            No active plan yet
                        </div>
                        <div className={mutedClass} style={{ fontSize: "0.82rem", marginBottom: "1.25rem" }}>
                            Subscribe to a plan to get started.
                        </div>
                        <button
                            style={{
                                fontSize: "0.85rem", fontWeight: 600, padding: "7px 20px",
                                borderRadius: "999px", border: "none", cursor: "pointer",
                                background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                                color: "#fff", boxShadow: "0 3px 14px rgba(79,70,229,0.3)",
                            }}
                            onClick={() => navigate("/plans")}
                        >
                            Browse Plans
                        </button>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}