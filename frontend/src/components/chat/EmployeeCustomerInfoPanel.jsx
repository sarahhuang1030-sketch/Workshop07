import React from "react";
import { Card, Badge, Spinner, Button } from "react-bootstrap";

function safe(value, fallback = "—") {
    if (value === null || value === undefined || value === "") return fallback;
    return value;
}

export default function EmployeeCustomerInfoPanel({
                                                      customer = null,
                                                      conversation = null,
                                                      loading = false,
                                                      onOpenProfile
                                                  }) {
    const fullName =
        customer?.fullName ||
        [customer?.firstName, customer?.lastName].filter(Boolean).join(" ") ||
        conversation?.customerName ||
        "Customer";

    const planName =
        customer?.subscriptionName ||
        customer?.planName ||
        customer?.currentPlan ||
        customer?.subscriptionPlan ||
        "—";

    const serviceType =
        customer?.serviceType ||
        customer?.subscriptionType ||
        customer?.category ||
        "—";

    const address =
        customer?.addressLine1 ||
        customer?.address ||
        customer?.streetAddress ||
        "—";

    return (
        <Card
            className="border-0 h-100"
            style={{
                borderRadius: 20,
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)"
            }}
        >
            <Card.Body className="p-4 d-flex flex-column h-100">
                <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h5 className="fw-bold mb-1">Customer Information</h5>
                        <div className="text-muted small">
                            Context for the selected support conversation
                        </div>
                    </div>

                    {onOpenProfile && (
                        <Button
                            type="button"
                            variant="outline-primary"
                            size="sm"
                            onClick={() => onOpenProfile(customer, conversation)}
                            style={{ borderRadius: 10 }}
                        >
                            Open Profile
                        </Button>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" />
                    </div>
                ) : !customer && !conversation ? (
                    <div className="text-muted text-center py-4">
                        Select a conversation to view customer details.
                    </div>
                ) : (
                    <>
                        <div
                            className="mb-3 p-3"
                            style={{
                                borderRadius: 16,
                                background: "#f8fafc",
                                border: "1px solid #e5e7eb"
                            }}
                        >
                            <div className="fw-bold" style={{ fontSize: "1.1rem" }}>
                                {fullName}
                            </div>

                            <div className="mt-2 d-flex flex-wrap gap-2">
                                {customer?.customerId != null && (
                                    <Badge bg="secondary">
                                        Customer #{customer.customerId}
                                    </Badge>
                                )}

                                {serviceType !== "—" && (
                                    <Badge bg="light" text="dark">
                                        {serviceType}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="row g-3">
                            <div className="col-md-6">
                                <div className="small text-muted mb-1">Email</div>
                                <div className="fw-semibold">
                                    {safe(customer?.email || conversation?.customerEmail)}
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="small text-muted mb-1">Phone</div>
                                <div className="fw-semibold">
                                    {safe(customer?.phone || customer?.phoneNumber)}
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="small text-muted mb-1">Address</div>
                                <div className="fw-semibold">
                                    {safe(address)}
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="small text-muted mb-1">City / Province</div>
                                <div className="fw-semibold">
                                    {customer?.city || customer?.province
                                        ? `${safe(customer?.city, "")}${customer?.city && customer?.province ? ", " : ""}${safe(customer?.province, "")}`.trim() || "—"
                                        : "—"}
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="small text-muted mb-1">Postal Code</div>
                                <div className="fw-semibold">
                                    {safe(customer?.postalCode || customer?.zipCode)}
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="small text-muted mb-1">Current Plan</div>
                                <div className="fw-semibold">
                                    {safe(planName)}
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="small text-muted mb-1">Subscription Status</div>
                                <div className="fw-semibold">
                                    {safe(
                                        customer?.subscriptionStatus ||
                                        customer?.status ||
                                        customer?.accountStatus
                                    )}
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="small text-muted mb-1">Conversation Reason</div>
                                <div className="fw-semibold">
                                    {safe(conversation?.reason)}
                                </div>
                            </div>
                        </div>

                        {(customer?.notes || customer?.supportNotes) && (
                            <div
                                className="mt-4 p-3"
                                style={{
                                    borderRadius: 14,
                                    background: "#fff7ed",
                                    border: "1px solid #fed7aa"
                                }}
                            >
                                <div className="small fw-bold mb-1">Support Notes</div>
                                <div className="small text-muted">
                                    {customer?.notes || customer?.supportNotes}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card.Body>
        </Card>
    );
}