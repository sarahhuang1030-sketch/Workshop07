/**
 Description: Payment Modal page, where users can add or edit their payment method details.
 Created by: Sarah
 Created on: March 2026
**/

import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Alert, Spinner, Row, Col } from "react-bootstrap";

export function PaymentModal({ show, onClose, onSaved, darkMode = false }) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // DB-aligned fields
    const [method, setMethod] = useState("");         // e.g. VISA / MasterCard
    const [cardNumber, setCardNumber] = useState(""); // full card number (school project)
    const [expiredDate, setExpiredDate] = useState(""); // "YYYY-MM" or "YYYY-MM-DD"
    const [holderName, setHolderName] = useState("");
    const [cvv, setCvv] = useState("");

    // Load existing payment method when modal opens
    useEffect(() => {
        if (!show) return;

        (async () => {
            setLoading(true);
            setError("");

            try {
                const res = await fetch("/api/billing/payment-method", { credentials: "include" });

                if (res.status === 404) {
                    // no payment method yet — clear form
                    setMethod("");
                    setCardNumber("");
                    setExpiredDate("");
                    setHolderName("");
                    setCvv("");
                    return;
                }

                if (!res.ok) throw new Error("Failed to load payment method");

                const data = await res.json();
                const pm = data?.paymentMethod ?? data ?? {};

                setMethod(pm.method ?? "");
                setCardNumber(pm.cardNumber ?? "");
                setExpiredDate(pm.expiredDate ?? "");
                setHolderName(pm.holderName ?? "");
                setCvv(pm.cvv ?? "");
            } catch (e) {
                setError(e?.message || "Failed to load payment method");
            } finally {
                setLoading(false);
            }
        })();
    }, [show]);

    const save = async () => {
        setSaving(true);
        setError("");

        try {
            // Basic frontend validation (optional)
            if (!method.trim()) throw new Error("Please enter a payment method (e.g., VISA).");
            if (!cardNumber.trim()) throw new Error("Please enter a card number.");
            if (!holderName.trim()) throw new Error("Please enter the cardholder name.");
            if (!expiredDate.trim()) throw new Error("Please enter an expiry date.");

            const payload = {
                method: method.trim(),
                cardNumber: cardNumber.trim(),
                expiredDate: expiredDate.trim(),
                holderName: holderName.trim(),
                cvv: cvv.trim(),
            };

            const res = await fetch("/api/billing/payment-method", {
                method: "PUT", // or POST
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to save payment method");

            const data = await res.json().catch(() => ({}));
            const saved = data?.paymentMethod ?? data ?? payload;

            onSaved?.(saved);
            onClose?.();
        } catch (e) {
            setError(e?.message || "Failed to save payment method");
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

                {loading ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" />
                    </div>
                ) : (
                    <>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Method</Form.Label>
                                    <Form.Control
                                        value={method}
                                        onChange={(e) => setMethod(e.target.value)}
                                        placeholder="VISA / MasterCard"
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Cardholder Name</Form.Label>
                                    <Form.Control
                                        value={holderName}
                                        onChange={(e) => setHolderName(e.target.value)}
                                        placeholder="Name on card"
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={8}>
                                <Form.Group>
                                    <Form.Label>Card Number</Form.Label>
                                    <Form.Control
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value)}
                                        placeholder="4111111111111111"
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
                                        value={expiredDate}
                                        onChange={(e) => setExpiredDate(e.target.value)}
                                        placeholder="YYYY-MM (or YYYY-MM-DD)"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </>
                )}
            </Modal.Body>

            <Modal.Footer className={darkMode ? "bg-dark" : ""}>
                <Button variant={darkMode ? "outline-light" : "outline-secondary"} onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={save} disabled={saving || loading}>
                    {saving ? "Saving..." : "Save"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}