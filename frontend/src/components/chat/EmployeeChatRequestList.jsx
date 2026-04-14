import React from "react";
import { Card, Form, Badge, Spinner } from "react-bootstrap";

function getStatusBadge(status) {
    const value = String(status || "").toUpperCase();

    if (value === "PENDING") return "warning";
    if (value === "ACTIVE") return "success";
    if (value === "CLOSED") return "secondary";
    if (value === "CANCELLED") return "dark";

    return "secondary";
}

function formatDateTime(value) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleString();
    } catch {
        return value;
    }
}

function getCustomerName(req) {
    return (
        req?.customerName ||
        req?.fullName ||
        [req?.firstName, req?.lastName].filter(Boolean).join(" ").trim() ||
        "Customer"
    );
}

export default function EmployeeChatRequestList({
                                                    role = "agent",
                                                    requests = [],
                                                    loading = false,
                                                    searchValue = "",
                                                    filterValue = "all",
                                                    onSearchChange,
                                                    onFilterChange,
                                                    onSelectRequest
                                                }) {
    const safeRequests = Array.isArray(requests) ? requests : [];

    const filteredRequests = safeRequests.filter((r) => {
        const customerName = getCustomerName(r).toLowerCase();
        const reason = String(r.reason || "").toLowerCase();
        const search = String(searchValue || "").toLowerCase();

        const matchesSearch =
            !search ||
            customerName.includes(search) ||
            reason.includes(search);

        const status = String(r.status || "").toLowerCase();

        if (role === "manager") {
            if (filterValue === "all") return matchesSearch;
            return matchesSearch && status === filterValue;
        }

        if (filterValue === "pending") {
            return matchesSearch && status === "pending";
        }

        if (filterValue === "active") {
            return matchesSearch && status === "active";
        }

        return matchesSearch;
    });

    return (
        <Card
            className="border-0 h-100"
            style={{
                borderRadius: 20,
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)"
            }}
        >
            <Card.Body className="p-3 d-flex flex-column h-100">
                <div className="mb-3">
                    <h5 className="fw-bold mb-2">Chat Requests</h5>

                    <Form.Control
                        placeholder="Search..."
                        value={searchValue}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        className="mb-2"
                    />

                    <Form.Select
                        value={filterValue}
                        onChange={(e) => onFilterChange?.(e.target.value)}
                    >
                        {role === "manager" ? (
                            <>
                                <option value="all">All</option>
                                <option value="pending">Pending</option>
                                <option value="active">Active</option>
                                <option value="closed">Closed</option>
                                <option value="cancelled">Cancelled</option>
                            </>
                        ) : (
                            <>
                                <option value="pending">Pending</option>
                                <option value="active">My Active</option>
                            </>
                        )}
                    </Form.Select>
                </div>

                <div style={{ overflowY: "auto", flexGrow: 1 }}>
                    {loading ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" />
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="text-muted text-center py-3">
                            No chat requests found.
                        </div>
                    ) : (
                        filteredRequests.map((req) => (
                            <div
                                key={req.requestId}
                                className="mb-2 p-3"
                                style={{
                                    borderRadius: 14,
                                    background: "#f8fafc",
                                    cursor: "pointer",
                                    border: "1px solid #e5e7eb"
                                }}
                                onClick={() => onSelectRequest?.(req)}
                            >
                                <div className="d-flex justify-content-between align-items-start gap-2">
                                    <div>
                                        <div className="fw-semibold">
                                            {getCustomerName(req)}
                                        </div>

                                        <div className="text-muted small">
                                            Customer ID: #{req.customerUserId}
                                        </div>

                                        <div className="text-muted small">
                                            {req.reason || "No reason provided"}
                                        </div>
                                    </div>

                                    <Badge bg={getStatusBadge(req.status)}>
                                        {req.status}
                                    </Badge>
                                </div>

                                <div className="mt-2 text-muted small">
                                    {formatDateTime(req.requestedAt)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card.Body>
        </Card>
    );
}