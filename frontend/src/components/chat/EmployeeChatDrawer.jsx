import React from "react";
import { Card, Button } from "react-bootstrap";
import EmployeeLiveChatPanel from "./EmployeeLiveChatPanel";

function getStatusDotColor(status) {
    const value = String(status || "").toUpperCase();

    if (value === "ACTIVE") return "#22c55e";
    if (value === "PENDING") return "#f59e0b";
    if (value === "CLOSED") return "#ef4444";
    if (value === "CANCELLED") return "#94a3b8";

    return "#94a3b8";
}

export default function EmployeeChatDrawer({
                                               darkMode = false,
                                               isOpen = false,
                                               activeTabs = [],
                                               activeConversationId = null,
                                               messagesByConversation = {},
                                               draftsByConversation = {},
                                               loadingByConversation = {},
                                               currentUserId = null,
                                               sendingMessage = false,

                                               onOpen,
                                               onMinimize,
                                               onSelectTab,
                                               onCloseTab,
                                               onDraftChange,
                                               onSendMessage,
                                               onCloseConversation
                                           }) {
    const activeConversation =
        activeTabs.find(
            (tab) => Number(tab.conversationId) === Number(activeConversationId)
        ) || null;

    const activeMessages =
        messagesByConversation?.[activeConversation?.conversationId] || [];

    const activeDraft =
        draftsByConversation?.[activeConversation?.conversationId] || "";

    const activeLoading =
        loadingByConversation?.[activeConversation?.conversationId] || false;

    const activeDotColor = getStatusDotColor(activeConversation?.status);



    return (
        <div
            style={{
                position: "fixed",
                right: "24px",
                bottom: "0",
                width: "420px",
                maxWidth: "calc(100vw - 24px)",
                height: isOpen ? "620px" : "46px",
                minHeight: isOpen ? "620px" : "46px",
                maxHeight: isOpen ? "80vh" : "46px",
                zIndex: 1080
            }}
        >
            {!isOpen ? (
                <Button
                    onClick={onOpen}
                    variant="light"
                    className="shadow border d-flex align-items-center justify-content-between px-3"
                    style={{
                        width: "320px",
                        height: "46px",
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                        marginLeft: "auto"
                    }}
                >
                    <span className="fw-semibold d-flex align-items-center gap-2">
                        <span
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                display: "inline-block",
                                backgroundColor: activeDotColor
                            }}
                        />
                        Employee Chat Drawer
                    </span>

                    {activeTabs.length > 0 && (
                        <span
                            className="fw-bold"
                            style={{
                                minWidth: 24,
                                height: 24,
                                borderRadius: 999,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#2563eb",
                                color: "white",
                                fontSize: "0.82rem"
                            }}
                        >
                            {activeTabs.length}
                        </span>
                    )}
                </Button>
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
                    {/* Header */}
                    <Card.Header
                        className={`d-flex justify-content-between align-items-center ${
                            darkMode ? "bg-dark text-light border-secondary" : "bg-light"
                        }`}
                    >
                        <div className="d-flex align-items-center gap-2">
                            <span
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: "50%",
                                    display: "inline-block",
                                    backgroundColor: activeDotColor
                                }}
                            />
                            <span className="fw-bold">Employee Chat Drawer</span>
                        </div>

                        <div className="d-flex gap-2">
                            <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={onMinimize}
                            >
                                Minimize
                            </Button>
                        </div>
                    </Card.Header>

                    {/* Tab strip */}
                    <div
                        style={{
                            borderBottom: darkMode
                                ? "1px solid #374151"
                                : "1px solid #e5e7eb",
                            background: darkMode ? "#111827" : "#f8fafc",
                            padding: "8px 10px",
                            overflowX: "auto",
                            whiteSpace: "nowrap"
                        }}
                    >
                        {activeTabs.length === 0 ? (
                            <div className="text-muted small px-2 py-1">
                                No active conversation tabs yet.
                            </div>
                        ) : (
                            <div className="d-flex gap-2">
                                {activeTabs.map((tab) => {
                                    const isActive =
                                        Number(tab.conversationId) ===
                                        Number(activeConversationId);

                                    const dotColor = getStatusDotColor(tab.status);

                                    return (
                                        <div
                                            key={tab.conversationId}
                                            className="d-inline-flex align-items-center gap-2"
                                            style={{
                                                borderRadius: 12,
                                                padding: "8px 10px",
                                                cursor: "pointer",
                                                border: isActive
                                                    ? "1px solid #2563eb"
                                                    : darkMode
                                                        ? "1px solid #374151"
                                                        : "1px solid #dbe3ee",
                                                background: isActive
                                                    ? darkMode
                                                        ? "#1d4ed8"
                                                        : "#eff6ff"
                                                    : darkMode
                                                        ? "#1f2937"
                                                        : "#ffffff",
                                                color: darkMode && isActive ? "#ffffff" : "inherit",
                                                minWidth: "150px",
                                                maxWidth: "220px"
                                            }}
                                            onClick={() => onSelectTab?.(tab)}
                                        >
                                            <span
                                                style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: "50%",
                                                    display: "inline-block",
                                                    backgroundColor: dotColor,
                                                    flexShrink: 0
                                                }}
                                            />

                                            <span
                                                style={{
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    fontWeight: 600,
                                                    fontSize: "0.9rem"
                                                }}
                                            >
                                                {tab.customerName ||
                                                    tab.displayName ||
                                                    `Conversation #${tab.conversationId}`}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onCloseTab?.(tab);
                                                }}
                                                style={{
                                                    border: "none",
                                                    background: "transparent",
                                                    color: isActive
                                                        ? darkMode
                                                            ? "#ffffff"
                                                            : "#1e3a8a"
                                                        : "#64748b",
                                                    fontWeight: 700,
                                                    fontSize: "0.95rem",
                                                    lineHeight: 1,
                                                    padding: 0,
                                                    marginLeft: "auto",
                                                    cursor: "pointer"
                                                }}
                                                aria-label="Close tab"
                                                title="Close tab"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Active chat body */}
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <EmployeeLiveChatPanel
                            darkMode={darkMode}
                            isOpen={true}
                            activeConversation={activeConversation}
                            messages={activeMessages}
                            loading={activeLoading}
                            currentUserId={currentUserId}
                            draftMessage={activeDraft}
                            sendingMessage={sendingMessage}
                            onDraftChange={(value, conversation) =>
                                onDraftChange?.(value, conversation || activeConversation)
                            }
                            onSendMessage={onSendMessage}
                            onMinimize={onMinimize}
                            onCloseConversation={onCloseConversation}
                            emptyTitle="No chat tab selected"
                            emptyText="Open a request or conversation from ChatHub to start managing chats here."
                            headerTitle="Live Support Chat"
                        />
                    </div>
                </Card>
            )}
        </div>
    );
}