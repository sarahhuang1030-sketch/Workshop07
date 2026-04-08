import React, { useState, useEffect } from "react";
import { Container, Card, Table, Form, Button, Badge, Row, Col, Alert, Spinner, Modal } from "react-bootstrap";
import { apiFetch } from "../../services/api";

const REQUESTS_API = "/api/customer/service-requests";

export default function CustomerSupport({ darkMode = false }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [showDetails, setShowDetails] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const [formData, setFormData] = useState({
        requestType: "Technical Support",
        priority: "Medium",
        description: ""
    });

    const requestTypes = ["Technical Support", "Billing Inquiry", "Installation", "Repair", "Upgrade", "Other"];
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

    const openDetails = (req) => {
        setSelectedRequest(req);
        setShowDetails(true);
    };

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
                                            <th>Action</th>
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
                                                <td>
                                                    <Button size="sm" variant="outline-primary" onClick={() => openDetails(req)}>
                                                        Details
                                                    </Button>
                                                </td>
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

            <Modal show={showDetails} onHide={() => setShowDetails(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Request Details - #{selectedRequest?.requestId}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedRequest && (
                        <div>
                            <h5>Description</h5>
                            <p>{selectedRequest.description}</p>
                            <hr />
                            <h5>Appointments</h5>
                            {selectedRequest.appointments && selectedRequest.appointments.length > 0 ? (
                                <Table striped bordered hover size="sm">
                                    <thead>
                                        <tr>
                                            <th>Type</th>
                                            <th>Start</th>
                                            <th>End</th>
                                            <th>Status</th>
                                            <th>Technician</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedRequest.appointments.map(appt => (
                                            <tr key={appt.appointmentId}>
                                                <td>{appt.locationType}</td>
                                                <td>{new Date(appt.scheduledStart).toLocaleString()}</td>
                                                <td>{new Date(appt.scheduledEnd).toLocaleString()}</td>
                                                <td>{appt.status}</td>
                                                <td>{appt.technicianName || "TBD"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <p className="text-muted">No appointments scheduled for this request yet.</p>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetails(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
