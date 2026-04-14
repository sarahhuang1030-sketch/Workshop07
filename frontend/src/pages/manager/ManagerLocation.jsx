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

const API_BASE = "/api/manager/location";

export default function ManagerLocation({ darkMode = false }) {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        locationName: "",
        locationType: "",
        street1: "",
        street2: "",
        city: "",
        province: "",
        postalCode: "",
        country: "",
        phone: "",
        isActive: true,
    });

    const cardBase = darkMode
        ? "bg-dark text-light border-secondary"
        : "bg-white text-dark";

    async function loadLocations() {
        try {
            setLoading(true);
            setError("");

            const res = await apiFetch(API_BASE);
            if (!res.ok) throw new Error("Failed to load locations");

            const data = await res.json();
            setLocations(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Failed to load locations");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadLocations();
    }, []);

    const filteredLocations = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return locations;

        return locations.filter((location) =>
            [
                location.locationId,
                location.locationName,
                location.locationType,
                location.street1,
                location.street2,
                location.city,
                location.province,
                location.postalCode,
                location.country,
                location.phone,
            ]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
    }, [locations, search]);

    function openCreateModal() {
        setEditingLocation(null);
        setFormData({
            locationName: "",
            locationType: "",
            street1: "",
            street2: "",
            city: "",
            province: "",
            postalCode: "",
            country: "",
            phone: "",
            isActive: true,
        });
        setShowModal(true);
    }

    function openEditModal(location) {
        setEditingLocation(location);
        setFormData({
            locationName: location.locationName ?? "",
            locationType: location.locationType ?? "",
            street1: location.street1 ?? "",
            street2: location.street2 ?? "",
            city: location.city ?? "",
            province: location.province ?? "",
            postalCode: location.postalCode ?? "",
            country: location.country ?? "",
            phone: location.phone ?? "",
            isActive: !!location.isActive,
        });
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingLocation(null);
    }

    function handleChange(e) {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    async function handleSave(e) {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");

            const method = editingLocation ? "PUT" : "POST";
            const url = editingLocation
                ? `${API_BASE}/${editingLocation.locationId}`
                : API_BASE;

            const payload = {
                locationName: formData.locationName,
                locationType: formData.locationType,
                street1: formData.street1 || null,
                street2: formData.street2 || null,
                city: formData.city || null,
                province: formData.province || null,
                postalCode: formData.postalCode || null,
                country: formData.country || null,
                phone: formData.phone || null,
                isActive: formData.isActive,
            };

            const res = await apiFetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to save location");

            closeModal();
            await loadLocations();
        } catch (err) {
            setError(err.message || "Failed to save location");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(location) {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${location.locationName}"?`
        );
        if (!confirmed) return;

        try {
            setError("");

            const res = await apiFetch(`${API_BASE}/${location.locationId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error("Failed to delete location");
            }

            await loadLocations();
        } catch (err) {
            setError(err.message || "Failed to delete location");
        }
    }

    async function toggleActive(location) {
        try {
            setError("");

            const res = await apiFetch(`${API_BASE}/${location.locationId}/active`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !location.isActive }),
            });

            if (!res.ok) throw new Error("Failed to update location status");

            await loadLocations();
        } catch (err) {
            setError(err.message || "Failed to update location status");
        }
    }

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 className="mb-1">Manager Locations</h2>
                    <div className={darkMode ? "text-light-50" : "text-muted"}>
                        Manage SJY Telecom locations.
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <Form.Control
                        type="text"
                        placeholder="Search locations..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: "220px" }}
                    />
                    <Button onClick={openCreateModal}>Add Location</Button>
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
                                <th>ID</th>
                                <th>Location Name</th>
                                <th>Type</th>
                                <th>City</th>
                                <th>Province</th>
                                <th>Country</th>
                                <th>Phone</th>
                                <th>Active</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredLocations.length > 0 ? (
                                filteredLocations.map((location) => (
                                    <tr key={location.locationId}>
                                        <td>{location.locationId}</td>
                                        <td>{location.locationName}</td>
                                        <td>{location.locationType || "—"}</td>
                                        <td>{location.city || "—"}</td>
                                        <td>{location.province || "—"}</td>
                                        <td>{location.country || "—"}</td>
                                        <td>{location.phone || "—"}</td>
                                        <td>
                                            <Badge bg={location.isActive ? "success" : "secondary"}>
                                                {location.isActive ? "Yes" : "No"}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2 flex-wrap">
                                                <Button
                                                    size="sm"
                                                    variant="outline-primary"
                                                    onClick={() => openEditModal(location)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={
                                                        location.isActive
                                                            ? "outline-danger"
                                                            : "outline-success"
                                                    }
                                                    onClick={() => toggleActive(location)}
                                                >
                                                    {location.isActive ? "Deactivate" : "Activate"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    onClick={() => handleDelete(location)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" className="text-center py-4">
                                        No locations found.
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
                        {editingLocation ? "Edit Location" : "Add Location"}
                    </Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleSave}>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Location Name</Form.Label>
                                    <Form.Control
                                        name="locationName"
                                        value={formData.locationName}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Location Type</Form.Label>
                                    <Form.Select
                                        name="locationType"
                                        value={formData.locationType}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select location type</option>
                                        <option value="SalesPoint">SalesPoint</option>
                                        <option value="Warehouse">Warehouse</option>
                                        <option value="Office">Office</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Street 1</Form.Label>
                                    <Form.Control
                                        name="street1"
                                        value={formData.street1}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Street 2</Form.Label>
                                    <Form.Control
                                        name="street2"
                                        value={formData.street2}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>City</Form.Label>
                                    <Form.Control
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Province</Form.Label>
                                    <Form.Control
                                        name="province"
                                        value={formData.province}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Postal Code</Form.Label>
                                    <Form.Control
                                        name="postalCode"
                                        value={formData.postalCode}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Country</Form.Label>
                                    <Form.Control
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Phone</Form.Label>
                                    <Form.Control
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12}>
                                <Form.Check
                                    type="checkbox"
                                    label="Active"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                />
                            </Col>
                        </Row>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Save"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}