import React, { useEffect, useState } from "react";
import {
    Container, Card, Table, Form, Button, Spinner,
    Modal, Row, Col, Alert
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";

// ==========================
// Canada Province → City mapping
// ==========================
const provinceCityMap = {
    Alberta: ["Calgary", "Edmonton", "Red Deer", "Lethbridge"],
    "British Columbia": ["Vancouver", "Victoria", "Surrey", "Burnaby"],
    Manitoba: ["Winnipeg", "Brandon"],
    "New Brunswick": ["Fredericton", "Moncton"],
    "Newfoundland and Labrador": ["St. John's", "Corner Brook"],
    "Nova Scotia": ["Halifax", "Sydney"],
    Ontario: ["Toronto", "Ottawa", "Mississauga", "Hamilton"],
    "Prince Edward Island": ["Charlottetown"],
    Quebec: ["Montreal", "Quebec City", "Laval"],
    Saskatchewan: ["Saskatoon", "Regina"],
    "Northwest Territories": ["Yellowknife"],
    Nunavut: ["Iqaluit"],
    Yukon: ["Whitehorse"]
};

// ==========================
// Empty form
// ==========================
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
    country: "Canada",
    customerType: "",
};

// ==========================
// Phone formatter
// ==========================
const formatPhone = (value) => {
    if (!value) return "";

    const numbers = value.replace(/\D/g, "").slice(0, 10);
    const match = numbers.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);

    let result = "";

    if (match[1]) result = `(${match[1]}`;
    if (match[1]?.length === 3) result += ") ";
    if (match[2]) result += match[2];
    if (match[2]?.length === 3) result += "-";
    if (match[3]) result += match[3];

    return result;
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

    const [showTempPwdModal, setShowTempPwdModal] = useState(false);
    const [tempPwdData, setTempPwdData] = useState(null);

    // ===== NEW (copy + json safety) =====
    const [copySuccess, setCopySuccess] = useState(false);
    const [jsonError, setJsonError] = useState("");

    // ==========================
    // Load customers
    // ==========================
    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await apiFetch("/api/customers/all");
            if (!res.ok) throw new Error("Failed to load customers");

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

    // ==========================
    // Create
    // ==========================
    const openCreate = () => {
        setSelectedCustomer(null);
        setDraft(emptyDraft);
        setShowModal(true);
        setError("");
    };

    // ==========================
    // Edit
    // ==========================
    const openModal = async (customerId) => {
        setError("");

        try {
            const res = await apiFetch(`/api/customers/${customerId}/detail`);
            if (!res.ok) throw new Error("Failed to load customer");

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
                country: "Canada",
                customerType: data.customerType ?? "",
            });

            setShowModal(true);

        } catch (e) {
            console.error(e);
            setError("Failed to load customer details.");
        }
    };

    // ==========================
    // SAVE (FIXED JSON SAFETY)
    // ==========================
    const handleSave = async () => {
        setSaving(true);
        setError("");
        setJsonError("");

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

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Save failed");
            }

            let data = null;

            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await res.json();
            }

            // Only show temp password on CREATE
            if (!selectedCustomer && data) {
                setTempPwdData(data);
                setShowTempPwdModal(true);
            }

            setShowModal(false);
            await loadCustomers();

        } catch (e) {
            console.error(e);
            setError(e.message || "Save failed");
            setJsonError("Server response invalid or malformed JSON");
        } finally {
            setSaving(false);
        }
    };

    // ==========================
    // DELETE
    // ==========================
    const handleDelete = async (customerId) => {

        if (!window.confirm("Are you sure you want to delete this customer?")) return;

        try {
            const res = await apiFetch(`/api/customers/${customerId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Delete failed");

            await loadCustomers();

        } catch (e) {
            console.error(e);
            setError("Failed to delete customer.");
        }
    };

    // ==========================
    // COPY (NEW UX)
    // ==========================
    const handleCopy = async (text) => {
        try {
            if (!text) return;

            await navigator.clipboard.writeText(text);

            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);

        } catch (err) {
            console.error(err);
            setError("Copy failed");
        }
    };

    // ==========================
    // FILTER
    // ==========================
    const filtered = customers.filter(c =>
        `${c.firstName} ${c.lastName} ${c.email}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    return (
        <Container className="py-4">

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2>Customers</h2>
                    <div className="text-muted">Canada Customer Management</div>
                </div>

                <div className="d-flex gap-2">
                    <Form.Control
                        placeholder="Search..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />

                    <Button onClick={openCreate}>Add</Button>
                    <Button variant="outline-secondary" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {/* Table */}
            <Card>
                <Card.Body>
                    {loading ? (
                        <Spinner animation="border" />
                    ) : (
                        <Table hover>
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Type</th>
                                <th>Actions</th>
                            </tr>
                            </thead>

                            <tbody>
                            {filtered.map(c => (
                                <tr key={c.customerId}>
                                    <td>{c.customerId}</td>
                                    <td>{c.firstName} {c.lastName}</td>
                                    <td>{c.email}</td>
                                    <td>{c.homePhone || "—"}</td>
                                    <td>{c.customerType || "—"}</td>

                                    <td className="d-flex gap-2">
                                        <Button size="sm" onClick={() => openModal(c.customerId)}>
                                            Edit
                                        </Button>

                                        <Button size="sm" variant="danger"
                                                onClick={() => handleDelete(c.customerId)}>
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* ================= MODAL ================= */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton={!saving}>
                    <Modal.Title>
                        {selectedCustomer ? "Edit Customer" : "Add Customer"}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>

                    {error && <Alert variant="danger">{error}</Alert>}

                    <Row className="g-3">

                        <Col md={6}>
                            <Form.Label>First Name</Form.Label>
                            <Form.Control
                                value={draft.firstName}
                                onChange={e => setDraft(d => ({ ...d, firstName: e.target.value }))}
                            />
                        </Col>

                        <Col md={6}>
                            <Form.Label>Last Name</Form.Label>
                            <Form.Control
                                value={draft.lastName}
                                onChange={e => setDraft(d => ({ ...d, lastName: e.target.value }))}
                            />
                        </Col>

                        <Col md={6}>
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                value={draft.email}
                                onChange={e => setDraft(d => ({ ...d, email: e.target.value }))}
                            />
                        </Col>

                        <Col md={6}>
                            <Form.Label>Phone</Form.Label>
                            <Form.Control
                                value={draft.homePhone}
                                onChange={e => setDraft(d => ({
                                    ...d,
                                    homePhone: formatPhone(e.target.value)
                                }))}
                            />
                        </Col>

                        <Col md={6}>
                            <Form.Label>Customer Type</Form.Label>
                            <Form.Select
                                value={draft.customerType}
                                onChange={e => setDraft(d => ({ ...d, customerType: e.target.value }))}
                            >
                                <option value="">Select</option>
                                <option value="Individual">Individual</option>
                                <option value="Business">Business</option>
                            </Form.Select>
                        </Col>

                        <Col md={12}><hr /></Col>

                        <Col md={6}>
                            <Form.Label>Street 1</Form.Label>
                            <Form.Control
                                value={draft.street1}
                                onChange={e => setDraft(d => ({ ...d, street1: e.target.value }))}
                            />
                        </Col>

                        <Col md={6}>
                            <Form.Label>Street 2</Form.Label>
                            <Form.Control
                                value={draft.street2}
                                onChange={e => setDraft(d => ({ ...d, street2: e.target.value }))}
                            />
                        </Col>

                        <Col md={4}>
                            <Form.Label>Province</Form.Label>
                            <Form.Select
                                value={draft.province}
                                onChange={e => setDraft(d => ({
                                    ...d,
                                    province: e.target.value,
                                    city: ""
                                }))}
                            >
                                <option value="">Select Province</option>
                                {Object.keys(provinceCityMap).map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </Form.Select>
                        </Col>

                        <Col md={4}>
                            <Form.Label>City</Form.Label>
                            <Form.Select
                                value={draft.city}
                                onChange={e => setDraft(d => ({ ...d, city: e.target.value }))}
                                disabled={!draft.province}
                            >
                                <option value="">Select City</option>
                                {(provinceCityMap[draft.province] || []).map(city => (
                                    <option key={city}>{city}</option>
                                ))}
                            </Form.Select>
                        </Col>

                        <Col md={4}>
                            <Form.Label>Postal Code</Form.Label>
                            <Form.Control
                                value={draft.postalCode}
                                onChange={e => setDraft(d => ({ ...d, postalCode: e.target.value }))}
                            />
                        </Col>

                        <Col md={4}>
                            <Form.Label>Country</Form.Label>
                            <Form.Control value="Canada" disabled />
                        </Col>

                    </Row>

                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>
                        Cancel
                    </Button>

                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : selectedCustomer ? "Update" : "Create"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ================= TEMP PASSWORD MODAL ================= */}
            <Modal show={showTempPwdModal} centered onHide={() => setShowTempPwdModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>User Created Successfully</Modal.Title>
                </Modal.Header>

                <Modal.Body>

                    {jsonError && <Alert variant="danger">{jsonError}</Alert>}

                    <div className="mb-2">
                        <b>Username:</b> {tempPwdData?.username}
                    </div>

                    <div>
                        <b>Temporary Password:</b>

                        <div
                            style={{
                                marginTop: 8,
                                fontFamily: "monospace",
                                background: "#f4f4f4",
                                padding: 10,
                                borderRadius: 6,
                                display: "flex",
                                justifyContent: "space-between"
                            }}
                        >
                            <span>{tempPwdData?.tempPassword}</span>

                            <Button size="sm" onClick={() => handleCopy(tempPwdData?.tempPassword)}>
                                Copy
                            </Button>
                        </div>

                        {copySuccess && (
                            <div style={{ color: "green", marginTop: 8 }}>
                                Copied to clipboard ✔
                            </div>
                        )}
                    </div>

                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowTempPwdModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

        </Container>
    );
}