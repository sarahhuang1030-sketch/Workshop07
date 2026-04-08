import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Table, Badge, Modal, Spinner, Alert } from "react-bootstrap";
import { MessageSquare, Plus, Clock, CheckCircle } from "lucide-react";
import { apiFetch } from "../../services/api";

function getStatusBadge(status) {
    const s = String(status).toUpperCase();
    switch (s) {
        case "OPEN": return "warning";
        case "IN PROGRESS":
        case "IN_PROGRESS": return "primary";
        case "RESOLVED":
        case "COMPLETED": return "success";
        default: return "light";
    }
}

export default function CustomerSupport() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newRequest, setNewRequest] = useState({
        requestType: "Tech Support",
        priority: "Medium",
        description: ""
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await apiFetch("/api/customer/service-requests");
            if (!res.ok) throw new Error("Failed to fetch requests");
            const data = await res.json();
            setRequests(data);
        } catch (err) {
            console.error(err);
            setError("Could not load your support requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const res = await apiFetch("/api/customer/service-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newRequest),
            });
            if (res.ok) {
                setShowModal(false);
                setNewRequest({ requestType: "Tech Support", priority: "Medium", description: "" });
                fetchRequests();
            } else {
                throw new Error("Failed to submit request");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to submit your request. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1">Support & Help</h2>
                    <p className="text-muted mb-0">Need assistance? Create a ticket and track its progress.</p>
                </div>
                <Button variant="primary" onClick={() => setShowModal(true)} style={{ borderRadius: 12 }}>
                    <Plus size={18} className="me-2" /> New Request
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="g-4 mb-4">
                <Col md={4}>
                    <Card className="shadow-sm border-0 h-100" style={{ borderRadius: 18 }}>
                        <Card.Body className="p-4 d-flex align-items-center gap-3">
                            <div className="bg-primary bg-opacity-10 p-3 rounded-3 text-primary">
                                <Clock size={24} />
                            </div>
                            <div>
                                <div className="text-muted small">Open Tickets</div>
                                <div className="h4 fw-bold mb-0">
                                    {requests.filter(r => r.status === "Open" || r.status === "In Progress").length}
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="shadow-sm border-0 h-100" style={{ borderRadius: 18 }}>
                        <Card.Body className="p-4 d-flex align-items-center gap-3">
                            <div className="bg-success bg-opacity-10 p-3 rounded-3 text-success">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <div className="text-muted small">Resolved</div>
                                <div className="h4 fw-bold mb-0">
                                    {requests.filter(r => r.status === "Resolved" || r.status === "Completed").length}
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="shadow-sm border-0 h-100" style={{ borderRadius: 18 }}>
                        <Card.Body className="p-4 d-flex align-items-center gap-3">
                            <div className="bg-info bg-opacity-10 p-3 rounded-3 text-info">
                                <MessageSquare size={24} />
                            </div>
                            <div>
                                <div className="text-muted small">Total Requests</div>
                                <div className="h4 fw-bold mb-0">{requests.length}</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="shadow-sm border-0" style={{ borderRadius: 18 }}>
                <Card.Header className="bg-transparent border-0 pt-4 px-4">
                    <h5 className="fw-bold mb-0">Your Support History</h5>
                </Card.Header>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="p-5 text-center"><Spinner animation="border" /></div>
                    ) : requests.length === 0 ? (
                        <div className="p-5 text-center">
                            <MessageSquare size={48} className="text-muted mb-3" />
                            <h5 className="fw-bold">No requests found</h5>
                            <p className="text-muted">You haven't created any support requests yet.</p>
                        </div>
                    ) : (
                        <Table responsive hover className="mb-0 align-middle">
                            <thead className="bg-light">
                            <tr>
                                <th className="ps-4">ID</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Priority</th>
                                <th>Description</th>
                                <th className="pe-4">Submitted</th>
                            </tr>
                            </thead>
                            <tbody>
                            {requests.map((req) => (
                                <tr key={req.requestId}>
                                    <td className="ps-4">#{req.requestId}</td>
                                    <td>{req.requestType}</td>
                                    <td>
                                        <Badge bg={getStatusBadge(req.status)}>{req.status}</Badge>
                                    </td>
                                    <td>
                                        <span className={`fw-semibold text-${req.priority === "High" ? "danger" : req.priority === "Medium" ? "warning" : "success"}`}>
                                            {req.priority}
                                        </span>
                                    </td>
                                    <td className="text-truncate" style={{ maxWidth: 250 }}>{req.description}</td>
                                    <td className="pe-4 text-muted small">{new Date(req.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>New Support Request</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Request Type</Form.Label>
                            <Form.Select
                                value={newRequest.requestType}
                                onChange={(e) => setNewRequest({ ...newRequest, requestType: e.target.value })}
                            >
                                <option value="Tech Support">Tech Support</option>
                                <option value="Billing">Billing</option>
                                <option value="Installation">Installation</option>
                                <option value="Outage">Outage</option>
                                <option value="Other">Other</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Priority</Form.Label>
                            <Form.Select
                                value={newRequest.priority}
                                onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })}
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
                                required
                                placeholder="Please describe your issue in detail..."
                                value={newRequest.description}
                                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                            />
                        </Form.Group>
                        <div className="d-flex gap-2 justify-content-end">
                            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button variant="primary" type="submit" disabled={submitting}>
                                {submitting ? "Submitting..." : "Submit Request"}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
}
