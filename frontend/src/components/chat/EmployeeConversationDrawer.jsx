import React from "react";
import { Card, Badge, Button } from "react-bootstrap";

function getStatusBadge(status) {
    const value = String(status || "").toUpperCase();

    if (value === "ACTIVE") return "success";
    if (value === "PENDING") return "warning";
    if (value === "CLOSED") return "secondary";
    if (value === "CANCELLED") return "dark";

    return "secondary";
}

export default function EmployeeConversationDrawer({
                                                       isOpen = true,
                                                       conversations = [],
                                                       activeConversationId = null,
                                                       onToggle,
                                                       onOpenConversation
                                                   }) {
    return (
        <div
            style={{
                position: "fixed",
                right: "16px",
                bottom: "56px",
                width: isOpen ? "320px" : "180px",
                maxWidth: "calc(100vw - 32px)",
                zIndex: 1070,
                transition: "width 0.2s ease"
            }}
        >
            <Card
                className="shadow border-0"
                style={{
                    borderTopLeftRadius: 14,
                    borderTopRightRadius: 14,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    overflow: "hidden"
                }}
            >
                <Card.Header
                    className="d-flex justify-content-between align-items-center bg-light"
                    style={{ minHeight: "48px" }}
                >
                    <div className="fw-bold">
                        {isOpen ? "Conversation Drawer" : "Conversations"}
                    </div>

                    <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={onToggle}
                        style={{ borderRadius: 10 }}
                    >
                        {isOpen ? "Minimize" : "Open"}
                    </Button>
                </Card.Header>

                {isOpen && (
                    <Card.Body
                        className="p-2"
                        style={{
                            maxHeight: "420px",
                            overflowY: "auto",
                            background: "#f8fafc"
                        }}
                    >
                        {conversations.length === 0 ? (
                            <div className="text-muted text-center py-3">
                                No conversations available.
                            </div>
                        ) : (
                            conversations.map((conversation) => {
                                const isActive =
                                    Number(conversation.conversationId) === Number(activeConversationId);

                                const customerName =
                                    conversation.customerName ||
                                    conversation.displayName ||
                                    `User #${conversation.otherUserId || conversation.customerUserId || "?"}`;

                                return (
                                    <div
                                        key={conversation.conversationId}
                                        className="mb-2 p-2"
                                        style={{
                                            borderRadius: 12,
                                            background: isActive ? "#eff6ff" : "#ffffff",
                                            border: isActive
                                                ? "2px solid #2563eb"
                                                : "1px solid #e5e7eb",
                                            cursor: "pointer"
                                        }}
                                        onClick={() => onOpenConversation?.(conversation)}
                                    >
                                        <div className="d-flex justify-content-between align-items-start gap-2">
                                            <div>
                                                <div className="fw-semibold">
                                                    {customerName}
                                                </div>
                                                <div className="text-muted small">
                                                    Conversation #{conversation.conversationId}
                                                </div>
                                            </div>

                                            <Badge bg={getStatusBadge(conversation.status)}>
                                                {conversation.status || "ACTIVE"}
                                            </Badge>
                                        </div>

                                        <div className="text-muted small mt-2">
                                            {conversation.reason || "Open conversation"}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </Card.Body>
                )}
            </Card>
        </div>
    );
}