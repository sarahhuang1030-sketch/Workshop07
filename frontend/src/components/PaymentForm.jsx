import React, { useEffect, useState } from "react";
import { Card, Button, Form } from "react-bootstrap";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiFetch } from "../services/api";

export default function PaymentForm({ onPaymentSaved }) {

    const stripe = useStripe();
    const elements = useElements();

    const [cards, setCards] = useState([]);
    const [selectedCard, setSelectedCard] = useState(null);
    const [holderName, setHolderName] = useState("");

    // Load saved cards
    useEffect(() => {

        const loadCards = async () => {
            try {

                const res = await apiFetch("/api/billing/payment");

                if (!res.ok) return;

                const data = await res.json();

                if (data.cards?.length > 0) {
                    setCards(data.cards);
                    setSelectedCard(data.cards[0]);
                    onPaymentSaved?.(data.cards[0]);
                }

            } catch (err) {
                console.error("Failed to load cards:", err);
            }
        };

        loadCards();

    }, [onPaymentSaved]);


    // Add new card
    const handleAddCard = async () => {

        if (!stripe || !elements) {
            alert("Stripe not ready");
            return;
        }

        const result = await stripe.createPaymentMethod({
            type: "card",
            card: elements.getElement(CardElement),
            billing_details: { name: holderName }
        });

        if (result.error) {
            alert(result.error.message);
            return;
        }

        try {

            const res = await apiFetch("/api/billing/payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    stripePaymentMethodId: result.paymentMethod.id,
                    holderName
                })
            });

            if (!res.ok) throw new Error("Save card failed");

            const savedCard = await res.json();

            setCards(prev => [...prev, savedCard]);
            setSelectedCard(savedCard);

            onPaymentSaved?.(savedCard);

            setHolderName("");

        } catch (err) {

            console.error("Failed to save card:", err);
            alert("Failed to save card");

        }
    };


    return (
        <Card className="p-3 mb-3">

            <h5>Payment Method</h5>

            {cards.length > 0 && (
                <div className="mb-3">
                    {cards.map(card => (
                        <Form.Check
                            key={card.stripePaymentMethodId}
                            type="radio"
                            label={`${(card.method || "CARD").toUpperCase()} •••• ${card.last4 || ""}`}
                            checked={selectedCard?.stripePaymentMethodId === card.stripePaymentMethodId}
                            onChange={() => {
                                setSelectedCard(card);
                                onPaymentSaved?.(card);
                            }}
                        />
                    ))}
                </div>
            )}

            <hr />

            <h6>Add New Card</h6>

            <Form.Control
                placeholder="Cardholder Name"
                value={holderName}
                onChange={e => setHolderName(e.target.value)}
                className="mb-2"
            />

            <div className="mb-3 p-2 border rounded">
                <CardElement
                    options={{
                        hidePostalCode: true,
                        style: {
                            base: {
                                fontSize: "16px",
                                color: "#495057"
                            }
                        }
                    }}
                />
            </div>

            <Button
                onClick={handleAddCard}
                className="w-100"
                disabled={!stripe}
            >
                Save Card
            </Button>

        </Card>
    );
}
