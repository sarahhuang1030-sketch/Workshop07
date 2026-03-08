// PaymentForm.jsx
import React, { useEffect, useState } from "react";
import {
    CardElement,
    useStripe,
    useElements
} from "@stripe/react-stripe-js";

import Cards from "react-credit-cards-2";
import "react-credit-cards-2/dist/es/styles-compiled.css";

import { Card, Form, Button, Row, Col, Spinner } from "react-bootstrap";

export default function PaymentForm() {

    const stripe = useStripe();
    const elements = useElements();

    const [holderName, setHolderName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvv, setCvv] = useState("");
    const [focus, setFocus] = useState("");

    const [useDefault, setUseDefault] = useState(true);
    const [saveCard, setSaveCard] = useState(false);

    const [defaultCard, setDefaultCard] = useState(null);
    const [loading, setLoading] = useState(true);

    /*
     Automatically load user's default billing card
     */
    useEffect(() => {

        const loadBilling = async () => {

            const res = await fetch("/api/billing/payment", {
                credentials: "include"
            });

            if (res.ok) {
                const data = await res.json();
                setDefaultCard(data);
            }

            setLoading(false);
        };

        loadBilling();

    }, []);

    /*
     Handle payment
     */
    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!stripe || !elements) return;

        /*
         If user selects default card
         */
        if (useDefault && defaultCard) {

            await fetch("/api/payment/charge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paymentMethodId: defaultCard.stripePaymentMethodId
                })
            });

            alert("Payment completed");
            return;
        }

        /*
         Create Stripe payment method
         */
        const cardElement = elements.getElement(CardElement);

        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: "card",
            card: cardElement,
            billing_details: {
                name: holderName
            }
        });

        if (error) {
            alert(error.message);
            return;
        }

        const card = paymentMethod.card;

        /*
         Save card if user checked save option
         */
        if (saveCard) {

            await fetch("/api/billing/payment", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    method: card.brand,
                    holderName: holderName,
                    cardNumber: "**** **** **** " + card.last4,
                    expiryMonth: card.exp_month,
                    expiryYear: card.exp_year,
                    stripePaymentMethodId: paymentMethod.id
                })
            });

        }

        /*
         Charge payment
         */
        await fetch("/api/payment/charge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                paymentMethodId: paymentMethod.id
            })
        });

        alert("Payment completed");

    };

    if (loading)
        return (
            <div style={{ textAlign: "center", padding: 40 }}>
                <Spinner animation="border" />
            </div>
        );

    return (

        <Card style={{ maxWidth: 650, margin: "auto", padding: 25 }}>

            <h4 style={{ marginBottom: 20 }}>Billing Payment</h4>

            <Form onSubmit={handleSubmit}>

                {/* Default card option */}

                {defaultCard && (

                    <Form.Check
                        type="radio"
                        name="paymentOption"
                        checked={useDefault}
                        onChange={() => setUseDefault(true)}
                        label={
                            <div>
                                <strong>Use default card</strong>
                                <div style={{ fontSize: 14, color: "#777" }}>
                                    {defaultCard.method.toUpperCase()} •••• {defaultCard.cardNumber.slice(-4)}
                                    <br />
                                    Cardholder: {defaultCard.holderName}
                                </div>
                            </div>
                        }
                        style={{ marginBottom: 20 }}
                    />

                )}

                {/* New card option */}

                <Form.Check
                    type="radio"
                    name="paymentOption"
                    checked={!useDefault}
                    onChange={() => setUseDefault(false)}
                    label="Use a new card"
                />

                {!useDefault && (

                    <Row className="mt-4">

                        {/* Credit card preview */}

                        <Col md={6}>

                            <Cards
                                number={cardNumber}
                                name={holderName}
                                expiry={expiry}
                                cvc={cvv}
                                focused={focus}
                            />

                        </Col>

                        {/* Input fields */}

                        <Col md={6}>

                            <Form.Group className="mb-3">
                                <Form.Label>Cardholder Name</Form.Label>
                                <Form.Control
                                    value={holderName}
                                    name="name"
                                    onFocus={(e) => setFocus(e.target.name)}
                                    onChange={(e) => setHolderName(e.target.value)}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Card Number</Form.Label>
                                <Form.Control
                                    value={cardNumber}
                                    name="number"
                                    placeholder="1234 5678 9012 3456"
                                    onFocus={(e) => setFocus(e.target.name)}
                                    onChange={(e) => setCardNumber(e.target.value)}
                                />
                            </Form.Group>

                            <Row>

                                <Col>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Expiry</Form.Label>
                                        <Form.Control
                                            name="expiry"
                                            placeholder="MMYY"
                                            value={expiry}
                                            onFocus={(e) => setFocus(e.target.name)}
                                            onChange={(e) => setExpiry(e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>

                                <Col>
                                    <Form.Group className="mb-3">
                                        <Form.Label>CVV</Form.Label>
                                        <Form.Control
                                            name="cvc"
                                            value={cvv}
                                            placeholder="123"
                                            onFocus={(e) => setFocus(e.target.name)}
                                            onChange={(e) => setCvv(e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>

                            </Row>

                            <Form.Check
                                type="checkbox"
                                label="Save this card for future payments"
                                checked={saveCard}
                                onChange={(e) => setSaveCard(e.target.checked)}
                            />

                        </Col>

                    </Row>

                )}

            </Form>

        </Card>

    );
}
