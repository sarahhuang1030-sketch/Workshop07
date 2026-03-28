import { Card, Container, Row, Col } from "react-bootstrap";
import { StarFill } from "react-bootstrap-icons";

export default function CustomerReviewsSection({ darkMode = false }) {
    const reviews = [
        {
            name: "Emily R.",
            role: "Mobile Customer",
            review:
                "TeleConnect made switching plans so easy. The network has been reliable and the customer support team was incredibly helpful.",
            rating: 5,
        },
        {
            name: "James T.",
            role: "Internet Customer",
            review:
                "The setup was quick and the connection speed has been excellent. I also like how simple the billing and account dashboard are.",
            rating: 5,
        },
        {
            name: "Sophia L.",
            role: "Family Plan Customer",
            review:
                "I’ve had a great experience with TeleConnect so far. Affordable plans, good coverage, and support whenever I need it.",
            rating: 4,
        },
    ];

    const sectionClass = darkMode ? "bg-dark text-light" : "bg-light text-dark";
    const cardClass = darkMode ? "bg-black text-light border-secondary" : "bg-white border-0";
    const mutedClass = darkMode ? "text-light opacity-75" : "text-muted";

    return (
        <section className={`py-5 ${sectionClass}`}>
            <Container>
                <div className="text-center mb-5">
                    <h2 className="fw-bold">What Our Customers Say</h2>
                    <p className={mutedClass}>
                        Real feedback from customers who trust TeleConnect every day.
                    </p>
                </div>

                <Row className="g-4">
                    {reviews.map((item, index) => (
                        <Col md={4} key={index}>
                            <Card className={`h-100 shadow-sm rounded-4 ${cardClass}`}>
                                <Card.Body className="p-4 d-flex flex-column">
                                    <div className="mb-3">
                                        {[...Array(item.rating)].map((_, i) => (
                                            <StarFill key={i} className="me-1 text-warning" />
                                        ))}
                                    </div>

                                    <p className="mb-4 flex-grow-1">“{item.review}”</p>

                                    <div>
                                        <h6 className="fw-bold mb-1">{item.name}</h6>
                                        <small className={mutedClass}>{item.role}</small>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Container>
        </section>
    );
}