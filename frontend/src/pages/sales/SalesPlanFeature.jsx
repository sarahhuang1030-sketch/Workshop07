import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Card,
    Form,
    Table,
    Badge,
    Spinner,
    Alert,
    Button,
    Modal,
    Container,
} from "react-bootstrap";
import { apiFetch } from "../../services/api";

export default function SalesPlanFeature({ darkMode = false }) {
    const navigate = useNavigate();


    const API_BASE = `/api/manager/planfeatures`;

    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingFeature, setEditingFeature] = useState(null);

    const [plans, setPlans] = useState([]);
    const [templates, setTemplates] = useState([]);

    const [formData, setFormData] = useState({
        planId: "",
        featureName: "",
        featureValue: "",
        unit: "",
        sortOrder: "",
    });

    const cardClass = darkMode ? "bg-dark text-light border-secondary" : "bg-white";
    const tableClass = darkMode ? "table-dark" : "";

    async function loadFeatures() {
        try {
            setLoading(true);
            setError("");

            const res = await apiFetch(API_BASE);
            if (!res.ok) throw new Error("Failed to load plan features");

            const data = await res.json();
            setFeatures(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Failed to load plan features");
        } finally {
            setLoading(false);
        }
    }

    async function loadDependencies() {
        try {
            const [planRes, tempRes] = await Promise.all([
                apiFetch("/api/manager/plans"),
                apiFetch("/api/manager/plans/features/templates")
            ]);

            if (planRes.ok) {
                const data = await planRes.json();
                setPlans(Array.isArray(data) ? data : []);
            }
            if (tempRes.ok) {
                const data = await tempRes.json();
                setTemplates(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Failed to load dependencies", err);
        }
    }

    useEffect(() => {
        loadFeatures();
        loadDependencies();
    }, []);

    const filteredFeatures = useMemo(() => {
        const q = search.trim().toLowerCase();

        return features.filter((feature) => {
            return (
                !q ||
                [
                    feature.featureId,
                    feature.planId,
                    feature.featureName,
                    feature.featureValue,
                    feature.unit,
                    feature.sortOrder,
                ]
                    .filter((v) => v !== null && v !== undefined)
                    .some((v) => String(v).toLowerCase().includes(q))
            );
        });
    }, [features, search]);

    function openCreateModal() {
        setEditingFeature(null);
        setFormData({
            planId: "",
            featureName: "",
            featureValue: "",
            unit: "",
            sortOrder: "",
        });
        setShowModal(true);
    }

    function openEditModal(feature) {
        setEditingFeature(feature);
        setFormData({
            planId: feature.planId ?? "",
            featureName: feature.featureName ?? "",
            featureValue: feature.featureValue ?? "",
            unit: feature.unit ?? "",
            sortOrder: feature.sortOrder ?? "",
        });
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingFeature(null);
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

            const method = editingFeature ? "PUT" : "POST";
            const url = editingFeature
                ? `${API_BASE}/${editingFeature.featureId}`
                : API_BASE;

            const payload = {
                planId: formData.planId ? Number(formData.planId) : null,
                featureName: formData.featureName || "",
                featureValue: formData.featureValue || "",
                unit: formData.unit || null,
                sortOrder: formData.sortOrder ? Number(formData.sortOrder) : 0,
            };

            const res = await apiFetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to save plan feature");

            closeModal();
            await loadFeatures();
        } catch (err) {
            setError(err.message || "Failed to save plan feature");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(feature) {
        const confirmed = window.confirm(
            `Are you sure you want to delete feature #${feature.featureId}?`
        );

        if (!confirmed) return;

        try {
            setError("");

            const res = await apiFetch(`${API_BASE}/${feature.featureId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete plan feature");

            await loadFeatures();
        } catch (err) {
            setError(err.message || "Failed to delete plan feature");
        }
    }

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-start gap-3 mb-3 flex-wrap">
                <div>
                    <h2 className="mb-1">Manager Plan Features</h2>
                    <div className={darkMode ? "text-light-50" : "text-muted"}>
                        Manage plan feature records.
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <Form.Control
                        placeholder="Search feature, value, unit..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: 320 }}
                    />

                    <Button onClick={openCreateModal}>Add New</Button>

                    <Button
                        variant="outline-secondary"
                        onClick={() => navigate("/manager/plan")}
                        style={{ borderRadius: 12 }}
                    >
                        Go Back
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className={cardClass} style={{ borderRadius: 18 }}>
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <Table responsive hover className={`align-middle mb-0 ${tableClass}`}>
                            <thead>
                            <tr>
                                <th>Feature ID</th>
                                <th>Plan</th>
                                <th>Feature Name</th>
                                <th>Feature Value</th>
                                <th>Unit</th>
                                <th>Sort Order</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredFeatures.length > 0 ? (
                                filteredFeatures.map((feature) => (
                                    <tr key={feature.featureId}>
                                        <td>{feature.featureId ?? "—"}</td>
                                        <td>{feature.planName || (feature.planId ? `Plan #${feature.planId}` : "—")}</td>
                                        <td>
                                            <Badge bg="info">
                                                {feature.featureName || "—"}
                                            </Badge>
                                        </td>
                                        <td>{feature.featureValue || "—"}</td>
                                        <td>{feature.unit || "—"}</td>
                                        <td>{feature.sortOrder ?? 0}</td>
                                        <td>
                                            <div className="d-flex gap-2 flex-wrap">
                                                <Button
                                                    size="sm"
                                                    variant="outline-primary"
                                                    onClick={() => openEditModal(feature)}
                                                    disabled={!feature.featureId}
                                                >
                                                    Edit
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    onClick={() => handleDelete(feature)}
                                                    disabled={!feature.featureId}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center">
                                        No plan features found.
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
                        {editingFeature ? "Edit Plan Feature" : "Add Plan Feature"}
                    </Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleSave}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Plan</Form.Label>
                            <Form.Select
                                name="planId"
                                value={formData.planId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Plan</option>
                                {plans.map(p => (
                                    <option key={p.planId} value={p.planId}>
                                        {p.planName}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Feature Name</Form.Label>
                            <Form.Select
                                name="featureName"
                                value={formData.featureName}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const template = templates.find(t => t.featureName === val);
                                    if (template) {
                                        setFormData(prev => ({
                                            ...prev,
                                            featureName: val,
                                            featureValue: template.featureValue,
                                            unit: template.unit || ""
                                        }));
                                    } else {
                                        handleChange(e);
                                    }
                                }}
                                required
                            >
                                <option value="">Select or Enter Feature Name</option>
                                {templates.map((t, idx) => (
                                    <option key={idx} value={t.featureName}>{t.featureName}</option>
                                ))}
                            </Form.Select>
                            <Form.Control
                                className="mt-2"
                                placeholder="Or enter new feature name..."
                                type="text"
                                name="featureName"
                                value={formData.featureName}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Feature Value</Form.Label>
                            <Form.Control
                                type="text"
                                name="featureValue"
                                value={formData.featureValue}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Unit</Form.Label>
                            <Form.Control
                                type="text"
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                placeholder="Optional"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Sort Order</Form.Label>
                            <Form.Control
                                type="number"
                                name="sortOrder"
                                value={formData.sortOrder}
                                onChange={handleChange}
                            />
                        </Form.Group>
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