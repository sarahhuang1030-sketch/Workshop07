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
import { apiFetch } from "../services/api";

export default function ShoppingCartPage() {
    const { plan, addOns, addAddOn, removeAddOn, removePlan } = useCart();
    const navigate = useNavigate();

    const [allAddOns, setAllAddOns] = useState([]);
    const [loadingAddOns, setLoadingAddOns] = useState(false);
    const [addOnsError, setAddOnsError] = useState("");

    const token = localStorage.getItem("token");
    const isLoggedIn = !!token;

    // ===============================
    // 🔐 LOGIN GUARD (FIXED)
    // ===============================
    useEffect(() => {
        if (!isLoggedIn) {
            navigate("/login", { replace: true });
        }
    }, [isLoggedIn, navigate]);

    // ===============================
    // PLAN TYPE DETECTION
    // ===============================
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

    // ===============================
    // LOAD ADD-ONS
    // ===============================
    useEffect(() => {
        let cancelled = false;

        async function loadAddOns() {
            if (!plan) return;

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
    }, [plan]);

    // ===============================
    // FILTER ADD-ONS
    // ===============================
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

    // ===============================
    // PRICING
    // ===============================
    const pricing = useMemo(() => {
        if (!plan) return null;

        const addOnsTotal = addOns.reduce(
            (sum, a) => sum + Number(a.monthlyPrice ?? a.price ?? 0),
            0
        );

        const planMonthly = Number(
            plan.totalPrice ??
            plan.price ??
            plan.monthlyPrice ??
            0
        );

        const subtotal = planMonthly + addOnsTotal;

        return { addOnsTotal, planMonthly, subtotal };
    }, [plan, addOns]);

    // ===============================
    // EMPTY CART
    // ===============================
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

    // ===============================
    // MAIN UI
    // ===============================
    return (
        <div className="py-5" style={{ background: "#f8fafc", minHeight: "100vh" }}>
            <Container style={{ maxWidth: 900 }}>

                {/* HEADER */}
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

                {/* PLAN CARD */}
                <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: 18 }}>
                    <Card.Body className="p-4">
                        <Row className="align-items-center">
                            <Col md={8}>
                                <Badge bg="info" className="mb-2">
                                    {plan.serviceType || (planServiceTypeId === 2 ? "Internet" : "Mobile")}
                                </Badge>

                                <h4 className="fw-bold mb-1">{plan.name}</h4>
                            </Col>

                            <Col md={4} className="text-md-end mt-3 mt-md-0">
                                <div className="fw-black fs-4">
                                    ${Number(pricing.planMonthly).toFixed(2)}
                                </div>

                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => removePlan(plan.serviceType)}
                                >
                                    <XCircle size={14} /> Remove Plan
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* ADD-ONS */}
                <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: 18 }}>
                    <Card.Body className="p-4">

                        <h5 className="fw-bold mb-3">Available Add-ons</h5>

                        {loadingAddOns && (
                            <Spinner animation="border" size="sm" />
                        )}

                        {addOnsError && (
                            <Alert variant="danger">{addOnsError}</Alert>
                        )}

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

                {/* SUMMARY */}
                <Card className="shadow border-0" style={{ borderRadius: 20 }}>
                    <Card.Body className="p-4">

                        <h5 className="fw-bold mb-3">Order Summary</h5>

                        <div className="d-flex justify-content-between">
                            <span>Plan</span>
                            <span>${pricing.planMonthly.toFixed(2)}</span>
                        </div>

                        <div className="d-flex justify-content-between">
                            <span>Add-ons</span>
                            <span>${pricing.addOnsTotal.toFixed(2)}</span>
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