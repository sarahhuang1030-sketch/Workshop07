    import React, { useEffect, useState } from "react";
    import { Container, Card, Row, Col, Spinner, Alert, Badge, Button } from "react-bootstrap";
    import { useNavigate } from "react-router-dom";
    import { Package, ArrowLeft } from "lucide-react";

    const formatMoney = (n) =>
        n == null || Number.isNaN(Number(n))
            ? "—"
            : Number(n).toLocaleString(undefined, { style: "currency", currency: "CAD" });

    export default function CustomerPlan({ darkMode = false }) {
        const navigate = useNavigate();
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState("");
        const [details, setDetails] = useState(null);

        const cardBase = darkMode ? "bg-dark border-secondary text-light" : "bg-white";
        const mutedClass = darkMode ? "text-light-50 text-secondary" : "text-muted";

        useEffect(() => {
            let isMounted = true;

            async function load() {
                try {
                    const res = await fetch("/api/me/subscription/details", { credentials: "include" });
                    if (res.status === 401) {
                        if (isMounted) {
                            setError("Unauthorized");
                            setLoading(false);
                        }
                        return;
                    }
                    if (!res.ok) throw new Error("Failed to load plan details.");

                    const data = await res.json();
                    if (isMounted) {
                        setDetails(data);
                        setLoading(false);
                    }
                } catch (e) {
                    if (isMounted) {
                        setError(e.message || "Failed to load plan details.");
                        setLoading(false);
                    }
                }
            }

            load();
            return () => { isMounted = false; };
        }, []);

        if (loading) {
            return (
                <Container className="py-5 text-center">
                    <Spinner animation="border" />
                    <div className={`mt-2 ${mutedClass}`}>Loading plan details…</div>
                </Container>
            );
        }

        if (error) {
            return (
                <Container className="py-5">
                    <Alert variant="danger">{error}</Alert>
                    <Button
                        variant={darkMode ? "outline-light" : "outline-secondary"}
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </Button>
                </Container>
            );
        }

        const sub = details?.subscription;
        const plan = details?.plan;
        const features = details?.features || [];
        const addOns = details?.addOns || [];
        const payments = details?.payments || [];

        return (
            <Container className="py-4 py-md-5 px-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <Button
                        variant={darkMode ? "outline-light" : "outline-secondary"}
                        style={{ borderRadius: 14 }}
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft size={16} className="me-2" />
                        Back
                    </Button>

                    <Badge
                        bg={(sub?.status || "Inactive") === "Active" ? "success" : "secondary"}
                        style={{ borderRadius: 999, padding: "0.45rem 0.75rem" }}
                    >
                        {sub?.status || "Inactive"}
                    </Badge>
                </div>

                <Card className={cardBase} style={{ borderRadius: 22 }}>
                    <Card.Body className="p-4">
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <Package size={18} />
                            <div style={{ fontWeight: 900, fontSize: "1.25rem" }}>My Plan</div>
                        </div>
                        <div className={mutedClass}>Your subscription, plan features, add-ons, and payment history.</div>

                        {/* Plan summary */}
                        <div className="mt-4">
                            <div style={{ fontWeight: 900, fontSize: "1.4rem" }}>
                                {plan?.planName || "—"}
                            </div>
                            <div className={mutedClass}>
                                {plan?.monthlyPrice != null ? `${formatMoney(plan.monthlyPrice)}/month` : "—"}
                            </div>
                            {plan?.description && <div className={`mt-2 small ${mutedClass}`}>{plan.description}</div>}
                        </div>

                        {/* Subscription details */}
                        <Row className="g-3 mt-3">
                            <Col md={6}>
                                <div className={`p-3 ${darkMode ? "tc-card-dark" : "bg-light"}`} style={{ borderRadius: 18 }}>
                                    <div className="fw-bold mb-2">Subscription</div>
                                    <div className="small">
                                        <div><span className={mutedClass}>Start:</span> {sub?.startDate ? String(sub.startDate) : "—"}</div>
                                        <div><span className={mutedClass}>End:</span> {sub?.endDate ? String(sub.endDate) : "—"}</div>
                                        <div><span className={mutedClass}>Billing day:</span> {sub?.billingCycleDay ?? "—"}</div>
                                    </div>
                                </div>
                            </Col>

                            <Col md={6}>
                                <div className={`p-3 ${darkMode ? "tc-card-dark" : "bg-light"}`} style={{ borderRadius: 18 }}>
                                    <div className="fw-bold mb-2">Quick totals</div>
                                    <div className="small">
                                        <div><span className={mutedClass}>Add-ons:</span> {addOns.length}</div>
                                        <div><span className={mutedClass}>Features:</span> {features.length}</div>
                                        <div><span className={mutedClass}>Payments:</span> {payments.length}</div>
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        {/* Features */}
                        <div className="mt-4">
                            <div className="fw-bold mb-2">Features</div>
                            {features.length ? (
                                <ul className="mb-0">
                                    {features.map((f, idx) => (
                                        <li key={idx}>
                                            {f.name}: {f.value}{f.unit ? ` ${f.unit}` : ""}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className={`small ${mutedClass}`}>No features found.</div>
                            )}
                        </div>

                        {/* Add-ons */}
                        <div className="mt-4">
                            <div className="fw-bold mb-2">Purchased Add-ons</div>
                            {addOns.length ? (
                                <ul className="mb-0">
                                    {addOns.map((a, idx) => (
                                        <li key={idx}>
                                            {a.addOnName} — {formatMoney(a.monthlyPrice)}/month
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className={`small ${mutedClass}`}>No add-ons purchased.</div>
                            )}
                        </div>

                        {/* Payments */}
                        <div className="mt-4">
                            <div className="fw-bold mb-2">Recent Payments</div>
                            {payments.length ? (
                                <ul className="mb-0">
                                    {payments.map((p, idx) => (
                                        <li key={idx}>
                                            {formatMoney(p.amount)} — {String(p.paymentDate)} ({p.method}, {p.status})
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className={`small ${mutedClass}`}>No payments found.</div>
                            )}
                        </div>
                    </Card.Body>
                </Card>
            </Container>
        );

}
