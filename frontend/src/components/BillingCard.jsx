/**
 Description: Billing Card component, used in the profile page and settings page.
 Shows the user's current billing information, including next bill amount/date, payment method, and billing address.
 Also has buttons to edit the payment method and billing address, which trigger modals in the settings page.

 Created by: Sarah
 Created on: February 2026

 Modified by: Sherry
 Modified on: March 2026
 **/

import React from "react";
import { Card, Row, Col, Button } from "react-bootstrap";
import { CreditCard } from "lucide-react";
import {useState} from "react";

export function BillingCard({ profile, darkMode, onEdit, onEditPayment }) {
    const cardBase = darkMode ? "bg-dark border-secondary" : "bg-white";
    const mutedClass = darkMode ? "text-light-50 text-secondary" : "text-muted";

    const addr = profile.billing.address || {};
    const pay = profile.billing.paymentMethod || {};

    const last4 =
        pay.cardNumber && String(pay.cardNumber).length >= 4
            ? String(pay.cardNumber).slice(-4)
            : "—";

    return (
        <Card className={`${cardBase} mt-4`} style={{ borderRadius: 22 }}>
            <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`} style={{ fontSize: "1.25rem" }}>Billing Information</div>
                        <div className={mutedClass}>Payment method, next bill, and billing address.</div>
                    </div>
                    <CreditCard size={18} />
                </div>

                <Row className="g-3 mt-3">
                    <Col md={6}>
                        <div className={`p-3 ${darkMode ? "bg-dark border-secondary" : "bg-light"}`} style={{ borderRadius: 18 }}>
                            <div className="fw-bold">Next bill</div>
                            <div className={`fw-bold mt-2 ${darkMode ? "text-light" : "text-dark"}`} style={{ fontSize: "1.6rem" }}>
                                {profile.billing.nextBillAmount != null ? profile.billing.nextBillAmount.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' }) : "—"}
                            </div>
                            <div className={mutedClass}>
                                {profile.billing.nextBillDate ? `Due: ${new Date(profile.billing.nextBillDate).toLocaleDateString()}` : "No upcoming invoice loaded."}
                            </div>

                            <div className="mt-3 fw-bold">Payment method</div>

                            <div className={mutedClass}>
                                {(pay.method ?? "—")} •••• {last4}
                            </div>
                            <Button variant={darkMode ? "outline-light" : "outline-secondary"} className="mt-3 fw-bold" style={{ borderRadius: 14 }} onClick={() => onEdit("payment")}>Edit Payment Method</Button>
                        </div>
                    </Col>
                    <Col md={6}>
                        <div className={`p-3 ${darkMode ? "bg-dark border-secondary" : "bg-light"}`} style={{ borderRadius: 18 }}>
                            <div className="fw-bold">Billing address</div>
                            <div className={`mt-2 ${mutedClass}`}>
                                <div>{addr.street1 ?? "—"}</div>
                                {addr.street2 && <div>{addr.street2}</div>}
                                <div>{addr.city ?? "—"}, {addr.province ?? "—"} {addr.postalCode ?? ""}</div>
                                <div>{addr.country ?? "—"}</div>
                            </div>
                            <Button variant={darkMode ? "outline-light" : "outline-secondary"} className="mt-3 fw-bold" style={{ borderRadius: 14 }} onClick={onEdit}>Edit Billing</Button>
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
}