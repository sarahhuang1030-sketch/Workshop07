import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Table, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function getTicketStatusBadge(status) {
    switch (status) {
        case "OPEN":
            return "warning";
        case "IN_PROGRESS":
            return "primary";
        case "RESOLVED":
            return "success";
        default:
            return "light";
    }
}

function getPriorityBadge(priority) {
    switch (priority) {
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
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        type: "",
        priority: "",
    });

    const tickets = []; // later replace with API data

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
                    <Button variant="primary" disabled>
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
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="RESOLVED">Resolved</option>
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
                    {tickets.length === 0 ? (
                        <div className="p-5 text-center">
                            <h5 className="fw-bold mb-2">No assigned tickets yet</h5>
                            <p className="text-muted mb-0">
                                Tickets will appear here once technician assignments are added to the seed data.
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
                            {tickets.map((ticket) => (
                                <tr key={ticket.id}>
                                    <td>{ticket.id}</td>
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
                                    <td>{ticket.createdAt}</td>
                                    <td>
                                        <Button size="sm" variant="outline-primary">
                                            View
                                        </Button>
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