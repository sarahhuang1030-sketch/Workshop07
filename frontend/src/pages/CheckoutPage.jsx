import { Container, Card, Button, Form, Alert } from "react-bootstrap";
import { useCart } from "../context/CartContext";
import { useState } from "react";

export default function CheckoutPage() {
    const { plan, addOns, total, clearCart } = useCart();
    const [submitted, setSubmitted] = useState(false);

    if (!plan) {
        return (
            <Container className="py-5">
                <Alert variant="warning">Your cart is empty.</Alert>
            </Container>
        );
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        clearCart();
    };

    return (
        <Container className="py-5" style={{ maxWidth: 600 }}>
            <h1 className="fw-black mb-4">Checkout</h1>

            {submitted ? (
                <Alert variant="success">
                    🎉 Payment successful! Your subscription is active.
                </Alert>
            ) : (
                <Form onSubmit={handleSubmit}>
                    <Card className="mb-4">
                        <Card.Body>
                            <h5 className="fw-bold">Order Summary</h5>
                            <div>{plan.name} — ${plan.price}/mo</div>
                            {addOns.map(a => (
                                <div key={a.addOnId}>
                                    {a.addOnName} — +${a.monthlyPrice}
                                </div>
                            ))}
                            <hr />
                            <div className="fw-black fs-4">Total: ${total}/month</div>
                        </Card.Body>
                    </Card>

                    <Card className="mb-4">
                        <Card.Body>
                            <h5 className="fw-bold mb-3">Payment Info</h5>

                            <Form.Group className="mb-3">
                                <Form.Label>Card Number</Form.Label>
                                <Form.Control required placeholder="4242 4242 4242 4242" />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Name on Card</Form.Label>
                                <Form.Control required />
                            </Form.Group>
                        </Card.Body>
                    </Card>

                    <Button size="lg" type="submit" className="w-100 fw-bold">
                        Pay ${total}
                    </Button>
                </Form>
            )}
        </Container>
    );
}
