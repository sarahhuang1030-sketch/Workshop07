import React, { useEffect, useState } from "react";
import { Card, Button, Form } from "react-bootstrap";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {apiFetch} from "../services/api.js";

/**
 * PaymentForm component
 * Props:
 *  - onPaymentSaved: callback function when a payment method is selected or added
 */
export default function PaymentForm({ onPaymentSaved }) {
    const stripe = useStripe();
    const elements = useElements();

    const [cards, setCards] = useState([]); // List of saved cards
    const [selectedCard, setSelectedCard] = useState(null); // Currently selected card
    const [holderName, setHolderName] = useState(""); // Name for new card
    const [loading, setLoading] = useState(true); // Loading state for cards
    const [setAsDefault, setSetAsDefault] = useState(false);

    /**
     * Load saved cards on component mount
     */
    // PaymentForm.jsx
    useEffect(() => {
        const loadCards = async () => {
            try {
                const token = localStorage.getItem("token"); // JWT from login
                if (!token) throw new Error("No token, please login");

                const userRes = await apiFetch("/api/billing/payment", {
                    headers: { "Authorization": `Bearer ${token}` },
                });

                if (!userRes.ok) throw new Error("Unauthorized");

                const userData = await userRes.json();
                const savedCard = userData?.payment;

                if (savedCard) {
                    setCards([savedCard]);
                    setSelectedCard(savedCard);
                } else {
                    setCards([]);
                }

            } catch (err) {
                console.error(err);
                setCards([]);
            } finally {
                setLoading(false);
            }
        };

        loadCards();
    }, []);

    /**
     * Handle adding a new card
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
            // ------------------- Step 1: Create a Stripe PaymentMethod -------------------
            const result = await stripe.createPaymentMethod({
                type: "card",
                card: elements.getElement(CardElement),
                billing_details: { name: holderName },
            });

            if (result.error) {
                console.error("Stripe createPaymentMethod error:", result.error.message);
                alert(result.error.message);
                return;
            }

            const paymentMethodId = result.paymentMethod.id;

            // ------------------- Step 2: Get stripeCustomerId from backend -------------------
            // This ensures first-time users get a Stripe customer ID
            const userRes = await apiFetch("/api/billing/payment", { credentials: "include" });
            if (!userRes.ok) throw new Error("Failed to retrieve user info");

            const userData = await userRes.json();
            const stripeCustomerId = userData?.stripeCustomerId || null; // backend will create one if null

            // ------------------- Step 3: Send payment method to backend -------------------
            const res = await apiFetch("/api/billing/payment/stripe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    stripeCustomerId: stripeCustomerId, // always pass from backend
                    stripePaymentMethodId: paymentMethodId,
                    holderName: holderName,
                    setAsDefault: setAsDefault
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to save card: ${text}`);
            }

            const savedCard = await res.json();

            // ------------------- Step 4: Update frontend state -------------------
            const updatedCards = [...cards, savedCard];
            setCards(updatedCards);
            setSelectedCard(savedCard);
            setHolderName("");
            onPaymentSaved(savedCard);

        } catch (err) {
            console.error("Error adding card:", err);
            alert("Failed to add card. See console for details.");
        }
    };

    /**
     * Handle selecting an existing card
     */
    const handleSelectCard = (card) => {
        setSelectedCard(card);
        onPaymentSaved(card);
    };

    // Show loading state
    if (loading) return <Card className="p-3">Loading saved cards...</Card>;

    return (
        <Card className="p-3 mb-3">
            <h5>Payment Methods</h5>

            {cards.length > 0 && (
                <div className="mb-3">
                    {cards.map((card) => (
                        <Form.Check
                            key={card.stripePaymentMethodId}
                            type="radio"
                            label={`${card.method?.toUpperCase()} •••• ${card.last4}`}
                            checked={selectedCard?.stripePaymentMethodId === card.stripePaymentMethodId}
                            onChange={() => handleSelectCard(card)}
                        />
                    ))}
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