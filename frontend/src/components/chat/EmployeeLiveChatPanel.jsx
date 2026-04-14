import React, { useEffect, useMemo, useRef } from "react";
import { Card, Button, Form, Spinner, Badge } from "react-bootstrap";

function formatTimestamp(value) {
    if (!value) return "";
    try {
        return new Date(value).toLocaleString();
    } catch {
        return "";
    }
}

function getStatusTone(status) {
    const value = String(status || "").toUpperCase();

    if (value === "ACTIVE") {
        return {
            bg: "#e8f9ef",
            text: "#15803d",
            dot: "#22c55e"
        };
    }

    if (value === "PENDING") {
        return {
            bg: "#fff7e6",
            text: "#b45309",
            dot: "#f59e0b"
        };
    }

    if (value === "CLOSED") {
        return {
            bg: "#fee2e2",
            text: "#b91c1c",
            dot: "#ef4444"
        };
    }

    if (value === "CANCELLED") {
        return {
            bg: "#eef2f7",
            text: "#64748b",
            dot: "#94a3b8"
        };
    }

    return {
        bg: "#eef2f7",
        text: "#64748b",
        dot: "#94a3b8"
    };
}

export default function EmployeeLiveChatPanel({
                                                  darkMode = false,
                                                  isOpen = true,
                                                  activeConversation = null,
                                                  messages = [],
                                                  loading = false,
                                                  currentUserId = null,
                                                  draftMessage = "",
                                                  sendingMessage = false,
                                                  onDraftChange,
                                                  onSendMessage,
                                                  onMinimize,
                                                  onCloseConversation,
                                                  emptyTitle = "No active conversation selected",
                                                  emptyText = "Select a conversation from the list or accept a pending request to begin.",
                                                  headerTitle = "Support Chat"
                                              }) {
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, activeConversation?.conversationId]);

    const status = String(activeConversation?.status || "").toUpperCase();
    const tone = useMemo(() => getStatusTone(status), [status]);

    const customerName =
        activeConversation?.customerName ||
        activeConversation?.displayName ||
        activeConversation?.fullName ||
        "Customer";

    const customerSubtitle =
        activeConversation?.reason ||
        activeConversation?.topic ||
        activeConversation?.email ||
        "Customer support conversation";

    const isPending = status === "PENDING";
    const isActive = status === "ACTIVE";
    const isClosed = status === "CLOSED";
    const isCancelled = status === "CANCELLED";
    const canSend = !!activeConversation && isActive;

    if (!isOpen) {
        return null;
    }

    return (
        <Card
            className={`h-100 border-0 ${darkMode ? "bg-dark text-light" : ""}`}
            style={{
                borderRadius: 20,
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                height: "100%",
                minHeight: 0
            }}
        >
            <Card.Body className="p-0 d-flex flex-column h-100" style={{ minHeight: 0 }}>
                {!activeConversation ? (
                    <div className="d-flex flex-column justify-content-center align-items-center h-100 px-4 text-center">
                        <div
                            style={{
                                width: 68,
                                height: 68,
                                borderRadius: "50%",
                                background: darkMode ? "#1f2937" : "#eef2ff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.5rem",
                                marginBottom: "16px"
                            }}
                        >
                            💬
                        </div>

                        <h4 className="fw-bold mb-2">{emptyTitle}</h4>
                        <div className="text-muted" style={{ maxWidth: "420px" }}>
                            {emptyText}
                        </div>
                    </div>
                ) : (
                    <>
                        <div
                            className={`px-4 py-3 border-bottom ${
                                darkMode ? "border-secondary" : ""
                            }`}
                            style={{ flexShrink: 0 }}
                        >
                            <div className="d-flex justify-content-between align-items-start gap-3">
                                <div className="min-w-0">
                                    <div className="text-muted small mb-1">{headerTitle}</div>

                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                        <h4 className="fw-bold mb-0">{customerName}</h4>

                                        <div
                                            className="d-inline-flex align-items-center gap-2 px-3 py-1"
                                            style={{
                                                borderRadius: "999px",
                                                backgroundColor: tone.bg,
                                                color: tone.text,
                                                fontSize: "0.82rem",
                                                fontWeight: 600
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: "50%",
                                                    backgroundColor: tone.dot,
                                                    display: "inline-block"
                                                }}
                                            />
                                            {status || "UNKNOWN"}
                                        </div>
                                    </div>

                                    <div className="text-muted mt-2" style={{ fontSize: "0.95rem" }}>
                                        {customerSubtitle}
                                    </div>
                                </div>

                                <div className="d-flex gap-2 flex-shrink-0">
                                    <Button
                                        type="button"
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={onMinimize}
                                        style={{ borderRadius: 10 }}
                                    >
                                        Minimize
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => onCloseConversation?.(activeConversation)}
                                        style={{ borderRadius: 10 }}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>

                            <div className="d-flex flex-wrap gap-2 mt-3">
                                {activeConversation?.requestId != null && (
                                    <Badge bg={darkMode ? "secondary" : "light"} text={darkMode ? "light" : "dark"}>
                                        Request #{activeConversation.requestId}
                                    </Badge>
                                )}

                                {activeConversation?.conversationId != null && (
                                    <Badge bg={darkMode ? "secondary" : "light"} text={darkMode ? "light" : "dark"}>
                                        Conversation #{activeConversation.conversationId}
                                    </Badge>
                                )}

                                {activeConversation?.assignedEmployeeName && (
                                    <Badge bg={darkMode ? "secondary" : "light"} text={darkMode ? "light" : "dark"}>
                                        Assigned: {activeConversation.assignedEmployeeName}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div
                            className="flex-grow-1 px-4 py-3"
                            style={{
                                overflowY: "auto",
                                background: darkMode ? "#111827" : "#fcfcfd",
                                minHeight: 0
                            }}
                        >
                            {loading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-muted py-5">
                                    No messages yet.
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {messages.map((msg, index) => {
                                        const mine =
                                            Number(msg.fromUserId) === Number(currentUserId);

                                        const key =
                                            msg.messageId ??
                                            `${msg.sentAt ?? "msg"}-${index}`;

                                        return (
                                            <div
                                                key={key}
                                                className={`d-flex ${
                                                    mine
                                                        ? "justify-content-end"
                                                        : "justify-content-start"
                                                }`}
                                            >
                                                <div
                                                    style={{
                                                        maxWidth: "76%",
                                                        padding: "12px 14px",
                                                        borderRadius: "16px",
                                                        background: mine
                                                            ? "#2563eb"
                                                            : darkMode
                                                                ? "#374151"
                                                                : "#f1f5f9",
                                                        color: mine
                                                            ? "#ffffff"
                                                            : darkMode
                                                                ? "#ffffff"
                                                                : "#0f172a",
                                                        boxShadow: mine
                                                            ? "0 6px 18px rgba(37, 99, 235, 0.18)"
                                                            : "none",
                                                        wordBreak: "break-word"
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: "0.74rem",
                                                            opacity: 0.78,
                                                            marginBottom: "4px"
                                                        }}
                                                    >
                                                        {mine
                                                            ? "You"
                                                            : msg.senderName ||
                                                            msg.fromName ||
                                                            customerName}
                                                    </div>

                                                    <div style={{ fontSize: "0.96rem" }}>
                                                        {msg.messageText}
                                                    </div>

                                                    <div
                                                        style={{
                                                            fontSize: "0.72rem",
                                                            marginTop: "6px",
                                                            opacity: 0.8,
                                                            textAlign: mine ? "right" : "left"
                                                        }}
                                                    >
                                                        {formatTimestamp(msg.sentAt)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        <div
                            className={`px-4 py-3 border-top ${
                                darkMode ? "border-secondary" : ""
                            }`}
                            style={{ flexShrink: 0 }}
                        >
                            {isPending && (
                                <div
                                    className="mb-3"
                                    style={{
                                        borderRadius: 14,
                                        background: darkMode ? "#1f2937" : "#fff7e6",
                                        color: darkMode ? "#f8fafc" : "#92400e",
                                        padding: "12px 14px",
                                        fontSize: "0.92rem"
                                    }}
                                >
                                    This request is pending. Messaging becomes available once the request is accepted and activated.
                                </div>
                            )}

                            {isClosed && (
                                <div
                                    className="mb-3"
                                    style={{
                                        borderRadius: 14,
                                        background: darkMode ? "#1f2937" : "#fee2e2",
                                        color: darkMode ? "#f8fafc" : "#991b1b",
                                        padding: "12px 14px",
                                        fontSize: "0.92rem"
                                    }}
                                >
                                    This conversation is closed. Reopen or review history from the conversation list if your workflow supports it.
                                </div>
                            )}

                            {isCancelled && (
                                <div
                                    className="mb-3"
                                    style={{
                                        borderRadius: 14,
                                        background: darkMode ? "#1f2937" : "#eef2f7",
                                        color: darkMode ? "#f8fafc" : "#475569",
                                        padding: "12px 14px",
                                        fontSize: "0.92rem"
                                    }}
                                >
                                    This request was cancelled. No further messages can be sent.
                                </div>
                            )}

                            <Form onSubmit={onSendMessage}>
                                <div className="d-flex gap-2 align-items-end">
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        value={draftMessage}
                                        onChange={(e) =>
                                            onDraftChange?.(e.target.value, activeConversation)
                                        }
                                        placeholder={
                                            canSend
                                                ? "Type a message..."
                                                : "Messaging is unavailable for this conversation."
                                        }
                                        disabled={!canSend || sendingMessage}
                                        style={{
                                            resize: "none",
                                            borderRadius: 12
                                        }}
                                    />

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={
                                            !canSend ||
                                            sendingMessage ||
                                            !String(draftMessage || "").trim()
                                        }
                                        style={{
                                            borderRadius: 12,
                                            padding: "10px 18px",
                                            fontWeight: 600,
                                            minWidth: "120px"
                                        }}
                                    >
                                        {sendingMessage ? "Sending..." : "Send"}
                                    </Button>
                                </div>
                            </Form>
                        </div>
                    </>
                )}
            </Card.Body>
        </Card>
    );
}