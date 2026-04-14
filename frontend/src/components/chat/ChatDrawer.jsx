import React, { useEffect, useRef } from "react";
import { Card, Button, Form, Spinner } from "react-bootstrap";
import ChatLauncher from "./ChatLauncher.jsx";

export default function ChatDrawer({
    darkMode = false,
    isOpen = false,
    height = 420,
    minHeight = 320,
    maxHeight = "75vh",
    title = "Customer Support Chat",
    subtitle = "Support Request",
    statusDotColor = "#6b7280",

    isPendingConversation = false,
    isActiveConversation = false,
    isClosedConversation = false,
    isCancelledConversation = false,

    currentUserId = null,
    messagesLoading = false,
    conversationMessages = [],
    messageText = "",
    sendingMessage = false,

    onOpen,
    onMinimize,
    onResizeStart,
    onMessageTextChange,
    onSendMessage,
    onCancelChatRequest,
    onCloseActiveChat,
    onDone
}) {
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [conversationMessages]);

    return (
        <div
            style={{
                position: "fixed",
                right: "24px",
                bottom: "0",
                width: "380px",
                maxWidth: "calc(100vw - 24px)",
                height: isOpen ? `${height}px` : "44px",
                minHeight: isOpen ? `${minHeight}px` : "44px",
                maxHeight: isOpen ? maxHeight : "44px",
                zIndex: 1050
            }}
        >
            {!isOpen ? (
                <ChatLauncher
                    title={title}
                    statusDotColor={statusDotColor}
                    onOpen={onOpen}
                />
            ) : (
                <Card
                    className={`shadow ${darkMode ? "bg-dark text-light border-secondary" : "bg-white"}`}
                    style={{
                        borderTopLeftRadius: 14,
                        borderTopRightRadius: 14,
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                        overflow: "hidden",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column"
                    }}
                >
                    <div
                        onMouseDown={onResizeStart}
                        style={{
                            height: "10px",
                            cursor: "ns-resize",
                            background: darkMode ? "#374151" : "#e5e7eb",
                            borderTopLeftRadius: 14,
                            borderTopRightRadius: 14,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                        }}
                    >
                        <div
                            style={{
                                width: "42px",
                                height: "4px",
                                borderRadius: "999px",
                                background: darkMode ? "#9ca3af" : "#9aa0a6"
                            }}
                        />
                    </div>

                    <Card.Header
                        className={`d-flex justify-content-between align-items-center ${
                            darkMode ? "bg-dark text-light border-secondary" : "bg-light"
                        }`}
                    >
                        <div>
                            <div className="fw-bold d-flex align-items-center gap-2">
                                <span
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: "50%",
                                        display: "inline-block",
                                        backgroundColor: statusDotColor
                                    }}
                                />
                                <span>{title}</span>
                            </div>

                            <div style={{ fontSize: "0.85rem" }}>
                                {subtitle}
                            </div>
                        </div>

                        <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={onMinimize}
                        >
                            Minimize
                        </Button>
                    </Card.Header>

                    <Card.Body style={{ flex: 1, overflowY: "auto" }}>
                        {isPendingConversation && (
                            <div>
                                <p className="mb-2 fw-semibold">
                                    Your request has been submitted.
                                </p>
                                <p className="mb-0">
                                    Waiting for an employee to accept your chat.
                                </p>
                            </div>
                        )}

                        {(isActiveConversation || isClosedConversation) && (
                            <>
                                <div className="mb-3">
                                    <p className="mb-0 fw-semibold">
                                        {isClosedConversation
                                            ? "This conversation is closed."
                                            : "You are now connected to customer support."}
                                    </p>
                                </div>

                                {messagesLoading ? (
                                    <div className="text-center py-3">
                                        <Spinner animation="border" size="sm" />
                                    </div>
                                ) : conversationMessages.length > 0 ? (
                                    <div className="d-flex flex-column gap-2">
                                        {conversationMessages.map((msg) => {
                                            const mine =
                                                Number(msg.fromUserId) === Number(currentUserId);

                                            return (
                                                <div
                                                    key={msg.messageId ?? `${msg.sentAt}-${msg.messageText}`}
                                                    className={`d-flex ${mine ? "justify-content-end" : "justify-content-start"}`}
                                                >
                                                    <div
                                                        style={{
                                                            maxWidth: "78%",
                                                            padding: "10px 12px",
                                                            borderRadius: "14px",
                                                            background: mine
                                                                ? (darkMode ? "#2563eb" : "#dbeafe")
                                                                : (darkMode ? "#374151" : "#f3f4f6"),
                                                            color: darkMode ? "#fff" : "#111827",
                                                            wordBreak: "break-word"
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize: "0.72rem",
                                                                opacity: 0.75,
                                                                marginBottom: "4px"
                                                            }}
                                                        >
                                                            {mine ? "You" : "Support"}
                                                        </div>

                                                        <div style={{ fontSize: "0.95rem" }}>
                                                            {msg.messageText}
                                                        </div>

                                                        <div
                                                            style={{
                                                                fontSize: "0.72rem",
                                                                marginTop: "6px",
                                                                opacity: 0.8
                                                            }}
                                                        >
                                                            {msg.sentAt
                                                                ? new Date(msg.sentAt).toLocaleString()
                                                                : ""}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                ) : (
                                    <div className="text-muted">
                                        No messages yet. Start the conversation below.
                                    </div>
                                )}
                            </>
                        )}

                        {isClosedConversation && (
                            <div>
                                <p className="mb-2 fw-semibold">
                                    This chat has ended.
                                </p>
                                <p className="mb-0">
                                    Press Done to dismiss this panel.
                                </p>
                            </div>
                        )}

                        {isCancelledConversation && (
                            <div>
                                <p className="mb-2 fw-semibold">
                                    This request was cancelled.
                                </p>
                                <p className="mb-0">
                                    Press Done to dismiss this panel.
                                </p>
                            </div>
                        )}
                    </Card.Body>

                    <Card.Footer
                        className={`${darkMode ? "bg-dark border-secondary" : "bg-light"}`}
                    >
                        {isPendingConversation && (
                            <div className="d-flex gap-2">
                                <Button
                                    variant="danger"
                                    onClick={onCancelChatRequest}
                                >
                                    Cancel
                                </Button>

                                <div className="d-flex gap-2 flex-grow-1">
                                    <Form.Control
                                        type="text"
                                        value={messageText}
                                        onChange={(e) => onMessageTextChange(e.target.value)}
                                        placeholder="Messaging unlocks after acceptance..."
                                        disabled
                                    />
                                    <Button variant="primary" disabled>
                                        Send
                                    </Button>
                                </div>
                            </div>
                        )}

                        {isActiveConversation && (
                            <Form onSubmit={onSendMessage}>
                                <div className="d-flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline-danger"
                                        onClick={onCloseActiveChat}
                                    >
                                        Close
                                    </Button>

                                    <Form.Control
                                        type="text"
                                        value={messageText}
                                        onChange={(e) => onMessageTextChange(e.target.value)}
                                        placeholder="Type a message..."
                                        disabled={sendingMessage}
                                    />

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={sendingMessage || !messageText.trim()}
                                    >
                                        {sendingMessage ? "Sending..." : "Send"}
                                    </Button>
                                </div>
                            </Form>
                        )}

                        {(isClosedConversation || isCancelledConversation) && (
                            <div className="text-end">
                                <Button
                                    variant="secondary"
                                    onClick={onDone}
                                >
                                    Done
                                </Button>
                            </div>
                        )}
                    </Card.Footer>
                </Card>
            )}
        </div>
    );
}