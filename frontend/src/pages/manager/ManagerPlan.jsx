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

const emptyForm = {
    serviceTypeId: "",
    planName: "",
    monthlyPrice: "",
    contractTermMonths: "",
    description: "",
    isActive: 1,
    features: [],
    addOnIds: [],
};

const SERVICE_TYPE_OPTIONS = [
    { id: 1, name: "Mobile" },
    { id: 2, name: "Internet" },
    // Add more service types as needed
];

export default function ManagePlan({ darkMode = false }) {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const navigate = useNavigate();
    const [availableAddOns, setAvailableAddOns] = useState([]);

    const [availableFeatureTemplates, setAvailableFeatureTemplates] = useState([]);
    const [selectedFeatureTemplate, setSelectedFeatureTemplate] = useState("");

    const loadPlans = async () => {
        try {
            setLoading(true);
            setError("");

            const res = await fetch("/api/manager/plans", {
                credentials: "include",
            });

            if (!res.ok) {
                throw new Error(`Failed to load plans: ${res.status}`);
            }

            const data = await res.json();
            setPlans(data);
        } catch (err) {
            console.error(err);
            setError("Unable to load plans.");
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableAddOns = async () => {
        try {
            const res = await fetch("/api/addons", {
                credentials: "include",
            });

            if (!res.ok) {
                throw new Error(`Failed to load add-ons: ${res.status}`);
            }

            const data = await res.json();
            setAvailableAddOns(data);
        } catch (err) {
            console.error(err);
            setError("Unable to load available add-ons.");
        }
    };

    const loadFeatureTemplates = async () => {
        try {
            const res = await fetch("/api/manager/plans/features/templates", {
                credentials: "include",
            });

            if (!res.ok) {
                throw new Error(`Failed to load feature templates: ${res.status}`);
            }

            const data = await res.json();
            setAvailableFeatureTemplates(data);
        } catch (err) {
            console.error(err);
            setError("Unable to load feature templates.");
        }
    };

    const loadPlanFeatures = async (planId) => {
        const res = await fetch(`/api/manager/plans/${planId}/features`, {
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(`Failed to load plan features: ${res.status}`);
        }

        return await res.json();
    };

    const loadPlanAddOns = async (planId) => {
        const res = await fetch(`/api/manager/plans/${planId}/addons`, {
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(`Failed to load plan add-ons: ${res.status}`);
        }

        return await res.json();
    };

    useEffect(() => {
        loadPlans();
        loadAvailableAddOns();
        loadFeatureTemplates();
    }, []);

    const addSelectedFeatureTemplate = () => {
        if (!selectedFeatureTemplate) return;

        const template = availableFeatureTemplates.find(
            (f) =>
                `${f.featureName}|${f.featureValue}|${f.unit ?? ""}` === selectedFeatureTemplate
        );

        if (!template) return;

        const alreadyExists = form.features.some(
            (f) =>
                f.featureName === template.featureName &&
                f.featureValue === template.featureValue &&
                (f.unit ?? "") === (template.unit ?? "")
        );

        if (alreadyExists) return;

        setForm((prev) => ({
            ...prev,
            features: [
                ...prev.features,
                {
                    featureName: template.featureName,
                    featureValue: template.featureValue,
                    unit: template.unit ?? "",
                },
            ],
        }));

        setSelectedFeatureTemplate("");
    };


    const removeFeature = (index) => {
        setForm((prev) => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index),
        }));
    };

    const toggleAddOn = (addOnId) => {
        setForm((prev) => {
            const exists = prev.addOnIds.includes(addOnId);
            return {
                ...prev,
                addOnIds: exists
                    ? prev.addOnIds.filter((id) => id !== addOnId)
                    : [...prev.addOnIds, addOnId],
            };
        });
    };

    const openCreate = () => {
        setEditingId(null);
        setSelectedFeatureTemplate("");
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = async (plan) => {
        try {
            setError("");

            const [featuresData, addOnsData] = await Promise.all([
                loadPlanFeatures(plan.planId),
                loadPlanAddOns(plan.planId),
            ]);

            setEditingId(plan.planId);
            setSelectedFeatureTemplate("");

            setForm({
                serviceTypeId: plan.serviceTypeId ?? "",
                planName: plan.planName ?? "",
                monthlyPrice: plan.monthlyPrice ?? "",
                contractTermMonths: plan.contractTermMonths ?? "",
                description: plan.description ?? "",
                isActive: plan.isActive ?? 1,
                features: (featuresData || []).map((f) => ({
                    featureName: f.featureName,
                    featureValue: f.featureValue,
                    unit: f.unit ?? "",
                    sortOrder: f.sortOrder ?? 0,
                })),
                addOnIds: (addOnsData || []).map((a) => a.addOnId),
            });

            setShowModal(true);
        } catch (err) {
            console.error(err);
            setError("Unable to load plan details.");
        }
    };

    const closeModal = () => {
        if (saving) return;
        setShowModal(false);
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

            const planUrl = editingId
                ? `/api/manager/plans/${editingId}`
                : "/api/manager/plans";

            const planMethod = editingId ? "PUT" : "POST";

            const planPayload = {
                serviceTypeId: form.serviceTypeId === "" ? null : Number(form.serviceTypeId),
                planName: form.planName,
                monthlyPrice: form.monthlyPrice === "" ? null : Number(form.monthlyPrice),
                contractTermMonths: form.contractTermMonths === "" ? null : Number(form.contractTermMonths),
                description: form.description,
                isActive: form.isActive === "" ? null : Number(form.isActive),
            };

            const planRes = await fetch(planUrl, {
                method: planMethod,
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(planPayload),
            });

            if (!planRes.ok) {
                throw new Error(`Plan save failed: ${planRes.status}`);
            }

            const savedPlan = await planRes.json();
            const planId = editingId || savedPlan.planId;

            // CREATE MODE
            if (!editingId) {
                for (const feature of form.features) {
                    const featurePayload = {
                        featureName: feature.featureName,
                        featureValue: feature.featureValue,
                        unit: feature.unit || null,
                        sortOrder: feature.sortOrder ?? 0,
                    };

                    const featureRes = await fetch(`/api/manager/plans/${planId}/features`, {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(featurePayload),
                    });

                    if (!featureRes.ok) {
                        throw new Error(`Feature save failed: ${featureRes.status}`);
                    }
                }

                for (const addOnId of form.addOnIds) {
                    const addOnRes = await fetch(`/api/manager/plans/${planId}/addons`, {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ addOnId }),
                    });

                    if (!addOnRes.ok) {
                        throw new Error(`Add-on save failed: ${addOnRes.status}`);
                    }
                }
            }

            // EDIT MODE
            if (editingId) {
                // 1) Remove existing features
                const existingFeatures = await loadPlanFeatures(planId);

                for (const feature of existingFeatures) {
                    const deleteFeatureRes = await fetch(
                        `/api/manager/plans/${planId}/features/${feature.featureId}`,
                        {
                            method: "DELETE",
                            credentials: "include",
                        }
                    );

                    if (!deleteFeatureRes.ok) {
                        throw new Error(`Feature delete failed: ${deleteFeatureRes.status}`);
                    }
                }

                // 2) Recreate current selected features
                for (const feature of form.features) {
                    const featurePayload = {
                        featureName: feature.featureName,
                        featureValue: feature.featureValue,
                        unit: feature.unit || null,
                        sortOrder: feature.sortOrder ?? 0,
                    };

                    const featureRes = await fetch(`/api/manager/plans/${planId}/features`, {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(featurePayload),
                    });

                    if (!featureRes.ok) {
                        throw new Error(`Feature save failed: ${featureRes.status}`);
                    }
                }

                // 3) Remove existing add-ons
                const existingAddOns = await loadPlanAddOns(planId);

                for (const addOn of existingAddOns) {
                    const deleteAddOnRes = await fetch(
                        `/api/manager/plans/${planId}/addons/${addOn.addOnId}`,
                        {
                            method: "DELETE",
                            credentials: "include",
                        }
                    );

                    if (!deleteAddOnRes.ok) {
                        throw new Error(`Add-on delete failed: ${deleteAddOnRes.status}`);
                    }
                }

                // 4) Recreate selected add-ons
                for (const addOnId of form.addOnIds) {
                    const addOnRes = await fetch(`/api/manager/plans/${planId}/addons`, {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ addOnId }),
                    });

                    if (!addOnRes.ok) {
                        throw new Error(`Add-on save failed: ${addOnRes.status}`);
                    }
                }
            }

            setShowModal(false);
            setForm(emptyForm);
            setEditingId(null);
            setSelectedFeatureTemplate("");
            await loadPlans();
        } catch (err) {
            console.error(err);
            setError("Unable to save plan.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (planId) => {
        const confirmed = window.confirm("Delete this plan?");
        if (!confirmed) return;

        try {
            setError("");

            const res = await fetch(`/api/manager/plans/${planId}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) {
                throw new Error(`Delete failed: ${res.status}`);
            }

            await loadPlans();
        } catch (err) {
            console.error(err);
            setError("Unable to delete plan. This plan may already be used by other records.");
        }
    };

    const cardBase = darkMode ? "bg-dark text-light border-secondary" : "bg-white text-dark";

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 className="mb-1">Manage Plans</h2>
                    <div className={darkMode ? "text-light-50" : "text-muted"}>
                        Create, update, and remove plan records.
                    </div>
                </div>

                <div className="d-flex gap-2">
                    <Button
                        variant="outline-secondary"
                        onClick={() => navigate("/manager")}
                        style={{ borderRadius: 12 }}
                    >
                        Go Back
                    </Button>

                    <Button onClick={openCreate} style={{ borderRadius: 12 }}>
                        Add Plan
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
                                <th>Plan Name</th>
                                <th>Service Type</th>
                                <th>Monthly Price</th>
                                <th>Term</th>
                                <th>Description</th>
                                {/*<th>Tagline</th>*/}
                                <th>Active</th>
                                <th style={{ width: 180 }}>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {plans.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="text-center py-4">
                                        No plans found.
                                    </td>
                                </tr>
                            ) : (
                                plans.map((plan) => (
                                    <tr key={plan.planId}>
                                        <td>{plan.planId}</td>
                                        <td>{plan.planName}</td>
                                        <td>
                                            {plan.serviceTypeId === 1
                                                ? "Mobile"
                                                : plan.serviceTypeId === 2
                                                    ? "Internet"
                                                    : "—"}
                                        </td>
                                        <td>
                                            {plan.monthlyPrice != null
                                                ? `$${Number(plan.monthlyPrice).toLocaleString()}`
                                                : "—"}
                                        </td>
                                        <td>
                                            {plan.contractTermMonths != null
                                                ? `${plan.contractTermMonths} months`
                                                : "—"}
                                        </td>
                                        <td>{plan.description || "—"}</td>
                                        {/*<td>{plan.tagline || "—"}</td>*/}
                                        <td>{plan.isActive === 1 ? "Yes" : "No"}</td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline-primary"
                                                    onClick={() => openEdit(plan)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    onClick={() => handleDelete(plan.planId)}
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
                        <Modal.Title>{editingId ? "Edit Plan" : "Add Plan"}</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Plan Name</Form.Label>
                                    <Form.Control
                                        name="planName"
                                        value={form.planName}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Service Type</Form.Label>
                                    <Form.Select
                                        name="serviceTypeId"
                                        value={form.serviceTypeId}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select service type</option>
                                        {SERVICE_TYPE_OPTIONS.map((opt) => (
                                            <option key={opt.id} value={opt.id}>
                                                {opt.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Monthly Price</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        name="monthlyPrice"
                                        value={form.monthlyPrice}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Contract Term Months</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="contractTermMonths"
                                        value={form.contractTermMonths}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            {/*<Col md={12}>*/}
                            {/*    <Form.Group>*/}
                            {/*        <Form.Label>Tagline</Form.Label>*/}
                            {/*        <Form.Control*/}
                            {/*            name="tagline"*/}
                            {/*            value={form.tagline}*/}
                            {/*            onChange={handleChange}*/}
                            {/*        />*/}
                            {/*    </Form.Group>*/}
                            {/*</Col>*/}

                            {/*<Col md={6}>*/}
                            {/*    <Form.Group>*/}
                            {/*        <Form.Label>Badge</Form.Label>*/}
                            {/*        <Form.Control*/}
                            {/*            name="badge"*/}
                            {/*            value={form.badge}*/}
                            {/*            onChange={handleChange}*/}
                            {/*        />*/}
                            {/*    </Form.Group>*/}
                            {/*</Col>*/}

                            {/*<Col md={6}>*/}
                            {/*    <Form.Group>*/}
                            {/*        <Form.Label>Data Label</Form.Label>*/}
                            {/*        <Form.Control*/}
                            {/*            name="dataLabel"*/}
                            {/*            value={form.dataLabel}*/}
                            {/*            onChange={handleChange}*/}
                            {/*        />*/}
                            {/*    </Form.Group>*/}
                            {/*</Col>*/}

                            {/*<Col md={4}>*/}
                            {/*    <Form.Group>*/}
                            {/*        <Form.Label>Icon Key</Form.Label>*/}
                            {/*        <Form.Control*/}
                            {/*            name="iconKey"*/}
                            {/*            value={form.iconKey}*/}
                            {/*            onChange={handleChange}*/}
                            {/*        />*/}
                            {/*    </Form.Group>*/}
                            {/*</Col>*/}

                            {/*<Col md={4}>*/}
                            {/*    <Form.Group>*/}
                            {/*        <Form.Label>Theme Key</Form.Label>*/}
                            {/*        <Form.Control*/}
                            {/*            name="themeKey"*/}
                            {/*            value={form.themeKey}*/}
                            {/*            onChange={handleChange}*/}
                            {/*        />*/}
                            {/*    </Form.Group>*/}
                            {/*</Col>*/}

                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Active</Form.Label>
                                    <Form.Select
                                        name="isActive"
                                        value={form.isActive}
                                        onChange={handleChange}
                                    >
                                        <option value={1}>Yes</option>
                                        <option value={0}>No</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <hr className="my-4" />
                        <h5 className="mb-3">Plan Features</h5>

                        <div className="text-muted mb-3">
                            Select existing feature templates to attach to this plan.
                        </div>

                        <Row className="g-2 align-items-end mb-3">
                            <Col md={9}>
                                <Form.Group>

                                    <Form.Select
                                        value={selectedFeatureTemplate}
                                        onChange={(e) => setSelectedFeatureTemplate(e.target.value)}
                                    >
                                        <option value="">Select a feature</option>
                                        {availableFeatureTemplates.map((feature, index) => {
                                            const key = `${feature.featureName}|${feature.featureValue}|${feature.unit ?? ""}`;
                                            return (
                                                <option key={`${key}-${index}`} value={key}>
                                                    {feature.featureName} — {feature.featureValue}
                                                    {feature.unit ? ` ${feature.unit}` : ""}
                                                </option>
                                            );
                                        })}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={3}>
                                <Button
                                    type="button"
                                    variant="outline-secondary"
                                    className="w-100"
                                    onClick={addSelectedFeatureTemplate}
                                >
                                    Add Feature
                                </Button>
                            </Col>
                        </Row>

                        {form.features.length === 0 ? (
                            <div className="text-muted mb-3">No features selected yet.</div>
                        ) : (
                            form.features.map((feature, index) => (
                                <Row className="g-2 mb-2" key={index}>
                                    <Col md={4}>
                                        <Form.Control value={feature.featureName} disabled />
                                    </Col>
                                    <Col md={4}>
                                        <Form.Control value={feature.featureValue} disabled />
                                    </Col>
                                    <Col md={2}>
                                        <Form.Control value={feature.unit || ""} disabled />
                                    </Col>
                                    <Col md={2}>
                                        <Button
                                            type="button"
                                            variant="outline-danger"
                                            className="w-100"
                                            onClick={() => removeFeature(index)}
                                        >
                                            Remove
                                        </Button>
                                    </Col>
                                </Row>
                            ))
                        )}
                        <hr className="my-4" />
                        <h5 className="mb-3">Allowed Add-ons</h5>
                        <div className="text-muted mb-3">Choose which add-ons can be attached to this plan.</div>

                        <Row className="g-2">
                            {availableAddOns.length === 0 ? (
                                <Col>
                                    <div className="text-muted">No add-ons available.</div>
                                </Col>
                            ) : (
                                availableAddOns.map((addon) => (
                                    <Col md={6} key={addon.addOnId}>
                                        <Form.Check
                                            type="checkbox"
                                            id={`addon-${addon.addOnId}`}
                                            label={`${addon.addOnName} ($${Number(addon.monthlyPrice).toLocaleString()})`}
                                            checked={form.addOnIds.includes(addon.addOnId)}
                                            onChange={() => toggleAddOn(addon.addOnId)}
                                        />
                                    </Col>
                                ))
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