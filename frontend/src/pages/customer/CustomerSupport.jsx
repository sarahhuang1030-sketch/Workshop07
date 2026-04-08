import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Table, Badge, Alert } from "react-bootstrap";
import { apiFetch } from "../../services/api";

function getStatusBadge(status) {
    switch (status) {
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

export default function CustomerSupport() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const [newTicket, setNewTicket] = useState({
        requestType: "TECH_SUPPORT",
        priority: "Medium",
        description: ""
    });

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const resp = await apiFetch("/api/customer/service-requests");
            if (resp.ok) {
                const data = await resp.json();
                setTickets(data);
            } else {
                setError("Failed to fetch tickets.");
            }
        } catch (err) {
            setError("Error connecting to server.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        setSuccessMsg("");

        try {
            const resp = await apiFetch("/api/customer/service-requests", {
                method: "POST",
                body: JSON.stringify(newTicket)
            });

            if (resp.ok) {
                setSuccessMsg("Ticket created successfully!");
                setNewTicket({ ...newTicket, description: "" });
                fetchTickets();
            } else {
                setError("Failed to create ticket.");
            }
        } catch (err) {
            setError("Error connecting to server.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container className="py-4">
            <h2 className="fw-bold mb-4">Support</h2>

            <Row className="g-4">
                <Col lg={4}>
                    <Card className="shadow-sm border-0" style={{ borderRadius: 18 }}>
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-3">Create a Ticket</h5>
                            {error && <Alert variant="danger">{error}</Alert>}
                            {successMsg && <Alert variant="success">{successMsg}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Request Type</Form.Label>
                                    <Form.Select
                                        value={newTicket.requestType}
                                        onChange={(e) => setNewTicket({ ...newTicket, requestType: e.target.value })}
                                    >
                                        <option value="TECH_SUPPORT">Technical Support</option>
                                        <option value="BILLING">Billing Inquiry</option>
                                        <option value="INSTALLATION">Installation Request</option>
                                        <option value="OUTAGE">Report an Outage</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Priority</Form.Label>
                                    <Form.Select
                                        value={newTicket.priority}
                                        onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        placeholder="Describe your issue..."
                                        value={newTicket.description}
                                        onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                        required
                                    />
                                </Form.Group>

                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="w-100"
                                    disabled={submitting}
                                    style={{ borderRadius: 12 }}
                                >
                                    {submitting ? "Submitting..." : "Submit Ticket"}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={8}>
                    <Card className="shadow-sm border-0" style={{ borderRadius: 18 }}>
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-3">Your Tickets</h5>
                            {loading ? (
                                <p>Loading tickets...</p>
                            ) : tickets.length === 0 ? (
                                <p className="text-muted">You have no support tickets.</p>
                            ) : (
                                <Table responsive hover className="align-middle">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                            <th>Priority</th>
                                            <th>Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tickets.map(t => (
                                            <tr key={t.requestId}>
                                                <td>#{t.requestId}</td>
                                                <td>{t.requestType}</td>
                                                <td>
                                                    <Badge bg={getStatusBadge(t.status)}>
                                                        {t.status}
                                                    </Badge>
                                                </td>
                                                <td>{t.priority}</td>
                                                <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
