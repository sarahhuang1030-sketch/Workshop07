import React, { useState, useEffect } from "react";
import { Container, Card, Table, Button, Badge, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";

const formatMoney = (n) =>
    n == null || Number.isNaN(Number(n))
        ? "—"
        : Number(n).toLocaleString(undefined, {
            style: "currency",
            currency: "CAD",
        });

export default function CustomerQuotes() {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        loadQuotes();
    }, []);

    const loadQuotes = async () => {
        try {
            setLoading(true);
            const res = await apiFetch("/api/quotes/my");
            if (!res.ok) throw new Error("Failed to fetch quotes");
            const data = await res.json();
            setQuotes(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (quoteId) => {
        try {
            const res = await apiFetch(`/api/quotes/${quoteId}/approve`, {
                method: "PATCH",
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Approval failed");
            }
            const invoice = await res.json();
            // Redirect to checkout with the invoice number
            navigate(`/checkout?invoiceNumber=${invoice.invoiceNumber}`);
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return (
        <Container className="py-5 text-center">
            <Spinner animation="border" />
            <div className="mt-2">Loading your quotes...</div>
        </Container>
    );

    if (error) return (
        <Container className="py-5">
            <Alert variant="danger">{error}</Alert>
        </Container>
    );

    return (
        <Container className="py-5">
            <h2 className="mb-4">My Quotes</h2>
            {quotes.length === 0 ? (
                <Alert variant="info">You have no quotes at this time.</Alert>
            ) : (
                <Table responsive hover className="align-middle">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quotes.map((q) => (
                            <tr key={q.id}>
                                <td>#{q.id}</td>
                                <td>{q.createdAt ? new Date(q.createdAt).toLocaleDateString() : "N/A"}</td>
                                <td>{formatMoney(q.amount)}</td>
                                <td>
                                    <Badge bg={
                                        q.status === "PENDING" ? "warning" :
                                        q.status === "INVOICED" ? "success" :
                                        q.status === "APPROVED" ? "primary" : "secondary"
                                    }>
                                        {q.status}
                                    </Badge>
                                </td>
                                <td>
                                    {q.status === "PENDING" && (
                                        <Button
                                            variant="success"
                                            size="sm"
                                            onClick={() => handleApprove(q.id)}
                                        >
                                            Approve & Pay
                                        </Button>
                                    )}
                                    {q.status === "INVOICED" && (
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => navigate("/customer/billing/history")}
                                        >
                                            View Invoices
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
}
