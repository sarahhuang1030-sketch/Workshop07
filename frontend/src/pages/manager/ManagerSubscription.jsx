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
    Row,
    Col,
} from "react-bootstrap";
import { apiFetch } from "../../services/api";

const API_BASE = "/api/manager/subscriptions";
const PLANS_API = "/api/manager/plans";
const CUSTOMERS_API = "/api/manager/customers";
const STATUSES_API = "/api/manager/subscriptions/statuses";

export default function ManagerSubscription({ darkMode = false }) {
    const navigate = useNavigate();

    const [subscriptions, setSubscriptions] = useState([]);
    const [plans, setPlans] = useState([]);
    const [customers, setCustomers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadingLookups, setLoadingLookups] = useState(false);

    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [showModal, setShowModal] = useState(false);
    const [editingSubscription, setEditingSubscription] = useState(null);

    const [expandedCustomers, setExpandedCustomers] = useState({});

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
    const mutedTextClass = darkMode ? "text-light" : "text-muted";

    const [statuses, setStatuses] = useState([]);
    const statusMap = useMemo(() => {
        const map = new Map();
        statuses.forEach((s) => {
            map.set(String(s.statusCode || "").toLowerCase(), s);
            map.set(String(s.displayName || "").toLowerCase(), s);
        });
        return map;
    }, [statuses]);



    async function loadStatuses() {
        const res = await apiFetch(STATUSES_API);
        if (!res.ok) throw new Error("Failed to load statuses");

        const data = await res.json();
        setStatuses(Array.isArray(data) ? data : []);
    }

    async function loadSubscriptions() {
        const res = await apiFetch(API_BASE);
        if (!res.ok) throw new Error("Failed to load subscriptions");

        const data = await res.json();
        setSubscriptions(Array.isArray(data) ? data : []);
    }

    async function loadPlans() {
        const res = await apiFetch(PLANS_API);
        if (!res.ok) throw new Error("Failed to load plans");

        const data = await res.json();
        setPlans(Array.isArray(data) ? data : []);
    }

    async function loadCustomers() {
        const res = await apiFetch(CUSTOMERS_API);
        if (!res.ok) throw new Error("Failed to load customers");

        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : []);
    }

    async function loadPageData() {
        try {
            setLoading(true);
            setError("");
            await Promise.all([loadSubscriptions(), loadPlans(), loadCustomers(), loadStatuses()]);
        } catch (err) {
            setError(err.message || "Failed to load subscription data");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadPageData();
    }, []);

    const planMap = useMemo(() => {
        const map = new Map();
        plans.forEach((plan) => {
            map.set(String(plan.planId), plan);
        });
        return map;
    }, [plans]);

    function getCustomerDisplayName(customer) {
        if (!customer) return "";

        if (customer.businessName && String(customer.businessName).trim()) {
            return customer.businessName.trim();
        }

        const firstName = customer.firstName ? String(customer.firstName).trim() : "";
        const lastName = customer.lastName ? String(customer.lastName).trim() : "";
        const fullName = `${firstName} ${lastName}`.trim();

        if (fullName) return fullName;

        return `Customer #${customer.customerId}`;
    }

    function getPlanDisplayName(plan) {
        if (!plan) return "";
        return plan.planName ? `${plan.planName}` : `Plan #${plan.planId}`;
    }

    function getCustomerNameFromSubscription(sub) {
        if (sub.customerName && String(sub.customerName).trim()) {
            return String(sub.customerName).trim();
        }

        const customer = customers.find(
            (c) => String(c.customerId) === String(sub.customerId)
        );

        return customer ? getCustomerDisplayName(customer) : `Customer #${sub.customerId}`;
    }

    function getPlanPrice(sub) {
        if (sub.monthlyPrice != null && !Number.isNaN(Number(sub.monthlyPrice))) {
            return Number(sub.monthlyPrice);
        }

        if (sub.planMonthlyPrice != null && !Number.isNaN(Number(sub.planMonthlyPrice))) {
            return Number(sub.planMonthlyPrice);
        }

        const plan = planMap.get(String(sub.planId));
        if (!plan) return 0;

        if (plan.monthlyPrice != null && !Number.isNaN(Number(plan.monthlyPrice))) {
            return Number(plan.monthlyPrice);
        }

        if (plan.price != null && !Number.isNaN(Number(plan.price))) {
            return Number(plan.price);
        }

        return 0;
    }

    function getAddonPrice(addon) {
        if (!addon) return 0;

        const possibleValues = [
            addon.monthlyPrice,
            addon.addOnPrice,
            addon.price,
            addon.amount,
        ];

        for (const value of possibleValues) {
            if (value != null && !Number.isNaN(Number(value))) {
                return Number(value);
            }
        }

        return 0;
    }

    function calculateSubscriptionTotal(sub) {
        const planPrice = getPlanPrice(sub);

        const addonTotal = Array.isArray(sub.addons)
            ? sub.addons.reduce((sum, addon) => {
                const isCancelled =
                    String(addon.status || "").toLowerCase() === "cancelled";
                if (isCancelled) return sum;
                return sum + getAddonPrice(addon);
            }, 0)
            : 0;

        return planPrice + addonTotal;
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat("en-CA", {
            style: "currency",
            currency: "CAD",
        }).format(Number(value || 0));
    }

    function calculateDerivedFields(planId, startDate) {
        if (!planId || !startDate) {
            return {
                endDate: "",
                billingCycleDay: "",
            };
        }

        const plan = plans.find((p) => String(p.planId) === String(planId));
        if (!plan || !plan.contractTermMonths) {
            return {
                endDate: "",
                billingCycleDay: "",
            };
        }

        const parsedStart = new Date(`${startDate}T00:00:00`);
        if (Number.isNaN(parsedStart.getTime())) {
            return {
                endDate: "",
                billingCycleDay: "",
            };
        }

        const calculatedEnd = new Date(parsedStart);
        calculatedEnd.setMonth(calculatedEnd.getMonth() + Number(plan.contractTermMonths));

        const year = calculatedEnd.getFullYear();
        const month = String(calculatedEnd.getMonth() + 1).padStart(2, "0");
        const day = String(calculatedEnd.getDate()).padStart(2, "0");

        return {
            endDate: `${year}-${month}-${day}`,
            billingCycleDay: String(parsedStart.getDate()),
        };
    }

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

        setFormData((prev) => {
            const next = {
                ...prev,
                [name]: value,
            };

            if (name === "planId" || name === "startDate") {
                const derived = calculateDerivedFields(
                    name === "planId" ? value : next.planId,
                    name === "startDate" ? value : next.startDate
                );

                next.endDate = derived.endDate;
                next.billingCycleDay = derived.billingCycleDay;
            }

            return next;
        });
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

    function toggleCustomer(customerId) {
        setExpandedCustomers((prev) => ({
            ...prev,
            [customerId]: !prev[customerId],
        }));
    }

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

            const totalText = String(calculateSubscriptionTotal(sub));

            const matchesSearch =
                !q ||
                [
                    sub.subscriptionId,
                    sub.customerId,
                    getCustomerNameFromSubscription(sub),
                    sub.planId,
                    sub.planName,
                    sub.status,
                    sub.notes,
                    sub.startDate,
                    sub.endDate,
                    sub.billingCycleDay,
                    addonsText,
                    totalText,
                ]
                    .filter(Boolean)
                    .some((v) => String(v).toLowerCase().includes(q));

            return matchesStatus && matchesSearch;
        });
    }, [subscriptions, search, statusFilter, customers, plans]);

    const groupedCustomers = useMemo(() => {
        const groups = new Map();

        filteredSubscriptions.forEach((sub) => {
            const customerId = sub.customerId ?? "unknown";
            const customerName = getCustomerNameFromSubscription(sub);

            if (!groups.has(customerId)) {
                groups.set(customerId, {
                    customerId,
                    customerName,
                    subscriptions: [],
                });
            }

            groups.get(customerId).subscriptions.push(sub);
        });

        return Array.from(groups.values()).sort((a, b) =>
            a.customerName.localeCompare(b.customerName)
        );
    }, [filteredSubscriptions, customers]);

    const selectedPlan = useMemo(() => {
        return plans.find((p) => String(p.planId) === String(formData.planId)) || null;
    }, [plans, formData.planId]);

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                    <h2 className="mb-1">Manage Subscriptions</h2>
                    <div className={mutedTextClass}>
                        Each customer appears once. Click a customer to view all subscriptions.
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <Form.Control
                        placeholder="Search customer, subscription, plan..."
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
                        <option value="pending">Pending</option>
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
                    ) : groupedCustomers.length === 0 ? (
                        <div className="text-center py-4">No subscriptions found.</div>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            {groupedCustomers.map((group) => {
                                const totalSubscriptions = group.subscriptions.length;
                                const activeCount = group.subscriptions.filter(
                                    (s) => String(s.status || "").toLowerCase() === "active"
                                ).length;

                                const customerGrandTotal = group.subscriptions.reduce(
                                    (sum, sub) => sum + calculateSubscriptionTotal(sub),
                                    0
                                );

                                const isExpanded = !!expandedCustomers[group.customerId];

                                return (
                                    <Card
                                        key={group.customerId}
                                        className={darkMode ? "bg-secondary text-light" : "shadow-sm"}
                                        style={{ borderRadius: 16 }}
                                    >
                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                                <div>
                                                    <h5 className="mb-1">{group.customerName}</h5>
                                                    <div className={mutedTextClass}>
                                                        Customer ID: {group.customerId}
                                                    </div>
                                                </div>

                                                <div className="d-flex flex-wrap gap-2 align-items-center">
                                                    <Badge bg="primary">
                                                        {totalSubscriptions} Subscription
                                                        {totalSubscriptions > 1 ? "s" : ""}
                                                    </Badge>
                                                    <Badge bg="success">
                                                        {activeCount} Active
                                                    </Badge>
                                                    {/*<Badge bg="dark">*/}
                                                    {/*    Total: {formatCurrency(customerGrandTotal)}*/}
                                                    {/*</Badge>*/}
                                                    <Button
                                                        variant={isExpanded ? "outline-secondary" : "outline-primary"}
                                                        onClick={() => toggleCustomer(group.customerId)}
                                                    >
                                                        {isExpanded ? "Hide Subscriptions" : "View Subscriptions"}
                                                    </Button>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="mt-3">
                                                    <Table
                                                        responsive
                                                        hover
                                                        className={`align-middle mb-0 ${darkMode ? "table-dark" : ""}`}
                                                    >
                                                        <thead>
                                                        <tr>
                                                            <th>Subscription ID</th>
                                                            <th>Plan</th>
                                                            <th>Start Date</th>
                                                            <th>End Date</th>
                                                            <th>Status</th>
                                                            <th>Billing Day</th>
                                                            <th>Add-ons</th>
                                                            <th>Total Amount</th>
                                                            <th>Notes</th>
                                                            <th>Actions</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        {group.subscriptions.map((sub) => {
                                                            const totalAmount =
                                                                calculateSubscriptionTotal(sub);
                                                            const statusObj = statusMap.get(String(sub.status || "").toLowerCase());
                                                            return (
                                                                <tr key={sub.subscriptionId}>
                                                                    <td>{sub.subscriptionId}</td>
                                                                    <td>
                                                                        {sub.planName ||
                                                                            `Plan #${sub.planId}`}
                                                                    </td>
                                                                    <td>{sub.startDate || "—"}</td>
                                                                    <td>{sub.endDate || "—"}</td>
                                                                    <td>
                                                                        <Badge
                                                                            bg={
                                                                                String(sub.status || "").toLowerCase() === "active"
                                                                                    ? "success"
                                                                                    : String(sub.status || "").toLowerCase() === "pending"
                                                                                        ? "primary"
                                                                                        : String(sub.status || "").toLowerCase() === "suspended"
                                                                                            ? "warning"
                                                                                            : String(sub.status || "").toLowerCase() === "cancelled"
                                                                                                ? "danger"
                                                                                                : "secondary"
                                                                            }
                                                                        >
                                                                            {statusObj?.displayName || sub.status || "Unknown"}
                                                                        </Badge>
                                                                    </td>
                                                                    <td>{sub.billingCycleDay ?? "—"}</td>
                                                                    <td style={{ minWidth: 220 }}>
                                                                        {Array.isArray(sub.addons) &&
                                                                        sub.addons.length > 0 ? (
                                                                            sub.addons.map((a) => (
                                                                                <div
                                                                                    key={
                                                                                        a.subscriptionAddOnId ||
                                                                                        `${sub.subscriptionId}-${a.addOnId}`
                                                                                    }
                                                                                >
                                                                                    {a.addOnName ||
                                                                                        `AddOn #${a.addOnId}`}{" "}
                                                                                    ({a.status || "Unknown"})
                                                                                    {" - "}
                                                                                    {formatCurrency(
                                                                                        getAddonPrice(a)
                                                                                    )}
                                                                                </div>
                                                                            ))
                                                                        ) : (
                                                                            "—"
                                                                        )}
                                                                    </td>
                                                                    <td className="fw-bold">
                                                                        {formatCurrency(totalAmount)}
                                                                    </td>
                                                                    <td>{sub.notes || "—"}</td>
                                                                    <td style={{ minWidth: 220 }}>
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
                                                                                    Deactivate
                                                                                </Button>
                                                                            )}

                                                                            {sub.status === "Suspended" && (
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline-success"
                                                                                    onClick={() =>
                                                                                        updateStatus(
                                                                                            sub.subscriptionId,
                                                                                            "Active"
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    Activate
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
                                                            );
                                                        })}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={closeModal} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingSubscription ? "Edit Subscription" : "Add Subscription"}
                    </Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleSave}>
                    <Modal.Body>
                        {loadingLookups && (
                            <Alert variant="info" className="mb-3">
                                Loading form data...
                            </Alert>
                        )}

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Customer</Form.Label>

                                    {editingSubscription ? (
                                        <Form.Control
                                            type="text"
                                            value={
                                                editingSubscription.customerName ||
                                                `Customer #${editingSubscription.customerId}`
                                            }
                                            disabled
                                        />
                                    ) : (
                                        <Form.Select
                                            name="customerId"
                                            value={formData.customerId}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Select customer</option>
                                            {customers.map((customer) => (
                                                <option
                                                    key={customer.customerId}
                                                    value={customer.customerId}
                                                >
                                                    {getCustomerDisplayName(customer)}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        {statuses
                                            .filter((s) => s.isActive === true || s.isActive === 1)
                                            .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
                                            .map((s) => (
                                                <option key={s.statusId} value={s.displayName}>
                                                    {s.displayName}
                                                </option>
                                            ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Plan</Form.Label>

                                    {editingSubscription ? (
                                        <Form.Control
                                            type="text"
                                            value={
                                                editingSubscription.planName ||
                                                `Plan #${editingSubscription.planId}`
                                            }
                                            disabled
                                        />
                                    ) : (
                                        <Form.Select
                                            name="planId"
                                            value={formData.planId}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Select plan</option>
                                            {plans
                                                .filter((plan) => Number(plan.isActive) === 1)
                                                .map((plan) => (
                                                    <option key={plan.planId} value={plan.planId}>
                                                        {getPlanDisplayName(plan)}
                                                    </option>
                                                ))}
                                        </Form.Select>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Billing Cycle Day</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="billingCycleDay"
                                        value={formData.billingCycleDay}
                                        readOnly
                                        disabled
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
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
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>End Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        readOnly
                                        disabled
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {!editingSubscription && selectedPlan && (
                            <Alert variant="light" className="border">
                                <div>
                                    <strong>Selected plan:</strong> {selectedPlan.planName}
                                </div>
                                <div>
                                    <strong>Contract term:</strong>{" "}
                                    {selectedPlan.contractTermMonths || 0} month(s)
                                </div>
                                {formData.startDate && formData.endDate && (
                                    <div>
                                        <strong>Auto-filled:</strong> ends on {formData.endDate},
                                        billing day {formData.billingCycleDay}
                                    </div>
                                )}
                            </Alert>
                        )}

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