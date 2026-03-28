import React, { useEffect, useState } from "react";
import { Container, Card, Table, Button, Modal, Form, Row, Col, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
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
import { apiFetch } from "../../services/api";

export default function ManageEmployee({ darkMode = false }) {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [search, setSearch] = useState("");
    const [roles, setRoles] = useState([]);
    const [createdCredentials, setCreatedCredentials] = useState(null);

    const loadEmployees = async () => {
        try {
            setLoading(true);
            setError("");

            const res = await apiFetch("/api/manager/employees");

            if (!res.ok) {
                throw new Error(`Failed to load employees: ${res.status}`);
            }

            const data = await res.json();
            setEmployees(data);
        } catch (err) {
            console.error(err);
            setError("Unable to load employees.");
        } finally {
            setLoading(false);
        }
    };



    const loadRoles = async () => {
        try {
            const res = await apiFetch("/api/roles");

            if (!res.ok) {
                throw new Error(`Failed to load roles: ${res.status}`);
            }

            const data = await res.json();
            setRoles(data);
        } catch (err) {
            console.error(err);
            setError("Unable to load roles.");
        }
    };

    useEffect(() => {
        loadEmployees();
        loadRoles();
    }, []);

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setCreatedCredentials(null);
        setShowModal(true);
    };

    const openEdit = (employee) => {
        setCreatedCredentials(null);
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
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");

            const url = editingId
                ? `/api/manager/employees/${editingId}`
                : "/api/manager/employees";

            const method = editingId ? "PUT" : "POST";

            const res = await apiFetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                throw new Error(`Save failed: ${res.status}`);
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

            await loadEmployees();
        } catch (err) {
            console.error(err);
            setError("Unable to save employee.");
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

            await loadEmployees();
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
            String(emp.status ?? "").toLowerCase().includes(keyword)
        );
    });

    const cardBase = darkMode ? "bg-dark text-light border-secondary" : "bg-white text-dark";

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
                        className={"w-auto"}
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

                                <th>Manager ID</th>
                                {/*<th>Active</th>*/}
                                <th style={{ width: 180 }}>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan="13" className="text-center py-4">
                                        No employees found.
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <tr key={emp.employeeId}>
                                        <td>{emp.employeeId}</td>
                                        <td>{emp.firstName} {emp.lastName}</td>
                                        <td>{emp.email}</td>
                                        <td>{emp.phone || "—"}</td>
                                        <td>{emp.role}</td>
                                        <td>{emp.status || "—"}</td>
                                        <td>{emp.hireDate || "—"}</td>
                                        <td>{emp.salary != null ? `$${Number(emp.salary).toLocaleString()}` : "—"}</td>
                                        <td>{emp.primaryLocationId ?? "—"}</td>

                                        <td>{emp.managerId ?? "—"}</td>
                                        {/*<td>{emp.active === 1 ? "Yes" : "No"}</td>*/}
                                        <td>
                                            <div className="d-flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline-primary"
                                                    onClick={() => openEdit(emp)}
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

                        <Row className="g-3">
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

                            <Col md={6}>
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

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Phone</Form.Label>
                                    <Form.Control
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Role</Form.Label>
                                    <Form.Select
                                        name="role"
                                        value={form.role}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select role</option>
                                        {roles
                                            .filter((role) => role.roleName !== "Customer")
                                            .map((role) => (
                                                <option
                                                    key={role.roleId}
                                                    value={role.roleName}
                                                >
                                                    {role.roleName}
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
                                        value={form.status}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="On Leave">On Leave</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Hire Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="hireDate"
                                        value={form.hireDate}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Salary (Yearly)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        name="salary"
                                        value={form.salary}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Primary Location ID</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="primaryLocationId"
                                        value={form.primaryLocationId}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>



                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Manager ID</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="managerId"
                                        value={form.managerId}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Active</Form.Label>
                                    <Form.Select
                                        name="active"
                                        value={form.active}
                                        onChange={handleChange}
                                    >
                                        <option value={1}>Yes</option>
                                        <option value={0}>No</option>
                                    </Form.Select>
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
                                <Button type="submit" disabled={saving}>
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