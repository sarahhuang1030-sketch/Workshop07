import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    useCallback
} from "react";
import { apiFetch } from "../services/api";
import {
    connectChatWs,
    disconnectChatWs,
    subscribeToUserTopic,
    subscribeToChatRequests,
    subscribeToConversationTopic
} from "../services/chatWsService";

const ChatContext = createContext(null);

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

export function ChatProvider({ children, currentUserId }) {
    const [activeTabs, setActiveTabs] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);

    const [messagesByConversation, setMessagesByConversation] = useState({});
    const [draftsByConversation, setDraftsByConversation] = useState({});
    const [loadingByConversation, setLoadingByConversation] = useState({});
    const [sendingByConversation, setSendingByConversation] = useState({});

    const [isOpen, setIsOpen] = useState(false);

    const userSubscriptionRef = useRef(null);
    const chatRequestsSubscriptionRef = useRef(null);
    const conversationSubscriptionsRef = useRef({});

    const [lastEvent, setLastEvent] = useState(null);

    const handleIncomingMessage = useCallback((msg) => {
        const conversationId = msg?.conversationId;
        if (!conversationId) return;

        setMessagesByConversation((prev) => {
            const existing = prev[conversationId] || [];

            const duplicate = existing.some(
                (m) =>
                    msg?.messageId != null &&
                    m?.messageId != null &&
                    Number(m.messageId) === Number(msg.messageId)
            );

            if (duplicate) return prev;

            return {
                ...prev,
                [conversationId]: [...existing, msg]
            };
        });

        setActiveTabs((prev) =>
            prev.map((tab) =>
                Number(tab.conversationId) === Number(conversationId)
                    ? {
                        ...tab,
                        lastMessageAt: msg.sentAt || new Date().toISOString()
                    }
                    : tab
            )
        );
    }, []);

    const applyClosedConversationLocally = useCallback((conversationId) => {
        if (!conversationId) return;

        setActiveTabs((prev) =>
            prev.map((tab) =>
                Number(tab.conversationId) === Number(conversationId)
                    ? { ...tab, status: "CLOSED" }
                    : tab
            )
        );
    }, []);

    const ensureConversationSubscription = useCallback((conversationId) => {
        if (!conversationId) return;

        const existing = conversationSubscriptionsRef.current[conversationId];
        if (existing) return;

        const sub = subscribeToConversationTopic(conversationId, (msg) => {
            handleIncomingMessage(msg);
        });

        if (sub) {
            conversationSubscriptionsRef.current[conversationId] = sub;
        }
    }, [handleIncomingMessage]);

    const loadMessages = useCallback(async (conversationId) => {
        if (!conversationId) return;

        setLoadingByConversation((prev) => ({
            ...prev,
            [conversationId]: true
        }));

        try {
            const res = await apiFetch(`/api/chat/${conversationId}/messages`);

            if (!res.ok) {
                console.error("Failed to load messages:", res.status);
                setMessagesByConversation((prev) => ({
                    ...prev,
                    [conversationId]: []
                }));
                return;
            }

            const data = await res.json();

            setMessagesByConversation((prev) => ({
                ...prev,
                [conversationId]: safeArray(data)
            }));
        } catch (err) {
            console.error("Failed to load messages", err);
            setMessagesByConversation((prev) => ({
                ...prev,
                [conversationId]: []
            }));
        } finally {
            setLoadingByConversation((prev) => ({
                ...prev,
                [conversationId]: false
            }));
        }
    }, []);

    useEffect(() => {
        if (!currentUserId) return;

        connectChatWs({
            onConnect: () => {
                console.log("[GLOBAL CHAT] STOMP connected");

                userSubscriptionRef.current?.unsubscribe?.();
                chatRequestsSubscriptionRef.current = subscribeToChatRequests((event) => {
                    const eventType = String(event?.eventType || "").toUpperCase();

                    // 🔥 propagate event to entire app
                    setLastEvent({
                        type: eventType || "CHAT_REQUEST_CREATED",
                        payload: event,
                        timestamp: Date.now()
                    });
                });

                userSubscriptionRef.current = subscribeToUserTopic(currentUserId, (event) => {
                    const eventType = String(event?.eventType || "").toUpperCase();

                    // 🔥 broadcast event globally
                    setLastEvent({
                        type: eventType,
                        payload: event,
                        timestamp: Date.now()
                    });

                    if (eventType === "NEW_MESSAGE") {
                        handleIncomingMessage(event);
                    }

                    if (eventType === "CHAT_REQUEST_CLOSED") {
                        if (event?.conversationId) {
                            applyClosedConversationLocally(event.conversationId);
                        }
                    }

                    if (eventType === "CHAT_REQUEST_ACCEPTED") {
                        if (event?.conversationId) {
                            setActiveTabs((prev) =>
                                prev.map((tab) =>
                                    Number(tab.conversationId) === Number(event.conversationId)
                                        ? { ...tab, status: "ACTIVE" }
                                        : tab
                                )
                            );
                        }
                    }
                });

                chatRequestsSubscriptionRef.current = subscribeToChatRequests(() => {
                    // no-op for now; kept so global connection mirrors old behavior
                });

                Object.keys(conversationSubscriptionsRef.current).forEach((key) => {
                    conversationSubscriptionsRef.current[key]?.unsubscribe?.();
                });
                conversationSubscriptionsRef.current = {};

                activeTabs.forEach((tab) => {
                    ensureConversationSubscription(tab.conversationId);
                });
            }
        });

        return () => {
            userSubscriptionRef.current?.unsubscribe?.();
            chatRequestsSubscriptionRef.current?.unsubscribe?.();

            Object.values(conversationSubscriptionsRef.current).forEach((sub) => {
                sub?.unsubscribe?.();
            });
            conversationSubscriptionsRef.current = {};

            disconnectChatWs();
        };
    }, [
        currentUserId,
        activeTabs,
        ensureConversationSubscription,
        handleIncomingMessage,
        applyClosedConversationLocally
    ]);

    useEffect(() => {
        activeTabs.forEach((tab) => {
            ensureConversationSubscription(tab.conversationId);
        });

        const activeIds = new Set(
            activeTabs.map((tab) => String(tab.conversationId))
        );

        Object.keys(conversationSubscriptionsRef.current).forEach((conversationId) => {
            if (!activeIds.has(String(conversationId))) {
                conversationSubscriptionsRef.current[conversationId]?.unsubscribe?.();
                delete conversationSubscriptionsRef.current[conversationId];
            }
        });
    }, [activeTabs, ensureConversationSubscription]);

    const openConversationTab = useCallback(async (tab) => {
        if (!tab?.conversationId) return;

        setActiveTabs((prev) => {
            const existingIndex = prev.findIndex(
                (t) => Number(t.conversationId) === Number(tab.conversationId)
            );

            if (existingIndex >= 0) {
                const copy = [...prev];
                copy[existingIndex] = { ...copy[existingIndex], ...tab };
                return copy;
            }

            return [...prev, tab];
        });

        setActiveConversationId(tab.conversationId);
        setIsOpen(true);

        ensureConversationSubscription(tab.conversationId);

        const alreadyLoaded = messagesByConversation?.[tab.conversationId];
        if (!alreadyLoaded) {
            await loadMessages(tab.conversationId);
        }
    }, [ensureConversationSubscription, loadMessages, messagesByConversation]);

    const closeTab = useCallback((tab) => {
        if (!tab?.conversationId) return;

        setActiveTabs((prev) => {
            const remaining = prev.filter(
                (t) => Number(t.conversationId) !== Number(tab.conversationId)
            );

            setActiveConversationId((current) => {
                if (Number(current) !== Number(tab.conversationId)) {
                    return current;
                }

                if (remaining.length === 0) {
                    setIsOpen(false);
                    return null;
                }

                return remaining[remaining.length - 1].conversationId;
            });

            return remaining;
        });
    }, []);

    const selectTab = useCallback(async (tab) => {
        if (!tab?.conversationId) return;

        setActiveConversationId(tab.conversationId);
        setIsOpen(true);

        ensureConversationSubscription(tab.conversationId);

        const alreadyLoaded = messagesByConversation?.[tab.conversationId];
        if (!alreadyLoaded) {
            await loadMessages(tab.conversationId);
        }
    }, [ensureConversationSubscription, loadMessages, messagesByConversation]);

    const setDraft = useCallback((conversationId, value) => {
        if (!conversationId) return;

        setDraftsByConversation((prev) => ({
            ...prev,
            [conversationId]: value
        }));
    }, []);

    const sendMessage = useCallback(async (conversation) => {
        const conversationId = conversation?.conversationId;
        if (!conversationId || !currentUserId) return;

        const text = draftsByConversation?.[conversationId] || "";
        if (!text.trim()) return;

        setSendingByConversation((prev) => ({
            ...prev,
            [conversationId]: true
        }));

        try {
            const res = await apiFetch(`/api/chat/${conversationId}/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fromUserId: currentUserId,
                    toUserId:
                        conversation?.otherUserId ||
                        conversation?.customerUserId ||
                        0,
                    messageText: text
                })
            });

            if (!res.ok) {
                console.error("Send message failed:", res.status);
                return;
            }

            const savedMessage = await res.json();

            setMessagesByConversation((prev) => {
                const existing = prev[conversationId] || [];

                const duplicate = existing.some(
                    (m) =>
                        savedMessage?.messageId != null &&
                        m?.messageId != null &&
                        Number(m.messageId) === Number(savedMessage.messageId)
                );

                if (duplicate) return prev;

                return {
                    ...prev,
                    [conversationId]: [...existing, savedMessage]
                };
            });

            setDraftsByConversation((prev) => ({
                ...prev,
                [conversationId]: ""
            }));

            setActiveTabs((prev) =>
                prev.map((tab) =>
                    Number(tab.conversationId) === Number(conversationId)
                        ? {
                            ...tab,
                            lastMessageAt:
                                savedMessage?.sentAt || new Date().toISOString()
                        }
                        : tab
                )
            );
        } catch (err) {
            console.error("Send message failed", err);
        } finally {
            setSendingByConversation((prev) => ({
                ...prev,
                [conversationId]: false
            }));
        }
    }, [currentUserId, draftsByConversation]);

    const closeConversation = useCallback(async (conversation) => {
        const conversationId = conversation?.conversationId;
        if (!conversationId) return;

        try {
            const res = await apiFetch(`/api/chat/${conversationId}/close`, {
                method: "POST"
            });

            if (!res.ok) {
                console.error("Close conversation failed:", res.status);
            }
        } catch (err) {
            console.error("Close conversation failed", err);
        }

        setActiveTabs((prev) =>
            prev.map((tab) =>
                Number(tab.conversationId) === Number(conversationId)
                    ? { ...tab, status: "CLOSED" }
                    : tab
            )
        );
    }, []);

    const activeConversation =
        activeTabs.find(
            (tab) => Number(tab.conversationId) === Number(activeConversationId)
        ) || null;

    return (
        <ChatContext.Provider
            value={{
                activeTabs,
                activeConversationId,
                activeConversation,
                messagesByConversation,
                draftsByConversation,
                loadingByConversation,
                sendingByConversation,
                isOpen,
                lastEvent,

                setIsOpen,
                openConversationTab,
                closeTab,
                selectTab,
                setDraft,
                loadMessages,
                sendMessage,
                closeConversation
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);

    if (!context) {
        throw new Error("useChat must be used inside ChatProvider");
    }

    return context;
}