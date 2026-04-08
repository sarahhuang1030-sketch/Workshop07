import React, { useState, useEffect } from "react";
import { Container, Card, Table, Button, Badge, Spinner, Alert, Modal, ListGroup } from "react-bootstrap";
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
    const [showDetails, setShowDetails] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [plansMap, setPlansMap] = useState({});
    const [addonsMap, setAddonsMap] = useState({});

    const navigate = useNavigate();

    useEffect(() => {
        loadQuotes();
        loadMetadata();
    }, []);

    const loadMetadata = async () => {
        try {
            const [plansRes, addonsRes] = await Promise.all([
                apiFetch("/api/plans"),
                apiFetch("/api/addons")
            ]);
            if (plansRes.ok) {
                const plans = await plansRes.json();
                const pMap = {};
                plans.forEach(p => pMap[p.planId] = p);
                setPlansMap(pMap);
            }
            if (addonsRes.ok) {
                const addons = await addonsRes.json();
                const aMap = {};
                addons.forEach(a => aMap[a.addOnId] = a);
                setAddonsMap(aMap);
            }
        } catch (err) {
            console.error("Failed to load metadata", err);
        }
    };

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

    const handleViewDetails = (quote) => {
        setSelectedQuote(quote);
        setShowDetails(true);
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
                                    <Button
                                        variant="outline-info"
                                        size="sm"
                                        className="me-2"
                                        onClick={() => handleViewDetails(q)}
                                    >
                                        View Details
                                    </Button>
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

            {/* DETAILS MODAL */}
            <Modal show={showDetails} onHide={() => setShowDetails(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Quote Details #{selectedQuote?.id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedQuote && (
                        <>
                            <h5>Plan</h5>
                            <ListGroup className="mb-3">
                                <ListGroup.Item>
                                    {plansMap[selectedQuote.planId]?.planName || `Plan ID: ${selectedQuote.planId}`}
                                    <span className="float-end">
                                        {formatMoney(plansMap[selectedQuote.planId]?.monthlyPrice)}
                                    </span>
                                </ListGroup.Item>
                            </ListGroup>

                            {selectedQuote.addonIds && selectedQuote.addonIds.length > 0 && (
                                <>
                                    <h5>Add-ons</h5>
                                    <ListGroup className="mb-3">
                                        {selectedQuote.addonIds.map(aid => (
                                            <ListGroup.Item key={aid}>
                                                {addonsMap[aid]?.addOnName || `Add-on ID: ${aid}`}
                                                <span className="float-end">
                                                    {formatMoney(addonsMap[aid]?.monthlyPrice)}
                                                </span>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </>
                            )}

                            <hr />
                            <div className="d-flex justify-content-between fw-bold fs-5">
                                <span>Total Amount:</span>
                                <span>{formatMoney(selectedQuote.amount)}</span>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetails(false)}>
                        Close
                    </Button>
                    {selectedQuote?.status === "PENDING" && (
                        <Button variant="success" onClick={() => {
                            setShowDetails(false);
                            handleApprove(selectedQuote.id);
                        }}>
                            Approve & Proceed to Checkout
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
