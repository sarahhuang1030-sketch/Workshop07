import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from "react-bootstrap";
import {
    Users,
    UserCog,
    Briefcase,
    Package,
    Puzzle,
    Repeat,
    FileBarChart2,
    ListChecks,
    ArrowRight,
    FileText,
    Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";

function Stat({ title, value, hint, icon: Icon, darkMode, children }) {
    const cardBase = darkMode ? "bg-dark border-secondary text-light" : "bg-white text-dark";
    const muted = darkMode ? "text-light-50" : "text-muted";



    return (
        <Card className={`${cardBase} shadow-sm h-100`} style={{ borderRadius: 18 }}>
            <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">

                    {/* LEFT SIDE */}
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

                    {/* RIGHT SIDE (ICON + BUTTON) */}
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

function ManageCard({ title, desc, icon: Icon, badge, to, darkMode, onGo }) {
    const cardBase = darkMode ? "bg-dark border-secondary text-light" : "bg-white text-dark";
    const muted = darkMode ? "text-light-50" : "text-muted";

    return (
        <Card className={`${cardBase} shadow-sm h-100`} style={{ borderRadius: 18 }}>
            <Card.Body className="p-4 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start">
                    <div className="d-flex gap-3">
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 16,
                                background: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
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

                <div className="mt-auto pt-3">
                    <Button
                        variant={darkMode ? "outline-light" : "primary"}
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

const formatMoney = (n) =>
    n == null || Number.isNaN(Number(n))
        ? "—"
        : Number(n).toLocaleString(undefined, {
            style: "currency",
            currency: "CAD",
            maximumFractionDigits: 0,
        });

export default function ManagerDashboard({ darkMode = false }) {
    const nav = useNavigate();
    const muted = darkMode ? "text-light-50" : "text-muted";
    const go = (to) => nav(to);

    const [summary, setSummary] = useState({
        customers: 0,
        activeSubs: 0,
        monthlyRevenue: 0,
        pastDue: 0,
        addOns: 0,
        planFeatures: 0,
        invoices: 0,
        pendingQuotes: 0,
        location: 0,
        serviceRequests: 0,
        serviceAppointments: 0
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let ignore = false;

        // const monthlyRevenue = invoicesArray
        //     .filter(inv => {
        //         const invDate = new Date(inv.date); // Assuming `date` field exists
        //         return inv.status === "PAID" && invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
        //     })
        //     .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
        //
        // // --- Update state ---
        // setSummary({
        //     customers: customersArray.length,
        //     invoices: invoicesArray.length,
        //     pendingQuotes: quotesArray.filter(q => q.status === "PENDING").length,
        //     monthlyRevenue,
        // });

        async function loadSummary() {
            try {
                setLoading(true);
                setError("");

                const response = await apiFetch("/api/manager/summary", {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                    },
                });



                if (!response.ok) {
                    throw new Error(`Failed to load summary: ${response.status}`);
                }

                const data = await response.json();

                // Quotes
                const quotesRes = await apiFetch("/api/quotes");
                if (!quotesRes.ok) {
                    throw new Error(`Failed to load quotes: ${quotesRes.status}`);
                }
                const quotesData = await quotesRes.json();
                const quotesArray = Array.isArray(quotesData)
                    ? quotesData
                    : quotesData.quotes ?? [];

                // Invoices
                const invoicesRes = await apiFetch("/api/invoices/all");
                if (!invoicesRes.ok) {
                    throw new Error(`Failed to load invoices: ${invoicesRes.status}`);
                }
                const invoicesData = await invoicesRes.json();
                const invoicesArray = Array.isArray(invoicesData)
                    ? invoicesData
                    : invoicesData.invoices ?? [];


                if (!ignore) {
                    setSummary({
                        customers: data.customers ?? 0,
                        activeSubs: data.activeSubs ?? 0,
                        monthlyRevenue: data.monthlyRevenue ?? 0, // keep yours
                        pastDue: data.pastDue ?? 0,
                        addOns: data.addOns ?? 0,
                        planFeatures: data.planFeatures ?? 0,
                        invoices: invoicesArray.length,
                        pendingQuotes: quotesArray.filter(
                            (q) => String(q.status).toUpperCase() === "PENDING"
                        ).length,
                        location: data.location ?? 0,
                        serviceRequests: data.serviceRequests ?? 0,
                        serviceAppointments: data.serviceAppointments ?? 0,
                    });

                }
            } catch (err) {
                console.error("Error loading manager summary:", err);
                if (!ignore) {
                    setError("Unable to load dashboard summary.");
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        loadSummary();

        return () => {
            ignore = true;
        };
    }, []);

    return (
        <Container className="py-4">
            {/* Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <div
                        className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}
                        style={{ fontSize: "1.8rem" }}
                    >
                        Manager Dashboard
                    </div>
                    <div className={muted}>
                        Overview and tools for managing catalog, subscriptions, customers, and staff.
                    </div>
                </div>

                <div className="d-flex gap-2">
                    <Button
                        variant={darkMode ? "outline-light" : "outline-primary"}
                        style={{ borderRadius: 14 }}
                        onClick={() => go("/manager/employee")}
                    >
                        Manage Employee
                    </Button>
                    <Button
                        variant={darkMode ? "outline-light" : "outline-primary"}
                        style={{ borderRadius: 14 }}
                        onClick={() => go("/manager/plan")}
                    >
                        Manage Plan
                    </Button>
                    <Button
                        variant={darkMode ? "light" : "outline-primary"}
                        style={{ borderRadius: 14 }}
                        onClick={() => go("/manager/users")}
                    >
                        Manage Customer
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="danger" className="mb-3">
                    {error}
                </Alert>
            )}

            {/* Stats */}
            <Row className="g-3">
                <Col xs={12} md={6} lg={3}>
                    <Stat
                        darkMode={darkMode}
                        title="Total Customers"
                        value={loading ? <Spinner animation="border" size="sm" /> : summary.customers}
                        hint="All accounts"
                        icon={Users}
                    />
                </Col>

                <Col xs={12} md={6} lg={3}>
                    <Stat
                        darkMode={darkMode}
                        title="Locations"
                        value={loading ? <Spinner animation="border" size="sm" /> : summary.location}
                        hint="All active locations"
                        icon={FileText}
                    >
                        <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => nav("/manager/location")}
                        >
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
                            onClick={() => nav("/manager/services")}
                        >
                            Details
                        </Button>
                    </Stat>
                </Col>

                <Col xs={12} md={6} lg={3}>
                    <Stat
                        darkMode={darkMode}
                        title="Invoices"
                        value={loading ? <Spinner animation="border" size="sm" /> : summary.invoices}
                        hint="All billing invoices"
                        icon={FileText}
                    >
                        <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => nav("/sales/history")}
                        >
                            Details
                        </Button>
                    </Stat>

                </Col>
                <Col xs={12} md={6} lg={3}>
                    <Stat
                        darkMode={darkMode}
                        title="Pending Quotes"
                        value={loading ? <Spinner animation="border" size="sm" /> : summary.pendingQuotes}
                        hint="Awaiting approval"
                        icon={Clock}
                    >
                        <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => nav("/sales/quotes")}
                        >
                            Details
                        </Button>
                    </Stat>

                </Col>

                <Col xs={12} md={6} lg={3}>
                    <Stat
                        darkMode={darkMode}
                        title="Active Subscriptions"
                        value={loading ? <Spinner animation="border" size="sm" /> : summary.activeSubs}
                        hint="Currently active"
                        icon={Repeat}
                    >
                        <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => nav("/manager/subscriptions")}
                        >
                            Details
                        </Button>
                    </Stat>

                </Col>
                <Col xs={12} md={6} lg={3}>

                    {/*monthly revenue*/}
                    {/*= sum of active subscription plan prices*/}
                    {/*+ sum of active add-on prices attached to active subscriptions*/}
                    <Stat
                        darkMode={darkMode}
                        title="Monthly Revenue"
                        value={loading ? <Spinner animation="border" size="sm" /> : formatMoney(summary.monthlyRevenue)}
                        hint="Estimated"
                        icon={Package}
                    />
                </Col>
                <Col xs={12} md={6} lg={3}>
                    {/*look for status in subscriptions table, and past due is invoices and payment allocation*/}
                    <Stat
                        darkMode={darkMode}
                        title="Past Due / Suspended"
                        value={loading ? <Spinner animation="border" size="sm" /> : summary.pastDue}
                        hint="Needs follow-up"
                        icon={ListChecks}
                    />
                </Col>


            {/* Management Cards */}

                {/*<Col xs={12} md={6} lg={4}>*/}
                {/*    <ManageCard*/}
                {/*        darkMode={darkMode}*/}
                {/*        title="Manage Subscriptions"*/}
                {/*        desc="Change plan, add/remove add-ons, suspend/cancel/reactivate."*/}
                {/*        icon={Repeat}*/}
                {/*        badge="Lifecycle"*/}
                {/*        to="/manager/subscriptions"*/}
                {/*        onGo={go}*/}
                {/*    />*/}
                {/*</Col>*/}

                <Col xs={12} md={6} lg={3}>
                    <Stat
                        darkMode={darkMode}
                        title="Total Add-ons"
                        value={loading ? <Spinner animation="border" size="sm" /> : summary.addOns}
                        hint="Currently active"
                        icon={Repeat}
                    >
                        <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => nav("/manager/addons")}
                        >
                            Details
                        </Button>
                    </Stat>

                </Col>

                <Col xs={12} md={6} lg={3}>
                    <Stat
                        darkMode={darkMode}
                        title="Total Plan Features"
                        value={loading ? <Spinner animation="border" size="sm" /> : summary.planFeatures}
                        hint="Currently active"
                        icon={Repeat}
                    >
                        <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => nav("/manager/planfeatures")}
                        >
                            Details
                        </Button>
                    </Stat>

                </Col>

                <Col xs={12} md={6}>
                    <ManageCard
                        darkMode={darkMode}
                        title="Audit Log"
                        desc="Track who changed plans, subscriptions, roles, and more."
                        icon={ListChecks}
                        badge="Security"
                        to="/manager/audit"
                        onGo={go}
                    />
                </Col>

                {/*<Col xs={12} md={6} lg={4}>*/}
                {/*    <ManageCard*/}
                {/*        darkMode={darkMode}*/}
                {/*        title="Manage Add-ons"*/}
                {/*        desc="Create/edit add-ons and control availability."*/}
                {/*        icon={Puzzle}*/}
                {/*        badge="Catalog"*/}
                {/*        to="/manager/addons"*/}
                {/*        onGo={go}*/}
                {/*    />*/}
                {/*</Col>*/}

                {/*<Col xs={12} md={6} lg={4}>*/}
                {/*    <ManageCard*/}
                {/*        darkMode={darkMode}*/}
                {/*        title="Reports"*/}
                {/*        desc="Revenue by plan, churn, growth, past-due trends."*/}
                {/*        icon={FileBarChart2}*/}
                {/*        badge="KPIs"*/}
                {/*        to="/manager/reports"*/}
                {/*        onGo={go}*/}
                {/*    />*/}
                {/*</Col>*/}


            {/* Reports row */}
            {/*<Row className="g-3 mt-2">*/}
            {/*    <Col xs={12} md={6}>*/}
            {/*        <ManageCard*/}
            {/*            darkMode={darkMode}*/}
            {/*            title="Audit Log"*/}
            {/*            desc="Track who changed plans, subscriptions, roles, and more."*/}
            {/*            icon={ListChecks}*/}
            {/*            badge="Security"*/}
            {/*            to="/manager/audit"*/}
            {/*            onGo={go}*/}
            {/*        />*/}
            {/*    </Col>*/}
            {/*</Row>*/}
            </Row>
        </Container>
    );
}