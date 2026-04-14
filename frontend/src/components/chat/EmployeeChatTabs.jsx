import React from "react";

function getStatusDotColor(status) {
    const value = String(status || "").toUpperCase();

    if (value === "ACTIVE") return "#22c55e";
    if (value === "PENDING") return "#f59e0b";
    if (value === "CLOSED") return "#ef4444";
    if (value === "CANCELLED") return "#94a3b8";

    return "#94a3b8";
}

export default function EmployeeChatTabs({
                                             tabs = [],
                                             activeConversationId = null,
                                             onSelectTab,
                                             onCloseTab
                                         }) {
    if (!tabs.length) return null;

    return (
        <div
            style={{
                position: "fixed",
                left: "16px",
                right: "16px",
                bottom: "0",
                zIndex: 1075,
                pointerEvents: "none"
            }}
        >
            <div
                className="d-flex align-items-end gap-2"
                style={{
                    overflowX: "auto",
                    padding: "0 8px"
                }}
            >
                {tabs.map((tab) => {
                    const isActive =
                        Number(tab.conversationId) === Number(activeConversationId);

                    const status = String(tab.status || "").toUpperCase();
                    const isClosed = status === "CLOSED";

                    const dotColor = getStatusDotColor(tab.status);

                    return (
                        <div
                            key={tab.conversationId}
                            onClick={() => onSelectTab?.(tab)}
                            style={{
                                pointerEvents: "auto",
                                minWidth: "220px",
                                maxWidth: "260px",
                                height: isActive ? "52px" : "46px",
                                borderTopLeftRadius: 12,
                                borderTopRightRadius: 12,
                                borderBottomLeftRadius: 0,
                                borderBottomRightRadius: 0,
                                border: isActive
                                    ? "1px solid #2563eb"
                                    : "1px solid #cbd5e1",
                                borderBottom: "none",
                                background: isClosed
                                    ? "#f1f5f9" // 👈 dimmed background
                                    : isActive
                                        ? "#eff6ff"
                                        : "#ffffff",
                                opacity: isClosed ? 0.75 : 1,
                                boxShadow: "0 -2px 10px rgba(15, 23, 42, 0.08)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "10px",
                                padding: "0 12px",
                                cursor: "pointer",
                                flexShrink: 0
                            }}
                        >
                            {/* LEFT SIDE */}
                            <div
                                className="d-flex align-items-center gap-2"
                                style={{
                                    minWidth: 0,
                                    overflow: "hidden"
                                }}
                            >
                                {/* STATUS DOT */}
                                <span
                                    style={{
                                        width: 9,
                                        height: 9,
                                        borderRadius: "50%",
                                        backgroundColor: dotColor,
                                        display: "inline-block",
                                        flexShrink: 0
                                    }}
                                />

                                {/* NAME */}
                                <span
                                    style={{
                                        fontWeight: 600,
                                        fontSize: "0.92rem",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis"
                                    }}
                                >
                                    {tab.customerName ||
                                        tab.displayName ||
                                        `Conversation #${tab.conversationId}`}
                                </span>

                                {/* CLOSED BADGE */}
                                {isClosed && (
                                    <span
                                        style={{
                                            fontSize: "0.7rem",
                                            background: "#ef4444",
                                            color: "white",
                                            padding: "2px 6px",
                                            borderRadius: "6px",
                                            marginLeft: "6px"
                                        }}
                                    >
                                        CLOSED
                                    </span>
                                )}
                            </div>

                            {/* CLOSE BUTTON */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCloseTab?.(tab);
                                }}
                                aria-label="Close tab"
                                title="Close tab"
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    color: "#64748b",
                                    fontWeight: 700,
                                    fontSize: "1rem",
                                    lineHeight: 1,
                                    padding: 0,
                                    cursor: "pointer",
                                    flexShrink: 0
                                }}
                            >
                                ×
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}