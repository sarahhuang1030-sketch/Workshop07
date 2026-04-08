import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Alert, Spinner, Badge } from "react-bootstrap";
import { Sparkles } from "lucide-react";
import { apiFetch } from "../../services/api";

export default function PlanAdvisorModal({
    show,
    onHide,
    darkMode,
    defaultServiceType = "Mobile",
    defaultLineCount = 1,
}) {
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const getInitialFormData = () => ({
        serviceType: defaultServiceType,
        monthlyBudget: "50",

        // Mobile
        numberOfLines: String(clamp(defaultLineCount || 1, 1, 6)),
        estimatedDataGb: "40",
        needsInternationalCalling: false,
        needsHotspot: defaultServiceType === "Mobile",
        phoneUsage: "balanced",

        // Internet
        estimatedInternetSpeedMbps: "300",
        householdSize: "2",
        connectedDevices: "8",

        // Shared
        heavyStreaming: true,
        priority: "best_value",
    });

    const [formData, setFormData] = useState(getInitialFormData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    useEffect(() => {
        if (show) {
            setFormData(getInitialFormData());
            setError("");
            setResult(null);
        }
    }, [defaultServiceType, defaultLineCount, show]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleDigitsOnly = (field, value, maxDigits = 4) => {
        const cleaned = value.replace(/[^\d]/g, "").slice(0, maxDigits);
        handleChange(field, cleaned);
    };

    const handleServiceTypeChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            serviceType: value,
            numberOfLines:
                value === "Mobile"
                    ? String(clamp(Number(prev.numberOfLines || 1), 1, 6))
                    : "1",
            needsHotspot: value === "Mobile" ? prev.needsHotspot : false,
            needsInternationalCalling:
                value === "Mobile" ? prev.needsInternationalCalling : false,
        }));
        setError("");
        setResult(null);
    };

    const handleLineSpinnerChange = (value) => {
        const parsed = Number(value);
        if (Number.isNaN(parsed)) {
            handleChange("numberOfLines", "1");
            return;
        }
        handleChange("numberOfLines", String(clamp(parsed, 1, 6)));
    };

    const validateForm = () => {
        const monthlyBudget = Number(formData.monthlyBudget || 0);

        if (!monthlyBudget || monthlyBudget < 10) {
            return "Please enter a monthly budget of at least $10.";
        }

        if (monthlyBudget > 9999) {
            return "Please enter a valid monthly budget below $10,000.";
        }

        if (formData.serviceType === "Mobile") {
            const numberOfLines = Number(formData.numberOfLines || 1);
            const estimatedDataGb = Number(formData.estimatedDataGb || 0);

            if (numberOfLines < 1 || numberOfLines > 6) {
                return "Number of lines must be between 1 and 6.";
            }

            if (estimatedDataGb < 0 || estimatedDataGb > 500) {
                return "Estimated data usage should be between 0 and 500 GB.";
            }
        }

        if (formData.serviceType === "Internet") {
            const estimatedInternetSpeedMbps = Number(
                formData.estimatedInternetSpeedMbps || 0
            );
            const householdSize = Number(formData.householdSize || 1);
            const connectedDevices = Number(formData.connectedDevices || 1);

            if (estimatedInternetSpeedMbps < 25 || estimatedInternetSpeedMbps > 5000) {
                return "Preferred internet speed should be between 25 and 5000 Mbps.";
            }

            if (householdSize < 1 || householdSize > 12) {
                return "Household size should be between 1 and 12.";
            }

            if (connectedDevices < 1 || connectedDevices > 100) {
                return "Connected devices should be between 1 and 100.";
            }
        }

        return "";
    };

    const buildPayload = () => ({
        serviceType: formData.serviceType,
        monthlyBudget: Number(formData.monthlyBudget || 0),

        numberOfLines:
            formData.serviceType === "Mobile"
                ? Number(formData.numberOfLines || 1)
                : 1,

        estimatedDataGb:
            formData.serviceType === "Mobile"
                ? Number(formData.estimatedDataGb || 0)
                : 0,

        estimatedInternetSpeedMbps:
            formData.serviceType === "Internet"
                ? Number(formData.estimatedInternetSpeedMbps || 0)
                : 0,

        needsInternationalCalling:
            formData.serviceType === "Mobile"
                ? formData.needsInternationalCalling
                : false,

        needsHotspot:
            formData.serviceType === "Mobile"
                ? formData.needsHotspot
                : false,

        heavyStreaming: formData.heavyStreaming,
        priority: formData.priority,

        // extra fields for future backend logic
        phoneUsage:
            formData.serviceType === "Mobile" ? formData.phoneUsage : null,
        householdSize:
            formData.serviceType === "Internet"
                ? Number(formData.householdSize || 1)
                : null,
        connectedDevices:
            formData.serviceType === "Internet"
                ? Number(formData.connectedDevices || 1)
                : null,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setResult(null);

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            setLoading(false);
            return;
        }

        try {
            const payload = buildPayload();

            const res = await apiFetch("/api/ai/plan-advice", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error(`AI request failed: ${res.status}`);
            }

            const data = await res.json();
            setResult(data);
        } catch (err) {
            setError(err.message || "Failed to get recommendation.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError("");
        setResult(null);
        setFormData(getInitialFormData());
        onHide();
    };

    const handleResetRecommendation = () => {
        setResult(null);
        setError("");
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title className="d-flex align-items-center gap-2">
                    <Sparkles size={18} />
                    AI Plan Advisor
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div className="d-flex align-items-center gap-2 mb-3">
                    <Badge bg={formData.serviceType === "Mobile" ? "primary" : "secondary"}>
                        {formData.serviceType}
                    </Badge>
                    <span
                        style={{
                            color: darkMode ? "#d2d2da" : "#5f6777",
                            fontSize: "0.95rem",
                        }}
                    >
                        Personalized recommendation based on current available plans
                    </span>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                {!result && (
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Service Type</Form.Label>
                            <Form.Select
                                value={formData.serviceType}
                                onChange={(e) => handleServiceTypeChange(e.target.value)}
                            >
                                <option value="Mobile">Mobile</option>
                                <option value="Internet">Internet</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Monthly Budget ($)</Form.Label>
                            <Form.Control
                                type="text"
                                inputMode="numeric"
                                placeholder="Enter your budget"
                                value={formData.monthlyBudget}
                                onChange={(e) =>
                                    handleDigitsOnly("monthlyBudget", e.target.value, 4)
                                }
                            />
                            <Form.Text muted>
                                Enter your preferred monthly spending limit.
                            </Form.Text>
                        </Form.Group>

                        {formData.serviceType === "Mobile" && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>Number of Lines</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min={1}
                                        max={6}
                                        step={1}
                                        value={formData.numberOfLines}
                                        onChange={(e) =>
                                            handleLineSpinnerChange(e.target.value)
                                        }
                                    />
                                    <Form.Text muted>
                                        You can choose between 1 and 6 lines.
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Estimated Data Usage (GB)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Enter estimated data usage"
                                        value={formData.estimatedDataGb}
                                        onChange={(e) =>
                                            handleDigitsOnly("estimatedDataGb", e.target.value, 3)
                                        }
                                    />
                                    <Form.Text muted>
                                        Example: 10 for light use, 40+ for heavier use.
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Phone Usage Style</Form.Label>
                                    <Form.Select
                                        value={formData.phoneUsage}
                                        onChange={(e) =>
                                            handleChange("phoneUsage", e.target.value)
                                        }
                                    >
                                        <option value="light">Light use</option>
                                        <option value="balanced">Balanced</option>
                                        <option value="heavy">Heavy use</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        label="Need hotspot"
                                        checked={formData.needsHotspot}
                                        onChange={(e) =>
                                            handleChange("needsHotspot", e.target.checked)
                                        }
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        label="Need international calling"
                                        checked={formData.needsInternationalCalling}
                                        onChange={(e) =>
                                            handleChange(
                                                "needsInternationalCalling",
                                                e.target.checked
                                            )
                                        }
                                    />
                                </Form.Group>
                            </>
                        )}

                        {formData.serviceType === "Internet" && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>Preferred Internet Speed (Mbps)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Enter preferred speed"
                                        value={formData.estimatedInternetSpeedMbps}
                                        onChange={(e) =>
                                            handleDigitsOnly(
                                                "estimatedInternetSpeedMbps",
                                                e.target.value,
                                                4
                                            )
                                        }
                                    />
                                    <Form.Text muted>
                                        Example: 100 for basic use, 500+ for heavier households.
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Household Size</Form.Label>
                                    <Form.Select
                                        value={formData.householdSize}
                                        onChange={(e) =>
                                            handleChange("householdSize", e.target.value)
                                        }
                                    >
                                        <option value="1">1 person</option>
                                        <option value="2">2 people</option>
                                        <option value="3">3 people</option>
                                        <option value="4">4 people</option>
                                        <option value="5">5 people</option>
                                        <option value="6">6 people</option>
                                        <option value="7">7 people</option>
                                        <option value="8">8 people</option>
                                        <option value="9">9 people</option>
                                        <option value="10">10 people</option>
                                        <option value="11">11 people</option>
                                        <option value="12">12 people</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Connected Devices</Form.Label>
                                    <Form.Control
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Enter connected devices"
                                        value={formData.connectedDevices}
                                        onChange={(e) =>
                                            handleDigitsOnly("connectedDevices", e.target.value, 3)
                                        }
                                    />
                                </Form.Group>
                            </>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Heavy streaming or gaming"
                                checked={formData.heavyStreaming}
                                onChange={(e) =>
                                    handleChange("heavyStreaming", e.target.checked)
                                }
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Priority</Form.Label>
                            <Form.Select
                                value={formData.priority}
                                onChange={(e) => handleChange("priority", e.target.value)}
                            >
                                <option value="best_value">Best Value</option>
                                <option value="lowest_price">Lowest Price</option>
                                <option value="most_data">Most Data / Best Performance</option>
                            </Form.Select>
                        </Form.Group>

                        <div
                            style={{
                                fontSize: "0.9rem",
                                color: darkMode ? "#b8b8c2" : "#6b7280",
                                marginBottom: "1rem",
                            }}
                        >
                            Recommendations are based on currently available plans and the present backend logic.
                        </div>

                        <div className="d-flex gap-2">
                            <Button type="submit" disabled={loading}>
                                {loading ? <Spinner size="sm" /> : "Get Recommendation"}
                            </Button>

                            <Button variant="outline-secondary" onClick={handleClose}>
                                Cancel
                            </Button>
                        </div>
                    </Form>
                )}

                {result && (
                    <div>
                        <h5>Recommended Plan</h5>
                        <p className="mb-1">
                            <strong>{result.recommendedPlanName}</strong>
                        </p>
                        <p>{result.reason}</p>

                        <hr />

                        <h6>Backup Option</h6>
                        <p className="mb-1">
                            <strong>{result.backupPlanName}</strong>
                        </p>
                        <p>{result.backupReason}</p>

                        {result.disclaimer && (
                            <Alert variant="light" className="mt-3 mb-0">
                                {result.disclaimer}
                            </Alert>
                        )}

                        <div className="d-flex gap-2 mt-3">
                            <Button onClick={handleResetRecommendation}>
                                Ask Again
                            </Button>
                            <Button variant="outline-secondary" onClick={handleClose}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
}