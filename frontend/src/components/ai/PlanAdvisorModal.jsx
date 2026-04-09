import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Form, Alert, Spinner, Badge, Nav, Row, Col } from "react-bootstrap";
import { Sparkles, Send, MessageSquareText, ClipboardList, Wifi, Smartphone } from "lucide-react";
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
        inputMode: "QUESTIONNAIRE",
        serviceType: defaultServiceType || "Mobile",
        monthlyBudget: "50",

        // Mobile
        numberOfLines: String(clamp(Number(defaultLineCount) || 1, 1, 6)),
        estimatedDataGb: "40",
        needsInternationalCalling: false,
        needsHotspot: (defaultServiceType || "Mobile") === "Mobile",
        heavyStreaming: true,

        // Internet
        estimatedInternetSpeedMbps: "300",
        householdSize: "2",
        connectedDevices: "8",

        // Shared
        priority: "best_value",

        // Prompt
        userPrompt: "",
    });

 const [formData, setFormData] = useState(getInitialFormData);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [result, setResult] = useState(null);
 const [lastPayload, setLastPayload] = useState(null);

    useEffect(() => {
        if (show) {
            setFormData(getInitialFormData());
            setError("");
            setResult(null);
            setLastPayload(null);
        }
    }, [defaultServiceType, defaultLineCount, show]);

    const isMobile = formData.serviceType === "Mobile";
    const isInternet = formData.serviceType === "Internet";

    const cardClass = darkMode ? "bg-secondary text-light border-0" : "";
    const mutedTextClass = darkMode ? "text-light opacity-75" : "text-muted";

    const handleChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleDigitsOnly = (field, value, maxDigits = 4) => {
        const cleaned = String(value || "").replace(/[^\d]/g, "").slice(0, maxDigits);
        handleChange(field, cleaned);
    };

    const handleServiceTypeChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            serviceType: value,
            numberOfLines: value === "Mobile"
                ? String(clamp(Number(prev.numberOfLines || 1), 1, 6))
                : "1",
            needsHotspot: value === "Mobile" ? prev.needsHotspot : false,
            needsInternationalCalling: value === "Mobile" ? prev.needsInternationalCalling : false,
        }));
        setError("");
        setResult(null);
    };

    const validateForm = () => {
        const budget = Number(formData.monthlyBudget || 0);

        if (formData.monthlyBudget && Number.isNaN(budget)) {
            return "Budget must be a valid number.";
        }

        if (!formData.serviceType) {
            return "Please choose a service type.";
        }

        if (formData.inputMode === "PROMPT") {
            if (!formData.userPrompt.trim()) {
                return "Please describe what you are looking for.";
            }
            if (formData.userPrompt.trim().length < 10) {
                return "Please add a little more detail so the recommendation can be more accurate.";
            }
            if (formData.userPrompt.length > 1000) {
                return "Prompt is too long. Please keep it under 1000 characters.";
            }

            if (budget > 0 && budget < 10) {
                return "If you include a budget, it must be at least $10.";
            }

            return "";
        }

        if (!budget || budget < 10) {
            return "Please enter a monthly budget of at least $10.";
        }

        if (isMobile) {
            const lines = Number(formData.numberOfLines || 0);
            const dataGb = Number(formData.estimatedDataGb || 0);

            if (lines < 1 || lines > 6) {
                return "Number of lines must be between 1 and 6.";
            }

            if (!dataGb || dataGb < 1) {
                return "Please enter estimated mobile data usage in GB.";
            }
        }

        if (isInternet) {
            const speed = Number(formData.estimatedInternetSpeedMbps || 0);
            const householdSize = Number(formData.householdSize || 0);
            const devices = Number(formData.connectedDevices || 0);

            if (!speed || speed < 25) {
                return "Please enter an internet speed need of at least 25 Mbps.";
            }

            if (!householdSize || householdSize < 1) {
                return "Please enter household size.";
            }

            if (!devices || devices < 1) {
                return "Please enter the number of connected devices.";
            }
        }

        return "";
    };

    const buildPayload = () => ({
        inputMode: formData.inputMode,
        serviceType: formData.serviceType,
        monthlyBudget: formData.monthlyBudget ? Number(formData.monthlyBudget) : null,

        numberOfLines: isMobile ? Number(formData.numberOfLines || 1) : 1,
        estimatedDataGb: isMobile ? Number(formData.estimatedDataGb || 0) : null,
        needsInternationalCalling: isMobile ? !!formData.needsInternationalCalling : false,
        needsHotspot: isMobile ? !!formData.needsHotspot : false,

        estimatedInternetSpeedMbps: isInternet ? Number(formData.estimatedInternetSpeedMbps || 0) : null,
        householdSize: isInternet ? Number(formData.householdSize || 0) : null,
        connectedDevices: isInternet ? Number(formData.connectedDevices || 0) : null,

        heavyStreaming: !!formData.heavyStreaming,
        priority: formData.priority,
        userPrompt: formData.userPrompt?.trim() || null,
    });

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (loading) return;

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

            if (JSON.stringify(payload) === JSON.stringify(lastPayload)) {
                setError("You already submitted this same request. Change something or review the current result.");
                setLoading(false);
                return;
            }

            setLastPayload(payload);

            const res = await apiFetch("/api/ai/plan-advice", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                let message = `Plan advisor request failed: ${res.status}`;
                try {
                    const errBody = await res.json();
                    if (errBody?.message) message = errBody.message;
                } catch {
                    // ignore parse failure
                }
                throw new Error(message);
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
       setLastPayload(null);
       setFormData(getInitialFormData());
       onHide();
   };

    const modeDescription = useMemo(() => {
        if (formData.inputMode === "PROMPT") {
            return "Describe your needs in your own words and the advisor will recommend the best fit.";
        }
        return "Answer a few questions so the advisor can match you to the most suitable plan.";
    }, [formData.inputMode]);

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
                        <div className={`mb-3 small ${mutedTextClass}`}>
                            {modeDescription}
                        </div>

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
                            <Form.Group className="mb-3">
                                <Form.Label>Service Type</Form.Label>
                                <Form.Select
                                    value={formData.serviceType}
                                    onChange={(e) => handleServiceTypeChange(e.target.value)}
                                    className={cardClass}
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
                                    className={cardClass}
                                />
                            </Form.Group>

                            {formData.inputMode === "QUESTIONNAIRE" ? (
                                <>
                                    {isMobile && (
                                        <>
                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Number of Lines</Form.Label>
                                                        <Form.Control
                                                            type="number"
                                                            min={1}
                                                            max={6}
                                                            value={formData.numberOfLines}
                                                            onChange={(e) => handleChange("numberOfLines", e.target.value)}
                                                            className={cardClass}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Estimated Data Needed (GB)</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            inputMode="numeric"
                                                            placeholder="e.g. 40"
                                                            value={formData.estimatedDataGb}
                                                            onChange={(e) => handleDigitsOnly("estimatedDataGb", e.target.value, 4)}
                                                            className={cardClass}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md={6}>
                                                    <Form.Check
                                                        className="mb-3"
                                                        type="switch"
                                                        id="needs-hotspot"
                                                        label="Needs hotspot"
                                                        checked={!!formData.needsHotspot}
                                                        onChange={(e) => handleChange("needsHotspot", e.target.checked)}
                                                    />
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Check
                                                        className="mb-3"
                                                        type="switch"
                                                        id="needs-international-calling"
                                                        label="Needs international calling"
                                                        checked={!!formData.needsInternationalCalling}
                                                        onChange={(e) => handleChange("needsInternationalCalling", e.target.checked)}
                                                    />
                                                </Col>
                                            </Row>
                                        </>
                                    )}

                                    {isInternet && (
                                        <>
                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Needed Speed (Mbps)</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            inputMode="numeric"
                                                            placeholder="e.g. 300"
                                                            value={formData.estimatedInternetSpeedMbps}
                                                            onChange={(e) => handleDigitsOnly("estimatedInternetSpeedMbps", e.target.value, 4)}
                                                            className={cardClass}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Household Size</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            inputMode="numeric"
                                                            placeholder="e.g. 2"
                                                            value={formData.householdSize}
                                                            onChange={(e) => handleDigitsOnly("householdSize", e.target.value, 2)}
                                                            className={cardClass}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <Form.Group className="mb-3">
                                                <Form.Label>Connected Devices</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="e.g. 8"
                                                    value={formData.connectedDevices}
                                                    onChange={(e) => handleDigitsOnly("connectedDevices", e.target.value, 3)}
                                                    className={cardClass}
                                                />
                                            </Form.Group>
                                        </>
                                    )}

                                    <Row>
                                        <Col md={6}>
                                            <Form.Check
                                                className="mb-3"
                                                type="switch"
                                                id="heavy-streaming"
                                                label="Heavy streaming usage"
                                                checked={!!formData.heavyStreaming}
                                                onChange={(e) => handleChange("heavyStreaming", e.target.checked)}
                                            />
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Priority</Form.Label>
                                                <Form.Select
                                                    value={formData.priority}
                                                    onChange={(e) => handleChange("priority", e.target.value)}
                                                    className={cardClass}
                                                >
                                                    <option value="best_value">Best Value</option>
                                                    <option value="lowest_price">Lowest Price</option>
                                                    <option value="most_data">
                                                        {isMobile ? "Most Data" : "Fastest Performance"}
                                                    </option>
                                                    <option value="family">Family Fit</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </>
                            ) : (
                                <>
                                    <Form.Group className="mb-3">
                                        <Form.Label>What are you looking for?</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={5}
                                            placeholder={
                                                isMobile
                                                    ? "e.g. I need 3 mobile lines with lots of data, hotspot support, and a budget under $150."
                                                    : "e.g. I need home internet for streaming, gaming, and school for 4 people with about 10 devices."
                                            }
                                            value={formData.userPrompt}
                                            onChange={(e) => handleChange("userPrompt", e.target.value)}
                                            className={cardClass}
                                        />
                                        <Form.Text className={darkMode ? "text-info" : ""}>
                                            Mention your budget, usage, number of lines or devices, and any must-have features.
                                        </Form.Text>
                                    </Form.Group>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Check
                                                className="mb-3"
                                                type="switch"
                                                id="prompt-heavy-streaming"
                                                label="Heavy streaming usage"
                                                checked={!!formData.heavyStreaming}
                                                onChange={(e) => handleChange("heavyStreaming", e.target.checked)}
                                            />
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Priority</Form.Label>
                                                <Form.Select
                                                    value={formData.priority}
                                                    onChange={(e) => handleChange("priority", e.target.value)}
                                                    className={cardClass}
                                                >
                                                    <option value="best_value">Best Value</option>
                                                    <option value="lowest_price">Lowest Price</option>
                                                    <option value="most_data">
                                                        {isMobile ? "Most Data" : "Fastest Performance"}
                                                    </option>
                                                    <option value="family">Family Fit</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </>
                            )}

                            <div className="d-grid mt-4">
                                <Button
                                    variant="primary"
                                    type="submit"
                                    disabled={loading}
                                    className="d-flex align-items-center justify-content-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Spinner size="sm" />
                                            Generating Recommendation...
                                        </>
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
                        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                            <div>
                                <Badge bg="success" className="mb-2">Recommended Plan</Badge>
                                <h3 className="fw-bold mb-1 d-flex align-items-center gap-2 flex-wrap">
                                    {result.recommendedPlanName}
                                    <Badge bg="primary">Best Match</Badge>
                                </h3>
                                {result.recommendedMonthlyPrice != null && (
                                    <div className={`small ${mutedTextClass}`}>
                                        ${result.recommendedMonthlyPrice}/mo
                                        {result.recommendedServiceType ? ` • ${result.recommendedServiceType}` : ""}
                                    </div>
                                )}
                            </div>

                            <Badge bg={result.recommendationMode === "AI" ? "info" : "secondary"}>
                                {result.recommendationMode === "AI" ? "AI Recommendation" : "Fallback Recommendation"}
                            </Badge>
                        </div>
                        {result.recommendationMode === "FALLBACK" && (
                            <Alert variant="warning" className="small py-2">
                                AI is currently unavailable. Showing a standard recommendation instead.
                            </Alert>
                        )}

                        <div className={`p-3 rounded mb-4 ${darkMode ? "bg-secondary" : "bg-light"}`}>
                            <h6 className="fw-bold mb-2">Why this plan?</h6>
                            <p className="mb-0">{result.reason || "This plan appears to be the best fit for your needs."}</p>
                        </div>

                       {result.matchSummary && (
                           <div className="mb-4">
                               <h6 className="fw-bold">Match Summary</h6>
                               <p className="small mb-1">{result.matchSummary}</p>
                               <div className="small text-success fw-semibold">
                                   ✔ Strong match based on your requirements
                               </div>
                           </div>
                       )}

                        {result.alternatives && result.alternatives.length > 0 && (
                            <div className="mb-4">
                                <h6 className="fw-bold">Other Options</h6>
                                {result.alternatives.map((alt, idx) => (
                                    <div
                                        key={`${alt.planId || idx}-${idx}`}
                                        className={`p-3 rounded mb-2 border ${darkMode ? "border-secondary" : ""}`}
                                    >
                                        <div className="fw-bold">{alt.planName}</div>
                                        <div className="small opacity-75">{alt.reason}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {result.disclaimer && (
                            <Alert variant={result.recommendationMode === "AI" ? "info" : "warning"} className="small py-2">
                                {result.disclaimer}
                            </Alert>
                        )}

                        <div className="d-flex gap-2 mt-4 flex-wrap">
                            <Button variant="primary" onClick={handleClose}>
                                Close
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