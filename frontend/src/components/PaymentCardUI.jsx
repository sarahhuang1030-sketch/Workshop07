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

    // ESLint-safe alert state (_ prefix to avoid "assigned but never used" warning)
    const [_ALERT_MESSAGE, _setAlertMessage] = useState("");

    /**
     * Fetch saved cards from backend once
     */
    const fetchCards = useCallback(async () => {
        try {
            const res = await apiFetch("/api/billing/payment/all");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            const mappedCards = data.map(c => ({
                accountId: c.AccountId,
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

            setCards(mappedCards);
        } catch (err) {
            console.error("Failed to load cards:", err);
            setCards([]);
        }
    }, []);

    // Only fetch once on mount
    useEffect(() => {
        fetchCards();
    }, [fetchCards]);

    // Select a card
    const handleSelectCard = (card) => {
        setSelectedCardId(card.stripePaymentMethodId);
        if (onCardSelect) onCardSelect(card);
    };

    // Add a new card
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

            let newCard = {
                accountId: null,
                stripePaymentMethodId: result.paymentMethod.id,
                stripeCustomerId: null,
                last4: result.paymentMethod.card.last4,
                brand: result.paymentMethod.card.brand,
                holderName,
                expiryMonth: result.paymentMethod.card.exp_month,
                expiryYear: result.paymentMethod.card.exp_year,
                isDefault: false,
                isTemporary: !saveCard
            };

            // Save card in backend if user opted to save
            if (saveCard) {
                const res = await apiFetch("/api/billing/payment/stripe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ stripePaymentMethodId: result.paymentMethod.id, holderName }),
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                newCard = await res.json();
                newCard.isTemporary = false;
            }

            setCards([newCard, ...cards]);
            handleSelectCard(newCard);

            // Show ESLint-safe success alert
            _setAlertMessage(`Card ending in ${newCard.last4} added successfully!`);
            setTimeout(() => _setAlertMessage(""), 4000);

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

    // Render individual card
    const renderCard = (card) => {
        const isSelected = selectedCardId === card.stripePaymentMethodId;
        return (
            <Card key={card.stripePaymentMethodId} className="p-3 mb-3 shadow-sm"
                  onClick={() => handleSelectCard(card)}
                  style={{
                      borderRadius: 20,
                      minHeight: 150,
                      color: "#fff",
                      cursor: "pointer",
                      background: card.isDefault ? "linear-gradient(135deg, #2a9d8f, #1d3557)"
                          : isSelected ? "linear-gradient(135deg, #ff9f1c, #ffbf69)"
                              : "linear-gradient(135deg, #4a90e2, #14213d)",
                      border: isSelected ? "3px solid #ffd700" : "none"
                  }}>
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
                        <div>{(card.expiryMonth || "--")}/{(card.expiryYear || "--")}</div>
                    </div>
                </div>
            </Card>
        );
    };

    // Render form to add new card
    const renderNewCardForm = () => (
        <Card className="p-3 mb-3 shadow-sm"
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
            {/* Success alert */}
            {_ALERT_MESSAGE && <Alert variant="success">{_ALERT_MESSAGE}</Alert>}

            <Row>
                {cards.map(card => (
                    <Col md={6} key={card.stripePaymentMethodId}>{renderCard(card)}</Col>
                ))}
                <Col md={6}>{renderNewCardForm()}</Col>
            </Row>
        </div>
    );
}