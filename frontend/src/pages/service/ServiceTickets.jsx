import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Table, Badge, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";

function getTicketStatusBadge(status) {
    switch (status?.toUpperCase()) {
        case "OPEN":
            return "warning";
        case "ASSIGNED":
            return "info";
        case "IN_PROGRESS":
            return "primary";
        case "RESOLVED":
            return "success";
        case "COMPLETED":
            return "secondary";
        default:
            return "light";
    }
}

function getPriorityBadge(priority) {
    switch (priority?.toUpperCase()) {
        case "HIGH":
            return "danger";
        case "MEDIUM":
            return "warning";
        case "LOW":
            return "success";
        default:
            return "light";
    }
}

export default function ServiceTickets() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        type: "",
        priority: "",
    });

    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const resp = await apiFetch("/api/service/tickets");
            if (resp.ok) {
                const data = await resp.json();
                setTickets(data);
            }
        } catch (err) {
            console.error("Error fetching tickets:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        setUpdating(true);
        try {
            const resp = await apiFetch(`/api/service/tickets/${selectedTicket.requestId}`, {
                method: "PUT",
                body: JSON.stringify({ status: newStatus })
            });
            if (resp.ok) {
                fetchTickets();
                setShowModal(false);
            }
        } catch (err) {
            console.error("Error updating ticket:", err);
        } finally {
            setUpdating(false);
        }
    };

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.customerName?.toLowerCase().includes(filters.search.toLowerCase()) ||
                              t.requestId?.toString().includes(filters.search);
        const matchesStatus = !filters.status || t.status === filters.status;
        const matchesType = !filters.type || t.requestType === filters.type;
        const matchesPriority = !filters.priority || t.priority?.toUpperCase() === filters.priority.toUpperCase();
        return matchesSearch && matchesStatus && matchesType && matchesPriority;
    });

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
                    <Button variant="primary" onClick={fetchTickets}>
                        Refresh
                    </Button>
                </div>
            </div>

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
                                <option value="OPEN">Open</option>
                                <option value="ASSIGNED">Assigned</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="RESOLVED">Resolved</option>
                                <option value="COMPLETED">Completed</option>
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
                                <option value="INSTALLATION">Installation</option>
                                <option value="OUTAGE">Outage</option>
                                <option value="BILLING">Billing</option>
                                <option value="TECH_SUPPORT">Tech Support</option>
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
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </Form.Select>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="shadow-sm border-0" style={{ borderRadius: 18 }}>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="p-5 text-center">Loading tickets...</div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="p-5 text-center">
                            <h5 className="fw-bold mb-2">No assigned tickets found</h5>
                            <p className="text-muted mb-0">
                                Try adjusting your filters or refresh the list.
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
                                    <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <Button
                                            size="sm"
                                            variant="outline-primary"
                                            onClick={() => {
                                                setSelectedTicket(ticket);
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

            {selectedTicket && (
                <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Manage Ticket #{selectedTicket.requestId}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p><strong>Customer:</strong> {selectedTicket.customerName}</p>
                        <p><strong>Type:</strong> {selectedTicket.requestType}</p>
                        <p><strong>Description:</strong> {selectedTicket.description}</p>
                        <hr />
                        <Form.Label>Update Status</Form.Label>
                        <div className="d-flex gap-2 flex-wrap">
                            {["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "COMPLETED"].map(s => (
                                <Button
                                    key={s}
                                    variant={selectedTicket.status === s ? "primary" : "outline-primary"}
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
