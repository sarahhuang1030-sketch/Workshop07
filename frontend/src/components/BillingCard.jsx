import React, { useState, useEffect } from "react";
import { Card, Button, Row, Col } from "react-bootstrap";
import { CreditCard, Trash2, CheckCircle } from "lucide-react";
import PaymentForm from "./PaymentCardUI.jsx";
import { apiFetch } from "../services/api";

/**
 * BillingCard Component
 * --------------------
 * Displays saved payment cards with realistic UI.
 * Supports: add, delete, set default.
 * Uses local state updates for instant UX (no full reload).
 */
export function BillingCard({ darkMode }) {

    const cardBase = darkMode
        ? "bg-dark border-secondary text-light"
        : "bg-white border-light text-dark";

    const [cards, setCards] = useState([]);
    const [showAddCard, setShowAddCard] = useState(false);

    // ================= FETCH CARDS =================
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

    // ================= ADD NEW CARD =================
    const handleNewCardSaved = (savedCard) => {
        const filtered = cards.filter(
            c => c.stripePaymentMethodId !== savedCard.stripePaymentMethodId
        );

        let updated = filtered.map(c => ({
            ...c,
            isDefault: savedCard.isDefault ? false : c.isDefault
        }));

        updated = [savedCard, ...updated];

        setCards(updated);
        setShowAddCard(false);
    };

    // ================= SET DEFAULT =================
    const handleSetDefault = async (card) => {
        try {
            await apiFetch(`/api/billing/payment/default/${card.stripePaymentMethodId}`, {
                method: "PATCH",
            });

            setCards(cards.map(c => ({
                ...c,
                isDefault: c.stripePaymentMethodId === card.stripePaymentMethodId
            })));
        } catch (err) {
            console.error("Failed to set default card", err);
        }
    };

    // ================= DELETE CARD =================
    const handleDelete = async (card) => {
        if (!window.confirm(`Delete card **** ${card.last4}?`)) return;

        try {
            await apiFetch(`/api/billing/payment/${card.stripePaymentMethodId}`, {
                method: "DELETE",
            });

            setCards(cards.filter(
                c => c.stripePaymentMethodId !== card.stripePaymentMethodId
            ));
        } catch (err) {
            console.error("Failed to delete card", err);
        }
    };

    // ================= CARD UI =================
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
                }}
            >
                {/* Top */}
                <div className="d-flex justify-content-between">
                    <div style={{ fontWeight: "bold", letterSpacing: 1 }}>
                        {brand}
                    </div>
                    {card.isDefault && <CheckCircle size={20} />}
                </div>

                {/* Number */}
                <div style={{
                    fontSize: "1.3rem",
                    letterSpacing: 3,
                    marginTop: 20,
                    fontWeight: "bold",
                }}>
                    {card.displayCard || `**** **** **** ${card.last4}`}
                </div>

                {/* Bottom */}
                <div className="d-flex justify-content-between mt-3" style={{ fontSize: "0.85rem" }}>
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

                {/* Actions */}
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
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="fw-bold" style={{ fontSize: "1.3rem" }}>
                    Billing Information
                </div>
                <CreditCard size={20} />
            </div>

            {/* Cards */}
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

            {/* Add Card */}
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