import React, { useState, useEffect } from "react";
import { Card, Button, Row, Col } from "react-bootstrap";
import { CreditCard } from "lucide-react";
import PaymentForm from "./PaymentForm"; // PaymentForm component from your project

/**
 * BillingCard component
 * Displays user's billing info and saved payment methods as card UI.
 * Allows adding new cards and saving them to the backend.
 *
 */
export function BillingCard({ profile, darkMode }) {
    // Styling classes
    const cardBase = darkMode ? "bg-dark border-secondary text-light" : "bg-white border-light text-dark";

    // State for saved cards and "add new card" form
    const [cards, setCards] = useState([]);
    const [showAddCard, setShowAddCard] = useState(false);

    // Extract payment info from profile
    const pay = profile.billing.paymentMethod || {};

    useEffect(() => {
        if (pay) setCards([pay]); // Load existing payment method
    }, [pay]);

    /**
     * Callback when a new card is saved in PaymentForm
     * Updates local state to show the new card
     */
    const handleNewCardSaved = (newCard) => {
        setCards([...cards, newCard]);
        setShowAddCard(false);
    };

    // Render each card as a realistic "credit card" UI
    const renderCardUI = (card) => (
        <Card
            key={card.stripePaymentMethodId || card.last4}
            className="p-3"
            style={{
                borderRadius: 18,
                background: "#4a90e2",
                color: "#fff",
                minHeight: 150,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
            }}
        >
            <div className="d-flex justify-content-between">
                <div>{card.method?.toUpperCase() || "CARD"}</div>
                <div>{card.isDefault ? "Default" : ""}</div>
            </div>

            <div className="fw-bold my-2" style={{ fontSize: "1.2rem", letterSpacing: 2 }}>
                {card.displayCard || `**** **** **** ${card.last4}`}
            </div>

            <div className="d-flex justify-content-between" style={{ fontSize: "0.85rem" }}>
                <div>Cardholder:<br />{card.holderName || "—"}</div>
                <div>Expires:<br />{(card.expiryMonth || "--") + "/" + (card.expiryYear || "--")}</div>
            </div>
        </Card>
    );

    return (
        <Card className={`${cardBase} mt-4`} style={{ borderRadius: 22, padding: 20 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="fw-bold" style={{ fontSize: "1.3rem" }}>Billing Information</div>
                <CreditCard size={20} />
            </div>

            {/* Cards Grid */}
            <Row className="mb-3">
                {cards.map((card) => (
                    <Col md={6} className="mb-3" key={card.stripePaymentMethodId || card.last4}>
                        {renderCardUI(card)}
                    </Col>
                ))}
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