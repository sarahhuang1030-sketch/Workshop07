import React, { useState, useEffect } from "react";
import { Container, Card, Table, Form, Button, Badge, Row, Col, Alert, Spinner } from "react-bootstrap";
import { apiFetch } from "../../services/api";

const REQUESTS_API = "/api/customer/service-requests";

export default function CustomerSupport({ darkMode = false }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        requestType: "Technical Support",
        priority: "Medium",
        description: ""
    });

    const requestTypes = ["Technical Support", "Billing Inquiry", "Installation Request", "Repair", "Other"];
    const priorities = ["Low", "Medium", "High"];

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const res = await apiFetch(REQUESTS_API);
            if (!res.ok) throw new Error("Failed to load requests");
            const data = await res.json();
            setRequests(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            setError("");
            const res = await apiFetch(REQUESTS_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error("Failed to submit request");

            setFormData({
                requestType: "Technical Support",
                priority: "Medium",
                description: ""
            });
            await loadRequests();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    function getStatusBadge(status) {
        const value = String(status || "").toLowerCase();
        if (value === "completed") return "success";
        if (value === "assigned" || value === "in progress") return "primary";
        if (value === "open") return "warning";
        return "secondary";
    }

    const cardBase = darkMode ? "bg-dark text-light border-secondary" : "bg-white text-dark shadow-sm";

    return (
        <Container className="py-4">
            <h2 className="fw-bold mb-4">Customer Support</h2>

            {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}

            <Row className="g-4">
                <Col lg={4}>
                    <Card className={cardBase} style={{ borderRadius: 18 }}>
                        <Card.Body className="p-4">
                            <h4 className="mb-3">Submit a Service Request</h4>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Request Type</Form.Label>
                                    <Form.Select name="requestType" value={formData.requestType} onChange={handleChange}>
                                        {requestTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </Form.Select>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Priority</Form.Label>
                                    <Form.Select name="priority" value={formData.priority} onChange={handleChange}>
                                        {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                                    </Form.Select>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        required
                                        placeholder="Please describe your issue..."
                                    />
                                </Form.Group>
                                <Button type="submit" variant="primary" className="w-100" disabled={submitting} style={{ borderRadius: 12 }}>
                                    {submitting ? "Submitting..." : "Submit Request"}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={8}>
                    <Card className={cardBase} style={{ borderRadius: 18 }}>
                        <Card.Body className="p-4">
                            <h4 className="mb-3">My Service Requests</h4>
                            {loading ? (
                                <div className="text-center py-4"><Spinner animation="border" /></div>
                            ) : requests.length > 0 ? (
                                <Table responsive hover className={`align-middle ${darkMode ? "table-dark" : ""}`}>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                            <th>Technician</th>
                                            <th>Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requests.map(req => (
                                            <tr key={req.requestId}>
                                                <td>#{req.requestId}</td>
                                                <td>{req.requestType}</td>
                                                <td>
                                                    <Badge bg={getStatusBadge(req.status)}>
                                                        {req.status}
                                                    </Badge>
                                                </td>
                                                <td>{req.technicianName || "TBD"}</td>
                                                <td>{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <div className="text-center py-4 text-muted">You have no service requests.</div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
