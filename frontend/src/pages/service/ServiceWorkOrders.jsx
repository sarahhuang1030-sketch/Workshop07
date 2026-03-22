import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Table, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function getWorkOrderBadge(status) {
    switch (status) {
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

    const [filters, setFilters] = useState({
        search: "",
        status: "",
    });

    const workOrders = []; // later replace with API data

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
                    <Button variant="primary" disabled>
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
                                placeholder="Search by work order ID or ticket"
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
                    {workOrders.length === 0 ? (
                        <div className="p-5 text-center">
                            <h5 className="fw-bold mb-2">No work orders assigned yet</h5>
                            <p className="text-muted mb-0">
                                Work orders will appear here once technician assignments are added to the seed data.
                            </p>
                        </div>
                    ) : (
                        <Table responsive hover className="mb-0 align-middle">
                            <thead>
                            <tr>
                                <th>Work Order ID</th>
                                <th>Ticket ID</th>
                                <th>Status</th>
                                <th>Scheduled Date</th>
                                <th>Location</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {workOrders.map((order) => (
                                <tr key={order.id}>
                                    <td>{order.id}</td>
                                    <td>{order.ticketId}</td>
                                    <td>
                                        <Badge bg={getWorkOrderBadge(order.status)}>
                                            {order.status}
                                        </Badge>
                                    </td>
                                    <td>{order.scheduledDate}</td>
                                    <td>{order.location}</td>
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