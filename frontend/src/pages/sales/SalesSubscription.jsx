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

const API_BASE = "/api/manager/subscriptions";

export default function SalesSubscription({ darkMode = false }) {
    const navigate = useNavigate();

    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [showModal, setShowModal] = useState(false);
    const [editingSubscription, setEditingSubscription] = useState(null);

    const [formData, setFormData] = useState({
        customerId: "",
        planId: "",
        startDate: "",
        endDate: "",
        status: "Active",
        billingCycleDay: "",
        notes: "",
    });

    const cardClass = darkMode ? "bg-dark text-light border-secondary" : "bg-white";
    const tableClass = darkMode ? "table-dark" : "";

    async function loadSubscriptions() {
        try {
            setLoading(true);
            setError("");

            const res = await apiFetch(API_BASE);
            if (!res.ok) throw new Error("Failed to load subscriptions");

            const data = await res.json();
            setSubscriptions(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Failed to load subscriptions");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadSubscriptions();
    }, []);

    const filteredSubscriptions = useMemo(() => {
        return subscriptions.filter((sub) => {
            const matchesStatus =
                statusFilter === "All" ||
                String(sub.status || "").toLowerCase() === statusFilter.toLowerCase();

            const q = search.trim().toLowerCase();


            const addonsText = Array.isArray(sub.addons)
                ? sub.addons
                    .map((a) => `${a.addOnName || ""} ${a.status || ""}`)
                    .join(" ")
                : "";

            const matchesSearch =
                !q ||
                [
                    sub.subscriptionId,
                    sub.customerId,
                    sub.planId,
                    sub.status,
                    sub.notes,
                    sub.startDate,
                    sub.endDate,
                    sub.billingCycleDay,
                    addonsText,
                ]
                    .filter(Boolean)
                    .some((v) => String(v).toLowerCase().includes(q));

            return matchesStatus && matchesSearch;
        });
    }, [subscriptions, search, statusFilter]);

    function openCreateModal() {
        setEditingSubscription(null);
        setFormData({
            customerId: "",
            planId: "",
            startDate: "",
            endDate: "",
            status: "Active",
            billingCycleDay: "",
            notes: "",
        });
        setShowModal(true);
    }

    function openEditModal(sub) {
        setEditingSubscription(sub);
        setFormData({
            customerId: sub.customerId ?? "",
            planId: sub.planId ?? "",
            startDate: sub.startDate ?? "",
            endDate: sub.endDate ?? "",
            status: sub.status ?? "Active",
            billingCycleDay: sub.billingCycleDay ?? "",
            notes: sub.notes ?? "",
        });
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingSubscription(null);
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

            const method = editingSubscription ? "PUT" : "POST";
            const url = editingSubscription
                ? `${API_BASE}/${editingSubscription.subscriptionId}`
                : API_BASE;

            const payload = {
                customerId: formData.customerId ? Number(formData.customerId) : null,
                planId: formData.planId ? Number(formData.planId) : null,
                startDate: formData.startDate || null,
                endDate: formData.endDate || null,
                status: formData.status,
                billingCycleDay: formData.billingCycleDay
                    ? Number(formData.billingCycleDay)
                    : null,
                notes: formData.notes || null,
            };

            const res = await apiFetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to save subscription");

            closeModal();
            await loadSubscriptions();
        } catch (err) {
            setError(err.message || "Failed to save subscription");
        } finally {
            setSaving(false);
        }
    }

    async function updateStatus(subscriptionId, status) {
        try {
            setError("");

            const res = await apiFetch(`${API_BASE}/${subscriptionId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });

            if (!res.ok) throw new Error("Failed to update subscription status");

            await loadSubscriptions();
        } catch (err) {
            setError(err.message || "Failed to update subscription");
        }
    }

    async function handleDelete(sub) {
        const confirmed = window.confirm(
            `Are you sure you want to delete subscription #${sub.subscriptionId}?`
        );

        if (!confirmed) return;

        try {
            setError("");

            const res = await apiFetch(`${API_BASE}/${sub.subscriptionId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete subscription");

            await loadSubscriptions();
        } catch (err) {
            setError(err.message || "Failed to delete subscription");
        }
    }

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 className="mb-1">Manage Subscriptions</h2>
                    <div className={darkMode ? "text-light-50" : "text-muted"}>
                        Manage subscription records.
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <Form.Control
                        placeholder="Search subscription, customer, plan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: 320 }}
                    />

                    <Form.Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ width: 180 }}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Cancelled">Cancelled</option>
                    </Form.Select>

                    <Button onClick={openCreateModal}>Add New</Button>

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
                                <th>Subscription ID</th>
                                <th>Customer</th>
                                <th>Plan</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Status</th>
                                <th>Billing Day</th>
                                <th>Notes</th>
                                <th>Add-ons</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredSubscriptions.length > 0 ? (
                                filteredSubscriptions.map((sub) => (
                                    <tr key={sub.subscriptionId}>
                                        <td>{sub.subscriptionId}</td>
                                        <td>{sub.customerName || `Customer #${sub.customerId}`}</td>
                                        <td>{sub.planName || `Plan #${sub.planId}`}</td>
                                        <td>{sub.startDate || "—"}</td>
                                        <td>{sub.endDate || "—"}</td>
                                        <td>
                                            <Badge
                                                bg={
                                                    sub.status === "Active"
                                                        ? "success"
                                                        : sub.status === "Suspended"
                                                            ? "warning"
                                                            : sub.status === "Cancelled"
                                                                ? "danger"
                                                                : "secondary"
                                                }
                                            >
                                                {sub.status || "Unknown"}
                                            </Badge>
                                        </td>
                                        <td>{sub.billingCycleDay ?? "—"}</td>
                                        <td>{sub.notes || "—"}</td>
                                        <td>
                                            {Array.isArray(sub.addons) && sub.addons.length > 0 ? (
                                                sub.addons.map((a) => (
                                                    <div key={a.subscriptionAddOnId}>
                                                        {a.addOnName || `AddOn #${a.addOnId}`} ({a.status})
                                                    </div>
                                                ))
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2 flex-wrap">
                                                <Button
                                                    size="sm"
                                                    variant="outline-primary"
                                                    onClick={() => openEditModal(sub)}
                                                >
                                                    Edit
                                                </Button>

                                                {sub.status === "Active" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline-warning"
                                                        onClick={() =>
                                                            updateStatus(
                                                                sub.subscriptionId,
                                                                "Suspended"
                                                            )
                                                        }
                                                    >
                                                        Suspend
                                                    </Button>
                                                )}

                                                {sub.status === "Suspended" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline-success"
                                                        onClick={() =>
                                                            updateStatus(sub.subscriptionId, "Active")
                                                        }
                                                    >
                                                        Reactivate
                                                    </Button>
                                                )}

                                                {sub.status !== "Cancelled" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline-danger"
                                                        onClick={() =>
                                                            updateStatus(
                                                                sub.subscriptionId,
                                                                "Cancelled"
                                                            )
                                                        }
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}

                                                <Button
                                                    size="sm"
                                                    variant="outline-dark"
                                                    onClick={() => handleDelete(sub)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10" className="text-center">
                                        No subscriptions found.
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
                        {editingSubscription ? "Edit Subscription" : "Add Subscription"}
                    </Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleSave}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Customer</Form.Label>
                            <Form.Control
                                type="number"
                                name="customerId"
                                value={formData.customerId}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Plan</Form.Label>
                            <Form.Control
                                type="number"
                                name="planId"
                                value={formData.planId}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Start Date</Form.Label>
                            <Form.Control
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>End Date</Form.Label>
                            <Form.Control
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Status</Form.Label>
                            <Form.Select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="Active">Active</option>
                                <option value="Suspended">Suspended</option>
                                <option value="Cancelled">Cancelled</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Billing Cycle Day</Form.Label>
                            <Form.Control
                                type="number"
                                name="billingCycleDay"
                                value={formData.billingCycleDay}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Notes</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="notes"
                                value={formData.notes}
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