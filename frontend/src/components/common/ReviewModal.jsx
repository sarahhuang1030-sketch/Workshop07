import { Modal, Button, Form, Row, Col } from "react-bootstrap";
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
    }, [show, user, customerPlans]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "rating" ? parseInt(value, 10) || 5 : value,
        }));
    };

    const handleSubmit = () => {
        if (!formData.name || !formData.review || !formData.selectedTarget) return;

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
                "TeleConnect Customer",
            review: formData.review,
            rating: formData.rating,
            targetType: selectedPlan ? "plan" : "company",
            targetId: selectedPlan ? String(selectedPlan.planId ?? selectedPlan.id) : null,
            targetLabel: selectedPlan
                ? selectedPlan.planName || selectedPlan.name
                : "TeleConnect",
        });

        setFormData({
            name: "",
            selectedTarget: "company",
            review: "",
            rating: 5,
        });

        onClose();
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
                                <option value="company">TeleConnect</option>

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
                            />
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit}>
                    Submit
                </Button>
            </Modal.Footer>
        </Modal>
    );
}