/**
 Description: Payment Modal page, where users can add or edit their payment method details.
 Created by: Sarah
 Edited by: Sherry
 Created on: March 2026
**/

import React, { useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiFetch } from "../services/api";

export function PaymentModal({
                                 show,
                                 onClose,
                                 onSaved,
                                 darkMode = false,
                             }) {
    const stripe = useStripe();
    const elements = useElements();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [confirmDefault, setConfirmDefault] = useState(false);
    const [holderName, setHolderName] = useState("");

    /**
     * Submit payment method securely using Stripe
     */
    const save = async () => {
        setSaving(true);
        setError("");

        try {
            if (!stripe || !elements) {
                throw new Error("Stripe has not loaded yet.");
            }

            if (!holderName.trim()) {
                throw new Error("Please enter cardholder name.");
            }

            if (!confirmDefault) {
                throw new Error("Please confirm default payment method.");
            }

            // Create PaymentMethod via Stripe (SECURE)
            const cardElement = elements.getElement(CardElement);

            const { error: stripeError, paymentMethod } =
                await stripe.createPaymentMethod({
                    type: "card",
                    card: cardElement,
                    billing_details: {
                        name: holderName,
                    },
                });

            if (stripeError) {
                throw new Error(stripeError.message);
            }

            // Send ONLY paymentMethod.id to backend
            const res = await apiFetch("/api/billing/payment/stripe", {
                method: "POST",
                body: JSON.stringify({
                    stripePaymentMethodId: paymentMethod.id,
                    holderName,
                    setAsDefault: confirmDefault,
                }),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(text || "Failed to save payment method");
            }

            const data = await res.json();

            onSaved?.(data);
            onClose?.();
        } catch (e) {
            setError(e.message || "Failed to save payment method");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Payment Method</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}

                <Form.Group className="mb-3">
                    <Form.Label>Cardholder Name</Form.Label>
                    <Form.Control
                        value={holderName}
                        onChange={(e) => setHolderName(e.target.value)}
                        placeholder="Name on card"
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Card Details</Form.Label>
                    <div style={{
                        padding: "10px",
                        border: "1px solid #ccc",
                        borderRadius: "6px"
                    }}>
                        <CardElement
                            options={{
                                hidePostalCode: true,
                                style: {
                                    base: {
                                        fontSize: "16px",
                                        color: darkMode ? "#fff" : "#000",
                                        "::placeholder": {
                                            color: "#999",
                                        },
                                    },
                                },
                            }}
                        />
                    </div>
                </Form.Group>

                <Form.Check
                    type="checkbox"
                    label="Set as default payment method"
                    checked={confirmDefault}
                    onChange={(e) => setConfirmDefault(e.target.checked)}
                />
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={save}
                    disabled={saving}
                >
                    {saving ? "Saving..." : "Save"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}