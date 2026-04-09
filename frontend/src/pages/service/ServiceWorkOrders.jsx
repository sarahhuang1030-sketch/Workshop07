import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Table, Badge, Spinner, Alert, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";

// FIXED STATUS COLORS
function getWorkOrderBadge(status) {
    const s = String(status || "").toLowerCase();

    if (s === "open") return "warning";
    if (s === "assigned") return "secondary";
    if (s === "in progress") return "primary";
    if (s === "completed") return "success";
    if (s === "cancelled") return "danger";

    return "light";
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

    const [showDetails, setShowDetails] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

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

            if (selectedOrder && selectedOrder.appointmentId === appointmentId) {
                setSelectedOrder(prev => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            alert(err.message);
        }
    };

    // 🔥 FIXED FILTER LOGIC
    const filteredWorkOrders = workOrders.filter(w => {
        const matchesSearch =
            !filters.search ||
            w.customerName?.toLowerCase().includes(filters.search.toLowerCase()) ||
            w.appointmentId?.toString().includes(filters.search) ||
            w.requestId?.toString().includes(filters.search);

        const matchesStatus =
            !filters.status ||
            String(w.status).toLowerCase() === filters.status.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    const openDetails = (order) => {
        setSelectedOrder(order);
        setShowDetails(true);
    };

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

            {/* FILTERS */}
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
                                <option value="Open">Open</option>
                                <option value="Assigned">Assigned</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </Form.Select>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* TABLE */}
            <Card className="shadow-sm border-0" style={{ borderRadius: 18 }}>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" /></div>
                    ) : filteredWorkOrders.length === 0 ? (
                        <div className="p-5 text-center">
                            <h5 className="fw-bold mb-2">No work orders assigned yet</h5>
                            <p className="text-muted mb-0">
                                Work orders will appear here once they are assigned to you.
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
                                        <div className="d-flex gap-2">
                                            <Button size="sm" variant="outline-primary" onClick={() => openDetails(order)}>
                                                Details
                                            </Button>

                                            {/* FIXED DROPDOWN */}
                                            <Form.Select
                                                size="sm"
                                                value={order.status}
                                                onChange={(e) =>
                                                    handleStatusUpdate(order.appointmentId, e.target.value)
                                                }
                                                style={{ width: "150px" }}
                                            >
                                                <option value="Assigned">Assigned</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </Form.Select>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* DETAILS MODAL */}
            <Modal show={showDetails} onHide={() => setShowDetails(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Work Order Details - #{selectedOrder?.appointmentId}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedOrder && (
                        <Row className="g-3">
                            <Col md={6}><strong>Ticket ID:</strong> #{selectedOrder.requestId}</Col>
                            <Col md={6}><strong>Customer:</strong> {selectedOrder.customerName}</Col>

                            <Col md={6}>
                                <strong>Status:</strong>{" "}
                                <Badge bg={getWorkOrderBadge(selectedOrder.status)}>
                                    {selectedOrder.status}
                                </Badge>
                            </Col>

                            <Col md={6}><strong>Location Type:</strong> {selectedOrder.locationType}</Col>
                            <Col md={6}><strong>Scheduled Start:</strong> {new Date(selectedOrder.scheduledStart).toLocaleString()}</Col>
                            <Col md={6}><strong>Scheduled End:</strong> {new Date(selectedOrder.scheduledEnd).toLocaleString()}</Col>

                            <Col md={12}><strong>Address:</strong> {selectedOrder.addressText || "N/A"}</Col>

                            <Col md={12}>
                                <strong>Notes:</strong>
                                <p className="mt-1 p-2 bg-light border rounded">
                                    {selectedOrder.notes || "No notes available."}
                                </p>
                            </Col>

                            {/*  FIXED MODAL DROPDOWN */}
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label><strong>Update Status:</strong></Form.Label>
                                    <Form.Select
                                        value={selectedOrder.status}
                                        onChange={(e) =>
                                            handleStatusUpdate(selectedOrder.appointmentId, e.target.value)
                                        }
                                    >
                                        <option value="Assigned">Assigned</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetails(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}