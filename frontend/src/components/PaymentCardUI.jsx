import React, { useState, useEffect, useCallback } from "react";
import { Card, Button, Row, Col, Form, Alert } from "react-bootstrap";
import { CheckCircle, CreditCard } from "lucide-react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiFetch } from "../services/api";

export default function PaymentCardUI({ onCardSelect }) {
    const stripe = useStripe();
    const elements = useElements();

    const [cards, setCards] = useState([]);
    const [selectedCardId, setSelectedCardId] = useState(null);

    const [showNewCardForm, setShowNewCardForm] = useState(false);
    const [holderName, setHolderName] = useState("");
    const [saveCard, setSaveCard] = useState(false);
    const [loading, setLoading] = useState(false);

    const [_ALERT, setAlert] = useState("");

    /**
     * Load saved payment methods from backend
     */
    const fetchCards = useCallback(async () => {
        try {
            const res = await apiFetch("/api/billing/payment/all");
            const data = await res.json();

            const mapped = data.map(c => ({
                accountId: c.accountId,
                stripePaymentMethodId: c.stripePaymentMethodId,
                stripeCustomerId: c.stripeCustomerId,
                last4: c.last4,
                brand: c.brand,
                holderName: c.holderName,
                isDefault: c.isDefault,
                expiryMonth: c.expiryMonth,
                expiryYear: c.expiryYear,
                isTemporary: false
            }));

            setCards(mapped);
        } catch (e) {
            console.error(e);
            setCards([]);
        }
    }, []);

    useEffect(() => {
        fetchCards();
    }, [fetchCards]);

    /**
     * Select card for checkout
     */
    const handleSelectCard = (card) => {
        setSelectedCardId(card.stripePaymentMethodId);
        if (onCardSelect) onCardSelect(card);
    };

    /**
     * Add new card using Stripe PaymentMethod
     */
    const handleAddCard = async () => {
        if (!stripe || !elements) return alert("Stripe not ready");
        if (!holderName.trim()) return alert("Cardholder name required");

        setLoading(true);

        try {
            // 1. Create PaymentMethod (Stripe)
            const { error, paymentMethod } = await stripe.createPaymentMethod({
                type: "card",
                card: elements.getElement(CardElement),
                billing_details: { name: holderName }
            });

            if (error) throw error;

            let newCard = {
                accountId: null,
                stripePaymentMethodId: paymentMethod.id,
                stripeCustomerId: null,
                last4: paymentMethod.card.last4,
                brand: paymentMethod.card.brand,
                holderName,
                expiryMonth: paymentMethod.card.exp_month,
                expiryYear: paymentMethod.card.exp_year,
                isDefault: false,
                isTemporary: !saveCard
            };

            // 2. Save to backend if user selected "Save card"
            if (saveCard) {
                const res = await apiFetch("/api/billing/payment/stripe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        stripePaymentMethodId: paymentMethod.id,
                        holderName
                    })
                });

                newCard = await res.json();
                newCard.isTemporary = false;
            }

            setCards(prev => [newCard, ...prev]);

            handleSelectCard(newCard);

            setAlert("Card added successfully");
            setTimeout(() => setAlert(""), 3000);

            setHolderName("");
            setSaveCard(false);
            setShowNewCardForm(false);

        } catch (e) {
            console.error(e);
            alert(e.message || "Failed to add card");
        } finally {
            setLoading(false);
        }
    };

    const renderCard = (card) => {
        const selected = selectedCardId === card.stripePaymentMethodId;

        return (
            <Card
                key={card.stripePaymentMethodId}
                className="p-3 mb-3 shadow-sm"
                onClick={() => handleSelectCard(card)}
                style={{
                    borderRadius: 20,
                    cursor: "pointer",
                    color: "#fff",
                    background: selected
                        ? "linear-gradient(135deg,#ff9f1c,#ffbf69)"
                        : "linear-gradient(135deg,#4a90e2,#14213d)",
                    border: selected ? "3px solid gold" : "none"
                }}
            >
                <div className="d-flex justify-content-between">
                    <strong>{card.brand?.toUpperCase()}</strong>
                    {card.isDefault && <CheckCircle size={18} />}
                </div>

                <div className="mt-3">
                    **** **** **** {card.last4}
                </div>

                <small>
                    {card.holderName} | {card.expiryMonth}/{card.expiryYear}
                </small>
            </Card>
        );
    };

    return (
        <div>
            <h5>Payment Methods</h5>

            {_ALERT && <Alert variant="success">{_ALERT}</Alert>}

            <Row>
                {cards.map(c => (
                    <Col md={6} key={c.stripePaymentMethodId}>
                        {renderCard(c)}
                    </Col>
                ))}

                <Col md={6}>
                    <Card
                        className="p-3"
                        style={{ borderRadius: 20 }}
                        onClick={() => setShowNewCardForm(v => !v)}
                    >
                        <div className="d-flex justify-content-between">
                            <strong>NEW CARD</strong>
                            <CreditCard />
                        </div>

                        {showNewCardForm && (
                            <div onClick={e => e.stopPropagation()}>
                                <Form.Control
                                    placeholder="Cardholder name"
                                    value={holderName}
                                    onChange={e => setHolderName(e.target.value)}
                                />

                                <div className="border p-2 mt-2">
                                    <CardElement options={{ hidePostalCode: true }} />
                                </div>

                                <Form.Check
                                    label="Save card for future use"
                                    checked={saveCard}
                                    onChange={() => setSaveCard(!saveCard)}
                                />

                                <Button
                                    className="w-100 mt-2"
                                    disabled={loading}
                                    onClick={handleAddCard}
                                >
                                    {loading ? "Processing..." : "Add Card"}
                                </Button>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
}