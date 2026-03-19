import React from "react";
import { Card, Button } from "react-bootstrap";

/**
 * BillingAddressCard component
 * Displays user's billing address and allows editing
 */
export function BillingAddressCard({ address = {}, darkMode = false, onEdit }) {
    const cardBase = darkMode ? "bg-dark border-secondary text-light" : "bg-white border-light text-dark";
    const mutedClass = darkMode ? "text-light-50 text-secondary" : "text-muted";

    // Check if address is missing
    const isAddressMissing =
        !address.street1 || !address.city || !address.province || !address.postalCode || !address.country;

    return (
        <Card className={`${cardBase} mt-4`} style={{ borderRadius: 22, padding: 20 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="fw-bold" style={{ fontSize: "1.3rem" }}>Billing Address</div>
            </div>

            <div className={`mb-3 ${mutedClass}`}>
                <div>{address.street1 ?? "—"}</div>
                <div>{address.city ?? "—"}, {address.province ?? "—"} {address.postalCode ?? ""}</div>
                <div>{address.country ?? "—"}</div>
            </div>

            <Button
                variant={isAddressMissing ? "warning" : darkMode ? "outline-light" : "outline-secondary"}
                className="fw-bold"
                style={{ borderRadius: 14 }}
                onClick={onEdit}
            >
                {isAddressMissing ? "Add Billing Address" : "Edit Billing Address"}
            </Button>
        </Card>
    );
}