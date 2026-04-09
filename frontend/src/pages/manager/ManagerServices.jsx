import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Container,
    Card,
    Button,
    Form,
    Table,
    Badge,
    Spinner,
    Alert,
    Modal,
    Row,
    Col,
} from "react-bootstrap";
import { apiFetch } from "../../services/api";

const REQUESTS_API = "/api/manager/service-requests";

export default function ManagerService({ darkMode = false }) {
    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);
    const [appointments, setAppointments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingRequest, setEditingRequest] = useState(null);

    const [showDetails, setShowDetails] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const [customers, setCustomers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [customerAddresses, setCustomerAddresses] = useState([]);

    const [formData, setFormData] = useState({
        customerId: "",
        createdByUserId: "",
        assignedTechnicianUserId: "",
        requestType: "",
        priority: "Medium",
        status: "",
        description: "",
    });

    const requestTypeOptions = ["Technical Support", "Billing Inquiry", "Installation", "Repair", "Upgrade", "Other"];
    const priorityOptions = ["Low", "Medium", "High"];
    const statusOptions = ["Open", "Assigned", "In Progress", "Completed", "Cancelled"];

    const cardBase = darkMode
        ? "bg-dark text-light border-secondary"
        : "bg-white text-dark";

    async function loadCustomers() {
        try {
            const res = await apiFetch("/api/manager/customers");
            if (!res.ok) throw new Error("Failed to load customers");

            const data = await res.json();
            setCustomers(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Failed to load customers");
        }
    }

    async function loadEmployees() {
        try {
            const res = await apiFetch("/api/manager/employees");
            if (!res.ok) throw new Error("Failed to load employees");

            const data = await res.json();
            setEmployees(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Failed to load employees");
        }
    }

    async function loadRequests() {
        try {
            setLoading(true);
            setError("");

            const res = await apiFetch(REQUESTS_API);
            if (!res.ok) {
                throw new Error(`Failed to load service requests: ${res.status}`);
            }

            const data = await res.json();
            setRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Failed to load service requests");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadRequests();
        loadCustomers();
        loadEmployees();
    }, []);

    const filteredRequests = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return requests;

        return requests.filter((req) =>
            [
                req.requestId,
                req.customerName,
                req.createdByName,
                req.technicianName,
                req.requestType,
                req.priority,
                req.status,
                req.description,
                req.createdAt,
            ]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
    }, [requests, search]);

    const createdByOptions = useMemo(() => {
        return employees.filter((employee) => {
            const role = String(
                employee.roleName ??
                employee.role ??
                employee.role?.roleName ??
                ""
            ).trim().toLowerCase();

            return role === "manager" || role === "sales agent";
        });
    }, [employees]);

    const technicianOptions = useMemo(() => {
        return employees.filter((employee) => {
            const role = String(
                employee.roleName ??
                employee.role ??
                employee.role?.roleName ??
                ""
            ).trim().toLowerCase();

            return role === "service technician" || role === "technician";
        });
    }, [employees]);

    function statusBadge(status) {
        const value = String(status || "").toLowerCase();

        if (value === "assigned") return "primary";
        if (value === "in progress") return "info";
        if (value === "completed") return "success";
        if (value === "cancelled") return "secondary";
        if (value === "open") return "warning";

        return "dark";
    }

    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);

    const [appointmentForm, setAppointmentForm] = useState({
        technicianUserId: "",
        addressId: "",
        locationId: "",
        locationType: "",
        scheduledStart: "",
        scheduledEnd: "",
        status: "Assigned",
        notes: "",
    });

    const appointmentStatusOptions = ["Assigned", "In Progress", "Completed", "Cancelled"];
    const locationTypeOptions = ["InStore", "Remote", "OnSite"];

    function handleAppointmentChange(e) {
        const { name, value } = e.target;
        setAppointmentForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function loadCustomerAddresses(customerId) {
        if (!customerId) {
            setCustomerAddresses([]);
            return;
        }

        try {
            const res = await apiFetch(`${REQUESTS_API}/customers/${customerId}/addresses`);
            if (!res.ok) throw new Error("Failed to load customer addresses");
            const data = await res.json();
            setCustomerAddresses(Array.isArray(data) ? data : []);
        } catch (err) {
            setCustomerAddresses([]);
            setError(err.message || "Failed to load customer addresses");
        }
    }

    async function reloadAppointmentsForSelectedRequest() {
        if (!selectedRequest?.requestId) return;

        const res = await apiFetch(
            `${REQUESTS_API}/${selectedRequest.requestId}/appointments`
        );

        if (!res.ok) {
            throw new Error("Failed to reload appointments");
        }

        const data = await res.json();
        setAppointments(Array.isArray(data) ? data : []);
        await loadRequests();
    }

    async function openCreateAppointmentModal() {
        setEditingAppointment(null);

        if (selectedRequest?.customerId) {
            await loadCustomerAddresses(selectedRequest.customerId);
        }

        setAppointmentForm({
            technicianUserId: selectedRequest?.assignedTechnicianUserId?.toString() ?? "",
            addressId: selectedRequest?.addressId?.toString() ?? "",
            locationId: "",
            locationType: "OnSite",
            scheduledStart: "",
            scheduledEnd: "",
            status: "Assigned",
            notes: "",
        });
        setShowAppointmentModal(true);
    }

    async function openEditAppointmentModal(appt) {
        setEditingAppointment(appt);

        if (selectedRequest?.customerId) {
            await loadCustomerAddresses(selectedRequest.customerId);
        }

        setAppointmentForm({
            technicianUserId: appt.technicianUserId?.toString() ?? "",
            addressId: appt.addressId?.toString() ?? "",
            locationId: appt.locationId?.toString() ?? "",
            locationType: appt.locationType ?? "OnSite",
            scheduledStart: appt.scheduledStart ? appt.scheduledStart.slice(0, 16) : "",
            scheduledEnd: appt.scheduledEnd ? appt.scheduledEnd.slice(0, 16) : "",
            status: appt.status ?? "Assigned",
            notes: appt.notes ?? "",
        });
        setShowAppointmentModal(true);
    }

    async function handleSaveAppointment(e) {
        e.preventDefault();

        if (!selectedRequest?.requestId) return;

        try {
            setSaving(true);
            setError("");

            const method = editingAppointment ? "PUT" : "POST";

            const url = editingAppointment
                ? `${REQUESTS_API}/${selectedRequest.requestId}/appointments/${editingAppointment.appointmentId}`
                : `${REQUESTS_API}/${selectedRequest.requestId}/appointments`;

            const res = await apiFetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...appointmentForm,
                    technicianUserId: appointmentForm.technicianUserId
                        ? Number(appointmentForm.technicianUserId)
                        : null,
                    addressId: appointmentForm.addressId
                        ? Number(appointmentForm.addressId)
                        : null,
                    locationId: appointmentForm.locationId
                        ? Number(appointmentForm.locationId)
                        : null
                })
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || `Failed to save appointment: ${res.status}`);
            }

            closeAppointmentModal();
            await reloadAppointmentsForSelectedRequest();
        } catch (err) {
            setError(err.message || "Failed to save appointment");
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteAppointment(appt) {
        if (!selectedRequest?.requestId) return;

        const confirmed = window.confirm(
            `Delete appointment #${appt.appointmentId}?`
        );
        if (!confirmed) return;

        try {
            setError("");

            const res = await apiFetch(
                `${REQUESTS_API}/${selectedRequest.requestId}/appointments/${appt.appointmentId}`,
                { method: "DELETE" }
            );

            if (!res.ok) {
                throw new Error(`Failed to delete appointment: ${res.status}`);
            }

            await reloadAppointmentsForSelectedRequest();
        } catch (err) {
            setError(err.message || "Failed to delete appointment");
        }
    }

    function closeAppointmentModal() {
        setShowAppointmentModal(false);
        setEditingAppointment(null);
    }

    function openCreateModal() {
        setEditingRequest(null);
        setFormData({
            customerId: "",
            createdByUserId: "",
            assignedTechnicianUserId: "",
            requestType: "",
            priority: "Medium",
            status: "Open",
            description: "",
        });
        setShowModal(true);
    }

    function openEditModal(req) {
        setEditingRequest(req);

        const normalizedPriority =
            req.priority === "Low" || req.priority === "Medium" || req.priority === "High"
                ? req.priority
                : "Medium";

        const normalizedStatus =
            req.status === "Open" ||
            req.status === "Assigned" ||
            req.status === "In Progress" ||
            req.status === "Completed" ||
            req.status === "Cancelled"
                ? req.status
                : "Open";

        setFormData({
            customerId: req.customerId?.toString() ?? "",
            createdByUserId: req.createdByUserId?.toString() ?? "",
            assignedTechnicianUserId: req.assignedTechnicianUserId?.toString() ?? "",
            requestType: req.requestType ?? "",
            priority: normalizedPriority,
            status: normalizedStatus,
            description: req.description ?? "",
        });

        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingRequest(null);
    }

    function closeDetails() {
        setShowDetails(false);
        setSelectedRequest(null);
        setAppointments([]);
        setCustomerAddresses([]);
    }

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function handleSave(e) {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");

            const method = editingRequest ? "PUT" : "POST";
            const url = editingRequest
                ? `${REQUESTS_API}/${editingRequest.requestId}`
                : REQUESTS_API;

            const payload = {
                customerId: formData.customerId ? Number(formData.customerId) : null,
                createdByUserId: formData.createdByUserId ? Number(formData.createdByUserId) : null,
                assignedTechnicianUserId: formData.assignedTechnicianUserId
                    ? Number(formData.assignedTechnicianUserId)
                    : null,
                requestType: formData.requestType,
                priority: formData.priority,
                status: formData.status,
                description: formData.description,
            };

            const res = await apiFetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(
                    msg || (
                        editingRequest
                            ? `Failed to update request: ${res.status}`
                            : `Failed to create request: ${res.status}`
                    )
                );
            }

            closeModal();
            await loadRequests();
        } catch (err) {
            setError(err.message || "Failed to save request");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(req) {
        const confirmed = window.confirm(
            `Delete service request #${req.requestId}?`
        );
        if (!confirmed) return;

        try {
            setError("");

            const res = await apiFetch(`${REQUESTS_API}/${req.requestId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error(`Failed to delete request: ${res.status}`);
            }

            await loadRequests();
        } catch (err) {
            setError(err.message || "Failed to delete request");
        }
    }

    async function openDetails(request) {
        try {
            setSelectedRequest(request);
            setShowDetails(true);
            setDetailsLoading(true);
            setError("");

            const res = await apiFetch(
                `${REQUESTS_API}/${request.requestId}/appointments`
            );

            if (!res.ok) {
                throw new Error(`Failed to load appointment details: ${res.status}`);
            }

            const data = await res.json();
            setAppointments(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Failed to load appointment details");
            setAppointments([]);
        } finally {
            setDetailsLoading(false);
        }
    }

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 className="mb-1">Manager Services</h2>
                    <div className={darkMode ? "text-light-50" : "text-muted"}>
                        View and manage service requests and appointment details.
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <Form.Control
                        type="text"
                        placeholder="Search service requests..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: "240px" }}
                    />
                    <Button onClick={openCreateModal}>Add Request</Button>
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
                        <div className="text-center py-4">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <Table responsive hover className="align-middle mb-0">
                            <thead>
                            <tr>
                                <th>Request ID</th>
                                <th>Customer</th>
                                <th>Created By</th>
                                <th>Assigned Technician</th>
                                <th>Request Type</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Description</th>
                                <th>Created At</th>
                                <th>Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredRequests.length > 0 ? (
                                filteredRequests.map((req) => (
                                    <tr key={req.requestId}>
                                        <td>{req.requestId}</td>
                                        <td>{req.customerName ?? "—"}</td>
                                        <td>{req.createdByName ?? "—"}</td>
                                        <td>{req.technicianName ?? "—"}</td>
                                        <td>{req.requestType || "—"}</td>
                                        <td>{req.priority || "—"}</td>
                                        <td>
                                            <Badge bg={statusBadge(req.status)}>
                                                {req.status || "—"}
                                            </Badge>
                                        </td>
                                        <td style={{ maxWidth: 280 }}>
                                            {req.description || "—"}
                                        </td>
                                        <td>
                                            {req.createdAt
                                                ? new Date(req.createdAt).toLocaleString()
                                                : "—"}
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2 flex-wrap">
                                                <Button
                                                    size="sm"
                                                    variant="outline-primary"
                                                    onClick={() => openDetails(req)}
                                                >
                                                    Details
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline-secondary"
                                                    onClick={() => openEditModal(req)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    onClick={() => handleDelete(req)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10" className="text-center py-4">
                                        No service requests found.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={closeModal} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingRequest ? "Edit Service Request" : "Add Service Request"}
                    </Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleSave}>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Customer</Form.Label>
                                    <Form.Select
                                        name="customerId"
                                        value={formData.customerId}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select customer</option>
                                        {customers.map((customer) => (
                                            <option key={customer.customerId} value={customer.customerId}>
                                                {customer.firstName} {customer.lastName}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Created By</Form.Label>
                                    <Form.Select
                                        name="createdByUserId"
                                        value={formData.createdByUserId}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select employee</option>
                                        {createdByOptions.map((employee) => (
                                            <option key={employee.employeeId} value={employee.userId}>
                                                {employee.firstName} {employee.lastName}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Assigned Technician</Form.Label>
                                    <Form.Select
                                        name="assignedTechnicianUserId"
                                        value={formData.assignedTechnicianUserId}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select technician</option>
                                        {technicianOptions.map((employee) => (
                                            <option key={employee.employeeId} value={employee.userId}>
                                                {employee.firstName} {employee.lastName}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Request Type</Form.Label>
                                    <Form.Select
                                        name="requestType"
                                        value={formData.requestType}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select request type</option>
                                        {requestTypeOptions.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Priority</Form.Label>
                                    <Form.Select
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleChange}
                                        required
                                    >
                                        {priorityOptions.map((priority) => (
                                            <option key={priority} value={priority}>
                                                {priority}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select status</option>
                                        {statusOptions.map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col xs={12}>
                                <Form.Group>
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving..." : editingRequest ? "Update" : "Create"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal show={showDetails} onHide={closeDetails} centered size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Service Appointment Details
                        {selectedRequest ? ` - Request #${selectedRequest.requestId}` : ""}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {detailsLoading ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" />
                        </div>
                    ) : appointments.length > 0 ? (
                        <Table responsive hover className="align-middle mb-0">
                            <thead>
                            <tr>
                                <th>Assigned Technician</th>
                                <th>Address</th>
                                <th>Location Type</th>
                                <th>Scheduled Start</th>
                                <th>Scheduled End</th>
                                <th>Status</th>
                                <th>Notes</th>
                                <th>Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {appointments.map((appt) => (
                                <tr key={appt.appointmentId}>
                                    <td>{appt.technicianName ?? "—"}</td>
                                    <td>{appt.addressText ?? "—"}</td>
                                    <td>{appt.locationType || "—"}</td>
                                    <td>
                                        {appt.scheduledStart
                                            ? new Date(appt.scheduledStart).toLocaleString()
                                            : "—"}
                                    </td>
                                    <td>
                                        {appt.scheduledEnd
                                            ? new Date(appt.scheduledEnd).toLocaleString()
                                            : "—"}
                                    </td>
                                    <td>
                                        <Badge bg={statusBadge(appt.status)}>
                                            {appt.status || "—"}
                                        </Badge>
                                    </td>
                                    <td>{appt.notes || "—"}</td>
                                    <td>
                                        <div className="d-flex gap-2 flex-wrap">
                                            <Button
                                                size="sm"
                                                variant="outline-secondary"
                                                onClick={() => openEditAppointmentModal(appt)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline-danger"
                                                onClick={() => handleDeleteAppointment(appt)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    ) : (
                        <div className="text-center py-3 text-muted">
                            No appointment details found for this request.
                        </div>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="primary" onClick={openCreateAppointmentModal}>
                        Add Appointment
                    </Button>
                    <Button variant="secondary" onClick={closeDetails}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showAppointmentModal} onHide={closeAppointmentModal} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingAppointment ? "Edit Service Appointment" : "Add Service Appointment"}
                    </Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleSaveAppointment}>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Assigned Technician</Form.Label>
                                    <Form.Select
                                        name="technicianUserId"
                                        value={appointmentForm.technicianUserId}
                                        onChange={handleAppointmentChange}
                                        required
                                    >
                                        <option value="">Select technician</option>
                                        {technicianOptions.map((employee) => (
                                            <option key={employee.employeeId} value={employee.userId}>
                                                {employee.firstName} {employee.lastName}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Location Type</Form.Label>
                                    <Form.Select
                                        name="locationType"
                                        value={appointmentForm.locationType}
                                        onChange={handleAppointmentChange}
                                        required
                                    >
                                        <option value="">Select location type</option>
                                        {locationTypeOptions.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Address</Form.Label>
                                    <Form.Select
                                        name="addressId"
                                        value={appointmentForm.addressId}
                                        onChange={handleAppointmentChange}
                                        required
                                    >
                                        <option value="">Select address</option>
                                        {customerAddresses.map((addr) => (
                                            <option key={addr.addressId} value={addr.addressId}>
                                                [{addr.addressType}] {addr.fullAddress}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Scheduled Start</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        name="scheduledStart"
                                        value={appointmentForm.scheduledStart}
                                        onChange={handleAppointmentChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Scheduled End</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        name="scheduledEnd"
                                        value={appointmentForm.scheduledEnd}
                                        onChange={handleAppointmentChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select
                                        name="status"
                                        value={appointmentForm.status}
                                        onChange={handleAppointmentChange}
                                        required
                                    >
                                        {appointmentStatusOptions.map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col xs={12}>
                                <Form.Group>
                                    <Form.Label>Notes</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="notes"
                                        value={appointmentForm.notes}
                                        onChange={handleAppointmentChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeAppointmentModal}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving..." : editingAppointment ? "Update" : "Create"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}