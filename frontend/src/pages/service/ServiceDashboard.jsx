import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from "react-bootstrap";
import {
    Wrench,
    ClipboardList,
    CheckCircle,
    AlertTriangle,
    ArrowRight,
    Briefcase,
    Calendar,
    CheckSquare,
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

function ActionCard({ title, desc, icon: Icon, badge, to, darkMode, onGo }) {
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

export default function ServiceDashboard({ darkMode = false }) {
    const nav = useNavigate();
    const muted = darkMode ? "text-light-50" : "text-muted";
    const [summary, setSummary] = useState({
        assignedRequests: 0,
        openRequests: 0,
        todayAppointments: 0,
        completedRequests: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadSummary() {
            try {
                setLoading(true);
                const response = await apiFetch("/api/service/summary");
                if (!response.ok) throw new Error("Failed to load summary");
                const data = await response.json();
                setSummary(data);
            } catch (err) {
                console.error(err);
                setError("Unable to load dashboard summary.");
            } finally {
                setLoading(false);
            }
        }
        loadSummary();
    }, []);

    return (
        <Container className="py-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`} style={{ fontSize: "1.8rem" }}>
                        Technician Dashboard
                    </div>
                    <div className={muted}>
                        Overview of your assigned tasks, tickets, and daily activity.
                    </div>
                </div>
                <div className="d-flex gap-2">
                    <Button variant={darkMode ? "outline-light" : "outline-primary"} style={{ borderRadius: 14 }} onClick={() => nav("/service/work-orders")}>
                        Work Orders
                    </Button>
                    <Button variant={darkMode ? "outline-light" : "outline-primary"} style={{ borderRadius: 14 }} onClick={() => nav("/service/tickets")}>
                        Tickets
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

            <Row className="g-3">
                <Col xs={12} md={6} lg={3}>
                    <Stat
                        darkMode={darkMode}
                        title="Assigned Tickets"
                        value={loading ? <Spinner animation="border" size="sm" /> : summary.assignedRequests}
                        hint="Total requests"
                        icon={ClipboardList}
                    />
                </Col>
                <Col xs={12} md={6} lg={3}>
                    <Stat
                        darkMode={darkMode}
                        title="Open Tasks"
                        value={loading ? <Spinner animation="border" size="sm" /> : summary.openRequests}
                        hint="Action required"
                        icon={Clock}
                    />
                </Col>
                <Col xs={12} md={6} lg={3}>
                    <Stat
                        darkMode={darkMode}
                        title="Today's Appointments"
                        value={loading ? <Spinner animation="border" size="sm" /> : summary.todayAppointments}
                        hint="Scheduled for today"
                        icon={Calendar}
                    >
                        <Button size="sm" variant="outline-primary" onClick={() => nav("/service/work-orders")}>
                            View
                        </Button>
                    </Stat>
                </Col>
                <Col xs={12} md={6} lg={3}>
                    <Stat
                        darkMode={darkMode}
                        title="Completed"
                        value={loading ? <Spinner animation="border" size="sm" /> : summary.completedRequests}
                        hint="Successfully finished"
                        icon={CheckSquare}
                    />
                </Col>
            </Row>

            <Row className="g-3 mt-2">
                <Col xs={12} md={6}>
                    <ActionCard
                        darkMode={darkMode}
                        title="Manage Work Orders"
                        desc="View and update your assigned service appointments and tasks."
                        icon={Wrench}
                        badge="Appointments"
                        to="/service/work-orders"
                        onGo={(to) => nav(to)}
                    />
                </Col>
                <Col xs={12} md={6}>
                    <ActionCard
                        darkMode={darkMode}
                        title="Manage Tickets"
                        desc="Track, update, and resolve customer service requests assigned to you."
                        icon={ClipboardList}
                        badge="Requests"
                        to="/service/tickets"
                        onGo={(to) => nav(to)}
                    />
                </Col>
            </Row>
        </Container>
    );
}