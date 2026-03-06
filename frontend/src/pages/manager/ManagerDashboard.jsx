import React from "react";
import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function Stat({ title, value, hint, icon: Icon, darkMode }) {
    const cardBase = darkMode ? "bg-dark border-secondary text-light" : "bg-white text-dark";
    const muted = darkMode ? "text-light-50" : "text-muted";

    return (
        <Card className={`${cardBase} shadow-sm h-100`} style={{ borderRadius: 18 }}>
            <Card.Body className="p-4 d-flex justify-content-between">
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

                <div
                    style={{
                        width: 50,
                        height: 50,
                        borderRadius: 16,
                        background: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                    }}
                    className="d-flex align-items-center justify-content-center"
                >
                    <Icon size={24} />
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

export default function ManagerDashboard({ darkMode = false }) {
    const nav = useNavigate();

    // Later: replace with API data from /api/manager/summary
    const summary = {
        customers: 214,
        activeSubs: 187,
        monthlyRevenue: "$18,200",
        pastDue: 7,
    };

    const muted = darkMode ? "text-light-50" : "text-muted";
    const go = (to) => nav(to);

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
                        onClick={() => go("/manager/employees/new")}
                    >
                        Add Employee
                    </Button>
                    <Button
                        variant={darkMode ? "outline-light" : "outline-primary"}
                        style={{ borderRadius: 14 }}
                        onClick={() => go("/manager/plans/new")}
                    >
                        Create Plan
                    </Button>
                    <Button
                        variant={darkMode ? "light" : "primary"}
                        style={{ borderRadius: 14 }}
                        onClick={() => go("/manager/customers")}
                    >
                        Find Customer
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <Row className="g-3">
                <Col xs={12} md={6} lg={3}>
                    <Stat
                        darkMode={darkMode}
                        title="Total Customers"
                        value={summary.customers}
                        hint="All accounts"
                        icon={Users}
                    />
                </Col>
                <Col xs={12} md={6} lg={3}>
                    <Stat
                        darkMode={darkMode}
                        title="Active Subscriptions"
                        value={summary.activeSubs}
                        hint="Currently active"
                        icon={Repeat}
                    />
                </Col>
                <Col xs={12} md={6} lg={3}>
                    <Stat
                        darkMode={darkMode}
                        title="Monthly Revenue"
                        value={summary.monthlyRevenue}
                        hint="Estimated"
                        icon={Package}
                    />
                </Col>
                <Col xs={12} md={6} lg={3}>
                    <Stat
                        darkMode={darkMode}
                        title="Past Due / Suspended"
                        value={summary.pastDue}
                        hint="Needs follow-up"
                        icon={ListChecks}
                    />
                </Col>
            </Row>

            {/* Management Cards */}
            <Row className="g-3 mt-2">
                <Col xs={12} md={6} lg={4}>
                    <ManageCard
                        darkMode={darkMode}
                        title="Manage Customers"
                        desc="CRUD, search, edit profiles, status changes."
                        icon={Users}
                        badge="CRUD"
                        to="/manager/customers"
                        onGo={go}
                    />
                </Col>

                <Col xs={12} md={6} lg={4}>
                    <ManageCard
                        darkMode={darkMode}
                        title="Manage Subscriptions"
                        desc="Change plan, add/remove add-ons, suspend/cancel/reactivate."
                        icon={Repeat}
                        badge="Lifecycle"
                        to="/manager/subscriptions"
                        onGo={go}
                    />
                </Col>

                <Col xs={12} md={6} lg={4}>
                    <ManageCard
                        darkMode={darkMode}
                        title="Manage Employees"
                        desc="CRUD employees, salary type/rate, assign positions."
                        icon={UserCog}
                        badge="Roles + Pay"
                        to="/manager/employees"
                        onGo={go}
                    />
                </Col>

                <Col xs={12} md={6} lg={4}>
                    <ManageCard
                        darkMode={darkMode}
                        title="Manage Plans"
                        desc="Create/edit/deactivate plans used in the storefront."
                        icon={Package}
                        badge="Catalog"
                        to="/manager/plans"
                        onGo={go}
                    />
                </Col>

                <Col xs={12} md={6} lg={4}>
                    <ManageCard
                        darkMode={darkMode}
                        title="Manage Add-ons"
                        desc="Create/edit add-ons and control availability."
                        icon={Puzzle}
                        badge="Catalog"
                        to="/manager/addons"
                        onGo={go}
                    />
                </Col>

                <Col xs={12} md={6} lg={4}>
                    <ManageCard
                        darkMode={darkMode}
                        title="Positions + Admin"
                        desc="Manage dropdown positions and review change history."
                        icon={Briefcase}
                        badge="Admin"
                        to="/manager/positions"
                        onGo={go}
                    />
                </Col>
            </Row>

            {/* Reports row */}
            <Row className="g-3 mt-2">
                <Col xs={12} md={6}>
                    <ManageCard
                        darkMode={darkMode}
                        title="Reports"
                        desc="Revenue by plan, churn, growth, past-due trends."
                        icon={FileBarChart2}
                        badge="KPIs"
                        to="/manager/reports"
                        onGo={go}
                    />
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
            </Row>
        </Container>
    );
}