import React, { useState, useEffect } from "react";
import { Card, Button, Row, Col } from "react-bootstrap";
import { CreditCard, Trash2, CheckCircle } from "lucide-react";
import PaymentForm from "./PaymentForm";
import { apiFetch } from "../services/api";

/**
 * BillingCard Component
 * --------------------
 * Displays user's saved billing/payment methods.
 * Supports adding new cards, deleting cards, and setting default card.
 * Syncs all changes with backend API (/api/billing/payment).
 */
export function BillingCard({ darkMode }) {
    const cardBase = darkMode ? "bg-dark border-secondary text-light" : "bg-white border-light text-dark";

    // State: list of saved cards
    const [cards, setCards] = useState([]);
    // State: show "Add New Card" form
    const [showAddCard, setShowAddCard] = useState(false);

    // Fetch saved cards from backend on component mount
    useEffect(() => {
        const fetchCards = async () => {
            try {
                const data = await apiFetch("/api/billing/payment/all");
                if (Array.isArray(data)) {
                    setCards(data);
                }
            } catch (err) {
                console.error("Failed to load cards:", err);
            }
        };

        fetchCards();
    }, []);

    /**
     * Handle a newly added card from PaymentForm
     * Updates local state
     */
    const handleNewCardSaved = (newCard) => {
        setCards((prev) => [...prev, newCard]);
        setShowAddCard(false);
    };

    /**
     * Set a card as default
     * Sends PATCH request to backend and updates local state
     */
    const handleSetDefault = async (card) => {
        try {
            await apiFetch(`/api/billing/payment/default/${card.stripePaymentMethodId}`, {
                method: "PATCH",
            });

            setCards((prev) =>
                prev.map((c) => ({
                    ...c,
                    isDefault: c.stripePaymentMethodId === card.stripePaymentMethodId,
                }))
            );
        } catch (err) {
            console.error("Failed to set default card", err);
            alert("Failed to set default card");
        }
    };

    /**
     * Delete a card
     * Sends DELETE request to backend and updates local state
     */
    const handleDelete = async (card) => {
        if (!window.confirm(`Are you sure you want to delete card **** **** **** ${card.last4}?`)) return;

        try {
            await apiFetch(`/api/billing/payment/${card.stripePaymentMethodId}`, { method: "DELETE" });
            setCards((prev) => prev.filter((c) => c.stripePaymentMethodId !== card.stripePaymentMethodId));
        } catch (err) {
            console.error("Failed to delete card", err);
            alert("Failed to delete card");
        }
    };

    /**
     * Render a single card in "credit card" style
     */
    const renderCardUI = (card) => (
        <Card
            key={card.stripePaymentMethodId || card.last4}
            className="p-3"
            style={{
                borderRadius: 18,
                background: card.isDefault ? "#2a9d8f" : "#4a90e2",
                color: "#fff",
                minHeight: 150,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
            }}
        >
            <div className="d-flex justify-content-between">
                <div>{card.method?.toUpperCase() || "CARD"}</div>
                <div>{card.isDefault && <CheckCircle size={18} />}</div>
            </div>

            <div className="fw-bold my-2" style={{ fontSize: "1.2rem", letterSpacing: 2 }}>
                {card.displayCard || `**** **** **** ${card.last4 || "—"}`}
            </div>

            <div className="d-flex justify-content-between" style={{ fontSize: "0.85rem" }}>
                <div>
                    Cardholder:<br />
                    {card.holderName || "—"}
                </div>
                <div>
                    Expires:<br />
                    {(card.expiryMonth || "--") + "/" + (card.expiryYear || "--")}
                </div>
            </div>

            <div className="d-flex justify-content-end mt-2 gap-2">
                {!card.isDefault && (
                    <Button size="sm" variant="light" onClick={() => handleSetDefault(card)}>
                        Set Default
                    </Button>
                )}
                <Button size="sm" variant="danger" onClick={() => handleDelete(card)}>
                    <Trash2 size={16} />
                </Button>
            </div>
        </Card>
    );

    return (
        <Card className={`${cardBase} mt-4`} style={{ borderRadius: 22, padding: 20 }}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="fw-bold" style={{ fontSize: "1.3rem" }}>
                    Billing Information
                </div>
                <CreditCard size={20} />
            </div>

            {/* Render saved cards */}
            <Row className="mb-3">
                {cards.map((card) => (
                    <Col md={6} className="mb-3" key={card.stripePaymentMethodId || card.last4}>
                        {renderCardUI(card)}
                    </Col>
                ))}
                {cards.length === 0 && <div className="text-muted">No saved cards yet.</div>}
            </Row>

            {/* Add New Card Section */}
            {showAddCard ? (
                <PaymentForm onPaymentSaved={handleNewCardSaved} />
            ) : (
                <Button
                    variant={darkMode ? "outline-light" : "primary"}
                    onClick={() => setShowAddCard(true)}
                >
                    Add New Card
                </Button>
            )}
        </Card>
    );
}