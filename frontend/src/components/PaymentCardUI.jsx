import React, { useState, useEffect } from "react";
import { Card, Button, Row, Col, Form, Alert } from "react-bootstrap";
import { CheckCircle, Trash2, CreditCard } from "lucide-react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiFetch } from "../services/api";

/**
 * PaymentCardUI
 * - Shows saved cards and allows adding new cards
 * - Supports selecting a card (temporary or saved)
 * - Calls `onCardSelect` when a card is selected
 */
export default function PaymentCardUI({ onCardSelect }) {
    const stripe = useStripe();
    const elements = useElements();

    const [cards, setCards] = useState([]);
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [showNewCardForm, setShowNewCardForm] = useState(false);
    const [holderName, setHolderName] = useState("");
    const [saveCard, setSaveCard] = useState(false);
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    // Fetch saved cards from backend
    const fetchCards = async () => {
        try {
            const res = await apiFetch("/api/billing/payment/all");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setCards(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load cards:", err);
            setCards([]);
        }
    };

    useEffect(() => {
        fetchCards();
    }, []);

    // Select a card and notify parent
    const handleSelectCard = (card) => {
        setSelectedCardId(card.stripePaymentMethodId);
        if (onCardSelect) onCardSelect(card); // Pass selected card to parent
    };

    // Add a new card (temporary or saved)
    const handleAddCard = async () => {
        if (!stripe || !elements) return alert("Stripe not ready");
        if (!holderName.trim()) return alert("Enter cardholder name");

        setLoading(true);
        try {
            const result = await stripe.createPaymentMethod({
                type: "card",
                card: elements.getElement(CardElement),
                billing_details: { name: holderName },
            });

            if (result.error) return alert(result.error.message);

            const paymentMethodId = result.paymentMethod.id;

            let newCard = {
                stripePaymentMethodId: paymentMethodId,
                last4: result.paymentMethod.card.last4,
                brand: result.paymentMethod.card.brand,
                holderName,
                expiryMonth: result.paymentMethod.card.exp_month,
                expiryYear: result.paymentMethod.card.exp_year,
                isDefault: false,
                isTemporary: !saveCard,
                stripeCustomerId: null, // Temporary card has no customer yet
            };

            // Save card in backend only if user wants
            if (saveCard) {
                const res = await apiFetch("/api/billing/payment/stripe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ stripePaymentMethodId: paymentMethodId, holderName }),
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                newCard = await res.json();
            }

            setCards([newCard, ...cards]);

            setAlertMessage(`Card ending in ${newCard.last4} added successfully!`);
            setTimeout(() => setAlertMessage(""), 4000);

            handleSelectCard(newCard); // Automatically select the new card

            setHolderName("");
            setSaveCard(false);
            setShowNewCardForm(false);
        } catch (err) {
            console.error(err);
            alert("Failed to add card. See console.");
        } finally {
            setLoading(false);
        }
    };

    // Set default card
    const handleSetDefault = async (card) => {
        try {
            await apiFetch(`/api/billing/payment/default/${card.stripePaymentMethodId}`, { method: "PATCH" });
            setCards(cards.map(c => ({ ...c, isDefault: c.stripePaymentMethodId === card.stripePaymentMethodId })));
        } catch (err) {
            console.error(err);
        }
    };

    // Delete card
    const handleDelete = async (card) => {
        if (!window.confirm(`Delete card ending in ${card.last4}?`)) return;
        try {
            await apiFetch(`/api/billing/payment/${card.stripePaymentMethodId}`, { method: "DELETE" });
            setCards(cards.filter(c => c.stripePaymentMethodId !== card.stripePaymentMethodId));
            if (selectedCardId === card.stripePaymentMethodId) {
                setSelectedCardId(null);
                if (onCardSelect) onCardSelect(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Render a single card
    const renderCard = (card) => {
        const isSelected = selectedCardId === card.stripePaymentMethodId;
        return (
            <Card
                key={card.stripePaymentMethodId}
                className="p-3 mb-3 shadow-sm"
                onClick={() => handleSelectCard(card)}
                style={{
                    borderRadius: 20,
                    minHeight: 150,
                    color: "#fff",
                    cursor: "pointer",
                    background: card.isDefault
                        ? "linear-gradient(135deg, #2a9d8f, #1d3557)"
                        : isSelected
                            ? "linear-gradient(135deg, #ff9f1c, #ffbf69)"
                            : "linear-gradient(135deg, #4a90e2, #14213d)",
                    position: "relative",
                    border: isSelected ? "3px solid #ffd700" : "none",
                }}
            >
                <div className="d-flex justify-content-between">
                    <div style={{ fontWeight: "bold" }}>{card.brand?.toUpperCase() || "CARD"}</div>
                    {card.isDefault && <CheckCircle size={20} />}
                </div>

                <div style={{ fontSize: "1.2rem", marginTop: 20, letterSpacing: 3 }}>
                    **** **** **** {card.last4}
                </div>

                <div className="d-flex justify-content-between mt-3" style={{ fontSize: "0.85rem" }}>
                    <div>
                        <div style={{ opacity: 0.7 }}>Cardholder</div>
                        <div>{card.holderName || "—"}</div>
                    </div>
                    <div>
                        <div style={{ opacity: 0.7 }}>Expires</div>
                        <div>
                            {(card.expiryMonth || "--")}/{(card.expiryYear || "--")}
                        </div>
                    </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3">
                    {!card.isDefault && (
                        <Button size="sm" variant="light" onClick={(e) => { e.stopPropagation(); handleSetDefault(card); }}>
                            Default
                        </Button>
                    )}
                    <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); handleDelete(card); }}>
                        <Trash2 size={16} />
                    </Button>
                </div>
            </Card>
        );
    };

    // Render form to add new card
    const renderNewCardForm = () => (
        <Card
            className="p-3 mb-3 shadow-sm"
            style={{
                borderRadius: 20,
                minHeight: 150,
                color: "#fff",
                background: showNewCardForm ? "linear-gradient(135deg, #ff9f1c, #ffbf69)" : "linear-gradient(135deg, #4a90e2, #14213d)",
                cursor: "pointer",
                border: showNewCardForm ? "3px solid #ffd700" : "none",
            }}
            onClick={() => setShowNewCardForm(!showNewCardForm)}
        >
            <div className="d-flex justify-content-between">
                <div style={{ fontWeight: "bold" }}>NEW CARD</div>
                <CreditCard size={20} />
            </div>

            {showNewCardForm && (
                <div onClick={(e) => e.stopPropagation()}>
                    <Form.Control
                        placeholder="Cardholder Name"
                        value={holderName}
                        onChange={(e) => setHolderName(e.target.value)}
                        className="mb-2"
                    />
                    <div className="mb-2 p-2 border rounded">
                        <CardElement options={{ hidePostalCode: true }} />
                    </div>
                    <Form.Check
                        type="checkbox"
                        label="Save this card for future use"
                        checked={saveCard}
                        onChange={() => setSaveCard(!saveCard)}
                        className="mb-2"
                    />
                    <Button onClick={handleAddCard} disabled={loading} className="w-100">
                        {loading ? "Saving..." : "Use Card"}
                    </Button>
                </div>
            )}
        </Card>
    );

    return (
        <div>
            <h5>Payment Cards</h5>
            {alertMessage && <Alert variant="success">{alertMessage}</Alert>}

            <Row>
                {cards.map(card => (
                    <Col md={6} key={card.stripePaymentMethodId}>
                        {renderCard(card)}
                    </Col>
                ))}
                <Col md={6}>
                    {renderNewCardForm()}
                </Col>
            </Row>
        </div>
    );
}