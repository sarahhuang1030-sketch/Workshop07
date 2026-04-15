import { Modal, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";
import { useEffect, useState } from "react";

export default function ReviewModal({
                                        show,
                                        onClose,
                                        onSubmit,
                                        user,
                                        customerPlans = [],
                                    }) {
    const [formData, setFormData] = useState({
        name: "",
        selectedTarget: "company",
        review: "",
        rating: 5,
    });

    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!show) return;

        const fullName =
            [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
            user?.username ||
            "";

        setFormData({
            name: fullName,
            selectedTarget: "company",
            review: "",
            rating: 5,
        });

        setError("");
        setSubmitting(false);
    }, [show, user, customerPlans]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "rating" ? parseInt(value, 10) || 5 : value,
        }));
    };

    const validateReviewWithAI = async (reviewText) => {
        try {
            const response = await fetch("/api/reviews/validate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text: reviewText }),
            });

            const data = await response.json();

            console.log("VALIDATION RESPONSE:", data); // 👈 add this

            return data;
        } catch (err) {
            console.error("VALIDATION ERROR:", err); // 👈 add this
            throw err;
        }
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.review.trim() || !formData.selectedTarget) {
            setError("Please fill in all required fields.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            const validation = await validateReviewWithAI(formData.review);

            if (!validation.safe) {
                setError(validation.message || "Your review contains inappropriate content.");
                setSubmitting(false);
                return;
            }

            const cleanedReview = validation.sanitizedText || formData.review;

            const selectedPlan =
                formData.selectedTarget === "company"
                    ? null
                    : customerPlans.find(
                        (plan) =>
                            String(plan.planId ?? plan.id) === String(formData.selectedTarget)
                    );

            onSubmit({
                id: Date.now(),
                name: formData.name,
                role:
                    selectedPlan?.planName ||
                    selectedPlan?.name ||
                    "SJY Telecom Customer",
                review: cleanedReview,
                rating: formData.rating,
                targetType: selectedPlan ? "plan" : "company",
                targetId: selectedPlan ? String(selectedPlan.planId ?? selectedPlan.id) : null,
                targetLabel: selectedPlan
                    ? selectedPlan.planName || selectedPlan.name
                    : "SJY Telecom",
            });

            setFormData({
                name: "",
                selectedTarget: "company",
                review: "",
                rating: 5,
            });

            onClose();
        } catch (err) {
            setError(err.message || "Something went wrong while validating the review.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Leave a Review</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Control
                                name="name"
                                placeholder="Your name"
                                value={formData.name}
                                readOnly
                            />
                        </Col>

                        <Col md={6}>
                            <Form.Select
                                name="selectedTarget"
                                value={formData.selectedTarget}
                                onChange={handleChange}
                            >
                                <option value="company">SJY Telecom</option>

                                {customerPlans.map((plan, index) => {
                                    const planId = plan.planId ?? plan.id;
                                    const planName =
                                        plan.planName || plan.name || `Plan ${index + 1}`;

                                    return (
                                        <option key={planId ?? index} value={String(planId)}>
                                            {planName}
                                        </option>
                                    );
                                })}
                            </Form.Select>
                        </Col>

                        <Col xs={12}>
                            <Form.Select
                                name="rating"
                                value={formData.rating}
                                onChange={handleChange}
                            >
                                {[5, 4, 3, 2, 1].map((n) => (
                                    <option key={n} value={n}>
                                        {n} Stars
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>

                        <Col xs={12}>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                name="review"
                                placeholder="Write your review..."
                                value={formData.review}
                                onChange={handleChange}
                                maxLength={1000}
                            />
                        </Col>

                        {error && (
                            <Col xs={12}>
                                <Alert variant="danger" className="mb-0">
                                    {error}
                                </Alert>
                            </Col>
                        )}
                    </Row>
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onClose} disabled={submitting}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? (
                        <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Validating...
                        </>
                    ) : (
                        "Submit"
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}