import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Table, Badge, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";

function getWorkOrderBadge(status) {
    switch (status?.toUpperCase()) {
        case "ASSIGNED":
            return "secondary";
        case "SCHEDULED":
            return "info";
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
    const [filters, setFilters] = useState({
        search: "",
        status: "",
    });

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchWorkOrders();
    }, []);

    const fetchWorkOrders = async () => {
        setLoading(true);
        try {
            const resp = await apiFetch("/api/service/work-orders");
            if (resp.ok) {
                const data = await resp.json();
                setWorkOrders(data);
            }
        } catch (err) {
            console.error("Error fetching work orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        setUpdating(true);
        try {
            const resp = await apiFetch(`/api/service/work-orders/${selectedOrder.appointmentId}`, {
                method: "PUT",
                body: JSON.stringify({ status: newStatus })
            });
            if (resp.ok) {
                fetchWorkOrders();
                setShowModal(false);
            }
        } catch (err) {
            console.error("Error updating work order:", err);
        } finally {
            setUpdating(false);
        }
    };

    const filteredOrders = workOrders.filter(o => {
        const matchesSearch = o.appointmentId?.toString().includes(filters.search) ||
                              o.requestId?.toString().includes(filters.search);
        const matchesStatus = !filters.status || o.status === filters.status;
        return matchesSearch && matchesStatus;
    });

    return (
        <Container className="py-4">
            {/* Header */}
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
                    <Button variant="primary" onClick={fetchWorkOrders}>
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: 18 }}>
                <Card.Body className="p-4">
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Control
                                type="text"
                                placeholder="Search by work order ID or ticket ID"
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
                                <option value="ASSIGNED">Assigned</option>
                                <option value="SCHEDULED">Scheduled</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                            </Form.Select>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Table / Empty State */}
            <Card className="shadow-sm border-0" style={{ borderRadius: 18 }}>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="p-5 text-center">Loading work orders...</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="p-5 text-center">
                            <h5 className="fw-bold mb-2">No work orders found</h5>
                            <p className="text-muted mb-0">
                                Try adjusting your filters or refresh the list.
                            </p>
                        </div>
                    ) : (
                        <Table responsive hover className="mb-0 align-middle">
                            <thead>
                            <tr>
                                <th>Work Order ID</th>
                                <th>Ticket ID</th>
                                <th>Status</th>
                                <th>Scheduled Start</th>
                                <th>Location</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredOrders.map((order) => (
                                <tr key={order.appointmentId}>
                                    <td>#{order.appointmentId}</td>
                                    <td>#{order.requestId}</td>
                                    <td>
                                        <Badge bg={getWorkOrderBadge(order.status)}>
                                            {order.status}
                                        </Badge>
                                    </td>
                                    <td>{new Date(order.scheduledStart).toLocaleString()}</td>
                                    <td>{order.addressText || order.locationType}</td>
                                    <td>
                                        <Button
                                            size="sm"
                                            variant="outline-primary"
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setShowModal(true);
                                            }}
                                        >
                                            Manage
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {selectedOrder && (
                <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Manage Work Order #{selectedOrder.appointmentId}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p><strong>Ticket ID:</strong> #{selectedOrder.requestId}</p>
                        <p><strong>Scheduled:</strong> {new Date(selectedOrder.scheduledStart).toLocaleString()}</p>
                        <p><strong>Location:</strong> {selectedOrder.addressText}</p>
                        <p><strong>Notes:</strong> {selectedOrder.notes || "No notes provided."}</p>
                        <hr />
                        <Form.Label>Update Status</Form.Label>
                        <div className="d-flex gap-2 flex-wrap">
                            {["ASSIGNED", "SCHEDULED", "IN_PROGRESS", "COMPLETED"].map(s => (
                                <Button
                                    key={s}
                                    variant={selectedOrder.status === s ? "primary" : "outline-primary"}
                                    size="sm"
                                    onClick={() => handleUpdateStatus(s)}
                                    disabled={updating}
                                >
                                    {s}
                                </Button>
                            ))}
                        </div>
                    </Modal.Body>
                </Modal>
            )}
        </Container>
    );
}
