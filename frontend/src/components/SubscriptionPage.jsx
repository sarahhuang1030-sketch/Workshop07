import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button } from "react-bootstrap";
import { Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";

// Utility function: format a number as CAD currency
const formatMoney = (n) =>
    n == null || Number.isNaN(Number(n))
        ? "—"
        : Number(n).toLocaleString(undefined, { style: "currency", currency: "CAD" });

export default function SubscriptionPage({ darkMode = false }) {
    const [loading, setLoading] = useState(true); // Loading state for subscription data
    const [latestInvoice, setLatestInvoice] = useState(null); // Latest invoice data
    const navigate = useNavigate();

    // CSS classes for dark/light modes
    const cardBase = darkMode ? "bg-dark border-secondary" : "bg-white";
    const mutedClass = darkMode ? "text-light-50 text-secondary" : "text-muted";

    // Fetch latest invoice on mount
    useEffect(() => {
        let isMounted = true;

        async function loadLatestInvoice() {
            try {
                const res = await apiFetch("/api/invoices/latest");
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) setLatestInvoice(data);
                }
            } catch {
                // silently ignore errors
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadLatestInvoice();
        return () => { isMounted = false; };
    }, []);

    // Loading UI
    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" />
                <div className={`mt-2 ${mutedClass}`}>Loading subscription data…</div>
            </Container>
        );
    }

    const hasInvoice = latestInvoice?.items?.length > 0;

    const mainPlan = latestInvoice?.items?.find(item => item.itemType === "plan");
    const addOnsItems = latestInvoice?.items?.filter(item => item.itemType === "addon");

    return (
        <Container className="py-4 py-md-5 px-4">
            <Card className={cardBase} style={{ borderRadius: 22 }}>
                <Card.Body className="p-4">
                    {/* Header: Plan overview */}
                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
                        <div>
                            <div
                                className={`${darkMode ? "text-light" : "text-dark"}`}
                                style={{ fontWeight: 900, fontSize: "1.25rem" }}
                            >
                                Your current plan
                            </div>
                            <div className={mutedClass}>Plan and add-ons overview.</div>
                        </div>

                        <Badge
                            bg={hasInvoice ? "success" : "secondary"}
                            style={{ borderRadius: 999, padding: "0.45rem 0.75rem", width: "fit-content" }}
                        >
                            {hasInvoice ? "Active" : "No Plan"}
                        </Badge>
                    </div>

                    {/* Plan + Add-ons */}
                    <Row className="g-3 mt-3">
                        <Col>
                            <div
                                className={`p-3 ${darkMode ? "tc-card-dark" : "bg-light"}`}
                                style={{ borderRadius: 18 }}
                            >
                                <div className="d-flex align-items-center gap-2">
                                    <Package size={18} />
                                    <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>
                                        Plan & Add-ons
                                    </div>
                                </div>

                                {hasInvoice ? (
                                    <div className="mt-2">
                                        {/* Display main plan */}
                                        {mainPlan && (
                                            <div
                                                className={`${darkMode ? "text-light" : "text-dark"}`}
                                                style={{ fontWeight: 900, fontSize: "1.2rem", marginBottom: 4 }}
                                            >
                                                {mainPlan.description} ({formatMoney(mainPlan.lineTotal)})
                                            </div>
                                        )}

                                        {/* Display add-ons */}
                                        {addOnsItems?.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className={`${darkMode ? "text-light" : "text-dark"}`}
                                                style={{ fontSize: "0.95rem", marginBottom: 2 }}
                                            >
                                                • {item.description} ({formatMoney(item.lineTotal)})
                                            </div>
                                        ))}

                                        {/* Fallback if no specific plan/addon tagged items but items exist */}
                                        {!mainPlan && latestInvoice.items.length > 0 && (
                                            <div
                                                className={`${darkMode ? "text-light" : "text-dark"}`}
                                                style={{ fontWeight: 900, fontSize: "1.2rem", marginBottom: 4 }}
                                            >
                                                {latestInvoice.items[0].description} ({formatMoney(latestInvoice.items[0].lineTotal)})
                                            </div>
                                        )}

                                        {/* Date information from latest invoice */}
                                        <div className={`mt-3 small ${mutedClass}`}>
                                            <div>
                                                <strong>Start Date:</strong> {latestInvoice.startDate || "—"}
                                            </div>
                                            <div>
                                                <strong>End Date:</strong> {latestInvoice.endDate || "—"}
                                            </div>
                                        </div>

                                        {/* Button: Navigate to full invoice page */}
                                        <Button
                                            variant={darkMode ? "outline-light" : "outline-secondary"}
                                            className="mt-3 fw-bold"
                                            style={{ borderRadius: 14 }}
                                            onClick={() => navigate("/customer/billing")}
                                        >
                                            Check Invoice
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="mt-3">
                                        <Alert variant={darkMode ? "secondary" : "info"}>
                                            You have no invoice yet. Subscribe to a plan to get started.
                                        </Alert>
                                        <Button
                                            variant="primary"
                                            onClick={() => navigate("/plans")}
                                        >
                                            Subscribe Now
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Container>
    );
}