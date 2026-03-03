/**
Description: Billing Modal component, used for both adding and editing billing information.
Created by: Sarah
Created on: February 2026

Modified by: Sherry
Modified on: March 2026
**/

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert, Row, Col, Spinner } from "react-bootstrap";

export function BillingModal({ show, profile, onClose, onSaveProfile, onSaved, needsPhone = true }) {
    const [draft, setDraft] = useState(null);       // local draft for form
    const [loading, setLoading] = useState(false);  // loading state for fetch
    const [saving, setSaving] = useState(false);    // saving state
    const [error, setError] = useState("");         // error message

    // Load billing info when modal opens
    useEffect(() => {
        if (!show || !profile) return;

        async function loadBilling() {
            setLoading(true);
            setError("");
            setDraft(null);

            try {
                const res = await fetch("/api/billing/address", { credentials: "include" });

                if (res.status === 401) {
                    // Redirect to login if unauthorized
                    window.location.href = "/login";
                    return;
                }

                if (!res.ok) {
                    const msg = await res.text().catch(() => "");
                    setError(msg || `Failed to load billing info (${res.status})`);

                    // Fallback: populate draft from profile if fetch fails
                    const a = profile.billing?.address || {};
                    setDraft({
                        street1: a.street1 === "—" ? "" : (a.street1 ?? ""),
                        street2: a.street2 === "—" ? "" : (a.street2 ?? ""),
                        city: a.city === "—" ? "" : (a.city ?? ""),
                        province: a.province === "—" ? "" : (a.province ?? ""),
                        postalCode: a.postalCode === "—" ? "" : (a.postalCode ?? ""),
                        country: a.country === "—" ? "" : (a.country ?? ""),
                        phone: profile.phone === "—" ? "" : (profile.phone ?? ""),
                        firstName: profile.firstName === "—" ? "" : (profile.firstName ?? ""),
                        lastName: profile.lastName ?? "",
                        email: profile.email ?? "",
                    });
                    return;
                }

                if (res.status === 204) {
                    return;
                }

                const data = await res.json();

                // Fill the draft with DB data
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

                // Optional: sync profile UI with fetched data
                if (onSaveProfile) {
                    onSaveProfile({
                        customerId: data.customerId ?? profile.customerId,
                        firstName: data.firstName ?? profile.firstName,
                        lastName: data.lastName ?? profile.lastName,
                        email: data.email ?? profile.email,
                        phone: data.homePhone ?? profile.phone,
                        billing: {
                            ...profile.billing,
                            address: {
                                ...profile.billing.address,
                                street1: data.street1 ?? profile.billing.address.street1,
                                street2: data.street2 ?? profile.billing.address.street2,
                                city: data.city ?? profile.billing.address.city,
                                province: data.province ?? profile.billing.address.province,
                                postalCode: data.postalCode ?? profile.billing.address.postalCode,
                                country: data.country ?? profile.billing.address.country,
                            },
                        },
                    });
                }
            } catch (e) {
                setError(e?.message || "Failed to load billing info");
            } finally {
                setLoading(false);
            }
        }

        loadBilling();
    }, [show, profile, onSaveProfile]);

    // Close modal and reset state
    const handleClose = () => {
        setDraft(null);
        setError("");
        onClose?.();
    };

    // Save billing draft to backend
    const handleSave = async () => {
        if (!draft) return;
        setSaving(true);
        setError("");

        try {
            // 1) Save personal info
            const resProfile = await fetch("/api/me/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    firstName: draft.firstName,
                    lastName: draft.lastName,
                    homePhone: draft.phone
                }),
            });
            if (!resProfile.ok) throw new Error("Failed to update profile");

            // 2) Save address (update)
            const res = await fetch("/api/billing/address", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(draft),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(text || `Failed to save (${res.status})`);
            }

            const updated = await res.json();

            // optional optimistic update (keep if you like)
            onSaveProfile?.(updated);

            // ✅ the key: refresh /api/me in ProfilePage + App
            await onSaved?.();

            handleClose();
        } catch (e) {
            setError(e.message || "Failed to save billing info");
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
                                onChange={(e) => setDraft(d => ({ ...d, firstName: e.target.value }))}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Last Name</Form.Label>
                            <Form.Control
                                value={draft.lastName}
                                onChange={(e) => setDraft(d => ({ ...d, lastName: e.target.value }))}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                value={draft.email}
                                onChange={(e) => setDraft(d => ({ ...d, email: e.target.value }))}
                            />
                        </Form.Group>

                        {needsPhone && (
                            <Form.Group className="mb-3">
                                <Form.Label>Phone Number</Form.Label>
                                <Form.Control
                                    value={draft.phone}
                                    onChange={(e) => setDraft(d => ({ ...d, phone: e.target.value }))}
                                />
                            </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label>Street 1</Form.Label>
                            <Form.Control
                                value={draft.street1}
                                onChange={(e) => setDraft(d => ({ ...d, street1: e.target.value }))}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Street 2 (optional)</Form.Label>
                            <Form.Control
                                value={draft.street2}
                                onChange={(e) => setDraft(d => ({ ...d, street2: e.target.value }))}
                            />
                        </Form.Group>

                        <Row className="g-2">
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>City</Form.Label>
                                    <Form.Control
                                        value={draft.city}
                                        onChange={(e) => setDraft(d => ({ ...d, city: e.target.value }))}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Province</Form.Label>
                                    <Form.Control
                                        value={draft.province}
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
                                        value={draft.postalCode}
                                        onChange={(e) => setDraft(d => ({ ...d, postalCode: e.target.value }))}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Country</Form.Label>
                                    <Form.Control
                                        value={draft.country}
                                        onChange={(e) => setDraft(d => ({ ...d, country: e.target.value }))}
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
                    disabled={saving || !draft?.street1?.trim() || !draft?.firstName?.trim() || !draft?.lastName?.trim()}
                >
                    {saving ? "Saving..." : "Save"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}