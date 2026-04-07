import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Alert, Spinner } from "react-bootstrap";
import { Sparkles } from "lucide-react";
import { apiFetch } from "../../services/api";

export default function PlanAdvisorModal({
    show,
    onHide,
    darkMode,
    defaultServiceType = "Mobile",
    defaultLineCount = 1,
}) {
    const getInitialFormData = () => ({
        serviceType: defaultServiceType,
        monthlyBudget: "50",
        numberOfLines: defaultServiceType === "Mobile" ? String(defaultLineCount) : "1",
        estimatedDataGb: "40",
        estimatedInternetSpeedMbps: "300",
        needsInternationalCalling: false,
        needsHotspot: defaultServiceType === "Mobile",
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

    const handleNumericChange = (field, value) => {
        const cleaned = value.replace(/[^\d]/g, "");
        handleChange(field, cleaned);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setResult(null);

        try {
            const payload = {
                serviceType: formData.serviceType,
                monthlyBudget: Number(formData.monthlyBudget || 0),
                numberOfLines:
                    formData.serviceType === "Mobile" ? Number(formData.numberOfLines || 1) : 1,
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
            };

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
                <p
                    style={{
                        color: darkMode ? "#d2d2da" : "#5f6777",
                        marginBottom: "1rem",
                    }}
                >
                    Get a quick recommendation based on the plans currently available.
                </p>

                {error && <Alert variant="danger">{error}</Alert>}

                {!result && (
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Service Type</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.serviceType}
                                disabled
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Monthly Budget ($)</Form.Label>
                            <Form.Control
                                type="text"
                                inputMode="numeric"
                                placeholder="Enter your budget"
                                value={formData.monthlyBudget}
                                onChange={(e) => handleNumericChange("monthlyBudget", e.target.value)}
                            />
                        </Form.Group>

                        {formData.serviceType === "Mobile" && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>Number of Lines</Form.Label>
                                    <Form.Control
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Enter number of lines"
                                        value={formData.numberOfLines}
                                        onChange={(e) =>
                                            handleNumericChange("numberOfLines", e.target.value)
                                        }
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Estimated Data Usage (GB)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Enter estimated data usage"
                                        value={formData.estimatedDataGb}
                                        onChange={(e) =>
                                            handleNumericChange("estimatedDataGb", e.target.value)
                                        }
                                    />
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
                            <Form.Group className="mb-3">
                                <Form.Label>Preferred Internet Speed (Mbps)</Form.Label>
                                <Form.Control
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Enter preferred speed"
                                    value={formData.estimatedInternetSpeedMbps}
                                    onChange={(e) =>
                                        handleNumericChange(
                                            "estimatedInternetSpeedMbps",
                                            e.target.value
                                        )
                                    }
                                />
                            </Form.Group>
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
                                <option value="most_data">Most Data</option>
                            </Form.Select>
                        </Form.Group>

                        {formData.serviceType === "Internet" && (
                            <div
                                style={{
                                    fontSize: "0.9rem",
                                    color: darkMode ? "#b8b8c2" : "#6b7280",
                                    marginBottom: "1rem",
                                }}
                            >
                                Internet speed is now collected in the UI. We still need to wire it into the backend recommendation logic next.
                            </div>
                        )}

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
