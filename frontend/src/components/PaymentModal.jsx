import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Alert, Row, Col } from "react-bootstrap";

export function PaymentModal({
                                 show,
                                 onClose,
                                 onSaved,
                                 darkMode = false,
                                 profileBilling = {},
                             }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [method, setMethod] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expiredDate, setExpiredDate] = useState(""); // YYYY-MM
    const [holderName, setHolderName] = useState("");
    const [cvv, setCvv] = useState("");

    const cardOptions = ["VISA", "MasterCard", "AMEX", "Discover"];

    // ---- use profileBilling to pre-fill form ----
    useEffect(() => {
        if (!show) return;

        setMethod(profileBilling.method ?? "");
        setCardNumber(profileBilling.last4 ? "**** **** **** " + profileBilling.last4 : "");
        setExpiredDate(profileBilling.expiredDate?.slice(0, 7) ?? "");
        setHolderName(profileBilling.holderName ?? "");
        setCvv(profileBilling.localCvv ?? "");
    }, [show, profileBilling]);

    const formatCardNumber = (value) => {
        if (!value) return "";
        return value.toString().replace(/\D/g, "").replace(/(\d{4})/g, "$1 ").trim();
    };

    const handleCardNumberChange = (e) => {
        const raw = e.target.value.replace(/\D/g, "");
        setCardNumber(formatCardNumber(raw));
    };

    const save = async () => {
        setSaving(true);
        setError("");

        try {
            if (!method) throw new Error("Please select a card type.");
            if (!holderName.trim()) throw new Error("Please enter the cardholder name.");
            if (!cardNumber.trim()) throw new Error("Please enter a card number.");
            const rawCard = cardNumber.replace(/\s+/g, "");
            if (!/^\d{16}$/.test(rawCard)) throw new Error("Card number must be 16 digits.");
            if (!cvv.trim()) throw new Error("Please enter CVV.");
            if (!/^\d{3,4}$/.test(cvv.trim())) throw new Error("CVV must be 3 or 4 digits.");
            if (!expiredDate.trim()) throw new Error("Please enter expiry date.");
            if (!/^\d{4}-\d{2}$/.test(expiredDate.trim())) throw new Error("Expiry date must be YYYY-MM");

            const [year, month] = expiredDate.split("-");
            const expiredLocalDate = `${year}-${month}-01`;

            const payload = {
                method,
                cardNumber: rawCard,
                holderName,
                expiredDate: expiredLocalDate,
            };

            // ---- PUT to backend ----
            const res = await fetch("/api/billing/payment", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(text || "Failed to save payment method");
            }

            const data = await res.json();

            // 回调，保存前端 CVV
            onSaved?.(data ?? payload, cvv);
        } catch (e) {
            setError(e.message || "Failed to save payment method");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose} centered backdrop keyboard>
            <Modal.Header closeButton className={darkMode ? "bg-dark text-light" : ""}>
                <Modal.Title>Payment Method</Modal.Title>
            </Modal.Header>

            <Modal.Body className={darkMode ? "bg-dark text-light" : ""}>
                {error && <Alert variant="danger">{error}</Alert>}

                <Row className="g-3">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Method</Form.Label>
                            <Form.Select value={method} onChange={(e) => setMethod(e.target.value)}>
                                <option value="">Select a card type</option>
                                {cardOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                            </Form.Select>
                        </Form.Group>
                    </Col>

                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Cardholder Name</Form.Label>
                            <Form.Control value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder="Name on card" />
                        </Form.Group>
                    </Col>

                    <Col md={8}>
                        <Form.Group>
                            <Form.Label>Card Number</Form.Label>
                            <Form.Control
                                value={cardNumber}
                                onChange={handleCardNumberChange}
                                placeholder="4111 1111 1111 1111"
                                inputMode="numeric"
                            />
                        </Form.Group>
                    </Col>

                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>CVV</Form.Label>
                            <Form.Control
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value)}
                                placeholder="123"
                                maxLength={4}
                                inputMode="numeric"
                            />
                        </Form.Group>
                    </Col>

                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Expiry Date</Form.Label>
                            <Form.Control
                                type="month"
                                value={expiredDate}
                                onChange={(e) => setExpiredDate(e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                </Row>
            </Modal.Body>

            <Modal.Footer className={darkMode ? "bg-dark" : ""}>
                <Button variant={darkMode ? "outline-light" : "outline-secondary"} onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={save} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}