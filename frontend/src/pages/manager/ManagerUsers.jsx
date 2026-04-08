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
import { apiFetch } from "../../services/api";
import {
    digitsOnly,
    formatPhoneFromDigits,
    formatPostalCode,
    postalCodeCA,
} from "../validation/Validation";

const emptyForm = {
    customerType: "Individual",
    firstName: "",
    lastName: "",
    businessName: "",
    email: "",
    homePhone: "",
    status: "Active",

    sameAsBilling: true,

    billingStreet1: "",
    billingStreet2: "",
    billingCity: "",
    billingProvince: "",
    billingPostalCode: "",
    billingCountry: "Canada",

    serviceStreet1: "",
    serviceStreet2: "",
    serviceCity: "",
    serviceProvince: "",
    servicePostalCode: "",
    serviceCountry: "Canada",
};

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
            setError("Unable to load customers.");
        } finally {
            setLoading(false);
        }
    };

    const loadCustomerAddresses = async (customerId) => {
        const res = await apiFetch(`/api/manager/customers/${customerId}/address`);

        if (res.status === 404) return [];
        if (!res.ok) throw new Error(`Failed to load addresses: ${res.status}`);

        const data = await res.json();
        return Array.isArray(data) ? data : [];
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

            const addresses = await loadCustomerAddresses(customer.customerId);

            const billing = addresses.find(
                (a) => (a.addressType || "").toLowerCase() === "billing"
            );

            const service = addresses.find(
                (a) => (a.addressType || "").toLowerCase() === "service"
            );

            const sameAsBilling = !service;

            setEditingId(customer.customerId);
            setForm({
                customerType: customer.customerType ?? "Individual",
                firstName: customer.firstName ?? "",
                lastName: customer.lastName ?? "",
                businessName: customer.businessName ?? "",
                email: customer.email ?? "",
                homePhone: formatPhoneFromDigits(digitsOnly(customer.homePhone ?? "")),
                status: customer.status ?? "Active",

                sameAsBilling,

                billingStreet1: billing?.street1 ?? "",
                billingStreet2: billing?.street2 ?? "",
                billingCity: billing?.city ?? "",
                billingProvince: billing?.province ?? "",
                billingPostalCode: formatPostalCode(billing?.postalCode ?? ""),
                billingCountry: billing?.country ?? "Canada",

                serviceStreet1: service?.street1 ?? "",
                serviceStreet2: service?.street2 ?? "",
                serviceCity: service?.city ?? "",
                serviceProvince: service?.province ?? "",
                servicePostalCode: formatPostalCode(service?.postalCode ?? ""),
                serviceCountry: service?.country ?? "Canada",
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
        const { name, value, type, checked } = e.target;

        setForm((prev) => {
            let nextValue = type === "checkbox" ? checked : value;

            if (name === "homePhone") {
                nextValue = formatPhoneFromDigits(digitsOnly(value));
            }

            if (name === "billingPostalCode" || name === "servicePostalCode") {
                nextValue = formatPostalCode(value);
            }

            const next = {
                ...prev,
                [name]: nextValue,
            };

            if (name === "customerType" && value !== "Business") {
                next.businessName = "";
            }

            return next;
        });
    };

    const saveAddress = async (customerId, addressType, payload) => {
        const res = await apiFetch(`/api/manager/customers/${customerId}/address`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                addressType,
                street1: payload.street1,
                street2: payload.street2 || null,
                city: payload.city,
                province: payload.province,
                postalCode: payload.postalCode,
                country: payload.country,
                isPrimary: 1,
            }),
        });

        if (!res.ok) {
            throw new Error(`${addressType} address save failed: ${res.status}`);
        }
    };

    const deleteServiceAddress = async (customerId) => {
        const res = await apiFetch(`/api/manager/customers/${customerId}/address/Service`, {
            method: "DELETE",
        });

        if (!res.ok && res.status !== 404) {
            throw new Error(`Delete service address failed: ${res.status}`);
        }
    };

    const validateCustomerForm = () => {
        if (!form.customerType?.trim()) return "Customer type is required.";
        if (!form.status?.trim()) return "Status is required.";
        if (!form.firstName?.trim()) return "First name is required.";
        if (!form.lastName?.trim()) return "Last name is required.";

        if (form.customerType === "Business" && !form.businessName?.trim()) {
            return "Business name is required.";
        }

        if (!form.email?.trim()) return "Email is required.";

        if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(form.email.trim())) {
            return "Enter a valid email address (e.g., name@email.com).";
        }

        const phoneDigits = digitsOnly(form.homePhone);
        if (!phoneDigits) return "Phone is required.";
        if (phoneDigits.length !== 10) {
            return "Phone must be 10 digits (e.g., (403) 555-1234).";
        }

        if (!form.billingStreet1?.trim()) return "Billing street 1 is required.";
        if (!form.billingCity?.trim()) return "Billing city is required.";
        if (!form.billingProvince?.trim()) return "Billing province is required.";
        if (!form.billingCountry?.trim()) return "Billing country is required.";
        if (!form.billingPostalCode?.trim()) return "Billing postal code is required.";

        if (
            form.billingCountry?.trim().toLowerCase() === "canada" &&
            !postalCodeCA.test(form.billingPostalCode.trim())
        ) {
            return "Enter a valid billing postal code (e.g., T2P 1A1).";
        }

        if (!form.sameAsBilling) {
            if (!form.serviceStreet1?.trim()) return "Service street 1 is required.";
            if (!form.serviceCity?.trim()) return "Service city is required.";
            if (!form.serviceProvince?.trim()) return "Service province is required.";
            if (!form.serviceCountry?.trim()) return "Service country is required.";
            if (!form.servicePostalCode?.trim()) return "Service postal code is required.";

            if (
                form.serviceCountry?.trim().toLowerCase() === "canada" &&
                !postalCodeCA.test(form.servicePostalCode.trim())
            ) {
                return "Enter a valid service postal code (e.g., T2P 1A1).";
            }
        }

        return "";
    };

    const handleSave = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");

            const validationMessage = validateCustomerForm();
            if (validationMessage) {
                setError(validationMessage);
                setSaving(false);
                return;
            }

            const url = editingId
                ? `/api/manager/customers/${editingId}`
                : "/api/manager/customers";

            const method = editingId ? "PUT" : "POST";

            const customerPayload = {
                customerType: form.customerType,
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                businessName:
                    form.customerType === "Business"
                        ? form.businessName?.trim() || null
                        : null,
                email: form.email.trim(),
                homePhone: digitsOnly(form.homePhone),
                status: form.status,
            };

            const res = await apiFetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(customerPayload),
            });

            if (!res.ok) {
                throw new Error(`Save failed: ${res.status}`);
            }

            const savedCustomer = await res.json();
            const customerId = editingId || savedCustomer.customerId;

            await saveAddress(customerId, "Billing", {
                street1: form.billingStreet1.trim(),
                street2: form.billingStreet2?.trim() || "",
                city: form.billingCity.trim(),
                province: form.billingProvince.trim(),
                postalCode: form.billingPostalCode.trim(),
                country: form.billingCountry.trim(),
            });

            if (form.sameAsBilling) {
                await deleteServiceAddress(customerId);
            } else {
                await saveAddress(customerId, "Service", {
                    street1: form.serviceStreet1.trim(),
                    street2: form.serviceStreet2?.trim() || "",
                    city: form.serviceCity.trim(),
                    province: form.serviceProvince.trim(),
                    postalCode: form.servicePostalCode.trim(),
                    country: form.serviceCountry.trim(),
                });
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
                        className="w-auto"
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

            <Modal show={showModal} onHide={closeModal} centered size="lg">
                <Form onSubmit={handleSave}>
                    <Modal.Header closeButton={!saving}>
                        <Modal.Title>{editingId ? "Edit Customer" : "Add Customer"}</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        {error && <Alert variant="danger">{error}</Alert>}
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Customer Type</Form.Label>
                                    <Form.Select
                                        name="customerType"
                                        value={form.customerType}
                                        onChange={handleChange}
                                        required
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
                                        required
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
                                        required
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
                                        required
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
                                        maxLength={14}
                                        placeholder="(403) 555-1234"
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={12}>
                                <hr className="my-2" />
                                <h5 className="mb-3">Billing Address</h5>
                            </Col>

                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Street 1</Form.Label>
                                    <Form.Control
                                        name="billingStreet1"
                                        value={form.billingStreet1}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Street 2</Form.Label>
                                    <Form.Control
                                        name="billingStreet2"
                                        value={form.billingStreet2}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>City</Form.Label>
                                    <Form.Control
                                        name="billingCity"
                                        value={form.billingCity}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Province</Form.Label>
                                    <Form.Control
                                        name="billingProvince"
                                        value={form.billingProvince}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Postal Code</Form.Label>
                                    <Form.Control
                                        name="billingPostalCode"
                                        value={form.billingPostalCode}
                                        onChange={handleChange}
                                        required
                                        maxLength={7}
                                        placeholder="T2P 1A1"
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Country</Form.Label>
                                    <Form.Control
                                        name="billingCountry"
                                        value={form.billingCountry}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={12}>
                                <Form.Check
                                    type="checkbox"
                                    name="sameAsBilling"
                                    label="Service address is the same as billing address"
                                    checked={form.sameAsBilling}
                                    onChange={handleChange}
                                    className="mt-2"
                                />
                            </Col>

                            {!form.sameAsBilling && (
                                <>
                                    <Col md={12}>
                                        <hr className="my-2" />
                                        <h5 className="mb-3">Service Address</h5>
                                    </Col>

                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label>Street 1</Form.Label>
                                            <Form.Control
                                                name="serviceStreet1"
                                                value={form.serviceStreet1}
                                                onChange={handleChange}
                                                required={!form.sameAsBilling}
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label>Street 2</Form.Label>
                                            <Form.Control
                                                name="serviceStreet2"
                                                value={form.serviceStreet2}
                                                onChange={handleChange}
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>City</Form.Label>
                                            <Form.Control
                                                name="serviceCity"
                                                value={form.serviceCity}
                                                onChange={handleChange}
                                                required={!form.sameAsBilling}
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Province</Form.Label>
                                            <Form.Control
                                                name="serviceProvince"
                                                value={form.serviceProvince}
                                                onChange={handleChange}
                                                required={!form.sameAsBilling}
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Postal Code</Form.Label>
                                            <Form.Control
                                                name="servicePostalCode"
                                                value={form.servicePostalCode}
                                                onChange={handleChange}
                                                required={!form.sameAsBilling}
                                                maxLength={7}
                                                placeholder="T2P 1A1"
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Country</Form.Label>
                                            <Form.Control
                                                name="serviceCountry"
                                                value={form.serviceCountry}
                                                onChange={handleChange}
                                                required={!form.sameAsBilling}
                                            />
                                        </Form.Group>
                                    </Col>
                                </>
                            )}
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