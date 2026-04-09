import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Table, Badge, Spinner, Alert, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";

function getTicketStatusBadge(status) {
    const s = String(status || "").toLowerCase();

    if (s === "open") return "warning";
    if (s === "assigned") return "primary";
    if (s === "in progress") return "info";
    if (s === "completed") return "success";
    if (s === "cancelled") return "danger";

    return "secondary";
}

function getPriorityBadge(priority) {
    const p = String(priority || "").toLowerCase();

    if (p === "high") return "danger";
    if (p === "medium") return "warning";
    if (p === "low") return "success";

    return "secondary";
}

export default function ServiceTickets() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        type: "",
        priority: "",
    });

    const [showDetails, setShowDetails] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await apiFetch("/api/service/tickets");
            if (!res.ok) throw new Error("Failed to load tickets");
            const data = await res.json();
            setTickets(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (requestId, newStatus) => {
        try {
            const res = await apiFetch(`/api/service/tickets/${requestId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newStatus)
            });

            if (!res.ok) throw new Error("Failed to update status");

            await loadTickets();

            if (selectedTicket && selectedTicket.requestId === requestId) {
                setSelectedTicket((prev) => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const filteredTickets = tickets.filter(t => {
        const matchesSearch =
            !filters.search ||
            t.customerName?.toLowerCase().includes(filters.search.toLowerCase()) ||
            t.requestId?.toString().includes(filters.search);

        const matchesStatus =
            !filters.status ||
            String(t.status || "").toLowerCase() === filters.status.toLowerCase();

        const matchesType =
            !filters.type ||
            String(t.requestType || "").toLowerCase() === filters.type.toLowerCase();

        const matchesPriority =
            !filters.priority ||
            String(t.priority || "").toLowerCase() === filters.priority.toLowerCase();

        return matchesSearch && matchesStatus && matchesType && matchesPriority;
    });

    const openDetails = (ticket) => {
        setSelectedTicket(ticket);
        setShowDetails(true);
    };

    return (
        <Container className="py-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h2 className="fw-bold mb-1">Assigned Tickets</h2>
                    <p className="text-muted mb-0">
                        View and manage tickets assigned to you.
                    </p>
                </div>

                <div className="d-flex gap-2">
                    <Button variant="outline-primary" onClick={() => navigate("/service")}>
                        Back to Dashboard
                    </Button>
                    <Button variant="primary" onClick={loadTickets}>
                        Refresh
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: 18 }}>
                <Card.Body className="p-4">
                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Control
                                type="text"
                                placeholder="Search by ticket ID or customer"
                                value={filters.search}
                                onChange={(e) =>
                                    setFilters({ ...filters, search: e.target.value })
                                }
                            />
                        </Col>

                        <Col md={3}>
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

                        <Col md={3}>
                            <Form.Select
                                value={filters.type}
                                onChange={(e) =>
                                    setFilters({ ...filters, type: e.target.value })
                                }
                            >
                                <option value="">All Request Types</option>
                                <option value="Technical Support">Technical Support</option>
                                <option value="Billing Inquiry">Billing Inquiry</option>
                                <option value="Installation">Installation</option>
                                <option value="Repair">Repair</option>
                                <option value="Upgrade">Upgrade</option>
                                <option value="Other">Other</option>
                            </Form.Select>
                        </Col>

                        <Col md={2}>
                            <Form.Select
                                value={filters.priority}
                                onChange={(e) =>
                                    setFilters({ ...filters, priority: e.target.value })
                                }
                            >
                                <option value="">Priority</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </Form.Select>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="shadow-sm border-0" style={{ borderRadius: 18 }}>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" /></div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="p-5 text-center">
                            <h5 className="fw-bold mb-2">No assigned tickets found</h5>
                            <p className="text-muted mb-0">
                                Tickets will appear here once they are assigned to you by a manager.
                            </p>
                        </div>
                    ) : (
                        <Table responsive hover className="mb-0 align-middle">
                            <thead>
                            <tr>
                                <th>Ticket ID</th>
                                <th>Customer</th>
                                <th>Request Type</th>
                                <th>Status</th>
                                <th>Priority</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredTickets.map((ticket) => (
                                <tr key={ticket.requestId}>
                                    <td>#{ticket.requestId}</td>
                                    <td>{ticket.customerName}</td>
                                    <td>{ticket.requestType}</td>
                                    <td>
                                        <Badge bg={getTicketStatusBadge(ticket.status)}>
                                            {ticket.status}
                                        </Badge>
                                    </td>
                                    <td>
                                        <Badge bg={getPriorityBadge(ticket.priority)}>
                                            {ticket.priority}
                                        </Badge>
                                    </td>
                                    <td>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "—"}</td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline-primary"
                                                onClick={() => openDetails(ticket)}
                                            >
                                                Details
                                            </Button>

                                            <Form.Select
                                                size="sm"
                                                value={ticket.status}
                                                onChange={(e) => handleStatusUpdate(ticket.requestId, e.target.value)}
                                                style={{ width: "140px" }}
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

            <Modal show={showDetails} onHide={() => setShowDetails(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Ticket Details - #{selectedTicket?.requestId}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedTicket && (
                        <div>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <strong>Customer:</strong> {selectedTicket.customerName}
                                </Col>
                                <Col md={6}>
                                    <strong>Request Type:</strong> {selectedTicket.requestType}
                                </Col>
                                <Col md={6}>
                                    <strong>Status:</strong>{" "}
                                    <Badge bg={getTicketStatusBadge(selectedTicket.status)}>
                                        {selectedTicket.status}
                                    </Badge>
                                </Col>
                                <Col md={6}>
                                    <strong>Priority:</strong>{" "}
                                    <Badge bg={getPriorityBadge(selectedTicket.priority)}>
                                        {selectedTicket.priority}
                                    </Badge>
                                </Col>
                            </Row>

                            <h5>Description</h5>
                            <p className="p-3 bg-light border rounded">
                                {selectedTicket.description || "No description provided."}
                            </p>

                            <hr />

                            <h5>Associated Appointments</h5>
                            {selectedTicket.appointments && selectedTicket.appointments.length > 0 ? (
                                <Table responsive bordered hover size="sm">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Location Type</th>
                                            <th>Start</th>
                                            <th>End</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedTicket.appointments.map((appt) => (
                                            <tr key={appt.appointmentId}>
                                                <td>#{appt.appointmentId}</td>
                                                <td>{appt.locationType || "—"}</td>
                                                <td>{appt.scheduledStart ? new Date(appt.scheduledStart).toLocaleString() : "—"}</td>
                                                <td>{appt.scheduledEnd ? new Date(appt.scheduledEnd).toLocaleString() : "—"}</td>
                                                <td>
                                                    <Badge bg={getTicketStatusBadge(appt.status)}>
                                                        {appt.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <p className="text-muted">No appointments found for this ticket.</p>
                            )}

                            <div className="mt-3">
                                <Form.Group>
                                    <Form.Label><strong>Update Status:</strong></Form.Label>
                                    <Form.Select
                                        value={selectedTicket.status}
                                        onChange={(e) => handleStatusUpdate(selectedTicket.requestId, e.target.value)}
                                    >
                                        <option value="Assigned">Assigned</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </Form.Select>
                                </Form.Group>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetails(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}