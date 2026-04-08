import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Table, Badge, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";

function getWorkOrderBadge(status) {
    const s = String(status || "").toUpperCase();
    switch (s) {
        case "SCHEDULED":
        case "ASSIGNED":
            return "secondary";
        case "IN_PROGRESS":
            return "primary";
        case "COMPLETED":
            return "success";
        default:
            return "light";
    }
}

export default function ServiceWorkOrders() {
    const navigate = useNavigate();
    const [workOrders, setWorkOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filters, setFilters] = useState({
        search: "",
        status: "",
    });

    useEffect(() => {
        loadWorkOrders();
    }, []);

    const loadWorkOrders = async () => {
        try {
            setLoading(true);
            const res = await apiFetch("/api/service/work-orders");
            if (!res.ok) throw new Error("Failed to load work orders");
            const data = await res.json();
            setWorkOrders(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (appointmentId, newStatus) => {
        try {
            const res = await apiFetch(`/api/service/work-orders/${appointmentId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newStatus)
            });
            if (!res.ok) throw new Error("Failed to update status");
            await loadWorkOrders();
        } catch (err) {
            alert(err.message);
        }
    };

    const filteredWorkOrders = workOrders.filter(w => {
        const matchesSearch = !filters.search ||
            w.customerName?.toLowerCase().includes(filters.search.toLowerCase()) ||
            w.appointmentId?.toString().includes(filters.search) ||
            w.requestId?.toString().includes(filters.search);
        const matchesStatus = !filters.status || w.status === filters.status;
        return matchesSearch && matchesStatus;
    });

    return (
        <Container className="py-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h2 className="fw-bold mb-1">Work Orders</h2>
                    <p className="text-muted mb-0">
                        View and manage your assigned work orders.
                    </p>
                </div>

                <div className="d-flex gap-2">
                    <Button variant="outline-primary" onClick={() => navigate("/service")}>
                        Back to Dashboard
                    </Button>
                    <Button variant="primary" onClick={loadWorkOrders}>
                        Refresh
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: 18 }}>
                <Card.Body className="p-4">
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Control
                                type="text"
                                placeholder="Search by work order ID, ticket, or customer"
                                value={filters.search}
                                onChange={(e) =>
                                    setFilters({ ...filters, search: e.target.value })
                                }
                            />
                        </Col>

                        <Col md={6}>
                            <Form.Select
                                value={filters.status}
                                onChange={(e) =>
                                    setFilters({ ...filters, status: e.target.value })
                                }
                            >
                                <option value="">All Statuses</option>
                                <option value="Scheduled">Scheduled</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </Form.Select>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="shadow-sm border-0" style={{ borderRadius: 18 }}>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" /></div>
                    ) : filteredWorkOrders.length === 0 ? (
                        <div className="p-5 text-center">
                            <h5 className="fw-bold mb-2">No work orders assigned yet</h5>
                            <p className="text-muted mb-0">
                                Work orders will appear here once they are assigned to you by a manager.
                            </p>
                        </div>
                    ) : (
                        <Table responsive hover className="mb-0 align-middle">
                            <thead>
                            <tr>
                                <th>Work Order ID</th>
                                <th>Ticket ID</th>
                                <th>Customer</th>
                                <th>Status</th>
                                <th>Scheduled Start</th>
                                <th>Location</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredWorkOrders.map((order) => (
                                <tr key={order.appointmentId}>
                                    <td>#{order.appointmentId}</td>
                                    <td>#{order.requestId}</td>
                                    <td>{order.customerName}</td>
                                    <td>
                                        <Badge bg={getWorkOrderBadge(order.status)}>
                                            {order.status}
                                        </Badge>
                                    </td>
                                    <td>{new Date(order.scheduledStart).toLocaleString()}</td>
                                    <td>{order.addressText || order.locationType}</td>
                                    <td>
                                        <Form.Select
                                            size="sm"
                                            value={order.status}
                                            onChange={(e) => handleStatusUpdate(order.appointmentId, e.target.value)}
                                            style={{ width: "130px" }}
                                        >
                                            <option value="Scheduled">Scheduled</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                        </Form.Select>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
}
