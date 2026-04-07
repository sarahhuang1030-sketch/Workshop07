import React, { useEffect, useState, useCallback } from "react";
import { Container, Button, Spinner, Alert, Card, Accordion } from "react-bootstrap";
import { apiFetch } from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function SalesQuotes() {

    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await apiFetch("/api/quotes");

            if (!res.ok) throw new Error();

            const data = await res.json();
            setQuotes(Array.isArray(data) ? data : []);
        } catch (e) {
            setError("Failed to load quotes");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    function edit(id) {
        navigate(`/sales/quotes/${id}/edit`);
    }

    async function cancel(id) {
        if (!window.confirm("Cancel this quote?")) return;

        await apiFetch(`/api/quotes/${id}/cancel`, {
            method: "PATCH",
        });

        load();
    }

    return (
        <Container className="py-4">

            <h3 className="mb-4">Quotes</h3>

            {loading && <Spinner animation="border" />}
            {error && <Alert variant="danger">{error}</Alert>}

            {!loading && !error && (
                <Accordion defaultActiveKey="0">

                    {quotes.map((q, index) => (
                        <Card key={q.id} className="mb-3 shadow-sm">

                            <Accordion.Item eventKey={String(index)}>

                                <Accordion.Header>
                                    <div className="d-flex justify-content-between w-100 pe-3">
                                        <div>
                                            <strong>Quote #{q.id}</strong>
                                            <div className="text-muted">
                                                {q.customerName}
                                            </div>
                                        </div>

                                        <div>
                                            <span className="badge bg-primary me-2">
                                                ${Number(q.amount || 0).toFixed(2)}
                                            </span>

                                            <span className="badge bg-secondary">
                                                {q.status}
                                            </span>
                                        </div>
                                    </div>
                                </Accordion.Header>

                                <Accordion.Body>

                                    <div className="mb-3">
                                        <strong>Customer:</strong> {q.customerName}
                                    </div>

                                    <div className="mb-3">
                                        <strong>Total:</strong> ${q.amount}
                                    </div>

                                    <div className="d-flex gap-2">

                                        <Button
                                            size="sm"
                                            variant="primary"
                                            onClick={() => edit(q.id)}
                                        >
                                            Edit
                                        </Button>

                                        {q.status === "PENDING" && (
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onClick={() => cancel(q.id)}
                                            >
                                                Cancel
                                            </Button>
                                        )}

                                    </div>

                                </Accordion.Body>

                            </Accordion.Item>

                        </Card>
                    ))}

                </Accordion>
            )}

        </Container>
    );
}