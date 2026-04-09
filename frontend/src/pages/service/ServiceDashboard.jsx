import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, ListGroup } from "react-bootstrap";
import { Wrench, ClipboardList, CheckCircle, AlertTriangle, Calendar } from "lucide-react";
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
    const [workOrders, setWorkOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [summaryRes, woRes] = await Promise.all([
                apiFetch("/api/service/summary"),
                apiFetch("/api/service/work-orders")
            ]);

            if (!summaryRes.ok) throw new Error("Failed to load summary");
            if (!woRes.ok) throw new Error("Failed to load work orders");

            const summaryData = await summaryRes.json();
            const woData = await woRes.json();

            setSummary(summaryData);
            setWorkOrders(woData);
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

            {/* Main Content */}
            <Row className="g-3 mt-2">
                <Col lg={8}>
                    <Card className="shadow-sm border-0 mb-3" style={{ borderRadius: 18 }}>
                        <Card.Header className="bg-transparent border-0 pt-4 px-4">
                            <h5 className="fw-bold mb-0">Upcoming Work Orders</h5>
                        </Card.Header>
                        <Card.Body className="p-4">
                            {workOrders.filter(wo => wo.status !== 'Completed' && wo.status !== 'Cancelled').length > 0 ? (
                                <ListGroup variant="flush">
                                    {workOrders
                                        .filter(wo => wo.status !== 'Completed' && wo.status !== 'Cancelled')
                                        .sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart))
                                        .slice(0, 5)
                                        .map(wo => (
                                            <ListGroup.Item key={wo.appointmentId} className="px-0 py-3 border-0 border-bottom">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <div className="fw-bold">{wo.customerName}</div>
                                                        <div className="text-muted small">
                                                            <Calendar size={14} className="me-1" />
                                                            {new Date(wo.scheduledStart).toLocaleString()} - {wo.locationType}
                                                        </div>
                                                    </div>
                                                    <Badge bg={wo.status === 'In Progress' ? 'primary' : 'secondary'}>
                                                        {wo.status}
                                                    </Badge>
                                                </div>
                                            </ListGroup.Item>
                                        ))}
                                </ListGroup>
                            ) : (
                                <div className="text-center py-4 text-muted">No upcoming work orders.</div>
                            )}
                            <Button variant="link" className="mt-2 p-0" onClick={() => nav("/service/work-orders")}>
                                View all work orders
                            </Button>
                        </Card.Body>
                    </Card>

                    <Row className="g-3">
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
                </Col>

                <Col lg={4}>
                    <Card className="shadow-sm border-0 h-100" style={{ borderRadius: 18 }}>
                        <Card.Header className="bg-transparent border-0 pt-4 px-4">
                            <h5 className="fw-bold mb-0">Quick Access</h5>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <div className="d-grid gap-3">
                                <Button variant="outline-primary" className="text-start py-3 px-4" style={{ borderRadius: 14 }} onClick={() => nav("/service/tickets")}>
                                    <div className="fw-bold">My Active Tickets</div>
                                    <div className="small opacity-75">View support requests assigned to you</div>
                                </Button>
                                <Button variant="outline-success" className="text-start py-3 px-4" style={{ borderRadius: 14 }} onClick={() => nav("/service/work-orders")}>
                                    <div className="fw-bold">Completed Jobs</div>
                                    <div className="small opacity-75">Review your work history</div>
                                </Button>
                            </div>

                            <div className="mt-4 p-3 bg-light rounded-4">
                                <h6 className="fw-bold mb-2">Technician Tip</h6>
                                <p className="small mb-0 text-muted">
                                    Updating a work order to "In Progress" will automatically notify the customer and update the ticket status.
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
