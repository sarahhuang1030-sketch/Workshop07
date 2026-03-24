import React, { useEffect, useState } from "react";
import { Card, Button, Form } from "react-bootstrap";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiFetch } from "../services/api";

/**
 * PaymentForm Component
 * ---------------------
 * Handles:
 *  - Displaying saved cards
 *  - Selecting a card
 *  - Adding a new card via Stripe
 *
 * NOTE:
 * apiFetch returns a Response object → we MUST call .json()
 */
export default function PaymentForm({ onPaymentSaved }) {
    const stripe = useStripe();
    const elements = useElements();

    const [cards, setCards] = useState([]);
    const [selectedCard, setSelectedCard] = useState(null);
    const [holderName, setHolderName] = useState("");
    const [loading, setLoading] = useState(true);
    const [setAsDefault, setSetAsDefault] = useState(false);

    /**
     * Load saved cards
     */
    useEffect(() => {
        const loadCards = async () => {
            try {
                const res = await apiFetch("/api/billing/payment/all");

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }

                const data = await res.json();

                if (Array.isArray(data)) {
                    setCards(data);

                    const defaultCard =
                        data.find((c) => c.isDefault) || data[0] || null;

                    setSelectedCard(defaultCard);

                    if (defaultCard) {
                        onPaymentSaved(defaultCard);
                    }
                } else {
                    setCards([]);
                }
            } catch (err) {
                console.error("Failed to load cards:", err);
                setCards([]);
            } finally {
                setLoading(false);
            }
        };

        loadCards();
    }, [onPaymentSaved]);

    /**
     * Add new card
     */
    const handleAddCard = async () => {
        if (!stripe || !elements) {
            alert("Stripe is not ready yet.");
            return;
        }

        if (!holderName.trim()) {
            alert("Please enter the cardholder name.");
            return;
        }

        try {
            // Step 1: Create Stripe PaymentMethod
            const result = await stripe.createPaymentMethod({
                type: "card",
                card: elements.getElement(CardElement),
                billing_details: { name: holderName },
            });

            if (result.error) {
                alert(result.error.message);
                return;
            }

            const paymentMethodId = result.paymentMethod.id;

            // Step 2: Save to backend
            const res = await apiFetch("/api/billing/payment/stripe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    stripePaymentMethodId: paymentMethodId,
                    holderName,
                    setAsDefault,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to save card");
            }

            const savedCard = await res.json(); // ✅ FIX

            // Step 3: Reload cards from backend
            const refreshRes = await apiFetch("/api/billing/payment/all");

            if (!refreshRes.ok) {
                throw new Error(`HTTP ${refreshRes.status}`);
            }

            const updatedCards = await refreshRes.json(); // ✅ FIX

            setCards(updatedCards);
            setSelectedCard(savedCard);

            // Reset form
            setHolderName("");
            setSetAsDefault(false);

            onPaymentSaved(savedCard);

        } catch (err) {
            console.error("Error adding card:", err);
            alert("Failed to add card.");
        }
    };

    /**
     * Select existing card
     */
    const handleSelectCard = (card) => {
        setSelectedCard(card);
        onPaymentSaved(card);
    };

    if (loading) {
        return <Card className="p-3">Loading saved cards...</Card>;
    }

    return (
        <Card className="p-3 mb-3">
            <h5>Payment Methods</h5>

            {cards.length > 0 ? (
                <div className="mb-3">
                    {cards.map((card) => (
                        <Form.Check
                            key={card.stripePaymentMethodId}
                            type="radio"
                            label={`${card.method?.toUpperCase()} •••• ${card.last4} ${
                                card.isDefault ? "(Default)" : ""
                            }`}
                            checked={
                                selectedCard?.stripePaymentMethodId ===
                                card.stripePaymentMethodId
                            }
                            onChange={() => handleSelectCard(card)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-muted mb-3">
                    No saved cards. Please add one.
                </div>
            )}

            <hr />

            <h6>Add New Card</h6>

            <Form.Control
                placeholder="Cardholder Name"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                className="mb-2"
            />

            <div className="mb-3 p-2 border rounded">
                <CardElement options={{ hidePostalCode: true }} />
            </div>

            <Form.Check
                type="checkbox"
                label="Set as default card"
                checked={setAsDefault}
                onChange={() => setSetAsDefault(!setAsDefault)}
                className="mb-3"
            />

            <Button onClick={handleAddCard} className="w-100">
                Save Card
            </Button>
        </Card>
    );
}