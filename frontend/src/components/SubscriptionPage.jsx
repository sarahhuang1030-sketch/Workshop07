// SubscriptionPage.jsx
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert } from "react-bootstrap";
import { Package, ShieldCheck } from "lucide-react";

const formatMoney = (n) =>
    n == null || Number.isNaN(Number(n))
        ? "—"
        : Number(n).toLocaleString(undefined, { style: "currency", currency: "CAD" });

export default function SubscriptionPage({ user: userProp, darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({
        plan: {
            status: "Inactive",
            name: "—",
            monthlyPrice: null,
            startedAt: null,
            features: [],
            addOns: [],
        },
    });
    const [error, setError] = useState("");

    const cardBase = darkMode ? "bg-dark border-secondary" : "bg-white";
    const mutedClass = darkMode ? "text-light-50 text-secondary" : "text-muted";

    useEffect(() => {
        async function loadProfile() {
            try {
                const res = await fetch("/api/me", { credentials: "include" });
                if (res.status === 401) {
                    setError("Unauthorized");
                    setLoading(false);
                    return;
                }
                const data = await res.json();
                setProfile(prev => ({ ...prev, plan: data.plan ?? prev.plan }));
                setLoading(false);
            } catch {
                setError("Failed to load subscription data.");
                setLoading(false);
            }
        }
        if (userProp) {
            setProfile(prev => ({ ...prev, plan: userProp.plan ?? prev.plan }));
            setLoading(false);
        } else {
            loadProfile();
        }
    }, [userProp]);

    if (loading) return (
        <Container className="py-5 text-center">
            <Spinner animation="border" />
            <div className={`mt-2 ${mutedClass}`}>Loading subscription data…</div>
        </Container>
    );

    if (error) return (
        <Container className="py-5">
            <Alert variant="danger">{error}</Alert>
        </Container>
    );

    return (
        <Container className="py-4 py-md-5 px-4">

            <Card className={cardBase} style={{ borderRadius: 22 }}>
                <Card.Body className="p-4">
                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
                        <div>
                            <div className={`fw-black ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900, fontSize: "1.25rem" }}>
                                Your current plan
                            </div>
                            <div className={mutedClass}>Plan and subscription details.</div>
                        </div>

                        <Badge
                            bg={profile.plan.status === "Active" ? "success" : "secondary"}
                            style={{ borderRadius: 999, padding: "0.45rem 0.75rem", width: "fit-content" }}
                        >
                            {profile.plan.status || "Inactive"}
                        </Badge>
                    </div>

                    <Row className="g-3 mt-3">
                        <Col md={6}>
                            <div className={`p-3 ${darkMode ? "tc-card-dark" : "bg-light"}`} style={{ borderRadius: 18 }}>
                                <div className="d-flex align-items-center gap-2">
                                    <Package size={18} />
                                    <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>Plan</div>
                                </div>
                                <div className={`fw-black mt-2 ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900, fontSize: "1.4rem" }}>
                                    {profile.plan.name || "—"}
                                </div>
                                <div className={mutedClass}>
                                    {profile.plan.monthlyPrice != null
                                        ? `${formatMoney(profile.plan.monthlyPrice)}/month`
                                        : "—"}
                                </div>
                                {profile.plan.startedAt && (
                                    <div className={`small mt-2 ${mutedClass}`}>Started: {String(profile.plan.startedAt)}</div>
                                )}
                            </div>
                        </Col>

                        <Col md={6}>
                            <div className={`p-3 ${darkMode ? "tc-card-dark" : "bg-light"}`} style={{ borderRadius: 18 }}>
                                <div className="d-flex align-items-center gap-2">
                                    <ShieldCheck size={18} />
                                    <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>Included Features</div>
                                </div>
                                {(profile.plan.features?.length ?? 0) > 0 ? (
                                    <ul className={`mt-2 mb-0 ${mutedClass}`}>
                                        {profile.plan.features.slice(0, 6).map((f, idx) => (
                                            <li key={idx}>{typeof f === "string" ? f : `${f.name}: ${f.value}${f.unit ?? ""}`}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className={`mt-2 ${mutedClass}`}>No plan features loaded yet.</div>
                                )}
                            </div>
                        </Col>
                    </Row>

                    {/* Add-ons */}
                    <div className="mt-4">
                        <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>Add-ons</div>
                        {(profile.plan.addOns?.length ?? 0) > 0 ? (
                            <Row className="g-2 mt-1">
                                {profile.plan.addOns.map((a, idx) => (
                                    <Col md={6} key={idx}>
                                        <div className={`p-3 ${darkMode ? "tc-card-dark" : "bg-light"}`} style={{ borderRadius: 16 }}>
                                            <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>{a.name ?? a.addOnName ?? a}</div>
                                            {a.monthlyPrice != null && <div className={mutedClass}>+{formatMoney(a.monthlyPrice)}/month</div>}
                                            {a.description && <div className={`small mt-1 ${mutedClass}`}>{a.description}</div>}
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        ) : (
                            <div className={mutedClass}>No add-ons attached.</div>
                        )}
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
}