import React, { useEffect, useState } from "react";
import {
    Container, Card, Table, Form, Button, Spinner,
    Modal, Row, Col, Alert
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";

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
    Yukon: ["Whitehorse"],
};

const emptyDraft = {
    firstName: "", lastName: "", email: "", homePhone: "",
    street1: "", street2: "", city: "", province: "",
    postalCode: "", country: "Canada", customerType: "",
};

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

const formatPostalCode = (value) => {
    if (!value) return "";
    let cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    return cleaned.length > 3 ? cleaned.slice(0, 3) + " " + cleaned.slice(3) : cleaned;
};

const isValidPostalCode = (code) => /^[A-Z]\d[A-Z] \d[A-Z]\d$/.test(code);

export default function SalesCustomers() {
    const navigate = useNavigate();

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState("");

    const [showModal, setShowModal]               = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [draft, setDraft]                       = useState(emptyDraft);
    const [saving, setSaving]                     = useState(false);
    const [error, setError]                       = useState("");

    const [showTempPwdModal, setShowTempPwdModal] = useState(false);
    const [tempPwdData, setTempPwdData]           = useState(null);
    const [copySuccess, setCopySuccess]           = useState(false);
    const [jsonError, setJsonError]               = useState("");

    useEffect(() => { loadCustomers(); }, []);

    const loadCustomers = async () => {
        setLoading(true);
        setError("");
        try {
            const res  = await apiFetch("/api/customers/all");
            if (!res.ok) throw new Error("Failed to load customers");
            const data = await res.json();
            setCustomers(data.map(c => ({
                customerId:   c.customerId   ?? c.CustomerId,
                firstName:    c.firstName    ?? c.FirstName,
                lastName:     c.lastName     ?? c.LastName,
                email:        c.email        ?? c.Email,
                homePhone:    c.homePhone    ?? c.HomePhone,
                customerType: c.customerType ?? "",
            })));
        } catch (e) {
            console.error(e);
            setError("Unable to load customers.");
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setSelectedCustomer(null);
        setDraft(emptyDraft);
        setShowModal(true);
        setError("");
    };

    const openModal = async (customerId) => {
        setError("");
        try {
            const res  = await apiFetch(`/api/customers/${customerId}/detail`);
            if (!res.ok) throw new Error("Failed to load customer");
            const data = await res.json();
            setSelectedCustomer({ customerId });
            setDraft({
                firstName:    data.firstName    ?? "",
                lastName:     data.lastName     ?? "",
                email:        data.email        ?? "",
                homePhone:    data.homePhone    ?? "",
                street1:      data.street1      ?? "",
                street2:      data.street2      ?? "",
                city:         data.city         ?? "",
                province:     data.province     ?? "",
                postalCode:   data.postalCode   ?? "",
                country:      "Canada",
                customerType: data.customerType ?? "",
            });
            setShowModal(true);
        } catch (e) {
            console.error(e);
            setError("Failed to load customer details.");
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setJsonError("");
        if (draft.postalCode && !isValidPostalCode(draft.postalCode)) {
            setError("Invalid Canadian postal code (Format: A1A 1A1)");
            setSaving(false);
            return;
        }
        try {
            const url    = selectedCustomer ? `/api/customers/${selectedCustomer.customerId}` : "/api/customers";
            const method = selectedCustomer ? "PUT" : "POST";
            const res    = await apiFetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(draft),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Save failed");
            }
            let data = null;
            const ct = res.headers.get("content-type");
            if (ct && ct.includes("application/json")) data = await res.json();
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

    const handleDelete = async (customerId) => {
        if (!window.confirm("Are you sure you want to delete this customer?")) return;
        try {
            const res = await apiFetch(`/api/customers/${customerId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            await loadCustomers();
        } catch (e) {
            console.error(e);
            setError("Failed to delete customer.");
        }
    };

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

    const filtered = customers.filter(c =>
        `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Container className="py-4">

            {/* ── Header ── */}
            <div className="mb-3">
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 flex-wrap">
                    <div>
                        <h2 className="mb-0">Customers</h2>
                        <div className="text-muted" style={{ fontSize: "0.9rem" }}>Canada Customer Management</div>
                    </div>

                    <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-sm-auto" style={{ maxWidth: 480 }}>
                        <Form.Control
                            placeholder="Search..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ minWidth: 0 }}
                        />
                        <div className="d-flex gap-2 flex-shrink-0">
                            <Button onClick={openCreate} style={{ whiteSpace: "nowrap" }}>Add</Button>
                            <Button variant="outline-secondary" onClick={() => navigate(-1)} style={{ whiteSpace: "nowrap" }}>Back</Button>
                        </div>
                    </div>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {/* ── Table ── */}
            <Card>
                <Card.Body className="p-0 p-md-3">
                    {loading ? (
                        <div className="text-center py-4"><Spinner animation="border" /></div>
                    ) : (
                        /* table-responsive*/
                        <div className="table-responsive">
                            <Table hover className="mb-0 align-middle">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th className="d-none d-md-table-cell">Email</th>
                                    <th className="d-none d-lg-table-cell">Phone</th>
                                    <th className="d-none d-sm-table-cell">Type</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-4 text-muted">No customers found.</td></tr>
                                ) : filtered.map(c => (
                                    <tr key={c.customerId}>
                                        <td style={{ whiteSpace: "nowrap" }}>{c.customerId}</td>
                                        <td style={{ whiteSpace: "nowrap" }}>{c.firstName} {c.lastName}</td>
                                        <td className="d-none d-md-table-cell">{c.email}</td>
                                        <td className="d-none d-lg-table-cell">{c.homePhone || "—"}</td>
                                        <td className="d-none d-sm-table-cell">{c.customerType || "—"}</td>
                                        <td>
                                            <div className="d-flex gap-1 flex-wrap">
                                                <Button size="sm" onClick={() => openModal(c.customerId)}>Edit</Button>
                                                <Button size="sm" variant="danger" onClick={() => handleDelete(c.customerId)}>Delete</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* ── Edit / Create Modal ── */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton={!saving}>
                    <Modal.Title>{selectedCustomer ? "Edit Customer" : "Add Customer"}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Row className="g-3">
                        <Col xs={12} sm={6}>
                            <Form.Label>First Name</Form.Label>
                            <Form.Control value={draft.firstName} onChange={e => setDraft(d => ({ ...d, firstName: e.target.value }))} />
                        </Col>
                        <Col xs={12} sm={6}>
                            <Form.Label>Last Name</Form.Label>
                            <Form.Control value={draft.lastName} onChange={e => setDraft(d => ({ ...d, lastName: e.target.value }))} />
                        </Col>
                        <Col xs={12} sm={6}>
                            <Form.Label>Email</Form.Label>
                            <Form.Control value={draft.email} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} />
                        </Col>
                        <Col xs={12} sm={6}>
                            <Form.Label>Phone</Form.Label>
                            <Form.Control value={draft.homePhone} onChange={e => setDraft(d => ({ ...d, homePhone: formatPhone(e.target.value) }))} />
                        </Col>
                        <Col xs={12} sm={6}>
                            <Form.Label>Customer Type</Form.Label>
                            <Form.Select value={draft.customerType} onChange={e => setDraft(d => ({ ...d, customerType: e.target.value }))}>
                                <option value="">Select</option>
                                <option value="Individual">Individual</option>
                                <option value="Business">Business</option>
                            </Form.Select>
                        </Col>

                        <Col xs={12}><hr className="my-1" /></Col>

                        <Col xs={12} sm={6}>
                            <Form.Label>Street 1</Form.Label>
                            <Form.Control value={draft.street1} onChange={e => setDraft(d => ({ ...d, street1: e.target.value }))} />
                        </Col>
                        <Col xs={12} sm={6}>
                            <Form.Label>Street 2</Form.Label>
                            <Form.Control value={draft.street2} onChange={e => setDraft(d => ({ ...d, street2: e.target.value }))} />
                        </Col>
                        <Col xs={12} sm={4}>
                            <Form.Label>Province</Form.Label>
                            <Form.Select value={draft.province} onChange={e => setDraft(d => ({ ...d, province: e.target.value, city: "" }))}>
                                <option value="">Select Province</option>
                                {Object.keys(provinceCityMap).map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col xs={12} sm={4}>
                            <Form.Label>City</Form.Label>
                            <Form.Select value={draft.city} onChange={e => setDraft(d => ({ ...d, city: e.target.value }))} disabled={!draft.province}>
                                <option value="">Select City</option>
                                {(provinceCityMap[draft.province] || []).map(city => (
                                    <option key={city}>{city}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col xs={12} sm={4}>
                            <Form.Label>Postal Code</Form.Label>
                            <Form.Control
                                value={draft.postalCode}
                                onChange={e => setDraft(d => ({ ...d, postalCode: formatPostalCode(e.target.value) }))}
                                placeholder="A1A 1A1"
                                style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}
                            />
                        </Col>
                        <Col xs={12} sm={4}>
                            <Form.Label>Country</Form.Label>
                            <Form.Control value="Canada" disabled />
                        </Col>
                    </Row>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : selectedCustomer ? "Update" : "Create"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ── Temp Password Modal ── */}
            <Modal show={showTempPwdModal} centered onHide={() => setShowTempPwdModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>User Created Successfully</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {jsonError && <Alert variant="danger">{jsonError}</Alert>}
                    <div className="mb-2"><b>Username:</b> {tempPwdData?.username}</div>
                    <div>
                        <b>Temporary Password:</b>
                        <div style={{ marginTop: 8, fontFamily: "monospace", background: "#f4f4f4", padding: 10, borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, wordBreak: "break-all" }}>
                            <span style={{ flex: 1 }}>{tempPwdData?.tempPassword}</span>
                            <Button size="sm" onClick={() => handleCopy(tempPwdData?.tempPassword)} style={{ flexShrink: 0 }}>Copy</Button>
                        </div>
                        {copySuccess && <div style={{ color: "green", marginTop: 8 }}>Copied to clipboard ✔</div>}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowTempPwdModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>

        </Container>
    );
}