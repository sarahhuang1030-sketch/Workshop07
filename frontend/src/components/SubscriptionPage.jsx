// SubscriptionPage.jsx
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button } from "react-bootstrap";
import { Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

const formatMoney = (n) =>
    n == null || Number.isNaN(Number(n))
        ? "—"
        : Number(n).toLocaleString(undefined, { style: "currency", currency: "CAD" });


//-----Default plan structure to ensure consistent rendering even if userProp is missing or incomplete-----//
const defaultPlan = {
    status: "Inactive",
    name: "—",
    monthlyPrice: null,
    startedAt: null,
    features: [],
    addOns: [],
};

export default function SubscriptionPage({ user: userProp, darkMode = false }) {
    const [loading, setLoading] = useState(!userProp);
    const [error, setError] = useState("");
    const [profile, setProfile] = useState({ plan: defaultPlan });

    const cardBase = darkMode ? "bg-dark border-secondary" : "bg-white";
    const mutedClass = darkMode ? "text-light-50 text-secondary" : "text-muted";
    const navigate = useNavigate();



    useEffect(() => {
        let isMounted = true;

        async function loadProfile() {
            try {
                const res = await fetch("/api/me/subscription", { credentials: "include" });

                if (res.status === 401) {
                    if (isMounted) {
                        setError("Unauthorized");
                        setLoading(false);
                    }
                    return;
                }

                // If backend returns 204 No Content => no plan yet, not an error
                if (res.status === 204) {
                    if (isMounted) {
                        setProfile(prev => ({ ...prev, plan: prev.plan ?? defaultPlan }));
                        setError("");
                        setLoading(false);
                    }
                    return;
                }

                // If backend uses 404 when no subscription exists => treat as no plan
                if (res.status === 404) {
                    if (isMounted) {
                        setProfile(prev => ({ ...prev, plan: defaultPlan }));
                        setError("");
                        setLoading(false);
                    }
                    return;
                }

                const data = await res.json();

                if (isMounted) {
                    setProfile(prev => ({
                        ...prev,
                        plan: data.plan ?? prev.plan,
                    }));
                    setLoading(false);
                }
            } catch (err) {
                if (isMounted) {
                    setError("Failed to load subscription data.");
                    setLoading(false);
                }
            }
        }

        // Show userProp immediately if available
        if (userProp?.plan) {
            setProfile(prev => ({
                ...prev,
                plan: userProp.plan,
            }));
        }

        // Always fetch fresh data
        loadProfile();

        return () => {
            isMounted = false;
        };
    }, [userProp]);

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" />
                <div className={`mt-2 ${mutedClass}`}>
                    Loading subscription data…
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    const hasPlan =
        profile?.plan &&
        profile.plan.status === "Active" &&
        profile.plan.name &&
        profile.plan.name !== "—";

    return (
        <Container className="py-4 py-md-5 px-4">
            <Card className={cardBase} style={{ borderRadius: 22 }}>
                <Card.Body className="p-4">

                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
                        <div>
                            <div
                                className={`${darkMode ? "text-light" : "text-dark"}`}
                                style={{ fontWeight: 900, fontSize: "1.25rem" }}
                            >
                                Your current plan
                            </div>
                            <div className={mutedClass}>
                                Plan and subscription details.
                            </div>
                        </div>

                        <Badge
                            bg={profile.plan.status === "Active" ? "success" : "secondary"}
                            style={{
                                borderRadius: 999,
                                padding: "0.45rem 0.75rem",
                                width: "fit-content",
                            }}
                        >
                            {profile.plan.status || "Inactive"}
                        </Badge>
                    </div>

                    <Row className="g-3 mt-3">
                        <Col>
                            <div
                                className={`p-3 ${
                                    darkMode ? "tc-card-dark" : "bg-light"
                                }`}
                                style={{ borderRadius: 18 }}
                            >
                                <div className="d-flex align-items-center gap-2">
                                    <Package size={18} />
                                    <div
                                        className={`fw-bold ${
                                            darkMode ? "text-light" : "text-dark"
                                        }`}
                                    >
                                        Plan
                                    </div>
                                </div>

                                <div
                                    className={`mt-2 ${
                                        darkMode ? "text-light" : "text-dark"
                                    }`}
                                    style={{ fontWeight: 900, fontSize: "1.4rem" }}
                                >
                                    {profile.plan.name || "—"}
                                </div>

                                <div className={mutedClass}>
                                    {profile.plan.monthlyPrice != null
                                        ? `${formatMoney(profile.plan.monthlyPrice)}/month`
                                        : "—"}
                                </div>

                                {/*{profile.plan.startedAt && (*/}
                                {/*    <div className={`small mt-2 ${mutedClass}`}>*/}
                                {/*        Started: {String(profile.plan.startedAt)}*/}
                                {/*    </div>*/}
                                {/*)}*/}

                                <Button
                                    variant={darkMode ? "outline-light" : "outline-secondary"}
                                    className="mt-3 fw-bold"
                                    style={{ borderRadius: 14 }}
                                    disabled={!hasPlan}
                                    onClick={() => hasPlan && navigate("/customer/plan")}
                                >
                                    View Plan Details
                                </Button>
                            </div>

                        </Col>

                    </Row>
                    {profile.plan.status !== "Active" && (
                        <Alert
                            variant={darkMode ? "secondary" : "info"}
                            className="mt-3 mb-0"
                            style={{ borderRadius: 14 }}
                        >
                            You don’t have an active plan yet. Choose a plan to get started.
                        </Alert>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
}