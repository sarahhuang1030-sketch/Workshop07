import { useMemo, useState } from "react";
import { Card, Container, Row, Col, Button } from "react-bootstrap";
import { StarFill } from "react-bootstrap-icons";

export default function CustomerReviewsSection({ reviews = [], darkMode = false }) {
    const [page, setPage] = useState(0);

    const reviewsPerPage = 3;
    const totalPages = Math.ceil(reviews.length / reviewsPerPage);

    const visibleReviews = useMemo(() => {
        const start = page * reviewsPerPage;
        return reviews.slice(start, start + reviewsPerPage);
    }, [reviews, page]);

    const sectionClass = darkMode ? "bg-dark text-light" : "bg-light text-dark";
    const cardClass = darkMode ? "bg-black text-light border-secondary" : "bg-white border-0";
    const mutedClass = darkMode ? "text-light opacity-75" : "text-muted";

    return (
        <section className={`py-5 ${sectionClass}`}>
            <Container>
                <div className="text-center mb-5">
                    <h2 className="fw-bold">What Our Customers Say</h2>
                    <p className={mutedClass}>
                        Real feedback from customers who trust SJY Telecom every day.
                    </p>
                </div>

                <Row className="g-4">
                    {visibleReviews.map((item) => (
                        <Col md={4} key={item.id}>
                            <Card className={`h-100 shadow-sm rounded-4 ${cardClass}`}>
                                <Card.Body className="p-4 d-flex flex-column">
                                    <div className="mb-3 text-warning">
                                        {[...Array(item.rating) || 0].map((_, i) => (
                                            <StarFill key={i} />
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

                {reviews.length > 3 && (
                    <div className="text-center mt-4">
                        <Button
                            className="me-2"
                            onClick={() => setPage((p) => p - 1)}
                            disabled={page === 0}
                        >
                            ← Prev
                        </Button>

                        <Button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page === totalPages - 1}
                        >
                            Next →
                        </Button>
                    </div>
                )}
            </Container>
        </section>
    );
}