import React from "react";
import { Container, Card, Button, ListGroup, Alert } from "react-bootstrap";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

export default function ShoppingCartPage() {
    const { plan, addOns, total, removeAddOn } = useCart();
    const navigate = useNavigate();

    if (!plan) {
        return (
            <Container className="py-5">
                <Alert variant="warning">
                    Your cart is empty. Please select a plan first.
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="py-5" style={{ maxWidth: 720 }}>
            <h1 className="fw-black mb-4">Shopping Cart</h1>

            {/* Plan */}
            <Card className="mb-4">
                <Card.Body>
                    <h4 className="fw-bold">{plan.name}</h4>
                    <div className="text-muted">{plan.data || "—"} data</div>
                    <div className="fw-black fs-4 mt-2">${plan.price}/month</div>
                </Card.Body>
            </Card>

            {/* Add-ons */}
            <Card className="mb-4">
                <Card.Body>
                    <h5 className="fw-bold mb-3">Add-ons</h5>

                    {addOns.length === 0 && (
                        <div className="text-muted">No add-ons selected</div>
                    )}

                    <ListGroup variant="flush">
                        {addOns.map(a => (
                            <ListGroup.Item key={a.addOnId} className="d-flex justify-content-between">
                                <div>
                                    <div className="fw-bold">{a.addOnName}</div>
                                    <div className="text-muted">+${a.monthlyPrice}/month</div>
                                </div>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => removeAddOn(a.addOnId)}
                                >
                                    Remove
                                </Button>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </Card.Body>
            </Card>

            {/* Total */}
            <Card>
                <Card.Body className="d-flex justify-content-between align-items-center">
                    <div>
                        <div className="text-muted">Total</div>
                        <div className="fw-black fs-3">${total}/month</div>
                    </div>
                    <Button
                        size="lg"
                        className="fw-bold"
                        onClick={() => navigate("/checkout")}
                    >
                        Checkout
                    </Button>
                </Card.Body>
            </Card>
        </Container>
    );
}
