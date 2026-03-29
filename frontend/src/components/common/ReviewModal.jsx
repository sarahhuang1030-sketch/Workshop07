import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { useState } from "react";

export default function ReviewModal({ show, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        name: "",
        role: "",
        review: "",
        rating: 5,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "rating" ? parseInt(value) || 5 : value,
        }));
    };

    const handleSubmit = () => {
        if (!formData.name || !formData.review) return;

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
                                onChange={handleChange}
                            />
                        </Col>

                        <Col md={6}>
                            <Form.Control
                                name="role"
                                placeholder="Customer type"
                                value={formData.role}
                                onChange={handleChange}
                            />
                        </Col>

                        <Col xs={12}>
                            <Form.Select
                                name="rating"
                                value={formData.rating}
                                onChange={handleChange}
                            >
                                {[5,4,3,2,1].map(n => (
                                    <option key={n}>{n} Stars</option>
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