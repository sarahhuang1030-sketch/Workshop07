import React, { useEffect, useState } from "react";
import { Container, Card, Table, Form, Button, Spinner, Modal, Row, Col, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";

// Empty draft template for new customer
const emptyDraft = {
    firstName: "",
    lastName: "",
    email: "",
    homePhone: "",
    street1: "",
    street2: "",
    city: "",
    province: "",
    postalCode: "",
    country: "",
    customerType: "",
};

export default function SalesCustomers() {
    const navigate = useNavigate();

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [draft, setDraft] = useState(emptyDraft);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Load all customers on mount
    useEffect(() => {
        loadCustomers();
    }, []);

    // Fetch customers from API
    const loadCustomers = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await apiFetch("/api/customers/all");
            if (!res.ok) throw new Error(`Failed to load customers: ${res.status}`);
            const data = await res.json();
            setCustomers(
                data.map(c => ({
                    customerId: c.customerId ?? c.CustomerId,
                    firstName: c.firstName ?? c.FirstName,
                    lastName: c.lastName ?? c.LastName,
                    email: c.email ?? c.Email,
                    homePhone: c.homePhone ?? c.HomePhone,
                    customerType: c.customerType ?? "",
                }))
            );
        } catch (e) {
            console.error(e);
            setError("Unable to load customers.");
        } finally {
            setLoading(false);
        }
    };

    // Open modal for creating a new customer
    const openCreate = () => {
        setSelectedCustomer(null);
        setDraft(emptyDraft);
        setShowModal(true);
        setError("");
    };

    // Open modal for viewing/editing an existing customer
    const openModal = async (customerId) => {
        setSaving(false);
        try {
            const res = await apiFetch(`/api/customers/${customerId}/detail`);
            if (!res.ok) throw new Error("Failed to load customer details");
            const data = await res.json();

            setSelectedCustomer({ customerId });
            setDraft({
                firstName: data.firstName ?? "",
                lastName: data.lastName ?? "",
                email: data.email ?? "",
                homePhone: data.homePhone ?? "",
                street1: data.street1 ?? "",
                street2: data.street2 ?? "",
                city: data.city ?? "",
                province: data.province ?? "",
                postalCode: data.postalCode ?? "",
                country: data.country ?? "",
                customerType: data.customerType ?? "",
            });
            setShowModal(true);
        } catch (e) {
            console.error(e);
            setError("Failed to load customer details.");
        }
    };

    const closeModal = () => {
        if (saving) return;
        setShowModal(false);
        setDraft(emptyDraft);
        setSelectedCustomer(null);
    };

    // Save customer (create or update)
    const handleSave = async () => {
        if (!draft) return;
        setSaving(true);
        setError("");

        try {
            const url = selectedCustomer
                ? `/api/customers/${selectedCustomer.customerId}`
                : "/api/customers";

            const method = selectedCustomer ? "PUT" : "POST";

            const res = await apiFetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(draft),
            });

            if (!res.ok) throw new Error("Failed to save customer info");

            setShowModal(false);
            await loadCustomers();
        } catch (e) {
            console.error(e);
            setError(e.message || "Failed to save customer info.");
        } finally {
            setSaving(false);
        }
    };

    // Delete customer
    const handleDelete = async (customerId) => {
        if (!window.confirm("Delete this customer?")) return;

        try {
            const res = await apiFetch(`/api/customers/${customerId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Delete failed");
            }

            await loadCustomers();
        } catch (e) {
            console.error(e);
            setError(e.message || "Failed to delete customer.");
        }
    };

    // Filter customers based on search
    const filtered = customers.filter(c =>
        `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 className="mb-1">Customers</h2>
                    <div className="text-muted">View, edit, and manage customer information.</div>
                </div>

                <div className="d-flex gap-2 align-items-center">
                    <Form.Control
                        className="w-auto"
                        type="text"
                        placeholder="Search customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ minWidth: "240px" }}
                    />
                    <Button onClick={openCreate} style={{ borderRadius: 12 }}>Add Customer</Button>
                    <Button
                        variant="outline-secondary"
                        onClick={() => navigate(-1)}
                        style={{ borderRadius: 12 }}
                    >
                        Go Back
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="bg-white text-dark" style={{ borderRadius: 18 }}>
                <Card.Body>
                    {loading ? (
                        <div className="py-4 text-center"><Spinner animation="border" /></div>
                    ) : (
                        <Table responsive hover className="align-middle mb-0">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Type</th>
                                <th style={{ width: 180 }}>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-4">No customers found.</td>
                                </tr>
                            ) : (
                                filtered.map(c => (
                                    <tr key={c.customerId}>
                                        <td>{c.customerId}</td>
                                        <td>{c.firstName} {c.lastName}</td>
                                        <td>{c.email}</td>
                                        <td>{c.homePhone || "—"}</td>
                                        <td>{c.customerType || "—"}</td>
                                        <td className="d-flex gap-2">
                                            <Button size="sm" variant="outline-primary" onClick={() => openModal(c.customerId)}>View / Edit</Button>
                                            <Button size="sm" variant="outline-danger" onClick={() => handleDelete(c.customerId)}>Delete</Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* Modal for Add / Edit Customer */}
            <Modal show={showModal} onHide={closeModal} size="lg" centered>
                <Modal.Header closeButton={!saving}>
                    <Modal.Title>{selectedCustomer ? "Edit Customer" : "Add Customer"}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}

                    {!draft ? (
                        <div className="text-center py-3"><Spinner animation="border" /></div>
                    ) : (
                        <>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>First Name</Form.Label>
                                        <Form.Control
                                            value={draft.firstName}
                                            onChange={e => setDraft(d => ({ ...d, firstName: e.target.value }))}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Last Name</Form.Label>
                                        <Form.Control
                                            value={draft.lastName}
                                            onChange={e => setDraft(d => ({ ...d, lastName: e.target.value }))}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                            value={draft.email}
                                            onChange={e => setDraft(d => ({ ...d, email: e.target.value }))}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Phone</Form.Label>
                                        <Form.Control
                                            value={draft.homePhone}
                                            onChange={e => setDraft(d => ({ ...d, homePhone: e.target.value }))}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Customer Type</Form.Label>
                                        <Form.Select
                                            value={draft.customerType}
                                            onChange={e => setDraft(d => ({ ...d, customerType: e.target.value }))}
                                            required
                                        >
                                            <option value="">Select Type</option>
                                            <option value="Individual">Individual</option>
                                            <option value="Business">Business</option>

                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <hr />
                            <h6>Billing Address</h6>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Street 1</Form.Label>
                                        <Form.Control
                                            value={draft.street1}
                                            onChange={e => setDraft(d => ({ ...d, street1: e.target.value }))}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Street 2</Form.Label>
                                        <Form.Control
                                            value={draft.street2}
                                            onChange={e => setDraft(d => ({ ...d, street2: e.target.value }))}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>City</Form.Label>
                                        <Form.Control
                                            value={draft.city}
                                            onChange={e => setDraft(d => ({ ...d, city: e.target.value }))}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Province</Form.Label>
                                        <Form.Control
                                            value={draft.province}
                                            onChange={e => setDraft(d => ({ ...d, province: e.target.value }))}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Postal Code</Form.Label>
                                        <Form.Control
                                            value={draft.postalCode}
                                            onChange={e => setDraft(d => ({ ...d, postalCode: e.target.value }))}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Country</Form.Label>
                                        <Form.Control
                                            value={draft.country}
                                            onChange={e => setDraft(d => ({ ...d, country: e.target.value }))}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={closeModal} disabled={saving}>Cancel</Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={
                            saving ||
                            !draft?.firstName ||
                            !draft?.lastName ||
                            !draft?.street1 ||
                            !draft?.customerType
                        }
                    >
                        {saving ? "Saving..." : selectedCustomer ? "Update" : "Create"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}