import React, { useMemo } from "react";
import {
    Container,
    Card,
    Button,
    ListGroup,
    Alert,
    Row,
    Col,
    Badge
} from "react-bootstrap";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, XCircle } from "lucide-react";

// const TAX_RATE = 0.13; // 13% HST

export default function ShoppingCartPage() {
    const { plan, addOns, removeAddOn, removePlan } = useCart();
    const navigate = useNavigate();

    const pricing = useMemo(() => {
        if (!plan) return null;

        const addOnsTotal = addOns.reduce(
            (sum, a) => sum + Number(a.monthlyPrice),
            0
        );

        const subtotal = Number(plan.price) + addOnsTotal;
        // const tax = subtotal * TAX_RATE;
        // const total = subtotal + tax;

        return {
            addOnsTotal,
            subtotal
            // tax,
            // total
        };
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

                {/* Header */}
                <div className="mb-4">
                    <h1 className="fw-black d-flex align-items-center gap-2">
                        <ShoppingCart size={32} />
                        Shopping Cart
                    </h1>
                    <div className="text-muted">
                        Review your plan and pricing details before checkout.
                    </div>
                </div>

                {/* PLAN CARD */}
                <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: 18 }}>
                    <Card.Body className="p-4">
                        <Row className="align-items-center">
                            <Col md={8}>
                                <Badge bg="info" className="mb-2">
                                    {plan.serviceType || "Mobile"}
                                </Badge>

                                <h4 className="fw-bold mb-1">{plan.name}</h4>

                                <div className="text-muted">
                                    {plan.data || "—"} data included
                                </div>
                            </Col>

                            <Col md={4} className="text-md-end mt-3 mt-md-0">
                                <div className="fw-black fs-4">
                                    ${plan.price}
                                </div>
                                <div className="text-muted small">
                                    per month
                                </div>

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

                {/* ADD-ONS */}
                <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: 18 }}>
                    <Card.Body className="p-4">
                        <h5 className="fw-bold mb-3">Add-ons</h5>

                        {addOns.length === 0 && (
                            <div className="text-muted">
                                No add-ons selected
                            </div>
                        )}

                        <ListGroup variant="flush">
                            {addOns.map(a => (
                                <ListGroup.Item
                                    key={a.addOnId}
                                    className="d-flex justify-content-between align-items-center px-0 py-3"
                                >
                                    <div>
                                        <div className="fw-bold">{a.addOnName}</div>
                                        <div className="text-muted small">
                                            +${a.monthlyPrice}/month
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => removeAddOn(a.addOnId)}
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </Card.Body>
                </Card>

                {/* PRICE SUMMARY */}
                <Card
                    className="shadow border-0"
                    style={{ borderRadius: 20 }}
                >
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
                            <div className="fw-bold fs-5">
                                Total (Monthly)
                            </div>
                            <div className="fw-black fs-4">
                                ${pricing.subtotal.toFixed(2)}
                            </div>
                        </div>


                        {/*<div className="d-flex justify-content-between mb-3 text-muted">*/}
                        {/*    <span>Tax</span>*/}
                        {/*    <span>${pricing.tax.toFixed(2)}</span>*/}
                        {/*</div>*/}

                        <hr />

                        <Button
                            size="lg"
                            className="w-100 mt-4 fw-bold"
                            style={{
                                borderRadius: 14,
                                background: "linear-gradient(90deg,#4f46e5,#7c3aed)",
                                border: "none"
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
