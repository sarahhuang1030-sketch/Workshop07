import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Alert, Spinner, Badge, Nav } from "react-bootstrap";
import { Sparkles, Send, MessageSquareText, ClipboardList } from "lucide-react";
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
        inputMode: "QUESTIONNAIRE", // QUESTIONNAIRE, PROMPT
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

        // Prompt mode
        userPrompt: "",
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

    const validateForm = () => {
        if (formData.inputMode === "PROMPT") {
            if (!formData.userPrompt.trim()) {
                return "Please describe what you are looking for.";
            }
            if (formData.userPrompt.length > 1000) {
                return "Prompt is too long. Please keep it under 1000 characters.";
            }
            return "";
        }

        const monthlyBudget = Number(formData.monthlyBudget || 0);

        if (!monthlyBudget || monthlyBudget < 10) {
            return "Please enter a monthly budget of at least $10.";
        }

        if (formData.serviceType === "Mobile") {
            const numberOfLines = Number(formData.numberOfLines || 1);
            if (numberOfLines < 1 || numberOfLines > 6) {
                return "Number of lines must be between 1 and 6.";
            }
        }

        return "";
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
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
            const res = await apiFetch("/api/ai/plan-advice", {
                method: "POST",
                body: JSON.stringify(formData),
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

    return (
        <Modal show={show} onHide={handleClose} centered size={result ? "lg" : "md"}>
            <Modal.Header closeButton className={darkMode ? "bg-dark text-light border-secondary" : ""}>
                <Modal.Title className="d-flex align-items-center gap-2">
                    <Sparkles size={18} className="text-primary" />
                    AI Plan Advisor
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className={darkMode ? "bg-dark text-light" : ""}>
                {!result && (
                    <>
                        <Nav
                            variant="pills"
                            activeKey={formData.inputMode}
                            onSelect={(k) => handleChange("inputMode", k)}
                            className="mb-4 justify-content-center"
                        >
                            <Nav.Item>
                                <Nav.Link eventKey="QUESTIONNAIRE" className="d-flex align-items-center gap-2">
                                    <ClipboardList size={16} />
                                    Questionnaire
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="PROMPT" className="d-flex align-items-center gap-2">
                                    <MessageSquareText size={16} />
                                    Describe Needs
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>

                        {error && <Alert variant="danger">{error}</Alert>}

                        <Form onSubmit={handleSubmit}>
                            {formData.inputMode === "QUESTIONNAIRE" ? (
                                <>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Service Type</Form.Label>
                                        <Form.Select
                                            value={formData.serviceType}
                                            onChange={(e) => handleServiceTypeChange(e.target.value)}
                                            className={darkMode ? "bg-secondary text-light border-0" : ""}
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
                                            placeholder="e.g. 50"
                                            value={formData.monthlyBudget}
                                            onChange={(e) => handleDigitsOnly("monthlyBudget", e.target.value, 4)}
                                            className={darkMode ? "bg-secondary text-light border-0" : ""}
                                        />
                                    </Form.Group>

                                    {formData.serviceType === "Mobile" && (
                                        <Form.Group className="mb-3">
                                            <Form.Label>Number of Lines</Form.Label>
                                            <Form.Control
                                                type="number"
                                                min={1}
                                                max={6}
                                                value={formData.numberOfLines}
                                                onChange={(e) => handleChange("numberOfLines", e.target.value)}
                                                className={darkMode ? "bg-secondary text-light border-0" : ""}
                                            />
                                        </Form.Group>
                                    )}

                                    <Form.Group className="mb-3">
                                        <Form.Label>Priority</Form.Label>
                                        <Form.Select
                                            value={formData.priority}
                                            onChange={(e) => handleChange("priority", e.target.value)}
                                            className={darkMode ? "bg-secondary text-light border-0" : ""}
                                        >
                                            <option value="best_value">Best Value</option>
                                            <option value="lowest_price">Lowest Price</option>
                                            <option value="most_data">Performance / Data</option>
                                        </Form.Select>
                                    </Form.Group>
                                </>
                            ) : (
                                <Form.Group className="mb-3">
                                    <Form.Label>What are you looking for?</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        placeholder="e.g. I need a family plan with 3 lines and at least 50GB of data, preferably under $150."
                                        value={formData.userPrompt}
                                        onChange={(e) => handleChange("userPrompt", e.target.value)}
                                        className={darkMode ? "bg-secondary text-light border-0" : ""}
                                    />
                                    <Form.Text className={darkMode ? "text-info" : ""}>
                                        Tell us about your usage, budget, or any specific requirements.
                                    </Form.Text>
                                </Form.Group>
                            )}

                            <div className="d-grid mt-4">
                                <Button
                                    variant="primary"
                                    type="submit"
                                    disabled={loading}
                                    className="d-flex align-items-center justify-content-center gap-2"
                                >
                                    {loading ? (
                                        <Spinner size="sm" />
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            Get Recommendation
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Form>
                    </>
                )}

                {result && (
                    <div className="animate-fade-in">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <Badge bg="success" className="mb-2">Recommended Plan</Badge>
                                <h3 className="fw-bold">{result.recommendedPlanName}</h3>
                            </div>
                            <Badge bg={result.recommendationMode === "AI" ? "info" : "secondary"}>
                                {result.recommendationMode} Mode
                            </Badge>
                        </div>

                        <div className={`p-3 rounded mb-4 ${darkMode ? "bg-secondary" : "bg-light"}`}>
                            <h6 className="fw-bold mb-2">Why this plan?</h6>
                            <p className="mb-0">{result.reason}</p>
                        </div>

                        {result.matchSummary && (
                            <div className="mb-4">
                                <h6 className="fw-bold">Match Summary</h6>
                                <p className="small">{result.matchSummary}</p>
                            </div>
                        )}

                        {result.alternatives && result.alternatives.length > 0 && (
                            <div className="mb-4">
                                <h6 className="fw-bold">Other Options</h6>
                                {result.alternatives.map((alt, idx) => (
                                    <div key={idx} className={`p-2 rounded mb-2 border ${darkMode ? "border-secondary" : ""}`}>
                                        <div className="fw-bold">{alt.planName}</div>
                                        <div className="small opacity-75">{alt.reason}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Alert variant="info" className="small py-2">
                            {result.disclaimer}
                        </Alert>

                        <div className="d-flex gap-2 mt-4">
                            <Button variant="primary" onClick={handleClose}>
                                Choose This Plan
                            </Button>
                            <Button variant="outline-secondary" onClick={() => setResult(null)}>
                                Try Again
                            </Button>
                        </div>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
}
