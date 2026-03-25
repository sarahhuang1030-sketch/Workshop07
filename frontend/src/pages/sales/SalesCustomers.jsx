import React, { useEffect, useState } from "react";
import { Container, Table, Form, Button, Spinner, Modal, Row, Col, Alert } from "react-bootstrap";
import { apiFetch } from "../../services/api";

/**
 * SalesCustomers component
 * - List all customers
 * - Search/filter
 * - View/Edit via modal
 * - Delete customer
 */
export default function SalesCustomers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [draft, setDraft] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Load customers on mount
    useEffect(() => {
        loadCustomers();
    }, []);

    async function loadCustomers() {
        setLoading(true);
        try {
            const response = await apiFetch("/api/customers/all");
            const data = await response.json();
            console.log("customers", data);
            setCustomers(
                data.map(c => ({
                    customerId: c.customerId ?? c.CustomerId,
                    firstName: c.firstName ?? c.FirstName,
                    lastName: c.lastName ?? c.LastName,
                    email: c.email ?? c.Email,
                    homePhone: c.homePhone ?? c.HomePhone,
                }))
            );
        } catch (e) {
            console.error("Failed to load customers", e);
        } finally {
            setLoading(false);
        }
    }

    // Open modal to view/edit customer
    const openModal = async (customerId) => {
        try {
            const response = await apiFetch(`/api/customers/${customerId}/detail`);
            if (!response.ok) throw new Error("Failed to load customer info");

            const data = await response.json();
            console.log("customer data:", data);

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
            });

            setShowModal(true);
            setError("");
        } catch (e) {
            console.error(e);
            alert("Failed to load customer details");
        }
    };

    // Save draft to backend
    const handleSave = async () => {
        if (!draft || !selectedCustomer) return;
        setSaving(true);
        setError("");

        try {
            const res = await apiFetch("/api/billing/address", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...draft,
                }),
            });

            if (!res.ok) throw new Error("Failed to save customer info");

            setShowModal(false);
            await loadCustomers();
        } catch (e) {
            setError(e.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    // Delete customer
    const handleDelete = async (customerId) => {
        if (!window.confirm("Delete this customer?")) return;
        try {
            await apiFetch(`/api/customers/${customerId}`, { method: "DELETE" });
            await loadCustomers();
        } catch (e) {
            console.error(e);
            alert("Failed to delete customer: " + e.message);
        }
    };

    const filtered = customers.filter(c =>
        `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Container className="py-4">
            <h3>Customers</h3>

            <Form.Control
                placeholder="Search customer..."
                className="mb-3"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {loading ? (
                <Spinner animation="border" />
            ) : (
                <Table striped hover>
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.map(c => (
                        <tr key={c.customerId}>
                            <td>{c.customerId}</td>
                            <td>{c.firstName} {c.lastName}</td>
                            <td>{c.email}</td>
                            <td>{c.homePhone}</td>
                            <td className="d-flex gap-2">
                                <Button size="sm" onClick={() => openModal(c.customerId)}>View / Edit</Button>
                                <Button size="sm" variant="danger" onClick={() => handleDelete(c.customerId)}>Delete</Button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            )}

            {/* ---------------- Modal ---------------- */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Edit Customer</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {!draft ? (
                        <div className="text-center py-3">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <>
                            <Row>
                                <Col>
                                    <Form.Group className="mb-2">
                                        <Form.Label>First Name</Form.Label>
                                        <Form.Control value={draft.firstName} onChange={e => setDraft(d => ({ ...d, firstName: e.target.value }))} />
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Last Name</Form.Label>
                                        <Form.Control value={draft.lastName} onChange={e => setDraft(d => ({ ...d, lastName: e.target.value }))} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-2">
                                <Form.Label>Email</Form.Label>
                                <Form.Control value={draft.email} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Phone</Form.Label>
                                <Form.Control value={draft.homePhone} onChange={e => setDraft(d => ({ ...d, homePhone: e.target.value }))} />
                            </Form.Group>
                            <hr />
                            <h6>Billing Address</h6>
                            <Row>
                                <Col>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Street 1</Form.Label>
                                        <Form.Control value={draft.street1} onChange={e => setDraft(d => ({ ...d, street1: e.target.value }))} />
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Street 2</Form.Label>
                                        <Form.Control value={draft.street2} onChange={e => setDraft(d => ({ ...d, street2: e.target.value }))} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <Form.Group className="mb-2">
                                        <Form.Label>City</Form.Label>
                                        <Form.Control value={draft.city} onChange={e => setDraft(d => ({ ...d, city: e.target.value }))} />
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Province</Form.Label>
                                        <Form.Control value={draft.province} onChange={e => setDraft(d => ({ ...d, province: e.target.value }))} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Postal Code</Form.Label>
                                        <Form.Control value={draft.postalCode} onChange={e => setDraft(d => ({ ...d, postalCode: e.target.value }))} />
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Country</Form.Label>
                                        <Form.Control value={draft.country} onChange={e => setDraft(d => ({ ...d, country: e.target.value }))} />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave} disabled={saving || !draft?.firstName || !draft?.lastName || !draft?.street1}>
                        {saving ? "Saving..." : "Save"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}