import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert, Row, Col, Spinner } from "react-bootstrap";
import { apiFetch } from "../services/api";

/* =========================
   VALIDATION HELPERS
========================= */

// Only letters allowed (first/last name)
const isValidName = (val) => /^[A-Za-z]+$/.test(val);

// Email validation (.com, .ca, etc.)
const isValidEmail = (val) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

// Canadian postal code format: A1A 1A1
const formatPostalCode = (val) => {
    const cleaned = val.replace(/\s/g, "").toUpperCase();
    if (cleaned.length <= 3) return cleaned;
    return cleaned.slice(0, 3) + " " + cleaned.slice(3, 6);
};

const isValidPostalCode = (val) =>
    /^[A-Z]\d[A-Z] \d[A-Z]\d$/.test(val);

// Phone format: 123-123-1234
const formatPhone = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    const parts = [];
    if (digits.length > 0) parts.push(digits.slice(0, 3));
    if (digits.length > 3) parts.push(digits.slice(3, 6));
    if (digits.length > 6) parts.push(digits.slice(6, 10));
    return parts.join("-");
};

/* =========================
   PROVINCE → CITY MAPPING (FIXED)
========================= */

const provinceCityMap = {
    "Alberta": ["Calgary", "Edmonton"],
    "British Columbia": ["Vancouver"],
    "Manitoba": ["Winnipeg"],
    "New Brunswick": [],
    "Newfoundland and Labrador": [],
    "Nova Scotia": [],
    "Ontario": ["Toronto", "Ottawa"],
    "Prince Edward Island": [],
    "Quebec": ["Montreal"],
    "Saskatchewan": [],
};

/* =========================
   CANADA DROPDOWN DATA
========================= */

const provinces = Object.keys(provinceCityMap);

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

    // validation state
    const [errors, setErrors] = useState({});

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
                    country: data.country ?? "Canada",
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
        setErrors({});
        onClose?.();
    };

    /* =========================
       FIELD HANDLER (FIXED + REALTIME VALIDATION)
    ========================= */

    const updateField = (key, value) => {
        let newValue = value;
        let newErrors = { ...errors };

        /* -------------------------
           NAME VALIDATION
        ------------------------- */
        if (key === "firstName" || key === "lastName") {
            if (!isValidName(value)) {
                newErrors[key] = "Only letters allowed";
            } else {
                delete newErrors[key];
            }
        }

        /* -------------------------
           EMAIL REAL-TIME VALIDATION (FIXED)
        ------------------------- */
        if (key === "email") {
            if (value.trim() === "") {
                newErrors.email = "Email is required";
            } else if (!isValidEmail(value)) {
                newErrors.email = "Invalid email format";
            } else {
                delete newErrors.email;
            }
        }

        /* -------------------------
           PHONE FORMAT
        ------------------------- */
        if (key === "phone") {
            newValue = formatPhone(value);
        }

        /* -------------------------
           POSTAL CODE
        ------------------------- */
        if (key === "postalCode") {
            newValue = formatPostalCode(value);

            if (newValue.length === 7 && !isValidPostalCode(newValue)) {
                newErrors.postalCode = "Invalid postal code (A1A 1A1)";
            } else {
                delete newErrors.postalCode;
            }
        }

        /* -------------------------
           PROVINCE → CITY RESET (FIXED)
        ------------------------- */
        if (key === "province") {
            setDraft(d => ({
                ...d,
                province: value,
                city: ""
            }));

            setErrors(newErrors);
            return;
        }

        setErrors(newErrors);

        setDraft(d => ({
            ...d,
            [key]: newValue
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError("");

            if (!isValidName(draft.firstName) || !isValidName(draft.lastName)) {
                setError("Name must contain only letters");
                return;
            }

            if (!isValidEmail(draft.email)) {
                setError("Invalid email format");
                return;
            }

            if (needsPhone && draft.phone.replace(/\D/g, "").length !== 10) {
                setError("Phone must be 10 digits");
                return;
            }

            if (draft.postalCode && !isValidPostalCode(draft.postalCode)) {
                setError("Invalid postal code format (A1A 1A1)");
                return;
            }

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

            if (res.status === 401) throw new Error("Not authenticated");

            if (res.status === 409) {
                setError("Please complete registration before updating billing information.");
                return;
            }

            if (!res.ok) throw new Error("Failed to update billing information");

            const data = await res.json();

            onSaveProfile?.(data);
            onSaved?.(data);

            handleClose();

        } catch (err) {
            console.error(err);
            setError(err.message || "Unexpected error");
        } finally {
            setSaving(false);
        }
    };

    /* =========================
       DYNAMIC CITIES (FIXED)
    ========================= */

    const availableCities =
        provinceCityMap[draft?.province] || [];

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
                        {/* FIRST NAME */}
                        <Form.Group className="mb-3">
                            <Form.Label>First Name</Form.Label>
                            <Form.Control
                                value={draft.firstName}
                                onChange={(e) => updateField("firstName", e.target.value)}
                                isInvalid={!!errors.firstName}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.firstName}
                            </Form.Control.Feedback>
                        </Form.Group>

                        {/* LAST NAME */}
                        <Form.Group className="mb-3">
                            <Form.Label>Last Name</Form.Label>
                            <Form.Control
                                value={draft.lastName}
                                onChange={(e) => updateField("lastName", e.target.value)}
                                isInvalid={!!errors.lastName}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.lastName}
                            </Form.Control.Feedback>
                        </Form.Group>

                        {/* EMAIL (REAL-TIME FIXED) */}
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                value={draft.email}
                                onChange={(e) => updateField("email", e.target.value)}
                                onBlur={(e) => updateField("email", e.target.value)}
                                isInvalid={!!errors.email}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.email}
                            </Form.Control.Feedback>
                        </Form.Group>

                        {/* PHONE */}
                        {needsPhone && (
                            <Form.Group className="mb-3">
                                <Form.Label>Phone</Form.Label>
                                <Form.Control
                                    value={draft.phone}
                                    onChange={(e) => updateField("phone", e.target.value)}
                                    isInvalid={!!errors.phone}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.phone}
                                </Form.Control.Feedback>
                            </Form.Group>
                        )}

                        {/* STREET */}
                        <Form.Group className="mb-3">
                            <Form.Label>Street 1</Form.Label>
                            <Form.Control
                                value={draft.street1}
                                onChange={(e) => updateField("street1", e.target.value)}
                            />
                        </Form.Group>

                        {/* PROVINCE */}
                        <Form.Group className="mb-3">
                            <Form.Label>Province</Form.Label>
                            <Form.Select
                                value={draft.province}
                                onChange={(e) => updateField("province", e.target.value)}
                            >
                                <option value="">Select Province</option>
                                {provinces.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        {/* CITY (FIXED DEPENDENT) */}
                        <Form.Group className="mb-3">
                            <Form.Label>City</Form.Label>
                            <Form.Select
                                value={draft.city}
                                onChange={(e) => updateField("city", e.target.value)}
                            >
                                <option value="">Select City</option>
                                {availableCities.length > 0 ? (
                                    availableCities.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))
                                ) : (
                                    <option disabled>No cities available</option>
                                )}
                            </Form.Select>
                        </Form.Group>

                        {/* POSTAL CODE */}
                        <Form.Group className="mb-3">
                            <Form.Label>Postal Code</Form.Label>
                            <Form.Control
                                value={draft.postalCode}
                                onChange={(e) => updateField("postalCode", e.target.value)}
                                isInvalid={!!errors.postalCode}
                                placeholder="A1A 1A1"
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.postalCode}
                            </Form.Control.Feedback>
                        </Form.Group>

                        {/* COUNTRY */}
                        <Form.Group className="mb-3">
                            <Form.Label>Country</Form.Label>
                            <Form.Control
                                type="text"
                                value="Canada"
                                readOnly
                            />
                        </Form.Group>
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
                    disabled={
                        saving ||
                        !draft?.street1 ||
                        !draft?.firstName ||
                        !draft?.lastName ||
                        !draft?.email ||
                        Object.keys(errors).length > 0
                    }
                >
                    {saving ? "Saving..." : "Save"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}