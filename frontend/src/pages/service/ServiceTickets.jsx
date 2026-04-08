import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Table, Badge, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";

function getTicketStatusBadge(status) {
    const s = String(status || "").toUpperCase();
    switch (s) {
        case "OPEN":
            return "warning";
        case "ASSIGNED":
        case "IN_PROGRESS":
            return "primary";
        case "COMPLETED":
        case "RESOLVED":
            return "success";
        default:
            return "secondary";
    }
}

function getPriorityBadge(priority) {
    const p = String(priority || "").toUpperCase();
    switch (p) {
        case "HIGH":
            return "danger";
        case "MEDIUM":
            return "warning";
        case "LOW":
            return "success";
        default:
            return "secondary";
    }
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

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            setLoading(true);
            const res = await apiFetch("/api/service/tickets");
            if (!res.ok) throw new Error("Failed to load tickets");
            const data = await res.json();
            setTickets(data);
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
        } catch (err) {
            alert(err.message);
        }
    };

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = !filters.search ||
            t.customerName?.toLowerCase().includes(filters.search.toLowerCase()) ||
            t.requestId?.toString().includes(filters.search);
        const matchesStatus = !filters.status || t.status === filters.status;
        const matchesType = !filters.type || t.requestType === filters.type;
        const matchesPriority = !filters.priority || t.priority === filters.priority;
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
                                <option value="Repair">Repair</option>
                                <option value="Installation Request">Installation</option>
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
                                    <td>{new Date(ticket.createdAt).toLocaleString()}</td>
                                    <td>
                                        <Form.Select
                                            size="sm"
                                            value={ticket.status}
                                            onChange={(e) => handleStatusUpdate(ticket.requestId, e.target.value)}
                                            style={{ width: "130px" }}
                                        >
                                            <option value="Assigned">Assigned</option>
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
