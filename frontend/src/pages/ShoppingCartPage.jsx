import React, { useMemo, useEffect, useState } from "react";
import {
    Container,
    Card,
    Button,
    ListGroup,
    Alert,
    Row,
    Col,
    Badge,
    Spinner,
} from "react-bootstrap";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, XCircle, Plus } from "lucide-react";

export default function ShoppingCartPage() {
    const { plan, addOns, addAddOn, removeAddOn, removePlan } = useCart();
    const navigate = useNavigate();

    const [allAddOns, setAllAddOns] = useState([]);
    const [loadingAddOns, setLoadingAddOns] = useState(false);
    const [addOnsError, setAddOnsError] = useState("");

    const planServiceTypeId = useMemo(() => {
        if (!plan) return null;

        const rawId =
            plan.serviceTypeId ??
            plan.ServiceTypeId ??
            plan.serviceTypeID ??
            plan.ServiceTypeID;

        if (rawId != null && !isNaN(Number(rawId))) return Number(rawId);

        const rawText = `${plan.serviceType ?? ""} ${plan.name ?? ""}`.toLowerCase();
        if (
            rawText.includes("internet") ||
            rawText.includes("fibre") ||
            rawText.includes("gigabit")
        ) {
            return 2;
        }

        return 1;
    }, [plan]);

    useEffect(() => {
        let cancelled = false;

        async function loadAddOns() {
            if (!plan) return;

            try {
                setLoadingAddOns(true);
                setAddOnsError("");

                const res = await fetch("/api/addons");
                if (!res.ok) throw new Error(`AddOns API failed: ${res.status}`);

                const json = await res.json();
                if (cancelled) return;

                setAllAddOns(json ?? []);
            } catch (e) {
                if (!cancelled) {
                    setAddOnsError(e?.message || "Failed to load add-ons");
                }
            } finally {
                if (!cancelled) setLoadingAddOns(false);
            }
        }

        loadAddOns();

        return () => {
            cancelled = true;
        };
    }, [plan]);

    const availableAddOns = useMemo(() => {
        if (!plan) return [];

        const mobileAddOns = [
            "Device Protection",
            "Extra 10GB Data",
            "International Calling",
            "Premium Voicemail",
            "Roaming Bundle",
        ];

        const internetAddOns = [
            "Wi-Fi Extender",
            "Mesh Wi-Fi Kit",
            "Static IP",
            "Parental Controls",
            "Premium Support",
        ];

        if (planServiceTypeId === 1) {
            return allAddOns.filter((a) => mobileAddOns.includes(a.addOnName));
        }

        if (planServiceTypeId === 2) {
            return allAddOns.filter((a) => internetAddOns.includes(a.addOnName));
        }

        return [];
    }, [allAddOns, planServiceTypeId, plan]);

    const pricing = useMemo(() => {
        if (!plan) return null;

        const addOnsTotal = addOns.reduce(
            (sum, a) => sum + Number(a.monthlyPrice ?? a.price ?? 0),
            0
        );

        const subtotal = Number(plan.price) + addOnsTotal;

        return { addOnsTotal, subtotal };
    }, [plan, addOns]);

    if (!plan) {
        return (
            <Container className="py-5">
                <Alert variant="warning" className="text-center">
                    <ShoppingCart size={20} className="me-2" />
                    Your cart is empty. Please select a plan first.
                </Alert>
            </Container>
        );
    }

    return (
        <div className="py-5" style={{ background: "#f8fafc", minHeight: "100vh" }}>
            <Container style={{ maxWidth: 900 }}>
                <div className="mb-4 d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
                    <div>
                        <h1 className="fw-black d-flex align-items-center gap-2 mb-1">
                            <ShoppingCart size={32} />
                            Shopping Cart
                        </h1>
                        <div className="text-muted">
                            Review your plan and pricing details before checkout.
                        </div>
                    </div>

                    <div className="d-flex gap-2">
                        <Button variant="outline-secondary" onClick={() => navigate("/plans")}>
                            ← Change Plan
                        </Button>
                    </div>
                </div>

                <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: 18 }}>
                    <Card.Body className="p-4">
                        <Row className="align-items-center">
                            <Col md={8}>
                                <Badge bg="info" className="mb-2">
                                    {plan.serviceType || (planServiceTypeId === 2 ? "Internet" : "Mobile")}
                                </Badge>

                                <h4 className="fw-bold mb-1">{plan.name}</h4>

                                <div className="text-muted">{plan.data || "—"} data included</div>
                            </Col>

                            <Col md={4} className="text-md-end mt-3 mt-md-0">
                                <div className="fw-black fs-4">${plan.price}</div>
                                <div className="text-muted small">per month</div>

                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="mt-2 d-inline-flex align-items-center gap-1"
                                    onClick={removePlan}
                                >
                                    <XCircle size={14} />
                                    Remove Plan
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: 18 }}>
                    <Card.Body className="p-4">
                        <h5 className="fw-bold mb-2">Available Add-ons</h5>
                        <div className="text-muted mb-3">
                            Add-ons recommended for this{" "}
                            <strong>{planServiceTypeId === 2 ? "Internet" : "Mobile"}</strong> plan.
                        </div>

                        {loadingAddOns && (
                            <div className="d-flex align-items-center gap-2 text-muted">
                                <Spinner animation="border" size="sm" />
                                Loading add-ons…
                            </div>
                        )}

                        {!loadingAddOns && addOnsError && (
                            <Alert variant="danger">{addOnsError}</Alert>
                        )}

                        {!loadingAddOns && !addOnsError && availableAddOns.length === 0 && (
                            <div className="text-muted">No add-ons available.</div>
                        )}

                        {!loadingAddOns && !addOnsError && availableAddOns.length > 0 && (
                            <Row className="g-3">
                                {availableAddOns.map((a) => {
                                    const alreadyAdded = addOns.some(
                                        (x) => x.addOnId === a.addOnId
                                    );

                                    return (
                                        <Col key={a.addOnId} md={6}>
                                            <Card className="h-100">
                                                <Card.Body className="d-flex flex-column">
                                                    <div className="fw-bold">{a.addOnName}</div>
                                                    <div className="text-muted small mb-2">
                                                        +${Number(a.monthlyPrice).toFixed(2)}/month
                                                    </div>
                                                    {a.description && (
                                                        <div className="text-muted small mb-3">
                                                            {a.description}
                                                        </div>
                                                    )}

                                                    <Button
                                                        className="mt-auto d-inline-flex align-items-center justify-content-center gap-2"
                                                        variant={
                                                            alreadyAdded ? "outline-danger" : "primary"
                                                        }
                                                        onClick={() =>
                                                            alreadyAdded
                                                                ? removeAddOn(a.addOnId)
                                                                : addAddOn(a)
                                                        }
                                                    >
                                                        {alreadyAdded ? (
                                                            <Trash2 size={16} />
                                                        ) : (
                                                            <Plus size={16} />
                                                        )}
                                                        {alreadyAdded ? "Remove" : "Add"}
                                                    </Button>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>
                        )}
                    </Card.Body>
                </Card>

                <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: 18 }}>
                    <Card.Body className="p-4">
                        <h5 className="fw-bold mb-3">Selected Add-ons</h5>

                        {addOns.length === 0 ? (
                            <div className="text-muted">No add-ons selected</div>
                        ) : (
                            <ListGroup variant="flush">
                                {addOns.map((a) => (
                                    <ListGroup.Item
                                        key={a.addOnId}
                                        className="d-flex justify-content-between align-items-center px-0 py-3"
                                    >
                                        <div>
                                            <div className="fw-bold">{a.addOnName}</div>
                                            <div className="text-muted small">
                                                +${Number(a.monthlyPrice ?? a.price ?? 0).toFixed(2)}/month
                                            </div>
                                        </div>

                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => removeAddOn(a.addOnId)}
                                            className="d-inline-flex align-items-center gap-1"
                                        >
                                            <Trash2 size={14} />
                                            Remove
                                        </Button>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        )}
                    </Card.Body>
                </Card>

                <Card className="shadow border-0" style={{ borderRadius: 20 }}>
                    <Card.Body className="p-4">
                        <h5 className="fw-bold mb-4">Order Summary</h5>

                        <div className="d-flex justify-content-between mb-2">
                            <span>Plan</span>
                            <span>${Number(plan.price).toFixed(2)}</span>
                        </div>

                        <div className="d-flex justify-content-between mb-2">
                            <span>Add-ons</span>
                            <span>${pricing.addOnsTotal.toFixed(2)}</span>
                        </div>

                        <hr />

                        <div className="d-flex justify-content-between align-items-center">
                            <div className="fw-bold fs-5">Total (Monthly)</div>
                            <div className="fw-black fs-4">${pricing.subtotal.toFixed(2)}</div>
                        </div>

                        <hr />

                        <Button
                            size="lg"
                            className="w-100 mt-4 fw-bold"
                            style={{
                                borderRadius: 14,
                                background: "linear-gradient(90deg,#4f46e5,#7c3aed)",
                                border: "none",
                            }}
                            onClick={() => navigate("/checkout")}
                        >
                            Proceed to Checkout
                        </Button>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
}