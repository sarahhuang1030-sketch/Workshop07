import React, { useState } from "react";
import { Card, Button, Form } from "react-bootstrap";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiFetch } from "../services/api";

/**
 * PaymentForm Component
 * ---------------------
 * Handles adding a new card via Stripe.
 * If "Set as default" is checked, sets this card as default after adding.
 */
export default function PaymentForm({ onPaymentSaved }) {
    const stripe = useStripe();
    const elements = useElements();

    const [holderName, setHolderName] = useState("");
    const [setAsDefault, setSetAsDefault] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleAddCard = async () => {
        if (!stripe || !elements) {
            alert("Stripe is not ready yet.");
            return;
        }

        if (!holderName.trim()) {
            alert("Please enter the cardholder name.");
            return;
        }

        setLoading(true);

        try {
            // Step 1: Create Stripe PaymentMethod
            const result = await stripe.createPaymentMethod({
                type: "card",
                card: elements.getElement(CardElement),
                billing_details: { name: holderName },
            });

            if (result.error) {
                console.error(result.error.message);
                alert(result.error.message);
                setLoading(false);
                return;
            }

            const paymentMethodId = result.paymentMethod.id;

            // Step 2: Send to backend to add card (no need for default)
            const res = await apiFetch("/api/billing/payment/stripe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    stripePaymentMethodId: paymentMethodId,
                    holderName,
                }),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const savedCard = await res.json();

            // Step 3: If user wants, set as default
            if (setAsDefault) {
                await apiFetch(`/api/billing/payment/default/${savedCard.stripePaymentMethodId}`, {
                    method: "PATCH",
                });
                savedCard.isDefault = true; // Update UI state
            }

            // Step 4: Notify parent to refresh UI
            onPaymentSaved(savedCard);

            // Reset form
            setHolderName("");
            setSetAsDefault(false);
        } catch (err) {
            console.error("Failed to add card:", err);
            alert("Failed to add card. See console for details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-3 mt-3">
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

            <Button onClick={handleAddCard} disabled={loading} className="w-100">
                {loading ? "Saving..." : "Save Card"}
            </Button>
        </Card>
    );
}