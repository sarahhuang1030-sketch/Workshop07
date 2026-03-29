import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert, Row, Col, Spinner } from "react-bootstrap";
import { apiFetch } from "../services/api";

export function BillingModal({
                                 show,
                                 profile,
                                 onClose,
                                 onSaveProfile,
                                 onSaved,
                                 needsPhone = true
                             }) {
    const [draft, setDraft] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!show || !profile) return;

        async function loadBilling() {
            setLoading(true);
            setError("");
            setDraft(null);

            try {
                const res = await apiFetch("/api/billing/address");

                if (!res.ok) {
                    const msg = await res.text().catch(() => "");
                    setError(msg || `Failed to load billing info`);
                    return;
                }

                const data = await res.json();

                setDraft({
                    street1: data.street1 ?? "",
                    street2: data.street2 ?? "",
                    city: data.city ?? "",
                    province: data.province ?? "",
                    postalCode: data.postalCode ?? "",
                    country: data.country ?? "",
                    phone: data.homePhone ?? "",
                    firstName: data.firstName ?? "",
                    lastName: data.lastName ?? "",
                    email: data.email ?? "",
                });

            } catch (e) {
                setError(e?.message || "Failed to load billing info");
            } finally {
                setLoading(false);
            }
        }

        loadBilling();
    }, [show, profile]);

    const handleClose = () => {
        setDraft(null);
        setError("");
        onClose?.();
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError("");

            const res = await apiFetch("/api/billing/address", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    street1: draft.street1,
                    street2: draft.street2,
                    city: draft.city,
                    province: draft.province,
                    postalCode: draft.postalCode,
                    country: draft.country,
                    homePhone: draft.phone,
                    firstName: draft.firstName,
                    lastName: draft.lastName,
                    email: draft.email,
                }),
            });

            if (res.status === 401) {
                throw new Error("Not authenticated");
            }

            if (res.status === 409) {
                setError("Please complete registration before updating billing information.");
                return;
            }

            if (!res.ok) {
                throw new Error("Failed to update billing information");
            }

            const data = await res.json();

            // ✅ UPDATE PARENT STATE (correct way)
            onSaveProfile?.(data);
            onSaved?.(data);

            // ✅ CLOSE MODAL (correct way)
            handleClose();

        } catch (err) {
            console.error(err);
            setError(err.message || "Unexpected error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Edit Billing Information</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {loading && (
                    <div className="text-center py-4">
                        <Spinner animation="border" />
                    </div>
                )}

                {error && <Alert variant="danger">{error}</Alert>}

                {draft && !loading && (
                    <>
                        <Form.Group className="mb-3">
                            <Form.Label>First Name</Form.Label>
                            <Form.Control
                                value={draft.firstName}
                                onChange={(e) =>
                                    setDraft(d => ({ ...d, firstName: e.target.value }))
                                }
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Last Name</Form.Label>
                            <Form.Control
                                value={draft.lastName}
                                onChange={(e) =>
                                    setDraft(d => ({ ...d, lastName: e.target.value }))
                                }
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                value={draft.email}
                                onChange={(e) =>
                                    setDraft(d => ({ ...d, email: e.target.value }))
                                }
                            />
                        </Form.Group>

                        {needsPhone && (
                            <Form.Group className="mb-3">
                                <Form.Label>Phone</Form.Label>
                                <Form.Control
                                    value={draft.phone}
                                    onChange={(e) =>
                                        setDraft(d => ({ ...d, phone: e.target.value }))
                                    }
                                />
                            </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label>Street 1</Form.Label>
                            <Form.Control
                                value={draft.street1}
                                onChange={(e) =>
                                    setDraft(d => ({ ...d, street1: e.target.value }))
                                }
                            />
                        </Form.Group>

                        <Row className="g-2">
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>City</Form.Label>
                                    <Form.Control
                                        value={draft.city}
                                        onChange={(e) =>
                                            setDraft(d => ({ ...d, city: e.target.value }))
                                        }
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Province</Form.Label>
                                    <Form.Control
                                        value={draft.province}
                                        onChange={(e) =>
                                            setDraft(d => ({ ...d, province: e.target.value }))
                                        }
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="g-2">
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Postal Code</Form.Label>
                                    <Form.Control
                                        value={draft.postalCode}
                                        onChange={(e) =>
                                            setDraft(d => ({ ...d, postalCode: e.target.value }))
                                        }
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Country</Form.Label>
                                    <Form.Control
                                        value={draft.country}
                                        onChange={(e) =>
                                            setDraft(d => ({ ...d, country: e.target.value }))
                                        }
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} disabled={saving}>
                    Cancel
                </Button>

                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving || !draft?.street1 || !draft?.firstName || !draft?.lastName}
                >
                    {saving ? "Saving..." : "Save"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}