import { Container, Card, Button, Form, Alert, Row, Col } from "react-bootstrap";
import { useCart } from "../context/CartContext";
import { useState, useMemo } from "react";

const PROVINCE_TAX = {
    ON: 0.13,
    BC: 0.12,
    AB: 0.05,
    QC: 0.14975,
    MB: 0.12,
    SK: 0.11,
    NS: 0.15,
    NB: 0.15,
    PE: 0.15,
    NL: 0.15,
};

const PROMO_CODES = {
    SAVE10: 0.1,
    STUDENT20: 0.2,
};

export default function CheckoutPage() {
    const { plan, addOns, total, clearCart } = useCart();

    const [billingCycle, setBillingCycle] = useState("monthly");
    const [province, setProvince] = useState("ON");
    const [promoInput, setPromoInput] = useState("");
    const [promoDiscount, setPromoDiscount] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [orderNumber, setOrderNumber] = useState("");

    if (!plan) {
        return (
            <Container className="py-5">
                <Alert variant="warning">Your cart is empty.</Alert>
            </Container>
        );
    }

    const pricing = useMemo(() => {
        const taxRate = PROVINCE_TAX[province] || 0.13;

        let subtotal = total;

        // discount for yearly pay
        if (billingCycle === "yearly") {
            subtotal = subtotal * 12 * 0.9;
        }

        // promo code
        const promoAmount = subtotal * promoDiscount;
        const afterDiscount = subtotal - promoAmount;

        const tax = afterDiscount * taxRate;
        const finalTotal = afterDiscount + tax;

        // first month for free
        const todayDue =
            billingCycle === "monthly"
                ? 0
                : finalTotal;

        return {
            subtotal,
            promoAmount,
            afterDiscount,
            tax,
            finalTotal,
            todayDue,
            taxRate
        };
    }, [total, billingCycle, province, promoDiscount]);

    const applyPromo = () => {
        const code = promoInput.trim().toUpperCase();
        if (PROMO_CODES[code]) {
            setPromoDiscount(PROMO_CODES[code]);
        } else {
            setPromoDiscount(0);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const generatedOrder =
            "TC-" +
            Date.now().toString().slice(-6) +
            "-" +
            Math.floor(Math.random() * 1000);

        setOrderNumber(generatedOrder);
        setSubmitted(true);
        clearCart();
    };

    return (
        <Container className="py-5" style={{ maxWidth: 700 }}>
            <h1 className="fw-black mb-4">Checkout</h1>

            {submitted ? (
                <Alert variant="success">
                    <h5>🎉 Payment Successful!</h5>
                    <div>Your subscription is now active.</div>
                    <hr />
                    <div><strong>Order Number:</strong> {orderNumber}</div>
                </Alert>
            ) : (
                <Form onSubmit={handleSubmit}>

                    {/* Billing Cycle */}
                    <Card className="mb-4">
                        <Card.Body>
                            <h5 className="fw-bold mb-3">Billing Cycle</h5>
                            <Form.Check
                                type="radio"
                                label="Monthly (First month FREE)"
                                checked={billingCycle === "monthly"}
                                onChange={() => setBillingCycle("monthly")}
                            />
                            <Form.Check
                                type="radio"
                                label="Yearly (12 months, 10% OFF)"
                                checked={billingCycle === "yearly"}
                                onChange={() => setBillingCycle("yearly")}
                            />
                        </Card.Body>
                    </Card>

                    {/* Province */}
                    <Card className="mb-4">
                        <Card.Body>
                            <h5 className="fw-bold mb-3">Province</h5>
                            <Form.Select
                                value={province}
                                onChange={(e) => setProvince(e.target.value)}
                            >
                                {Object.keys(PROVINCE_TAX).map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </Form.Select>
                        </Card.Body>
                    </Card>

                    {/* Promo Code */}
                    <Card className="mb-4">
                        <Card.Body>
                            <h5 className="fw-bold mb-3">Promo Code</h5>
                            <Row>
                                <Col>
                                    <Form.Control
                                        value={promoInput}
                                        onChange={(e) =>
                                            setPromoInput(e.target.value)
                                        }
                                        placeholder="Enter promo code"
                                    />
                                </Col>
                                <Col xs="auto">
                                    <Button onClick={applyPromo}>
                                        Apply
                                    </Button>
                                </Col>
                            </Row>
                            {promoDiscount > 0 && (
                                <div className="text-success mt-2">
                                    Promo applied: {promoDiscount * 100}% OFF
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Summary */}
                    <Card className="mb-4">
                        <Card.Body>
                            <h5 className="fw-bold mb-3">Order Summary</h5>

                            <div>Subtotal: ${pricing.subtotal.toFixed(2)}</div>

                            {promoDiscount > 0 && (
                                <div className="text-success">
                                    Discount: -${pricing.promoAmount.toFixed(2)}
                                </div>
                            )}

                            <div>
                                Tax ({(pricing.taxRate * 100).toFixed(2)}%): $
                                {pricing.tax.toFixed(2)}
                            </div>

                            <hr />

                            <div className="fw-bold">
                                Total: ${pricing.finalTotal.toFixed(2)}
                            </div>

                            <div className="mt-2 text-primary fw-bold">
                                Today Due: ${pricing.todayDue.toFixed(2)}
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Payment Info */}
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
                        Pay ${pricing.todayDue.toFixed(2)}
                    </Button>
                </Form>
            )}
        </Container>
    );
}
