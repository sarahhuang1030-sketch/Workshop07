import React, { useState, useEffect } from "react";
import { Card, Button, Row, Col } from "react-bootstrap";
import { CreditCard, Trash2, CheckCircle } from "lucide-react";
import PaymentForm from "./PaymentForm";
import { apiFetch } from "../services/api";

/**
 * BillingCard Component
 * --------------------
 * Displays saved payment cards with realistic UI.
 * Supports: add, delete, and set default.
 * New cards are added in real-time without refreshing the whole list.
 */
export function BillingCard({ darkMode }) {
    const cardBase = darkMode
        ? "bg-dark border-secondary text-light"
        : "bg-white border-light text-dark";

    const [cards, setCards] = useState([]);
    const [showAddCard, setShowAddCard] = useState(false);

    // ----------------- Fetch all cards -----------------
    const fetchCards = async () => {
        try {
            const res = await apiFetch("/api/billing/payment/all");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (Array.isArray(data)) setCards(data);
            else setCards([]);
        } catch (err) {
            console.error("Failed to load cards:", err);
            setCards([]);
        }
    };

    useEffect(() => {
        fetchCards();
    }, []);

    // ----------------- Handle new card saved -----------------
    const handleNewCardSaved = (savedCard) => {
        // Remove any previous card with same ID (safety)
        const filtered = cards.filter(c => c.stripePaymentMethodId !== savedCard.stripePaymentMethodId);

        // If savedCard is default, mark others as non-default
        let updated = filtered.map(c => ({ ...c, isDefault: savedCard.isDefault ? false : c.isDefault }));

        // Add the new card at the top
        updated = [savedCard, ...updated];

        setCards(updated);       // Update state to reflect new card immediately
        setShowAddCard(false);   // Close the form
    };

    // ----------------- Set card as default -----------------
    const handleSetDefault = async (card) => {
        try {
            await apiFetch(`/api/billing/payment/default/${card.stripePaymentMethodId}`, {
                method: "PATCH",
            });

            // Update state locally
            setCards(cards.map(c => ({
                ...c,
                isDefault: c.stripePaymentMethodId === card.stripePaymentMethodId
            })));
        } catch (err) {
            console.error("Failed to set default card", err);
        }
    };

    // ----------------- Delete card -----------------
    const handleDelete = async (card) => {
        if (!window.confirm(`Delete card **** ${card.last4}?`)) return;
        try {
            await apiFetch(`/api/billing/payment/${card.stripePaymentMethodId}`, { method: "DELETE" });

            // Remove from local state
            setCards(cards.filter(c => c.stripePaymentMethodId !== card.stripePaymentMethodId));
        } catch (err) {
            console.error("Failed to delete card", err);
        }
    };

    // ----------------- Render card UI -----------------
    const renderCardUI = (card) => {
        const brand = card.method?.toUpperCase() || "CARD";
        return (
            <Card
                key={card.stripePaymentMethodId}
                className="p-3 shadow-sm"
                style={{
                    borderRadius: 20,
                    background: card.isDefault
                        ? "linear-gradient(135deg, #2a9d8f, #1d3557)"
                        : "linear-gradient(135deg, #4a90e2, #14213d)",
                    color: "#fff",
                    minHeight: 170,
                    position: "relative",
                }}
            >
                <div className="d-flex justify-content-between">
                    <div style={{ fontWeight: "bold", letterSpacing: 1 }}>{brand}</div>
                    {card.isDefault && <CheckCircle size={20} />}
                </div>

                <div style={{ fontSize: "1.3rem", letterSpacing: 3, marginTop: 20, fontWeight: "bold" }}>
                    {card.displayCard || `**** **** **** ${card.last4}`}
                </div>

                <div className="d-flex justify-content-between" style={{ marginTop: 20, fontSize: "0.85rem" }}>
                    <div>
                        <div style={{ opacity: 0.7 }}>Cardholder</div>
                        <div>{card.holderName || "—"}</div>
                    </div>
                    <div>
                        <div style={{ opacity: 0.7 }}>Expires</div>
                        <div>
                            {(card.expiryMonth || "--") + "/" + (card.expiryYear || "--")}
                        </div>
                    </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3">
                    {!card.isDefault && (
                        <Button size="sm" variant="light" onClick={() => handleSetDefault(card)}>
                            Default
                        </Button>
                    )}
                    <Button size="sm" variant="danger" onClick={() => handleDelete(card)}>
                        <Trash2 size={16} />
                    </Button>
                </div>
            </Card>
        );
    };

    return (
        <Card className={`${cardBase} mt-4`} style={{ borderRadius: 22, padding: 20 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="fw-bold" style={{ fontSize: "1.3rem" }}>Billing Information</div>
                <CreditCard size={20} />
            </div>

            <Row>
                {cards.length > 0 ? (
                    cards.map(card => (
                        <Col md={6} key={card.stripePaymentMethodId} className="mb-3">
                            {renderCardUI(card)}
                        </Col>
                    ))
                ) : (
                    <div className="text-muted">No saved cards yet.</div>
                )}
            </Row>

            {showAddCard ? (
                <PaymentForm onPaymentSaved={handleNewCardSaved} />
            ) : (
                <Button
                    variant={darkMode ? "outline-light" : "primary"}
                    onClick={() => setShowAddCard(true)}
                    className="mt-3"
                >
                    Add New Card
                </Button>
            )}
        </Card>
    );
}