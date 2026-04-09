import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner, Alert, Table, Badge } from "react-bootstrap";
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

function getStatusBadge(status) {
    const s = String(status || "").toLowerCase();
    if (s === "assigned") return "secondary";
    if (s === "in progress") return "primary";
    if (s === "completed") return "success";
    if (s === "cancelled") return "danger";
    return "dark";
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
            setError("");

            const [summaryRes, workOrdersRes] = await Promise.all([
                apiFetch("/api/service/summary"),
                apiFetch("/api/service/work-orders"),
            ]);

            if (!summaryRes.ok) throw new Error("Failed to load summary");
            if (!workOrdersRes.ok) throw new Error("Failed to load work orders");

            const summaryData = await summaryRes.json();
            const workOrdersData = await workOrdersRes.json();

            setSummary(summaryData);
            setWorkOrders(Array.isArray(workOrdersData) ? workOrdersData : []);
        } catch (err) {
            setError(err.message || "Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    };

    const upcomingWorkOrders = [...workOrders]
        .filter((w) => w.status !== "Completed" && w.status !== "Cancelled")
        .sort((a, b) => {
            const aTime = a.scheduledStart ? new Date(a.scheduledStart).getTime() : Number.MAX_SAFE_INTEGER;
            const bTime = b.scheduledStart ? new Date(b.scheduledStart).getTime() : Number.MAX_SAFE_INTEGER;
            return aTime - bTime;
        })
        .slice(0, 5);

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" />
            </div>
        );
    }

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold">Technician Dashboard</h2>
                    <p className="text-muted">
                        Overview of your work and assigned tickets.
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

            <Row className="g-3">
                <Col md={3}>
                    <Stat
                        title="Assigned Tickets"
                        value={summary?.assignedRequests || 0}
                        hint="Tickets assigned to you"
                        icon={ClipboardList}
                    />
                </Col>

                <Col md={3}>
                    <Stat
                        title="Today's Work Orders"
                        value={summary?.todayAppointments || 0}
                        hint="Scheduled for today"
                        icon={Wrench}
                    />
                </Col>

                <Col md={3}>
                    <Stat
                        title="Completed Jobs"
                        value={summary?.completedRequests || 0}
                        hint="Finished work"
                        icon={CheckCircle}
                    />
                </Col>

                <Col md={3}>
                    <Stat
                        title="Active Requests"
                        value={summary?.openRequests || 0}
                        hint="Not completed yet"
                        icon={AlertTriangle}
                    />
                </Col>
            </Row>

            <Row className="mt-4">
                <Col>
                    <Card className="shadow-sm border-0" style={{ borderRadius: 18 }}>
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="fw-bold mb-0">Upcoming Work Orders</h5>
                                <Button size="sm" onClick={() => nav("/service/work-orders")}>
                                    View All
                                </Button>
                            </div>

                            {upcomingWorkOrders.length === 0 ? (
                                <p className="text-muted">No upcoming work orders.</p>
                            ) : (
                                <Table responsive hover>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Customer</th>
                                            <th>Start</th>
                                            <th>Location</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {upcomingWorkOrders.map((w) => (
                                            <tr key={w.appointmentId}>
                                                <td>#{w.appointmentId}</td>
                                                <td>{w.customerName || "—"}</td>
                                                <td>
                                                    {w.scheduledStart
                                                        ? new Date(w.scheduledStart).toLocaleString()
                                                        : "—"}
                                                </td>
                                                <td>{w.addressText || w.locationType || "—"}</td>
                                                <td>
                                                    <Badge bg={getStatusBadge(w.status)}>
                                                        {w.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-3 mt-2">
                <Col md={6}>
                    <Card className="shadow-sm h-100" style={{ borderRadius: 18 }}>
                        <Card.Body>
                            <h5 className="fw-bold">Manage Work Orders</h5>
                            <p className="text-muted">
                                View and update your assigned work orders.
                            </p>
                            <Button className="w-100" onClick={() => nav("/service/work-orders")}>
                                Open
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="shadow-sm h-100" style={{ borderRadius: 18 }}>
                        <Card.Body>
                            <h5 className="fw-bold">Manage Tickets</h5>
                            <p className="text-muted">
                                Track and update support tickets.
                            </p>
                            <Button className="w-100" onClick={() => nav("/service/tickets")}>
                                Open
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}