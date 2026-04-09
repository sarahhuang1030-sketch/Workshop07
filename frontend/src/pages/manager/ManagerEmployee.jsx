import React, { useEffect, useMemo, useState } from "react";
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
    emailRegex,
    digitsOnly,
    formatPhoneFromDigits,
} from "../validation/Validation";

const emptyForm = {
    primaryLocationId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    salary: "",
    hireDate: "",
    status: "Active",
    active: 1,
    managerId: "",
};

export default function ManageEmployee({ darkMode = false }) {
    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [locations, setLocations] = useState([]);
    const [managers, setManagers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [formErrors, setFormErrors] = useState({});

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [search, setSearch] = useState("");
    const [createdCredentials, setCreatedCredentials] = useState(null);

    const navigate = useNavigate();

    const today = new Date();
    const currentYear = today.getFullYear();
    const todayStr = today.toISOString().split("T")[0];
    const endOfYearStr = `${currentYear}-12-31`;

    const isFutureHireDate = useMemo(() => {
        return !!form.hireDate && form.hireDate > todayStr;
    }, [form.hireDate, todayStr]);

    const isEditingInactiveEmployee = useMemo(() => {
        if (!editingId) return false;
        return String(form.status).toLowerCase() === "inactive" || Number(form.active) === 0;
    }, [editingId, form.status, form.active]);

    const loadEmployees = async () => {
        const res = await apiFetch("/api/manager/employees");
        if (!res.ok) throw new Error(`Failed to load employees: ${res.status}`);
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : []);
    };

    const loadRoles = async () => {
        const res = await apiFetch("/api/roles");
        if (!res.ok) throw new Error(`Failed to load roles: ${res.status}`);
        const data = await res.json();
        setRoles(Array.isArray(data) ? data : []);
    };

    const loadLocations = async () => {
        const res = await apiFetch("/api/manager/location");
        if (!res.ok) throw new Error(`Failed to load locations: ${res.status}`);
        const data = await res.json();
        setLocations(Array.isArray(data) ? data : []);
    };

    const loadManagers = async () => {
        const res = await apiFetch("/api/manager/employees");
        if (!res.ok) throw new Error(`Failed to load managers: ${res.status}`);
        const data = await res.json();

        const managerList = (Array.isArray(data) ? data : []).filter(
            (emp) =>
                String(emp.role || "").trim().toLowerCase() === "manager"
        );

        setManagers(managerList);
    };

    const loadAll = async () => {
        try {
            setLoading(true);
            setError("");
            await Promise.all([loadEmployees(), loadRoles(), loadLocations(), loadManagers()]);
        } catch (err) {
            console.error(err);
            setError("Unable to load employee data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, []);

    const openCreate = () => {
        setEditingId(null);
        setCreatedCredentials(null);
        setFormErrors({});
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (employee) => {
        setCreatedCredentials(null);
        setFormErrors({});
        setEditingId(employee.employeeId);

        setForm({
            primaryLocationId: employee.primaryLocationId ?? "",
            firstName: employee.firstName ?? "",
            lastName: employee.lastName ?? "",
            email: employee.email ?? "",
            phone: employee.phone ?? "",
            role: employee.role ?? "",
            salary: employee.salary ?? "",
            hireDate: employee.hireDate ?? "",
            status: employee.status ?? "Active",
            active: employee.active ?? 1,
            managerId: employee.managerId ?? "",
        });

        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;
        setShowModal(false);
        setCreatedCredentials(null);
        setFormErrors({});
        setForm(emptyForm);
        setEditingId(null);
    };

    const validateEmployeeForm = () => {
        const errors = {};

        if (!form.firstName?.trim()) errors.firstName = "First name is required.";
        if (!form.lastName?.trim()) errors.lastName = "Last name is required.";

        if (!form.email?.trim()) {
            errors.email = "Email is required.";
        } else if (!emailRegex.test(form.email.trim())) {
            errors.email = "Enter a valid email address.";
        }

        const phoneDigits = digitsOnly(form.phone);
        if (!phoneDigits) {
            errors.phone = "Phone is required.";
        } else if (phoneDigits.length !== 10) {
            errors.phone = "Phone must be 10 digits.";
        }

        if (!form.role?.trim()) errors.role = "Role is required.";

        if (!form.salary && form.salary !== 0) {
            errors.salary = "Salary is required.";
        } else if (Number(form.salary) <= 0) {
            errors.salary = "Salary must be greater than 0.";
        }

        if (!form.hireDate) {
            errors.hireDate = "Hire date is required.";
        } else {
            const hireYear = new Date(form.hireDate).getFullYear();

            if (hireYear !== currentYear) {
                errors.hireDate = `Hire date must be within ${currentYear}.`;
            } else if (form.hireDate > endOfYearStr) {
                errors.hireDate = `Hire date must be within ${currentYear}.`;
            }
        }

        if (!form.primaryLocationId) {
            errors.primaryLocationId = "Primary location is required.";
        }

        // if (String(form.role).trim().toLowerCase() !== "manager" && !form.managerId) {
        //     errors.managerId = "Manager is required.";
        // }

        return errors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        let nextValue = value;

        if (name === "phone") {
            nextValue = formatPhoneFromDigits(digitsOnly(value));
        }

        setForm((prev) => {
            const updated = {
                ...prev,
                [name]: nextValue,
            };

            if (name === "hireDate") {
                const future = !!value && value > todayStr;
                updated.status = future ? "Inactive" : "Active";
                updated.active = future ? 0 : 1;
            }

            if (name === "role" && String(value).trim().toLowerCase() === "manager") {
                updated.managerId = "";
            }

            if (name === "status") {
                updated.active = String(value).toLowerCase() === "inactive" ? 0 : 1;
            }

            if (name === "active") {
                updated.status = Number(value) === 0 ? "Inactive" : "Active";
            }

            return updated;
        });

        setFormErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (isEditingInactiveEmployee) {
            setError("Inactive employees cannot be edited.");
            return;
        }

        const errors = validateEmployeeForm();
        setFormErrors(errors);

        if (Object.keys(errors).length > 0) return;

        try {
            setSaving(true);
            setError("");

            const payload = {
                ...form,
                phone: formatPhoneFromDigits(digitsOnly(form.phone)),
                salary: Number(form.salary),
                primaryLocationId: form.primaryLocationId ? Number(form.primaryLocationId) : null,
                managerId: form.managerId ? Number(form.managerId) : null,
                active: Number(form.active),
            };

            const url = editingId
                ? `/api/manager/employees/${editingId}`
                : "/api/manager/employees";

            const method = editingId ? "PUT" : "POST";

            const res = await apiFetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || `Save failed: ${res.status}`);
            }

            const data = await res.json();

            if (editingId) {
                setShowModal(false);
                setCreatedCredentials(null);
            } else {
                setCreatedCredentials({
                    firstName: data.firstName,
                    lastName: data.lastName,
                    username: data.username,
                    tempPassword: data.tempPassword,
                });
            }

            await loadAll();
        } catch (err) {
            console.error(err);
            setError(err.message || "Unable to save employee.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (employeeId) => {
        const confirmed = window.confirm("Delete this employee?");
        if (!confirmed) return;

        try {
            setError("");

            const res = await apiFetch(`/api/manager/employees/${employeeId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error(`Delete failed: ${res.status}`);
            }

            await loadAll();
        } catch (err) {
            console.error(err);
            setError("Unable to delete employee.");
        }
    };

    const filteredEmployees = employees.filter((emp) => {
        const keyword = search.toLowerCase();

        return (
            String(emp.employeeId ?? "").toLowerCase().includes(keyword) ||
            String(emp.firstName ?? "").toLowerCase().includes(keyword) ||
            String(emp.lastName ?? "").toLowerCase().includes(keyword) ||
            String(emp.email ?? "").toLowerCase().includes(keyword) ||
            String(emp.phone ?? "").toLowerCase().includes(keyword) ||
            String(emp.role ?? "").toLowerCase().includes(keyword) ||
            String(emp.status ?? "").toLowerCase().includes(keyword) ||
            String(emp.primaryLocationName ?? "").toLowerCase().includes(keyword) ||
            String(emp.managerName ?? "").toLowerCase().includes(keyword)
        );
    });

    const cardBase = darkMode
        ? "bg-dark text-light border-secondary"
        : "bg-white text-dark";

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 className="mb-1">Manage Employees</h2>
                    <div className={darkMode ? "text-light-50" : "text-muted"}>
                        Create, update, and remove employee records.
                    </div>
                </div>

                <div className="d-flex gap-2">
                    <Form.Control
                        className="w-auto"
                        type="text"
                        placeholder="Search employees..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ minWidth: "240px" }}
                    />
                    <Button onClick={openCreate} style={{ borderRadius: 12 }}>
                        Add Employee
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
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Hire Date</th>
                                <th>Salary (Yearly)</th>
                                <th>Location</th>
                                <th>Manager</th>
                                <th style={{ width: 180 }}>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan="11" className="text-center py-4">
                                        No employees found.
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((emp) => {
                                    const locked =
                                        String(emp.status || "").toLowerCase() === "inactive" ||
                                        Number(emp.active) === 0;

                                    return (
                                        <tr key={emp.employeeId}>
                                            <td>{emp.employeeId}</td>
                                            <td>{emp.firstName} {emp.lastName}</td>
                                            <td>{emp.email}</td>
                                            <td>{emp.phone || "—"}</td>
                                            <td>{emp.role}</td>
                                            <td>{emp.status || "—"}</td>
                                            <td>{emp.hireDate || "—"}</td>
                                            <td>
                                                {emp.salary != null
                                                    ? `$${Number(emp.salary).toLocaleString()}`
                                                    : "—"}
                                            </td>
                                            <td>{emp.primaryLocationName || "—"}</td>
                                            <td>{emp.managerName || "—"}</td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline-primary"
                                                        onClick={() => openEdit(emp)}
                                                        disabled={locked}
                                                        title={locked ? "Inactive employees cannot be edited." : ""}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline-danger"
                                                        onClick={() => handleDelete(emp.employeeId)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={closeModal} centered>
                <Form onSubmit={handleSave}>
                    <Modal.Header closeButton={!saving}>
                        <Modal.Title>{editingId ? "Edit Employee" : "Add Employee"}</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        {createdCredentials && (
                            <Alert variant="success">
                                <div className="fw-bold mb-2">Employee created successfully.</div>
                                <div>
                                    Name: {createdCredentials.firstName} {createdCredentials.lastName}
                                </div>
                                <div>
                                    Username: <strong>{createdCredentials.username}</strong>
                                </div>
                                <div>
                                    Temporary Password: <strong>{createdCredentials.tempPassword}</strong>
                                </div>
                                <div className="mt-2">
                                    Please copy these credentials now and give them to the employee.
                                </div>
                            </Alert>
                        )}

                        {editingId && isEditingInactiveEmployee && (
                            <Alert variant="warning">
                                This employee is inactive and cannot be edited.
                            </Alert>
                        )}

                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>First Name</Form.Label>
                                    <Form.Control
                                        name="firstName"
                                        value={form.firstName}
                                        onChange={handleChange}
                                        isInvalid={!!formErrors.firstName}
                                        disabled={isEditingInactiveEmployee}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.firstName}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Last Name</Form.Label>
                                    <Form.Control
                                        name="lastName"
                                        value={form.lastName}
                                        onChange={handleChange}
                                        isInvalid={!!formErrors.lastName}
                                        disabled={isEditingInactiveEmployee}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.lastName}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        isInvalid={!!formErrors.email}
                                        disabled={isEditingInactiveEmployee}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.email}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Phone</Form.Label>
                                    <Form.Control
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="(403) 555-1234"
                                        isInvalid={!!formErrors.phone}
                                        disabled={isEditingInactiveEmployee}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.phone}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Role</Form.Label>
                                    <Form.Select
                                        name="role"
                                        value={form.role}
                                        onChange={handleChange}
                                        isInvalid={!!formErrors.role}
                                        disabled={isEditingInactiveEmployee}
                                    >
                                        <option value="">Select role</option>
                                        {roles
                                            .filter((role) => role.roleName !== "Customer")
                                            .map((role) => (
                                                <option key={role.roleId} value={role.roleName}>
                                                    {role.roleName}
                                                </option>
                                            ))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.role}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Status</Form.Label>
                                    <Form.Control
                                        value={form.status}
                                        disabled
                                        readOnly
                                    />
                                    {/*<Form.Text muted>*/}
                                    {/*    Future hire dates are automatically set to Inactive.*/}
                                    {/*</Form.Text>*/}
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Hire Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="hireDate"
                                        value={form.hireDate}
                                        min={`${currentYear}-01-01`}
                                        max={endOfYearStr}
                                        onChange={handleChange}
                                        isInvalid={!!formErrors.hireDate}
                                        disabled={isEditingInactiveEmployee}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.hireDate}
                                    </Form.Control.Feedback>
                                    {/*<Form.Text muted>*/}
                                    {/*    Hire date can be today or a future date, but only within {currentYear}.*/}
                                    {/*</Form.Text>*/}
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Salary (Yearly)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="salary"
                                        value={form.salary}
                                        onChange={handleChange}
                                        isInvalid={!!formErrors.salary}
                                        disabled={isEditingInactiveEmployee}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.salary}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Primary Location</Form.Label>
                                    <Form.Select
                                        name="primaryLocationId"
                                        value={form.primaryLocationId}
                                        onChange={handleChange}
                                        isInvalid={!!formErrors.primaryLocationId}
                                        disabled={isEditingInactiveEmployee}
                                    >
                                        <option value="">Select location</option>
                                        {locations.map((loc) => (
                                            <option key={loc.locationId} value={loc.locationId}>
                                                {loc.locationName}
                                            </option>
                                        ))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.primaryLocationId}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Manager</Form.Label>
                                    <Form.Select
                                        name="managerId"
                                        value={form.managerId}
                                        onChange={handleChange}
                                        isInvalid={!!formErrors.managerId}
                                        disabled={
                                            isEditingInactiveEmployee ||
                                            String(form.role).trim().toLowerCase() === "manager"
                                        }
                                    >
                                        <option value="">
                                            {String(form.role).trim().toLowerCase() === "manager"
                                                ? "Managers do not need a manager"
                                                : "Select manager"}
                                        </option>
                                        {managers.map((mgr) => (
                                            <option key={mgr.employeeId} value={mgr.employeeId}>
                                                {mgr.firstName} {mgr.lastName}
                                            </option>
                                        ))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.managerId}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>

                    <Modal.Footer>
                        {createdCredentials ? (
                            <Button variant="primary" onClick={closeModal}>
                                Close
                            </Button>
                        ) : (
                            <>
                                <Button variant="secondary" onClick={closeModal} disabled={saving}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving || isEditingInactiveEmployee}
                                >
                                    {saving ? "Saving..." : editingId ? "Update" : "Create"}
                                </Button>
                            </>
                        )}
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}