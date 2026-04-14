import React, { useState, useEffect, useRef } from "react";
import {
    Container,
    Card,
    Table,
    Form,
    Button,
    Badge,
    Row,
    Col,
    Spinner,
    Modal
} from "react-bootstrap";
import { Client } from "@stomp/stompjs";
import { apiFetch } from "../../services/api";
import ChatDrawer from "../../components/chat/ChatDrawer.jsx";

const REQUESTS_API = "/api/customer/service-requests";
const CHAT_REQUESTS_API = "/api/chat/chat-requests";

export default function CustomerSupport({ darkMode = false }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [showDetails, setShowDetails] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const [formData, setFormData] = useState({
        requestType: "Technical Support",
        priority: "Medium",
        description: ""
    });

    const [chatSubmitting, setChatSubmitting] = useState(false);
    const [createdChatRequest, setCreatedChatRequest] = useState(null);

    const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
    const [chatSocketConnected, setChatSocketConnected] = useState(false);

    const [chatForm, setChatForm] = useState({
        reason: "Customer Support",
        comment: ""
    });

    const [messagesLoading, setMessagesLoading] = useState(false);
    const [conversationMessages, setConversationMessages] = useState([]);
    const [messageText, setMessageText] = useState("");
    const [sendingMessage, setSendingMessage] = useState(false);

    const stompClientRef = useRef(null);
    const userSubscriptionRef = useRef(null);
    const conversationSubscriptionRef = useRef(null);
    const connectedUserIdRef = useRef(null);
    const subscribedConversationIdRef = useRef(null);

    const [drawerHeight, setDrawerHeight] = useState(420);

    const isResizingRef = useRef(false);
    const startYRef = useRef(0);
    const startHeightRef = useRef(420);

    const requestTypes = [
        "Technical Support",
        "Billing Inquiry",
        "Installation",
        "Repair",
        "Upgrade",
        "Other"
    ];

    const priorities = ["Low", "Medium", "High"];

    useEffect(() => {
        loadRequests();
    }, []);

    useEffect(() => {
        restoreCurrentChat();
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizingRef.current) return;

            const deltaY = startYRef.current - e.clientY;
            const nextHeight = startHeightRef.current + deltaY;

            const minHeight = 320;
            const maxHeight = Math.floor(window.innerHeight * 0.75);

            setDrawerHeight(Math.max(minHeight, Math.min(maxHeight, nextHeight)));
        };

        const handleMouseUp = () => {
            if (!isResizingRef.current) return;

            isResizingRef.current = false;
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("tc_user") || "{}");
        const userId = storedUser?.userId ?? storedUser?.raw?.userId ?? null;

        if (!userId) return;
        if (stompClientRef.current && connectedUserIdRef.current === userId) return;

        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const wsUrl = `${protocol}://localhost:8080/ws`;

        const client = new Client({
            brokerURL: wsUrl,
            reconnectDelay: 5000,
            debug: () => {}
        });

        client.onConnect = () => {
            setChatSocketConnected(true);
            connectedUserIdRef.current = userId;

            if (userSubscriptionRef.current) {
                try {
                    userSubscriptionRef.current.unsubscribe();
                } catch (err) {
                    console.debug("Customer user topic unsubscribe skipped:", err);
                }
            }

            userSubscriptionRef.current = client.subscribe(`/topic/user/${userId}`, (message) => {
                const body = message?.body || "";
                let parsed = null;

                try {
                    parsed = JSON.parse(body);
                } catch (err) {
                    console.debug("Customer user topic parse failed:", err);
                    parsed = null;
                }

                const eventType = String(
                    parsed?.eventType ??
                    parsed?.type ??
                    parsed?.event ??
                    ""
                ).toUpperCase();

                const requestId =
                    parsed?.requestId ??
                    parsed?.chatRequestId ??
                    parsed?.id ??
                    null;

                const conversationId =
                    parsed?.conversationId ??
                    parsed?.conversation?.conversationId ??
                    null;

                const status =
                    parsed?.status ??
                    parsed?.requestStatus ??
                    null;

                const assignedEmployeeUserId =
                    parsed?.assignedEmployeeUserId ??
                    parsed?.employeeUserId ??
                    null;

                setCreatedChatRequest((prev) => {
                    if (!prev) return prev;

                    const prevRequestId = prev.requestId ?? prev.id ?? null;

                    if (
                        requestId != null &&
                        prevRequestId != null &&
                        Number(requestId) !== Number(prevRequestId)
                    ) {
                        return prev;
                    }

                    const next = { ...prev };

                    if (conversationId != null) {
                        next.conversationId = conversationId;
                    }

                    if (status != null) {
                        next.status = status;
                    }

                    if (assignedEmployeeUserId != null) {
                        next.assignedEmployeeUserId = assignedEmployeeUserId;
                    }

                    if (
                        eventType.includes("ACCEPT") ||
                        eventType.includes("ACTIVE") ||
                        eventType.includes("REQUEST_ACCEPTED")
                    ) {
                        next.status = "ACTIVE";
                        setChatDrawerOpen(true);
                    }

                    if (eventType.includes("CLOSE") || eventType.includes("CLOSED")) {
                        next.status = "CLOSED";

                        // Keep drawer open so user can see closed state
                        setChatDrawerOpen(true);
                    }

                    if (eventType.includes("CANCEL") || eventType.includes("CANCELLED")) {
                        next.status = "CANCELLED";
                        setChatDrawerOpen(false);
                    }

                    return next;
                });
            });
        };

        client.onStompError = () => {
            setChatSocketConnected(false);
        };

        client.onWebSocketClose = () => {
            setChatSocketConnected(false);
        };

        client.onWebSocketError = () => {
            setChatSocketConnected(false);
        };

        client.activate();
        stompClientRef.current = client;

        return () => {
            try {
                if (userSubscriptionRef.current) {
                    userSubscriptionRef.current.unsubscribe();
                    userSubscriptionRef.current = null;
                }
            } catch (err) {
                console.debug("Customer user subscription cleanup skipped:", err);
            }

            try {
                if (conversationSubscriptionRef.current) {
                    conversationSubscriptionRef.current.unsubscribe();
                    conversationSubscriptionRef.current = null;
                }
            } catch (err) {
                console.debug("Customer conversation subscription cleanup skipped:", err);
            }

            try {
                client.deactivate();
            } catch (err) {
                console.debug("Customer STOMP deactivate skipped:", err);
            }

            if (stompClientRef.current === client) {
                stompClientRef.current = null;
            }

            connectedUserIdRef.current = null;
            subscribedConversationIdRef.current = null;
            setChatSocketConnected(false);
        };
    }, []);

    useEffect(() => {
        const conversationId = createdChatRequest?.conversationId;
        const isActive = String(createdChatRequest?.status || "").toUpperCase() === "ACTIVE";

        if (!conversationId || !isActive) return;

        loadConversationMessages(conversationId);
        subscribeConversationTopic(conversationId);
    }, [createdChatRequest?.conversationId, createdChatRequest?.status]);

    useEffect(() => {
        const status = String(createdChatRequest?.status || "").toUpperCase();

        if (status === "PENDING" || status === "ACTIVE" || status === "CLOSED") return;

        try {
            if (conversationSubscriptionRef.current) {
                conversationSubscriptionRef.current.unsubscribe();
                conversationSubscriptionRef.current = null;
            }
        } catch (err) {
            console.debug("Conversation unsubscribe skipped:", err);
        }

        subscribedConversationIdRef.current = null;
        setConversationMessages([]);
        setMessageText("");
    }, [createdChatRequest?.status]);

    const restoreCurrentChat = async () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem("tc_user") || "{}");
            const userId = storedUser?.userId ?? storedUser?.raw?.userId ?? null;

            if (!userId) return;

            const res = await apiFetch(`/api/chat/chat-requests/customer/${userId}/current`);
            if (!res.ok) return;

            const data = await res.json();
            if (!data) {
                // Do NOT force clear immediately — user might still need to see CLOSED state
                return;
            }

            const status = String(data?.status || "").toUpperCase();

            if (status !== "PENDING" && status !== "ACTIVE" && status !== "CLOSED") {
                setCreatedChatRequest(null);
                setChatDrawerOpen(false);
                setConversationMessages([]);
                setMessageText("");
                return;
            }

            setCreatedChatRequest(data);
            setChatDrawerOpen(true);
        } catch (err) {
            console.error("Failed to restore chat:", err);
        }
    };

    const loadRequests = async () => {
        try {
            setLoading(true);
            const res = await apiFetch(REQUESTS_API);
            if (!res.ok) throw new Error("Failed to load requests");
            const data = await res.json();
            setRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load requests:", err);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const loadConversationMessages = async (conversationId) => {
        try {
            setMessagesLoading(true);

            const res = await apiFetch(`/api/chat/${conversationId}/messages`);
            if (!res.ok) {
                throw new Error("Failed to load conversation messages");
            }

            const data = await res.json();
            setConversationMessages(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load conversation messages:", err);
            setConversationMessages([]);
        } finally {
            setMessagesLoading(false);
        }
    };

    const subscribeConversationTopic = (conversationId) => {
        const client = stompClientRef.current;
        if (!client || !client.connected) return;
        if (subscribedConversationIdRef.current === conversationId) return;

        try {
            if (conversationSubscriptionRef.current) {
                conversationSubscriptionRef.current.unsubscribe();
                conversationSubscriptionRef.current = null;
            }
        } catch (err) {
            console.debug("Conversation resubscribe cleanup skipped:", err);
        }

        conversationSubscriptionRef.current = client.subscribe(
            `/topic/conversation/${conversationId}`,
            (message) => {
                const body = message?.body || "";
                let parsed = null;

                try {
                    parsed = JSON.parse(body);
                } catch (err) {
                    console.debug("Conversation message parse failed:", err);
                    parsed = null;
                }

                if (!parsed) return;

                setConversationMessages((prev) => {
                    const messageId = parsed?.messageId;
                    if (messageId != null && prev.some((m) => Number(m.messageId) === Number(messageId))) {
                        return prev;
                    }
                    return [...prev, parsed];
                });
            }
        );

        subscribedConversationIdRef.current = conversationId;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);

            const res = await apiFetch(REQUESTS_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Failed to submit request");

            setFormData({
                requestType: "Technical Support",
                priority: "Medium",
                description: ""
            });

            await loadRequests();
        } catch (err) {
            console.error("Failed to submit request:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleChatFieldChange = (e) => {
        const { name, value } = e.target;
        setChatForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleStartChatRequest = async (e) => {
        e.preventDefault();

        try {
            setChatSubmitting(true);
            setConversationMessages([]);
            setMessageText("");

            const storedUser = JSON.parse(localStorage.getItem("tc_user") || "{}");
            const customerUserId =
                storedUser?.userId ??
                storedUser?.raw?.userId ??
                null;

            if (!customerUserId) {
                throw new Error("Logged-in user ID for chat was not found");
            }

            const params = new URLSearchParams({
                customerUserId: String(customerUserId),
                reason: chatForm.reason || "",
                comment: chatForm.comment || ""
            });

            const res = await apiFetch(`${CHAT_REQUESTS_API}?${params.toString()}`, {
                method: "POST"
            });

            if (!res.ok) {
                throw new Error("Failed to create chat request");
            }

            const data = await res.json();

            setCreatedChatRequest(data);
            setChatDrawerOpen(true);

            setChatForm({
                reason: "Customer Support",
                comment: ""
            });
        } catch (err) {
            console.error("Failed to create chat request:", err);
        } finally {
            setChatSubmitting(false);
        }
    };

    const handleCancelChatRequest = async () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem("tc_user") || "{}");
            const customerUserId =
                storedUser?.userId ??
                storedUser?.raw?.userId ??
                null;

            const requestId = createdChatRequest?.requestId ?? createdChatRequest?.id ?? null;

            if (!customerUserId || !requestId) {
                throw new Error("Missing request or user information");
            }

            const res = await apiFetch(
                `/api/chat/chat-requests/${requestId}/cancel?customerUserId=${customerUserId}`,
                { method: "POST" }
            );

            if (!res.ok) {
                throw new Error("Failed to cancel chat request");
            }

            setCreatedChatRequest(null);
            setChatDrawerOpen(false);
            setConversationMessages([]);
            setMessageText("");
        } catch (err) {
            console.error("Failed to cancel chat request:", err);
        }
    };

    const handleCloseActiveChat = async () => {
        try {
            const conversationId = createdChatRequest?.conversationId;
            if (!conversationId) {
                throw new Error("Conversation ID not found");
            }

            const res = await apiFetch(`/api/chat/${conversationId}/close`, {
                method: "POST"
            });

            if (!res.ok) {
                throw new Error("Failed to close active chat");
            }

            setCreatedChatRequest(null);
            setChatDrawerOpen(false);
            setConversationMessages([]);
            setMessageText("");
        } catch (err) {
            console.error("Failed to close active chat:", err);
        }
    };

    const handleResizeStart = (e) => {
        e.preventDefault();
        isResizingRef.current = true;
        startYRef.current = e.clientY;
        startHeightRef.current = drawerHeight;

        document.body.style.userSelect = "none";
        document.body.style.cursor = "ns-resize";
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        const conversationId = createdChatRequest?.conversationId;
        const status = String(createdChatRequest?.status || "").toUpperCase();

        if (!conversationId || status !== "ACTIVE") return;

        const trimmed = messageText.trim();
        if (!trimmed) return;

        try {
            setSendingMessage(true);

            const storedUser = JSON.parse(localStorage.getItem("tc_user") || "{}");
            const fromUserId =
                storedUser?.userId ??
                storedUser?.raw?.userId ??
                null;

            const toUserId =
                createdChatRequest?.assignedEmployeeUserId ??
                null;

            if (!fromUserId) {
                throw new Error("Logged-in user ID for send message was not found");
            }

            if (!toUserId) {
                throw new Error("Assigned employee user ID was not found");
            }

            const res = await apiFetch(`/api/chat/${conversationId}/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fromUserId,
                    toUserId,
                    messageText: trimmed
                })
            });

            if (!res.ok) {
                throw new Error("Failed to send message");
            }

            const data = await res.json();

            setConversationMessages((prev) => {
                const messageId = data?.messageId;
                if (messageId != null && prev.some((m) => Number(m.messageId) === Number(messageId))) {
                    return prev;
                }
                return [...prev, data];
            });

            setMessageText("");
        } catch (err) {
            console.error("Failed to send message:", err);
        } finally {
            setSendingMessage(false);
        }
    };

    function getStatusBadge(status) {
        const value = String(status || "").toLowerCase();
        if (value === "completed") return "success";
        if (value === "assigned" || value === "in progress") return "primary";
        if (value === "open") return "warning";
        return "secondary";
    }

    const openDetails = (req) => {
        setSelectedRequest(req);
        setShowDetails(true);
    };

    const currentUser = JSON.parse(localStorage.getItem("tc_user") || "{}");
    const currentUserId = currentUser?.userId ?? currentUser?.raw?.userId ?? null;
    const chatStatus = String(createdChatRequest?.status || "").toUpperCase();
    const isPendingConversation = chatStatus === "PENDING";
    const isActiveConversation = chatStatus === "ACTIVE";
    const isClosedConversation = chatStatus === "CLOSED";
    const isCancelledConversation = chatStatus === "CANCELLED";
    const hasCurrentChat =
        isPendingConversation ||
        isActiveConversation ||
        isClosedConversation;

    const statusDotColor = isActiveConversation
        ? "#22c55e"
        : isPendingConversation
            ? "#f59e0b"
            : isClosedConversation
                ? "#ef4444"
                : "#6b7280";

    return (
        <>
            <Container className="py-4">
                <div className="text-center mb-5">
                    <h2 className="fw-bold mb-2">Customer Support</h2>
                    <div className="text-muted">
                        Submit service requests or connect with live support for immediate help.
                    </div>
                </div>

                <Row className="g-4 mb-4">
                    <Col lg={6}>
                        <Card
                            className="h-100 border-0"
                            style={{
                                borderRadius: 20,
                                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)"
                            }}
                        >
                            <Card.Body className="p-4 d-flex flex-column h-100">
                                <h4 className="fw-bold mb-2" style={{ fontSize: "1.6rem" }}>
                                    Submit a Service Request
                                </h4>

                                <div className="text-muted mb-4" style={{ fontSize: "0.95rem" }}>
                                    Tell us what you need and our team will assist you.
                                </div>

                                <Form onSubmit={handleSubmit} className="d-flex flex-column flex-grow-1">
                                    <Form.Group className="mb-4">
                                        <Form.Label>Request Type</Form.Label>
                                        <Form.Select
                                            name="requestType"
                                            value={formData.requestType}
                                            onChange={handleChange}
                                        >
                                            {requestTypes.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label>Priority</Form.Label>
                                        <Form.Select
                                            name="priority"
                                            value={formData.priority}
                                            onChange={handleChange}
                                        >
                                            {priorities.map((p) => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label>Description</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={4}
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            required
                                            placeholder="Describe your issue..."
                                        />
                                    </Form.Group>

                                    <div className="mt-auto d-flex justify-content-start">
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            disabled={submitting}
                                            style={{
                                                borderRadius: 12,
                                                padding: "10px 18px",
                                                fontWeight: 600,
                                                minWidth: "170px"
                                            }}
                                        >
                                            {submitting ? "Submitting..." : "Submit Request"}
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={6}>
                        <Card
                            className="h-100 border-0"
                            style={{
                                borderRadius: 20,
                                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)"
                            }}
                        >
                            <Card.Body className="p-4 d-flex flex-column h-100">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h4 className="fw-bold mb-0" style={{ fontSize: "1.6rem" }}>
                                        Live Chat Support
                                    </h4>

                                    <div
                                        className="d-inline-flex align-items-center gap-2 px-3 py-1"
                                        style={{
                                            borderRadius: "999px",
                                            backgroundColor: chatSocketConnected ? "#e8f9ef" : "#eef2f7",
                                            color: chatSocketConnected ? "#15803d" : "#64748b",
                                            fontSize: "0.82rem",
                                            fontWeight: 600
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: "50%",
                                                backgroundColor: chatSocketConnected ? "#22c55e" : "#94a3b8",
                                                display: "inline-block"
                                            }}
                                        />
                                        {chatSocketConnected ? "Online" : "Offline"}
                                    </div>
                                </div>

                                <div className="text-muted mb-4" style={{ fontSize: "0.95rem" }}>
                                    Chat instantly with a support agent for real-time help.
                                </div>

                                <Form onSubmit={handleStartChatRequest} className="d-flex flex-column flex-grow-1">
                                    <Form.Group className="mb-4">
                                        <Form.Label>Reason</Form.Label>
                                        <Form.Control
                                            name="reason"
                                            value={chatForm.reason}
                                            onChange={handleChatFieldChange}
                                            placeholder="Customer Support"
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label>Comment</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={4}
                                            name="comment"
                                            value={chatForm.comment}
                                            onChange={handleChatFieldChange}
                                            placeholder="Describe your issue..."
                                            required
                                        />
                                    </Form.Group>

                                    {createdChatRequest && hasCurrentChat && (
                                        <div
                                            className="mb-3"
                                            style={{
                                                borderTop: "1px solid #e5e7eb",
                                                paddingTop: "16px"
                                            }}
                                        >
                                            <div
                                                style={{
                                                    borderRadius: 14,
                                                    background: "#f8fafc",
                                                    padding: "14px 16px"
                                                }}
                                            >
                                                <div className="small fw-semibold mb-1">
                                                    Status: {createdChatRequest.status}
                                                </div>

                                                {isPendingConversation && (
                                                    <div className="text-muted small">
                                                        Waiting for a support agent to accept your request.
                                                    </div>
                                                )}

                                                {isActiveConversation && (
                                                    <div className="text-muted small">
                                                        You are now connected to support.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-auto d-flex flex-column align-items-start">
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            disabled={
                                                chatSubmitting ||
                                                ["PENDING", "ACTIVE"].includes(
                                                    String(createdChatRequest?.status || "").toUpperCase()
                                                )
                                            }
                                            style={{
                                                borderRadius: 12,
                                                padding: "10px 18px",
                                                fontWeight: 600,
                                                minWidth: "170px"
                                            }}
                                        >
                                            {chatSubmitting ? "Starting..." : "Start Live Chat"}
                                        </Button>

                                        {createdChatRequest && hasCurrentChat && (
                                            <Button
                                                type="button"
                                                variant="outline-primary"
                                                className="mt-2"
                                                onClick={() => setChatDrawerOpen(true)}
                                                style={{
                                                    borderRadius: 12,
                                                    padding: "10px 18px",
                                                    fontWeight: 600,
                                                    minWidth: "170px"
                                                }}
                                            >
                                                Open Chat
                                            </Button>
                                        )}
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row>
                    <Col>
                        <Card className="shadow-sm" style={{ borderRadius: 18 }}>
                            <Card.Body className="p-4">
                                <h4 className="mb-3">My Service Requests</h4>

                                {loading ? (
                                    <div className="text-center py-4">
                                        <Spinner animation="border" />
                                    </div>
                                ) : requests.length > 0 ? (
                                    <Table hover responsive>
                                        <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                            <th>Technician</th>
                                            <th>Created</th>
                                            <th></th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {requests.map((req) => (
                                            <tr key={req.requestId}>
                                                <td>#{req.requestId}</td>
                                                <td>{req.requestType}</td>
                                                <td>
                                                    <Badge bg={getStatusBadge(req.status)}>
                                                        {req.status}
                                                    </Badge>
                                                </td>
                                                <td>{req.technicianName || "TBD"}</td>
                                                <td>
                                                    {req.createdAt
                                                        ? new Date(req.createdAt).toLocaleDateString()
                                                        : "-"}
                                                </td>
                                                <td>
                                                    <Button
                                                        size="sm"
                                                        variant="outline-primary"
                                                        onClick={() => openDetails(req)}
                                                    >
                                                        Details
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </Table>
                                ) : (
                                    <div className="text-muted text-center py-3">
                                        No service requests yet.
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {createdChatRequest && hasCurrentChat && (
                <ChatDrawer
                    darkMode={darkMode}
                    isOpen={chatDrawerOpen}
                    height={drawerHeight}
                    minHeight={320}
                    maxHeight="75vh"
                    title="Customer Support Chat"
                    subtitle={createdChatRequest.reason || "Support Request"}
                    statusDotColor={statusDotColor}
                    isPendingConversation={isPendingConversation}
                    isActiveConversation={isActiveConversation}
                    isClosedConversation={isClosedConversation}
                    isCancelledConversation={isCancelledConversation}
                    currentUserId={currentUserId}
                    messagesLoading={messagesLoading}
                    conversationMessages={conversationMessages}
                    messageText={messageText}
                    sendingMessage={sendingMessage}
                    onOpen={() => setChatDrawerOpen(true)}
                    onMinimize={() => setChatDrawerOpen(false)}
                    onResizeStart={handleResizeStart}
                    onMessageTextChange={setMessageText}
                    onSendMessage={handleSendMessage}
                    onCancelChatRequest={handleCancelChatRequest}
                    onCloseActiveChat={handleCloseActiveChat}
                    onDone={() => {
                        setCreatedChatRequest(null);
                        setChatDrawerOpen(false);
                        setConversationMessages([]);
                        setMessageText("");
                    }}
                />
            )}

            <Modal show={showDetails} onHide={() => setShowDetails(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Request Details - #{selectedRequest?.requestId}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedRequest && (
                        <div>
                            <h5>Description</h5>
                            <p>{selectedRequest.description}</p>
                            <hr />
                            <h5>Appointments</h5>
                            {selectedRequest.appointments &&
                            selectedRequest.appointments.length > 0 ? (
                                <Table striped bordered hover size="sm">
                                    <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Start</th>
                                        <th>End</th>
                                        <th>Status</th>
                                        <th>Technician</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {selectedRequest.appointments.map((appt) => (
                                        <tr key={appt.appointmentId}>
                                            <td>{appt.locationType}</td>
                                            <td>{new Date(appt.scheduledStart).toLocaleString()}</td>
                                            <td>{new Date(appt.scheduledEnd).toLocaleString()}</td>
                                            <td>{appt.status}</td>
                                            <td>{appt.technicianName || "TBD"}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <p className="text-muted">
                                    No appointments scheduled for this request yet.
                                </p>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetails(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}