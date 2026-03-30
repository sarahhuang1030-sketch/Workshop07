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
        role: "",
        review: "",
        rating: 5,
    });

    useEffect(() => {
        if (!show) return;

        const fullName =
            [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
            user?.username ||
            "";

        const firstPlan =
            customerPlans.length > 0
                ? customerPlans[0].planName || customerPlans[0].name || ""
                : "";

        setFormData((prev) => ({
            ...prev,
            name: fullName,
            role: firstPlan,
        }));
    }, [show, user, customerPlans]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "rating" ? parseInt(value, 10) || 5 : value,
        }));
    };

    const handleSubmit = () => {
        if (!formData.name || !formData.review || !formData.role) return;

        onSubmit({
            id: Date.now(),
            ...formData,
        });

        setFormData({
            name: "",
            role: "",
            review: "",
            rating: 5,
        });

        onClose();
    };

    const hasMultiplePlans = customerPlans.length > 1;

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
                            {hasMultiplePlans ? (
                                <Form.Select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                >
                                    {customerPlans.map((plan, index) => {
                                        const planName = plan.planName || plan.name || `Plan ${index + 1}`;
                                        return (
                                            <option
                                                key={plan.id || plan.subscriptionId || index}
                                                value={planName}
                                            >
                                                {planName}
                                            </option>
                                        );
                                    })}
                                </Form.Select>
                            ) : (
                                <Form.Control
                                    name="role"
                                    placeholder="Customer type"
                                    value={formData.role}
                                    readOnly
                                />
                            )}
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
