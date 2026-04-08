import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Table, Badge, Modal, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";

function getWorkOrderBadge(status) {
    const s = String(status).toUpperCase();
    switch (s) {
        case "ASSIGNED":
        case "SCHEDULED":
            return "secondary";
        case "IN PROGRESS":
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
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: "",
        status: "",
    });

    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [newStatus, setNewStatus] = useState("");

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const res = await apiFetch("/api/service/appointments");
            if (!res.ok) throw new Error("Failed to fetch appointments");
            const data = await res.json();
            setAppointments(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleUpdateStatus = async () => {
        if (!selectedAppointment || !newStatus) return;
        try {
            const res = await apiFetch(`/api/service/appointments/${selectedAppointment.appointmentId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                setShowStatusModal(false);
                fetchAppointments();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const filteredAppointments = (appointments || []).filter(a => {
        if (!a) return false;
        const aid = a.appointmentId ? String(a.appointmentId) : "";
        const rid = a.requestId ? String(a.requestId) : "";
        const addr = a.addressText ? String(a.addressText).toLowerCase() : "";
        const search = filters.search.toLowerCase();

        const matchesSearch = aid.includes(search) || rid.includes(search) || addr.includes(search);
        const matchesStatus = !filters.status || a.status === filters.status;
        return matchesSearch && matchesStatus;
    });

    return (
        <Container className="py-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h2 className="fw-bold mb-1">Work Orders</h2>
                    <p className="text-muted mb-0">
                        View and manage your assigned service appointments.
                    </p>
                </div>

                <div className="d-flex gap-2">
                    <Button variant="outline-primary" onClick={() => navigate("/service")}>
                        Back to Dashboard
                    </Button>
                    <Button variant="primary" onClick={fetchAppointments}>
                        Refresh
                    </Button>
                </div>
            </div>

            <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: 18 }}>
                <Card.Body className="p-4">
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Control
                                type="text"
                                placeholder="Search by ID, ticket, or location"
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
                                <option value="Assigned">Assigned</option>
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
                        <div className="p-5 text-center"><Spinner animation="border" /></div>
                    ) : filteredAppointments.length === 0 ? (
                        <div className="p-5 text-center">
                            <h5 className="fw-bold mb-2">No work orders found</h5>
                            <p className="text-muted mb-0">
                                Your assigned appointments will appear here.
                            </p>
                        </div>
                    ) : (
                        <Table responsive hover className="mb-0 align-middle">
                            <thead>
                            <tr>
                                <th>Appointment ID</th>
                                <th>Ticket ID</th>
                                <th>Status</th>
                                <th>Scheduled</th>
                                <th>Location</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredAppointments.map((order) => (
                                <tr key={order.appointmentId || Math.random()}>
                                    <td>#{order.appointmentId || "N/A"}</td>
                                    <td>#{order.requestId || "N/A"}</td>
                                    <td>
                                        <Badge bg={getWorkOrderBadge(order.status)}>
                                            {order.status || "UNKNOWN"}
                                        </Badge>
                                    </td>
                                    <td>{order.scheduledStart ? new Date(order.scheduledStart).toLocaleString() : "—"}</td>
                                    <td className="small">{order.addressText || "—"}</td>
                                    <td>
                                        <Button
                                            size="sm"
                                            variant="outline-primary"
                                            onClick={() => {
                                                setSelectedAppointment(order);
                                                setNewStatus(order.status);
                                                setShowStatusModal(true);
                                            }}
                                        >
                                            Update Status
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Update Appointment #{selectedAppointment?.appointmentId}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Status</Form.Label>
                        <Form.Select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                        >
                            <option value="Assigned">Assigned</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowStatusModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleUpdateStatus}>Save Changes</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}