import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner, Alert } from "react-bootstrap";
import { Wrench, ClipboardList, CheckCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";

function Stat({ title, value, hint, icon: Icon }) {
    return (
        <Card className="shadow-sm h-100" style={{ borderRadius: 18 }}>
            <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                    <div>
                        <div className="text-muted fw-semibold">{title}</div>
                        <div className="fw-bold" style={{ fontSize: "1.7rem" }}>
                            {value}
                        </div>
                        <div className="text-muted">{hint}</div>
                    </div>

                    <div
                        style={{
                            width: 50,
                            height: 50,
                            borderRadius: 16,
                            background: "rgba(0,0,0,0.05)",
                        }}
                        className="d-flex align-items-center justify-content-center"
                    >
                        <Icon size={24} />
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}

function ActionCard({ title, desc, icon: Icon, to }) {
    const nav = useNavigate();

    return (
        <Card className="shadow-sm h-100" style={{ borderRadius: 18 }}>
            <Card.Body className="p-4 d-flex flex-column">
                <div className="d-flex gap-3">
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 16,
                            background: "rgba(0,0,0,0.05)",
                        }}
                        className="d-flex align-items-center justify-content-center"
                    >
                        <Icon size={24} />
                    </div>

                    <div>
                        <div className="fw-bold">{title}</div>
                        <div className="text-muted small">{desc}</div>
                    </div>
                </div>

                <div className="mt-auto pt-3">
                    <Button
                        variant="primary"
                        className="w-100"
                        style={{ borderRadius: 14 }}
                        onClick={() => nav(to)}
                    >
                        Open
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
}

export default function ServiceDashboard() {
    const nav = useNavigate();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadSummary();
    }, []);

    const loadSummary = async () => {
        try {
            setLoading(true);
            const res = await apiFetch("/api/service/summary");
            if (!res.ok) throw new Error("Failed to load summary");
            const data = await res.json();
            setSummary(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

    return (
        <Container className="py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold">Technician Dashboard</h2>
                    <p className="text-muted">
                        Overview of assigned tickets, work orders, and technician activity.
                    </p>
                </div>

                <div className="d-flex gap-2">
                    <Button variant="outline-primary" onClick={() => nav("/service/work-orders")}>
                        Work Orders
                    </Button>
                    <Button variant="outline-primary" onClick={() => nav("/service/tickets")}>
                        Tickets
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {/* Stats Row */}
            <Row className="g-3">
                <Col md={3}>
                    <Stat title="Assigned Tickets" value={summary?.assignedRequests || 0} hint="Active tickets" icon={ClipboardList} />
                </Col>
                <Col md={3}>
                    <Stat title="Work Orders" value={summary?.todayAppointments || 0} hint="Today's tasks" icon={Wrench} />
                </Col>
                <Col md={3}>
                    <Stat title="Completed Jobs" value={summary?.completedRequests || 0} hint="Total finished" icon={CheckCircle} />
                </Col>
                <Col md={3}>
                    <Stat title="Open Requests" value={summary?.openRequests || 0} hint="Needs action" icon={AlertTriangle} />
                </Col>
            </Row>

            {/* Action Cards */}
            <Row className="g-3 mt-2">
                <Col md={6}>
                    <ActionCard
                        title="Manage Work Orders"
                        desc="View and update assigned work orders."
                        icon={Wrench}
                        to="/service/work-orders"
                    />
                </Col>

                <Col md={6}>
                    <ActionCard
                        title="Manage Tickets"
                        desc="Track and update support tickets."
                        icon={ClipboardList}
                        to="/service/tickets"
                    />
                </Col>
            </Row>
        </Container>
    );
}
