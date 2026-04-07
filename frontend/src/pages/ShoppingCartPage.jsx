import React, { useMemo, useEffect, useState } from "react";
import {
    Container,
    Card,
    Button,
    Alert,
    Row,
    Col,
    Badge,
    Spinner,
} from "react-bootstrap";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, XCircle } from "lucide-react";
import { apiFetch } from "../services/api";

export default function ShoppingCartPage() {
    const {
        plans,
        addOns,
        devices,
        removeDevice,
        addAddOn,
        removeAddOn,
        removePlanAtIndex,
    } = useCart();

    const navigate = useNavigate();

    const [allAddOns, setAllAddOns] = useState([]);
    const [loadingAddOns, setLoadingAddOns] = useState(false);
    const [addOnsError, setAddOnsError] = useState("");

    const token = localStorage.getItem("token");
    const isLoggedIn = !!token;

    useEffect(() => {
        if (!isLoggedIn) {
            navigate("/login", { replace: true });
        }
    }, [isLoggedIn, navigate]);

    const primaryPlan = plans[0] || null;

    const planServiceTypeId = useMemo(() => {
        if (!primaryPlan) return null;

        const rawId =
            primaryPlan.serviceTypeId ??
            primaryPlan.ServiceTypeId ??
            primaryPlan.serviceTypeID ??
            primaryPlan.ServiceTypeID;

        if (rawId != null && !isNaN(Number(rawId))) return Number(rawId);

        const rawText = `${primaryPlan.serviceType ?? ""} ${primaryPlan.name ?? ""}`.toLowerCase();

        if (
            rawText.includes("internet") ||
            rawText.includes("fibre") ||
            rawText.includes("gigabit")
        ) {
            return 2;
        }

        return 1;
    }, [primaryPlan]);

    useEffect(() => {
        let cancelled = false;

        async function loadAddOns() {
            if (!primaryPlan) return;

            try {
                setLoadingAddOns(true);
                setAddOnsError("");

                const res = await apiFetch("/api/addons");
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
    }, [primaryPlan]);

    const availableAddOns = useMemo(() => {
        if (!primaryPlan) return [];

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
    }, [allAddOns, planServiceTypeId, primaryPlan]);

    const pricing = useMemo(() => {
        const plansTotal = plans.reduce(
            (sum, p) => sum + Number(p?.totalPrice ?? p?.price ?? p?.monthlyPrice ?? 0),
            0
        );

        const addOnsTotal = addOns.reduce(
            (sum, a) => sum + Number(a?.monthlyPrice ?? a?.price ?? 0),
            0
        );

        const devicesTotal = devices.reduce(
            (sum, d) => sum + Number(d?.totalPrice ?? 0),
            0
        );

        return {
            plansTotal,
            addOnsTotal,
            devicesTotal,
            subtotal: plansTotal + addOnsTotal + devicesTotal,
        };
    }, [plans, addOns, devices]);

    if (plans.length === 0 && devices.length === 0 && addOns.length === 0) {
        return (
            <Container className="py-5">
                <Alert variant="warning" className="text-center">
                    <ShoppingCart size={20} className="me-2" />
                    Your cart is empty. Add a plan or a device to get started.
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

                {plans.map((plan, idx) => (
                    <Card
                        key={`${plan.serviceType}-${idx}`}
                        className="mb-4 shadow-sm border-0"
                        style={{ borderRadius: 18 }}
                    >
                        <Card.Body className="p-4">
                            <Row className="align-items-center">
                                <Col md={8}>
                                    <Badge bg="info" className="mb-2">
                                        {plan.serviceType || "Plan"}
                                    </Badge>

                                    <h4 className="fw-bold mb-1">{plan.name}</h4>

                                    {plan.tagline && (
                                        <div className="text-muted mb-2">{plan.tagline}</div>
                                    )}

                                    {plan.serviceType === "Mobile" && Number(plan.lines ?? 1) > 1 && (
                                        <div className="text-muted small mt-2">
                                            {Array.from({ length: Number(plan.lines) }).map((_, i) => (
                                                <div key={i}>
                                                    Line {i + 1}:{" "}
                                                    {plan.subscribers?.[i]?.fullName || `Line ${i + 1}`} • $
                                                    {Number(plan.pricePerLine ?? 0).toFixed(2)}/mo
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {plan.serviceType === "Mobile" && Number(plan.lines ?? 1) === 1 && (
                                        <div className="text-muted small mt-2">
                                            {plan.subscribers?.[0]?.fullName || "Line 1"} • $
                                            {Number(plan.pricePerLine ?? plan.totalPrice ?? 0).toFixed(2)}/mo
                                        </div>
                                    )}
                                </Col>

                                <Col md={4} className="text-md-end mt-3 mt-md-0">
                                    <div className="fw-black fs-4">
                                        ${Number(plan.totalPrice ?? plan.price ?? plan.monthlyPrice ?? 0).toFixed(2)}
                                    </div>

                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => removePlanAtIndex(idx)}
                                    >
                                        <XCircle size={14} className="me-1" />
                                        Remove Plan
                                    </Button>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                ))}

                {devices.length > 0 && (
                    <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: 18 }}>
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-3">Devices</h5>

                            {devices.map((device) => (
                                <Card
                                    key={device.cartDeviceId}
                                    className="mb-3 border-0 shadow-sm"
                                >
                                    <Card.Body>
                                        <Row className="align-items-center">
                                            <Col md={8}>
                                                <div className="fw-bold">
                                                    {device.brand} {device.model}
                                                </div>

                                                <div className="text-muted small">
                                                    {device.storage} • {device.color}
                                                </div>

                                                <div className="text-muted small mt-1">
                                                    Assigned to:{" "}
                                                    <strong>{device.assignedSubscriberName}</strong>
                                                </div>

                                                <div className="text-muted small">
                                                    Pricing:{" "}
                                                    {device.pricingType === "monthly"
                                                        ? `$${Number(device.monthlyPrice ?? 0).toFixed(2)}/mo`
                                                        : `$${Number(device.fullPrice ?? 0).toFixed(2)} one-time`}
                                                </div>
                                            </Col>

                                            <Col md={4} className="text-md-end mt-3 mt-md-0">
                                                <div className="fw-black fs-5">
                                                    ${Number(device.totalPrice ?? 0).toFixed(2)}
                                                </div>

                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    className="mt-2"
                                                    onClick={() => removeDevice(device.cartDeviceId)}
                                                >
                                                    <XCircle size={14} className="me-1" />
                                                    Remove
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            ))}
                        </Card.Body>
                    </Card>
                )}

                <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: 18 }}>
                    <Card.Body className="p-4">
                        <h5 className="fw-bold mb-3">Available Add-ons</h5>

                        {loadingAddOns && <Spinner animation="border" size="sm" />}

                        {addOnsError && <Alert variant="danger">{addOnsError}</Alert>}

                        <Row className="g-3">
                            {availableAddOns.map((a) => {
                                const alreadyAdded = addOns.some(
                                    (x) => x.addOnId === a.addOnId
                                );

                                return (
                                    <Col key={a.addOnId} md={6}>
                                        <Card>
                                            <Card.Body className="d-flex flex-column">
                                                <div className="fw-bold">{a.addOnName}</div>
                                                <div className="text-muted small mb-3">
                                                    +${Number(a.monthlyPrice).toFixed(2)}/month
                                                </div>

                                                <Button
                                                    className="mt-auto"
                                                    variant={alreadyAdded ? "outline-danger" : "primary"}
                                                    onClick={() =>
                                                        alreadyAdded
                                                            ? removeAddOn(a.addOnId)
                                                            : addAddOn(a)
                                                    }
                                                >
                                                    {alreadyAdded ? "Remove" : "Add"}
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                    </Card.Body>
                </Card>

                <Card className="shadow border-0" style={{ borderRadius: 20 }}>
                    <Card.Body className="p-4">
                        <h5 className="fw-bold mb-3">Order Summary</h5>

                        <div className="d-flex justify-content-between">
                            <span>Plans</span>
                            <span>${pricing.plansTotal.toFixed(2)}</span>
                        </div>

                        <div className="d-flex justify-content-between">
                            <span>Add-ons</span>
                            <span>${pricing.addOnsTotal.toFixed(2)}</span>
                        </div>

                        <div className="d-flex justify-content-between">
                            <span>Devices</span>
                            <span>${pricing.devicesTotal.toFixed(2)}</span>
                        </div>

                        <hr />

                        <div className="d-flex justify-content-between fw-bold fs-5">
                            <span>Total</span>
                            <span>${pricing.subtotal.toFixed(2)}</span>
                        </div>

                        <Button
                            size="lg"
                            className="w-100 mt-4 fw-bold"
                            style={{
                                borderRadius: 14,
                                background: "linear-gradient(90deg,#4f46e5,#7c3aed)",
                                border: "none",
                            }}
                            onClick={() => {
                                if (!isLoggedIn) {
                                    navigate("/login");
                                    return;
                                }
                                navigate("/checkout");
                            }}
                        >
                            Proceed to Checkout
                        </Button>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
}