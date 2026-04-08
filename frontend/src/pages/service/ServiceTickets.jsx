import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Table, Badge, Modal, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";

function getTicketStatusBadge(status) {
    switch (status?.toUpperCase()) {
        case "OPEN": return "warning";
        case "ASSIGNED": return "info";
        case "IN_PROGRESS": return "primary";
        case "RESOLVED": return "success";
        case "COMPLETED": return "secondary";
        default: return "light";
    }
}

function getPriorityBadge(priority) {
    switch (priority?.toUpperCase()) {
        case "HIGH": return "danger";
        case "MEDIUM": return "warning";
        case "LOW": return "success";
        default: return "light";
    }
}

export default function ServiceTickets() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ search: "", status: "", type: "", priority: "" });

    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showManageModal, setShowManageModal] = useState(false);
    const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
    const [updating, setUpdating] = useState(false);

    const [workOrderData, setWorkOrderData] = useState({
        locationId: "",
        locationType: "OnSite",
        scheduledStart: "",
        scheduledEnd: "",
        notes: ""
    });

    const [me, setMe] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [tResp, lResp, mResp] = await Promise.all([
                apiFetch("/api/service/tickets"),
                apiFetch("/api/locations"),
                apiFetch("/api/customers/me/profile") // Just to get my ID, though we might need a better endpoint for employees
            ]);

            if (tResp.ok) setTickets(await tResp.json());
            if (lResp.ok) setLocations(await lResp.json());

            // For now, let's assume we can get the user info from localStorage or another way if needed
            const userStr = localStorage.getItem("user");
            if (userStr) setMe(JSON.parse(userStr));

        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleClaimTicket = async (ticketId) => {
        setUpdating(true);
        try {
            const resp = await apiFetch(`/api/service/tickets/${ticketId}`, {
                method: "PUT",
                body: JSON.stringify({
                    status: "ASSIGNED",
                    assignedTechnicianUserId: me?.userId
                })
            });
            if (resp.ok) {
                await fetchInitialData();
                setShowManageModal(false);
            }
        } catch (err) {
            console.error("Error claiming ticket:", err);
        } finally {
            setUpdating(false);
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
                await fetchInitialData();
                setShowManageModal(false);
            }
        } catch (err) {
            console.error("Error updating ticket:", err);
        } finally {
            setUpdating(false);
        }
    };

    const handleCreateWorkOrder = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const resp = await apiFetch("/api/service/work-orders", {
                method: "POST",
                body: JSON.stringify({
                    ...workOrderData,
                    requestId: selectedTicket.requestId,
                    addressId: selectedTicket.addressId
                })
            });
            if (resp.ok) {
                setShowWorkOrderModal(false);
                alert("Work order created successfully!");
            }
        } catch (err) {
            console.error("Error creating work order:", err);
        } finally {
            setUpdating(false);
        }
    };

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.customerName?.toLowerCase().includes(filters.search.toLowerCase()) ||
                              t.requestId?.toString().includes(filters.search);
        const matchesStatus = !filters.status || t.status?.toUpperCase() === filters.status?.toUpperCase();
        const matchesType = !filters.type || t.requestType?.toUpperCase() === filters.type?.toUpperCase();
        const matchesPriority = !filters.priority || t.priority?.toUpperCase() === filters.priority.toUpperCase();
        return matchesSearch && matchesStatus && matchesType && matchesPriority;
    });

    const yourTickets = filteredTickets.filter(t => t.assignedTechnicianUserId === me?.userId);
    const unassignedTickets = filteredTickets.filter(t => !t.assignedTechnicianUserId);

    return (
        <Container className="py-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h2 className="fw-bold mb-1">Service Tickets</h2>
                    <p className="text-muted mb-0">Manage assigned and unassigned support requests.</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-primary" onClick={() => navigate("/service")}>Back</Button>
                    <Button variant="primary" onClick={fetchInitialData}>Refresh</Button>
                </div>
            </div>

            <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: 18 }}>
                <Card.Body className="p-4">
                    <Row className="g-3">
                        <Col md={4}><Form.Control placeholder="Search..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} /></Col>
                        <Col md={2}>
                            <Form.Select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                                <option value="">All Statuses</option>
                                <option value="OPEN">Open</option>
                                <option value="ASSIGNED">Assigned</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="RESOLVED">Resolved</option>
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
                                <option value="">All Types</option>
                                <option value="INSTALLATION">Installation</option>
                                <option value="OUTAGE">Outage</option>
                                <option value="BILLING">Billing</option>
                                <option value="TECH_SUPPORT">Tech Support</option>
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Select value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}>
                                <option value="">All Priorities</option>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </Form.Select>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Row className="g-4">
                <Col lg={12}>
                    <Card className="shadow-sm border-0" style={{ borderRadius: 18 }}>
                        <Card.Header className="bg-white border-0 pt-4 px-4">
                            <h5 className="fw-bold mb-0">Your Assigned Tickets</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {loading ? <div className="p-4 text-center">Loading...</div> : yourTickets.length === 0 ? (
                                <div className="p-5 text-center text-muted">No tickets assigned to you.</div>
                            ) : (
                                <Table responsive hover className="mb-0 align-middle">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Customer</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                            <th>Priority</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {yourTickets.map(t => (
                                            <tr key={t.requestId}>
                                                <td>#{t.requestId}</td>
                                                <td>{t.customerName}</td>
                                                <td>{t.requestType}</td>
                                                <td><Badge bg={getTicketStatusBadge(t.status)}>{t.status}</Badge></td>
                                                <td><Badge bg={getPriorityBadge(t.priority)}>{t.priority}</Badge></td>
                                                <td>
                                                    <Button size="sm" variant="outline-primary" onClick={() => { setSelectedTicket(t); setShowManageModal(true); }}>Manage</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={12}>
                    <Card className="shadow-sm border-0" style={{ borderRadius: 18 }}>
                        <Card.Header className="bg-white border-0 pt-4 px-4">
                            <h5 className="fw-bold mb-0">Available Unassigned Tickets</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {loading ? <div className="p-4 text-center">Loading...</div> : unassignedTickets.length === 0 ? (
                                <div className="p-5 text-center text-muted">No unassigned tickets available.</div>
                            ) : (
                                <Table responsive hover className="mb-0 align-middle">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Customer</th>
                                            <th>Type</th>
                                            <th>Priority</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {unassignedTickets.map(t => (
                                            <tr key={t.requestId}>
                                                <td>#{t.requestId}</td>
                                                <td>{t.customerName}</td>
                                                <td>{t.requestType}</td>
                                                <td><Badge bg={getPriorityBadge(t.priority)}>{t.priority}</Badge></td>
                                                <td>
                                                    <Button size="sm" variant="success" onClick={() => handleClaimTicket(t.requestId)} disabled={updating}>Claim Ticket</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Manage Ticket Modal */}
            <Modal show={showManageModal} onHide={() => setShowManageModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>Manage Ticket #{selectedTicket?.requestId}</Modal.Title></Modal.Header>
                <Modal.Body>
                    <p><strong>Customer:</strong> {selectedTicket?.customerName}</p>
                    <p><strong>Description:</strong> {selectedTicket?.description}</p>
                    <hr />
                    <h6>Update Status</h6>
                    <div className="d-flex gap-2 mb-3">
                        {["IN_PROGRESS", "RESOLVED", "COMPLETED"].map(s => (
                            <Button key={s} size="sm" variant={selectedTicket?.status === s ? "primary" : "outline-primary"} onClick={() => handleUpdateStatus(s)} disabled={updating}>{s}</Button>
                        ))}
                    </div>
                    <Button variant="info" className="w-100" onClick={() => { setShowManageModal(false); setShowWorkOrderModal(true); }}>Create Work Order</Button>
                </Modal.Body>
            </Modal>

            {/* Create Work Order Modal */}
            <Modal show={showWorkOrderModal} onHide={() => setShowWorkOrderModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>Create Work Order for #{selectedTicket?.requestId}</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleCreateWorkOrder}>
                        <Form.Group className="mb-3">
                            <Form.Label>Service Location</Form.Label>
                            <Form.Select value={workOrderData.locationId} onChange={e => setWorkOrderData({ ...workOrderData, locationId: e.target.value })} required>
                                <option value="">Select Location</option>
                                {locations.map(l => <option key={l.locationId} value={l.locationId}>{l.locationName} ({l.city})</option>)}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Start Time</Form.Label>
                            <Form.Control type="datetime-local" value={workOrderData.scheduledStart} onChange={e => setWorkOrderData({ ...workOrderData, scheduledStart: e.target.value })} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>End Time</Form.Label>
                            <Form.Control type="datetime-local" value={workOrderData.scheduledEnd} onChange={e => setWorkOrderData({ ...workOrderData, scheduledEnd: e.target.value })} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Notes</Form.Label>
                            <Form.Control as="textarea" rows={3} value={workOrderData.notes} onChange={e => setWorkOrderData({ ...workOrderData, notes: e.target.value })} />
                        </Form.Group>
                        <Button type="submit" variant="primary" className="w-100" disabled={updating}>Create Work Order</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
}
