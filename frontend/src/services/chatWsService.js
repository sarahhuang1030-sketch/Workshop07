import { Client } from "@stomp/stompjs";

let stompClient = null;
let currentBrokerUrl = null;

function buildBrokerUrl() {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    return `${protocol}://localhost:8080/ws`;
}

export function connectChatWs({
    onConnect,
    onDisconnect,
    onError,
    debug = false
} = {}) {
    const brokerURL = buildBrokerUrl();

    if (stompClient && stompClient.connected) {
        onConnect?.(stompClient);
        return stompClient;
    }

    if (stompClient && currentBrokerUrl === brokerURL) {
        return stompClient;
    }

    stompClient = new Client({
        brokerURL,
        reconnectDelay: 5000,
        debug: debug ? (msg) => console.log("[CHAT-WS]", msg) : () => {}
    });

    stompClient.onConnect = () => {
        onConnect?.(stompClient);
    };

    stompClient.onStompError = (frame) => {
        console.error("[CHAT-WS] STOMP error", frame);
        onError?.(frame);
    };

    stompClient.onWebSocketError = (event) => {
        console.error("[CHAT-WS] WebSocket error", event);
        onError?.(event);
    };

    stompClient.onWebSocketClose = (event) => {
        onDisconnect?.(event);
    };

    currentBrokerUrl = brokerURL;
    stompClient.activate();

    return stompClient;
}

export function disconnectChatWs() {
    if (!stompClient) return;

    try {
        stompClient.deactivate();
    } catch (err) {
        console.error("[CHAT-WS] Failed to deactivate client", err);
    } finally {
        stompClient = null;
        currentBrokerUrl = null;
    }
}

export function getChatWsClient() {
    return stompClient;
}

export function subscribeToUserTopic(userId, handler) {
    if (!stompClient || !stompClient.connected || !userId) return null;

    return stompClient.subscribe(`/topic/user/${userId}`, (message) => {
        let parsed = null;

        try {
            parsed = JSON.parse(message?.body || "{}");
        } catch (err) {
            console.error("[CHAT-WS] Failed to parse user topic message", err);
            return;
        }

        handler?.(parsed, message);
    });
}

export function subscribeToChatRequests(handler) {
    if (!stompClient || !stompClient.connected) return null;

    return stompClient.subscribe("/topic/chat-requests", (message) => {
        let parsed = null;

        try {
            parsed = JSON.parse(message?.body || "{}");
        } catch (err) {
            console.error("[CHAT-WS] Failed to parse chat-requests message", err);
            return;
        }

        handler?.(parsed, message);
    });
}

export function subscribeToConversationTopic(conversationId, handler) {
    if (!stompClient || !stompClient.connected || !conversationId) return null;

    return stompClient.subscribe(`/topic/conversation/${conversationId}`, (message) => {
        let parsed = null;

        try {
            parsed = JSON.parse(message?.body || "{}");
        } catch (err) {
            console.error("[CHAT-WS] Failed to parse conversation message", err);
            return;
        }

        handler?.(parsed, message);
    });
}