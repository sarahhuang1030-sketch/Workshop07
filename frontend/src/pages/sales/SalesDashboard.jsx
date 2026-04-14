/**
 * SalesDashboard (FINAL VERSION)
 * ----------------------------------------
 * Features:
 * - Fully aligned with ManagerDashboard design system
 * - Dark mode support
 * - Unified Stat + ManageCard components
 * - Consistent button styles
 * - Safe API handling
 * - Clean ESLint (no warnings)
 */

import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Spinner, Badge } from "react-bootstrap";
import {
    Users,
    FileText,
    Clock,
    Package,
    Repeat,
    ListChecks,
    TrendingUp,
    ArrowRight, Briefcase
} from "lucide-react";
import { Box } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";

/* =========================
   FORMAT MONEY (SAFE)
========================= */
function formatMoney(value) {
    const num = Number(value);
    if (!isFinite(num)) return "$0";
    return num.toLocaleString(undefined, {
        style: "currency",
        currency: "CAD",
        maximumFractionDigits: 0,
    });
}

/* =========================
   STAT CARD (MATCH MANAGER)
========================= */
function Stat({ title, value, hint, icon: Icon, darkMode, children }) {

    const cardBase = darkMode
        ? "bg-dark border-secondary text-light"
        : "bg-white text-dark";

    const muted = darkMode ? "text-light-50" : "text-muted";

    return (
        <Card className={`${cardBase} shadow-sm h-100`} style={{ borderRadius: 18 }}>
            <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">

                    {/* LEFT */}
                    <div>
                        <div className={`${muted} fw-semibold`} style={{ fontSize: ".95rem" }}>
                            {title}
                        </div>

                        <div className="fw-bold" style={{ fontSize: "1.7rem" }}>
                            {value}
                        </div>

                        {hint && (
                            <div className={muted} style={{ fontSize: ".9rem" }}>
                                {hint}
                            </div>
                        )}
                    </div>

                    {/* RIGHT */}
                    <div className="d-flex flex-column align-items-end gap-2">

                        <div
                            style={{
                                width: 50,
                                height: 50,
                                borderRadius: 16,
                                background: darkMode
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(0,0,0,0.05)",
                            }}
                            className="d-flex align-items-center justify-content-center"
                        >
                            <Icon size={24} />
                        </div>

                        {children}

                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}

/* =========================
   MANAGE CARD (MATCH MANAGER)
========================= */
function ManageCard({ title, desc, icon: Icon, badge, to, darkMode, onGo }) {

    const cardBase = darkMode
        ? "bg-dark border-secondary text-light"
        : "bg-white text-dark";

    const muted = darkMode ? "text-light-50" : "text-muted";

    return (
        <Card className={`${cardBase} shadow-sm h-100`} style={{ borderRadius: 18 }}>
            <Card.Body className="p-4 d-flex flex-column">

                <div className="d-flex justify-content-between align-items-start">

                    {/* LEFT */}
                    <div className="d-flex gap-3">

                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 16,
                                background: darkMode
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(0,0,0,0.05)",
                            }}
                            className="d-flex align-items-center justify-content-center"
                        >
                            <Icon size={24} />
                        </div>

                        <div>
                            <div className="fw-bold" style={{ fontSize: "1.1rem" }}>
                                {title}
                            </div>
                            <div className={muted} style={{ fontSize: ".92rem" }}>
                                {desc}
                            </div>
                        </div>
                    </div>

                    {badge && (
                        <Badge bg={darkMode ? "secondary" : "light"} text={darkMode ? "light" : "dark"}>
                            {badge}
                        </Badge>
                    )}
                </div>

                {/* BUTTON */}
                <div className="mt-auto pt-3">
                    <Button
                        variant={darkMode ? "outline-light" : "outline-primary"}
                        style={{ borderRadius: 14 }}
                        className="w-100 d-flex align-items-center justify-content-center gap-2"
                        onClick={() => onGo(to)}
                    >
                        Open <ArrowRight size={18} />
                    </Button>
                </div>

            </Card.Body>
        </Card>
    );
}

/* =========================
   MAIN DASHBOARD
========================= */
export default function SalesDashboard({ darkMode = false }) {

    const nav = useNavigate();
    const go = (to) => nav(to);

    const [summary, setSummary] = useState({
        customers: 0,
        invoices: 0,
        pendingQuotes: 0,
        monthlyRevenue: 0,
        activeSubs: 0,
        addOns: 0,
        planFeatures: 0,
        pastDue: 0,
        pendingChatRequests: 0
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        let isMounted = true;

        async function load() {
            try {
                setLoading(true);

                const [custRes, quoteRes, invRes, managerRes, serviceRes, chatReqRes] = await Promise.all([
                    apiFetch("/api/customers/all"),
                    apiFetch("/api/quotes"),
                    apiFetch("/api/invoices/all"),
                    apiFetch("/api/manager/summary"),
                    apiFetch("/api/manager/service-requests"),
                    apiFetch("/api/chat/chat-requests?manager=false")
                ]);

                const customers = await custRes.json();
                const quotes = await quoteRes.json();
                const invoices = await invRes.json();
                const manager = await managerRes.json();
                const serviceData = await serviceRes.json();
                const chatReqData = await chatReqRes.json();

                // ✅ FIX 1: safe unwrap (DO NOT change UI logic)
                const c = Array.isArray(customers) ? customers : customers?.customers ?? [];
                const q = Array.isArray(quotes) ? quotes : quotes?.quotes ?? [];
                const i = Array.isArray(invoices) ? invoices : [];

                // 🔥 FIX 2: service requests safe parse (IMPORTANT BUG FIX)
                const requests = Array.isArray(serviceData)
                    ? serviceData
                    : serviceData?.data || serviceData?.requests || [];

                const chatRequests = Array.isArray(chatReqData)
                    ? chatReqData
                    : chatReqData?.data || chatReqData?.requests || [];

                // 🔥 FIX 3: correct id mapping
                const apptPromises = requests.map(r =>
                    apiFetch(
                        `/api/manager/service-requests/${
                            r.requestId || r.id || r.serviceRequestId
                        }/appointments`
                    )
                        .then(res => res.ok ? res.json() : [])
                        .catch(() => [])
                );

                const apptsNested = await Promise.all(apptPromises);
                const flatAppts = apptsNested.flat();

                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                let totalRevenue = 0;
                let monthlyRevenue = 0;

                i.forEach(inv => {
                    const amount = Number(inv?.total ?? 0);
                    if (!isFinite(amount)) return;

                    totalRevenue += amount;

                    const [year, month] = (inv?.issueDate || "")
                        .split("-")
                        .map(Number);

                    if (year === currentYear && (month - 1) === currentMonth) {
                        monthlyRevenue += amount;
                    }
                });

                if (!isMounted) return;

                // ✅ FIX 4: ONLY use existing state fields (NO UI CHANGE)
                setSummary(prev => ({
                    ...prev,
                    customers: c.length,
                    invoices: i.length,
                    pendingQuotes: q.filter(x => x.status === "PENDING").length,
                    monthlyRevenue,
                    revenue: totalRevenue,
                    activeSubs: manager?.activeSubs ?? 0,
                    addOns: manager?.addOns ?? 0,
                    planFeatures: manager?.planFeatures ?? 0,
                    pastDue: manager?.pastDue ?? 0,

                    // FIXED VALUES
                    serviceRequests: requests.length,
                    serviceAppointments: flatAppts.length,

                    pendingChatRequests: chatRequests.filter(
                        (r) => String(r.status || "").toUpperCase() === "PENDING"
                    ).length,
                }));

            } catch (err) {
                console.error("Dashboard load failed:", err);

                if (!isMounted) return;

                setSummary(prev => ({
                    ...prev,
                    customers: 0,
                    invoices: 0,
                    pendingQuotes: 0,
                    monthlyRevenue: 0,
                    revenue: 0,
                    activeSubs: 0,
                    addOns: 0,
                    planFeatures: 0,
                    pastDue: 0,
                    serviceRequests: 0,
                    serviceAppointments: 0,
                    pendingChatRequests: 0
                }));

            } finally {
                if (isMounted) setLoading(false);
            }
        }

        load();

        return () => {
            isMounted = false;
        };

    }, []);

    if (loading) {
        return (
            <Container className="text-center py-5">
                <Spinner />
            </Container>
        );
    }

    return (
        <Container className="py-4">

            <h2 className="fw-bold mb-3">Sales Dashboard</h2>

            {/* ================= STATS ================= */}
            <Row className="g-3">

                <Col md={3}>
                    <Stat title="Customers" value={summary.customers} hint="All accounts" icon={Users} darkMode={darkMode}>
                        <Button size="sm" variant={darkMode ? "outline-light" : "outline-primary"} onClick={() => nav("/sales/customers")}>
                            Details
                        </Button>
                    </Stat>
                </Col>

                <Col md={3}>
                    <Stat title="Invoices" value={summary.invoices} hint="All billing invoices" icon={FileText} darkMode={darkMode}>
                        <Button size="sm" variant={darkMode ? "outline-light" : "outline-primary"} onClick={() => nav("/sales/history")}>
                            Details
                        </Button>
                    </Stat>
                </Col>

                <Col md={3}>
                    <Stat title="Quotes" value={summary.pendingQuotes} hint="Awaiting approval" icon={Clock} darkMode={darkMode}>
                        <Button size="sm" variant={darkMode ? "outline-light" : "outline-primary"} onClick={() => nav("/sales/quotes")}>
                            Details
                        </Button>
                    </Stat>
                </Col>

                <Col md={3}>
                    <Stat title="Revenue" value={formatMoney(summary.monthlyRevenue)} hint="Estimated" icon={Package} darkMode={darkMode} />
                </Col>

                <Col md={3}>
                    <Stat title="Subscriptions" value={summary.activeSubs} hint="Currently active" icon={Repeat} darkMode={darkMode}>
                        <Button size="sm" variant={darkMode ? "outline-light" : "outline-primary"} onClick={() => nav("/sales/subscriptions")}>
                            Details
                        </Button>
                    </Stat>
                </Col>

                <Col md={3}>
                    <Stat title="Add-ons" value={summary.addOns} hint="Currently active" icon={Package} darkMode={darkMode}>
                        <Button size="sm" variant={darkMode ? "outline-light" : "outline-primary"} onClick={() => nav("/sales/addons")}>
                            Details
                        </Button>
                    </Stat>
                </Col>

                <Col md={3}>
                    <Stat title="Plan Features" value={summary.planFeatures} hint="Currently active" icon={ListChecks} darkMode={darkMode}>
                        <Button size="sm" variant={darkMode ? "outline-light" : "outline-primary"} onClick={() => nav("/sales/planfeatures")}>
                            Details
                        </Button>
                    </Stat>
                </Col>

                <Col xs={12} md={6} lg={3}>
                    <Stat
                        darkMode={darkMode}
                        title="Service"
                        value={
                            loading ? (
                                <Spinner animation="border" size="sm" />
                            ) : (
                                `${summary.serviceRequests} / ${summary.serviceAppointments}`
                            )
                        }
                        hint="Requests / Appointments"
                        icon={Briefcase}
                    >
                        <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => nav("/sales/services")}
                        >
                            Details
                        </Button>
                    </Stat>
                </Col>

                <Col md={3}>
                    <Stat title="Past Due" value={summary.pastDue} hint="Needs follow-up" icon={Clock} darkMode={darkMode} />
                </Col>

                <Col md={6}>
                    <ManageCard
                        title="Chat Hub"
                        desc="Handle chat requests and manage active customer conversations."
                        icon={Users}
                        badge={
                            summary.pendingChatRequests > 0
                                ? `${summary.pendingChatRequests} Pending`
                                : "Support"
                        }
                        to="/sales/chat"
                        onGo={go}
                        darkMode={darkMode}
                    />
                </Col>

            </Row>

            {/* ================= MANAGEMENT ================= */}
            <Row className="mt-4 g-3">

                {/*<Col md={6}>*/}
                {/*    <ManageCard*/}
                {/*        title="Audit Log"*/}
                {/*        desc="Track system changes"*/}
                {/*        icon={ListChecks}*/}
                {/*        badge="Security"*/}
                {/*        to="/sales/audit"*/}
                {/*        onGo={go}*/}
                {/*        darkMode={darkMode}*/}
                {/*    />*/}
                {/*</Col>*/}

                <Col md={6}>
                    <ManageCard
                        title="Custom Bundle"
                        desc="Create personalized bundle for customer"
                        icon={Box}
                        badge="New"
                        to="/sales/bundle/create"
                        onGo={go}
                        darkMode={darkMode}
                    />
                </Col>

                <Col md={6}>
                    <ManageCard
                        title="Employee Sales"
                        desc="Sales performance report"
                        icon={TrendingUp}
                        badge="Reports"
                        to="/sales/employee-sales"
                        onGo={go}
                        darkMode={darkMode}
                    />
                </Col>

            </Row>

        </Container>
    );
}