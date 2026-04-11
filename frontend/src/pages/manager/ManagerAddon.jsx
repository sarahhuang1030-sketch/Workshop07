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
} from "react-bootstrap";
import { apiFetch } from "../../services/api";

const API_BASE = "/api/manager/addons";

export default function ManagerAddon({ darkMode = false }) {
    const [addons, setAddons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingAddon, setEditingAddon] = useState(null);

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        serviceTypeId: "",
        addOnName: "",
        monthlyPrice: "",
        description: "",
        isActive: true,
        iconKey: "",
        themeKey: "",
    });

    const cardBase = darkMode
        ? "bg-dark text-light border-secondary"
        : "bg-white text-dark";

    async function loadAddons() {
        try {
            setLoading(true);
            setError("");

            const res = await apiFetch(API_BASE);
            if (!res.ok) throw new Error("Failed to load add-ons");

            const data = await res.json();
            setAddons(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Failed to load add-ons");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAddons();
    }, []);

    const filteredAddons = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return addons;

        return addons.filter((addon) =>
            [
                addon.addOnName,
                addon.description,
                addon.iconKey,
                addon.themeKey,
                addon.serviceTypeId,
            ]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
    }, [addons, search]);

    function openCreateModal() {
        setEditingAddon(null);
        setFormData({
            serviceTypeId: "",
            addOnName: "",
            monthlyPrice: "",
            description: "",
            isActive: true,
            iconKey: "",
            themeKey: "",
        });
        setShowModal(true);
    }

    function openEditModal(addon) {
        setEditingAddon(addon);
        setFormData({
            serviceTypeId: addon.serviceTypeId ?? "",
            addOnName: addon.addOnName ?? "",
            monthlyPrice: addon.monthlyPrice ?? "",
            description: addon.description ?? "",
            isActive: !!addon.isActive,
            iconKey: addon.iconKey ?? "",
            themeKey: addon.themeKey ?? "",
        });
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingAddon(null);
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

            const method = editingAddon ? "PUT" : "POST";
            const url = editingAddon
                ? `${API_BASE}/${editingAddon.addOnId}`
                : API_BASE;

            const payload = {
                serviceTypeId: formData.serviceTypeId
                    ? Number(formData.serviceTypeId)
                    : null,
                addOnName: formData.addOnName,
                monthlyPrice: Number(formData.monthlyPrice),
                description: formData.description || null,
                isActive: formData.isActive,
                iconKey: formData.iconKey || null,
                themeKey: formData.themeKey || null,
            };

            const res = await apiFetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to save add-on");

            closeModal();
            await loadAddons();
        } catch (err) {
            setError(err.message || "Failed to save add-on");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(addon) {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${addon.addOnName}"?`
        );
        if (!confirmed) return;

        try {
            setError("");

            const res = await apiFetch(`${API_BASE}/${addon.addOnId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error("Failed to delete add-on");
            }

            await loadAddons();
        } catch (err) {
            setError(err.message || "Failed to delete add-on");
        }
    }

    async function toggleActive(addon) {
        try {
            setError("");

            const res = await apiFetch(`${API_BASE}/${addon.addOnId}/active`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !addon.isActive }),
            });

            if (!res.ok) throw new Error("Failed to update add-on status");

            await loadAddons();
        } catch (err) {
            setError(err.message || "Failed to update add-on status");
        }
    }

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 className="mb-1">Manager Add-ons</h2>
                    <div className={darkMode ? "text-light-50" : "text-muted"}>
                        Manage SJY Telecom add-ons.
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <Form.Control
                        type="text"
                        placeholder="Search add-ons..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: "220px" }}
                    />
                    <Button onClick={openCreateModal}>Add Add-on</Button>
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
                                <th>Service Type</th>
                                <th>Add-on Name</th>
                                <th>Monthly Price</th>
                                <th>Description</th>
                                <th>Active</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredAddons.length > 0 ? (
                                filteredAddons.map((addon) => (
                                    <tr key={addon.addOnId}>
                                        <td>{addon.addOnId}</td>
                                        <td>{addon.serviceTypeName || (addon.serviceTypeId ? `Type #${addon.serviceTypeId}` : "—")}</td>
                                        <td>{addon.addOnName}</td>
                                        <td>
                                            ${Number(addon.monthlyPrice || 0).toFixed(2)}
                                        </td>
                                        <td>{addon.description || "—"}</td>
                                        <td>
                                            <Badge bg={addon.isActive ? "success" : "secondary"}>
                                                {addon.isActive ? "Yes" : "No"}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2 flex-wrap">
                                                <Button
                                                    size="sm"
                                                    variant="outline-primary"
                                                    onClick={() => openEditModal(addon)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={
                                                        addon.isActive
                                                            ? "outline-danger"
                                                            : "outline-success"
                                                    }
                                                    onClick={() => toggleActive(addon)}
                                                >
                                                    {addon.isActive ? "Deactivate" : "Activate"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    onClick={() => handleDelete(addon)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center py-4">
                                        No add-ons found.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={closeModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingAddon ? "Edit Add-on" : "Add Add-on"}
                    </Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleSave}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Service Type</Form.Label>
                            <Form.Control
                                type="number"
                                name="serviceTypeId"
                                value={formData.serviceTypeId}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Add-on Name</Form.Label>
                            <Form.Control
                                name="addOnName"
                                value={formData.addOnName}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Monthly Price</Form.Label>
                            <Form.Control
                                type="number"
                                step="0.01"
                                min="0"
                                name="monthlyPrice"
                                value={formData.monthlyPrice}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Icon Key</Form.Label>
                            <Form.Control
                                name="iconKey"
                                value={formData.iconKey}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Theme Key</Form.Label>
                            <Form.Control
                                name="themeKey"
                                value={formData.themeKey}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        <Form.Check
                            type="checkbox"
                            label="Active"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                        />
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