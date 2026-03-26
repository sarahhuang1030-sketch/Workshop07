import React, { useEffect, useState } from "react";
import {
    Container,
    Card,
    Table,
    Button,
    Modal,
    Form,
    Row,
    Col,
    Alert,
    Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const emptyForm = {
    customerType: "Individual",
    firstName: "",
    lastName: "",
    businessName: "",
    email: "",
    homePhone: "",
    status: "Active",
    street1: "",
    street2: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Canada",
    addressType: "Billing",
    isPrimary: 1,
};
import { apiFetch } from "../../services/api";

export default function ManagerUsers({ darkMode = false }) {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const navigate = useNavigate();
    const [search, setSearch] = useState("");

    const loadCustomers = async () => {
        try {
            setLoading(true);
            setError("");

            const res = await apiFetch("/api/manager/customers");

            if (!res.ok) {
                throw new Error(`Failed to load customers: ${res.status}`);
            }

            const data = await res.json();
            setCustomers(data);
        } catch (err) {
            console.error(err);
            setError("Unable to load CustomersPage.jsx.");
        } finally {
            setLoading(false);
        }
    };

    const loadCustomerAddress = async (customerId) => {
        const res = await apiFetch(`/api/manager/customers/${customerId}/address`);

        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`Failed to load address: ${res.status}`);

        return await res.json();
    };

    useEffect(() => {
        loadCustomers();
    }, []);

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...emptyForm });
        setShowModal(true);
    };

    const openEdit = async (customer) => {
        try {
            setError("");

            const address = await loadCustomerAddress(customer.customerId);

            setEditingId(customer.customerId);
            setForm({
                customerType: customer.customerType ?? "Individual",
                firstName: customer.firstName ?? "",
                lastName: customer.lastName ?? "",
                businessName: customer.businessName ?? "",
                email: customer.email ?? "",
                homePhone: customer.homePhone ?? "",
                status: customer.status ?? "Active",

                street1: address?.street1 ?? "",
                street2: address?.street2 ?? "",
                city: address?.city ?? "",
                province: address?.province ?? "",
                postalCode: address?.postalCode ?? "",
                country: address?.country ?? "Canada",
                addressType: address?.addressType ?? "Billing",
                isPrimary: address?.isPrimary ?? 1,
            });

            setShowModal(true);
        } catch (err) {
            console.error(err);
            setError("Unable to load customer details.");
        }
    };

    const closeModal = () => {
        if (saving) return;
        setShowModal(false);
        setError("");
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
            ...(name === "customerType" && value !== "Business"
                ? { businessName: "" }
                : {}),
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");

            const url = editingId
                ? `/api/manager/customers/${editingId}`
                : "/api/manager/CustomersPage.jsx";

            const method = editingId ? "PUT" : "POST";

            const payload = {
                customerType: form.customerType,
                firstName: form.firstName,
                lastName: form.lastName,
                businessName: form.businessName || null,
                email: form.email,
                homePhone: form.homePhone,
                status: form.status,
            };

            const res = await apiFetch(url, {
                method,

                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error(`Save failed: ${res.status}`);
            }

            const savedCustomer = await res.json();
            const customerId = editingId || savedCustomer.customerId;

            const addressPayload = {
                addressType: form.addressType,
                street1: form.street1,
                street2: form.street2 || null,
                city: form.city,
                province: form.province,
                postalCode: form.postalCode,
                country: form.country,
                isPrimary: 1,
            };

            const addressRes = await apiFetch(`/api/manager/customers/${customerId}/address`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(addressPayload),
            });

            if (!addressRes.ok) {
                throw new Error(`Address save failed: ${addressRes.status}`);
            }

            setShowModal(false);
            setForm({ ...emptyForm });
            setEditingId(null);
            await loadCustomers();
        } catch (err) {
            console.error(err);
            setError("Unable to save customer.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (customerId) => {
        const confirmed = window.confirm("Delete this customer?");
        if (!confirmed) return;

        try {
            setError("");

            const res = await apiFetch(`/api/manager/customers/${customerId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error(`Delete failed: ${res.status}`);
            }

            await loadCustomers();
        } catch (err) {
            console.error(err);
            setError("Unable to delete customer. This customer may already be used by other records.");
        }
    };

    const cardBase = darkMode ? "bg-dark text-light border-secondary" : "bg-white text-dark";

    const filteredCustomers = customers.filter((cust) => {
        const keyword = search.toLowerCase();

        return (
            String(cust.customerId ?? "").toLowerCase().includes(keyword) ||
            String(cust.customerType ?? "").toLowerCase().includes(keyword) ||
            String(cust.firstName ?? "").toLowerCase().includes(keyword) ||
            String(cust.lastName ?? "").toLowerCase().includes(keyword) ||
            String(cust.businessName ?? "").toLowerCase().includes(keyword) ||
            String(cust.email ?? "").toLowerCase().includes(keyword) ||
            String(cust.homePhone ?? "").toLowerCase().includes(keyword) ||
            String(cust.status ?? "").toLowerCase().includes(keyword)
        );
    });

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 className="mb-1">Manage Customers</h2>
                    <div className={darkMode ? "text-light-50" : "text-muted"}>
                        Create, update, and remove customer records.
                    </div>
                </div>

                <div className="d-flex gap-2">
                    <Form.Control
                        className={"w-auto"}
                        type="text"
                        placeholder="Search customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ minWidth: "240px" }}
                    />
                    <Button onClick={openCreate} style={{ borderRadius: 12 }}>
                        Add Customer
                    </Button>
                    <Button
                    variant="outline-secondary"
                    onClick={() => navigate("/manager")}
                    style={{ borderRadius: 12 }}
                >
                    Go Back
                </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className={cardBase} style={{ borderRadius: 18 }}>
                <Card.Body>
                    {loading ? (
                        <div className="py-4 text-center">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <Table responsive hover className="align-middle mb-0">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Type</th>
                                <th>Name</th>
                                <th>Business Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th style={{ width: 180 }}>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-4">
                                        No customers found.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.customerId}>
                                        <td>{customer.customerId}</td>
                                        <td>{customer.customerType || "—"}</td>
                                        <td>{customer.firstName} {customer.lastName}</td>
                                        <td>{customer.businessName || "—"}</td>
                                        <td>{customer.email}</td>
                                        <td>{customer.homePhone || "—"}</td>
                                        <td>{customer.status || "—"}</td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline-primary"
                                                    onClick={() => openEdit(customer)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    onClick={() => handleDelete(customer.customerId)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={closeModal} centered>
                <Form onSubmit={handleSave}>
                    <Modal.Header closeButton={!saving}>
                        <Modal.Title>{editingId ? "Edit Customer" : "Add Customer"}</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Customer Type</Form.Label>
                                    <Form.Select
                                        name="customerType"
                                        value={form.customerType}
                                        onChange={handleChange}
                                    >
                                        <option value="Individual">Individual</option>
                                        <option value="Business">Business</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select
                                        name="status"
                                        value={form.status}
                                        onChange={handleChange}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>First Name</Form.Label>
                                    <Form.Control
                                        name="firstName"
                                        value={form.firstName}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Last Name</Form.Label>
                                    <Form.Control
                                        name="lastName"
                                        value={form.lastName}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            {form.customerType === "Business" && (
                                <Col md={12}>
                                    <Form.Group>
                                        <Form.Label>Business Name</Form.Label>
                                        <Form.Control
                                            name="businessName"
                                            value={form.businessName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                            )}

                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Phone</Form.Label>
                                    <Form.Control
                                        name="homePhone"
                                        value={form.homePhone}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>




                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Address Type</Form.Label>
                                    <Form.Select
                                        name="addressType"
                                        value={form.addressType}
                                        onChange={handleChange}
                                    >
                                        <option value="Billing">Billing</option>
                                        <option value="Service">Service</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Street 1</Form.Label>
                                    <Form.Control
                                        name="street1"
                                        value={form.street1}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Street 2</Form.Label>
                                    <Form.Control
                                        name="street2"
                                        value={form.street2}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>City</Form.Label>
                                    <Form.Control
                                        name="city"
                                        value={form.city}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Province</Form.Label>
                                    <Form.Control
                                        name="province"
                                        value={form.province}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Postal Code</Form.Label>
                                    <Form.Control
                                        name="postalCode"
                                        value={form.postalCode}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Country</Form.Label>
                                    <Form.Control
                                        name="country"
                                        value={form.country}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeModal} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving..." : editingId ? "Update" : "Create"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}