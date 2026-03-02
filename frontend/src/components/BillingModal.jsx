import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert, Row, Col, Spinner } from "react-bootstrap";

export function BillingModal({ show, profile, onClose, onSave, needsPhone = true }) {
    const [draft, setDraft] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (show && profile) {
            setDraft({
                firstName: profile.firstName ?? "",
                lastName: profile.lastName ?? "",
                email: profile.email ?? "",
                phone: profile.phone ?? "",
                street1: profile.billing?.address?.street1 ?? "",
                street2: profile.billing?.address?.street2 ?? "",
                city: profile.billing?.address?.city ?? "",
                province: profile.billing?.address?.province ?? "",
                postalCode: profile.billing?.address?.postalCode ?? "",
                country: profile.billing?.address?.country ?? "",
            });
            setError("");
        }
    }, [show, profile]);

    const handleSave = async () => {
        setSaving(true);
        setError("");

        try {
            const res = await fetch("/api/me/address", {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(draft),
            });

            if (!res.ok) throw new Error("Failed to save");

            const updated = await res.json();
            if (onSave) onSave(updated);
            if (onClose) onClose();
        } catch (err) {
            console.error(err);
            setError("Failed to save billing info.");
        } finally {
            setSaving(false);
        }
    };

    if (!profile) {
        return (
            <Modal show={show} onHide={onClose} centered>
                <Modal.Body className="text-center py-4">
                    <Spinner animation="border" />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Edit Billing Information</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}

                <Form.Group className="mb-3">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control
                        value={draft.firstName ?? ""}
                        onChange={(e) => setDraft(d => ({ ...d, firstName: e.target.value }))}
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control
                        value={draft.lastName ?? ""}
                        onChange={(e) => setDraft(d => ({ ...d, lastName: e.target.value }))}
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                        type="email"
                        value={draft.email ?? ""}
                        onChange={(e) => setDraft(d => ({ ...d, email: e.target.value }))}
                    />
                </Form.Group>

                {needsPhone && (
                    <Form.Group className="mb-3">
                        <Form.Label>Phone Number</Form.Label>
                        <Form.Control
                            value={draft.phone ?? ""}
                            onChange={(e) => setDraft(d => ({ ...d, phone: e.target.value }))}
                        />
                    </Form.Group>
                )}

                <Form.Group className="mb-3">
                    <Form.Label>Street 1</Form.Label>
                    <Form.Control
                        value={draft.street1 ?? ""}
                        onChange={(e) => setDraft(d => ({ ...d, street1: e.target.value }))}
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Street 2 (optional)</Form.Label>
                    <Form.Control
                        value={draft.street2 ?? ""}
                        onChange={(e) => setDraft(d => ({ ...d, street2: e.target.value }))}
                    />
                </Form.Group>

                <Row className="g-2">
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>City</Form.Label>
                            <Form.Control
                                value={draft.city ?? ""}
                                onChange={(e) => setDraft(d => ({ ...d, city: e.target.value }))}
                            />
                        </Form.Group>
                    </Col>

                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Province</Form.Label>
                            <Form.Control
                                value={draft.province ?? ""}
                                onChange={(e) => setDraft(d => ({ ...d, province: e.target.value }))}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Row className="g-2">
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Postal Code</Form.Label>
                            <Form.Control
                                value={draft.postalCode ?? ""}
                                onChange={(e) => setDraft(d => ({ ...d, postalCode: e.target.value }))}
                            />
                        </Form.Group>
                    </Col>

                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Country</Form.Label>
                            <Form.Control
                                value={draft.country ?? ""}
                                onChange={(e) => setDraft(d => ({ ...d, country: e.target.value }))}
                            />
                        </Form.Group>
                    </Col>
                </Row>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving || !draft.street1?.trim() || !draft.firstName?.trim() || !draft.lastName?.trim()}
                >
                    {saving ? "Saving..." : "Save"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}