import React from "react";
import { Card, Badge, Spinner } from "react-bootstrap";

function formatTime(value) {
    if (!value) return "";
    try {
        return new Date(value).toLocaleString();
    } catch {
        return "";
    }
}

function getStatusBadge(status) {
    const value = String(status || "").toUpperCase();

    if (value === "ACTIVE") return "success";
    if (value === "PENDING") return "warning";
    if (value === "CLOSED") return "secondary";
    if (value === "CANCELLED") return "dark";

    return "secondary";
}

export default function EmployeeConversationList({
                                                     conversations = [],
                                                     loading = false,
                                                     activeConversationId = null,
                                                     onSelectConversation,
                                                     onOpenConversationTab
                                                 }) {
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
                    <h5 className="fw-bold mb-0">Active Conversations</h5>
                </div>

                <div style={{ overflowY: "auto", flexGrow: 1 }}>
                    {loading ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="text-muted text-center py-3">
                            No active conversations.
                        </div>
                    ) : (
                        conversations.map((conversation) => {
                            const isSelected =
                                Number(conversation.conversationId) === Number(activeConversationId);

                            const customerName =
                                conversation.customerName ||
                                conversation.displayName ||
                                conversation.fullName ||
                                "Customer";

                            const preview =
                                conversation.lastMessageText ||
                                conversation.reason ||
                                "Open conversation";

                            return (
                                <div
                                    key={conversation.conversationId}
                                    className="mb-2 p-3"
                                    style={{
                                        borderRadius: 14,
                                        cursor: "pointer",
                                        border: isSelected
                                            ? "2px solid #2563eb"
                                            : "1px solid #e5e7eb",
                                        background: isSelected ? "#eff6ff" : "#f8fafc",
                                        transition: "all 0.15s ease"
                                    }}
                                    onClick={() => onSelectConversation?.(conversation)}
                                >
                                    <div className="d-flex justify-content-between align-items-start gap-2">
                                        <div className="min-w-0">
                                            <div className="fw-semibold">
                                                {customerName}
                                            </div>

                                            <div
                                                className="text-muted small"
                                                style={{
                                                    fontSize: "0.85rem",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    maxWidth: "220px"
                                                }}
                                            >
                                                {preview}
                                            </div>
                                        </div>

                                        <Badge bg={getStatusBadge(conversation.status)}>
                                            {conversation.status || "ACTIVE"}
                                        </Badge>
                                    </div>

                                    <div className="mt-2 d-flex justify-content-between align-items-center">
                                        <div className="text-muted small">
                                            {formatTime(
                                                conversation.lastMessageAt ||
                                                conversation.updatedAt ||
                                                conversation.createdAt
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onOpenConversationTab?.(conversation);
                                            }}
                                            style={{
                                                border: "none",
                                                background: "transparent",
                                                color: "#2563eb",
                                                fontWeight: 600,
                                                fontSize: "0.9rem",
                                                padding: 0
                                            }}
                                        >
                                            Open
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </Card.Body>
        </Card>
    );
}