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
    Alert,
    Spinner,
    Modal
} from "react-bootstrap";
import { Client } from "@stomp/stompjs";
import { apiFetch } from "../../services/api";

const REQUESTS_API = "/api/customer/service-requests";
const CHAT_REQUESTS_API = "/api/chat/chat-requests";

export default function CustomerSupport({ darkMode = false }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [showDetails, setShowDetails] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const [formData, setFormData] = useState({
        requestType: "Technical Support",
        priority: "Medium",
        description: ""
    });

    const [chatSubmitting, setChatSubmitting] = useState(false);
    const [chatError, setChatError] = useState("");
    const [chatSuccess, setChatSuccess] = useState("");
    const [createdChatRequest, setCreatedChatRequest] = useState(null);

    const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
    const [chatSocketConnected, setChatSocketConnected] = useState(false);
    const [chatEventText, setChatEventText] = useState("");

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
    const messagesEndRef = useRef(null);

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
        const storedUser = JSON.parse(localStorage.getItem("tc_user") || "{}");
        const userId = storedUser?.userId ?? storedUser?.raw?.userId ?? null;

        if (!userId) {
            return;
        }

        if (stompClientRef.current && connectedUserIdRef.current === userId) {
            return;
        }

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
                } catch {}
            }

            userSubscriptionRef.current = client.subscribe(`/topic/user/${userId}`, (message) => {
                const body = message?.body || "";
                let parsed = null;

                try {
                    parsed = JSON.parse(body);
                } catch {
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

                setChatEventText(body);

                setCreatedChatRequest((prev) => {
                    if (!prev) return prev;

                    const prevRequestId = prev.requestId ?? prev.id ?? null;

                    if (requestId != null && prevRequestId != null && Number(requestId) !== Number(prevRequestId)) {
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
                    }

                    return next;
                });

                if (
                    eventType.includes("ACCEPT") ||
                    eventType.includes("ACTIVE") ||
                    body.toUpperCase().includes("ACCEPT") ||
                    body.toUpperCase().includes("ACTIVE")
                ) {
                    setChatDrawerOpen(true);
                    setChatSuccess("Your chat request was accepted.");
                }
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
            } catch {}

            try {
                if (conversationSubscriptionRef.current) {
                    conversationSubscriptionRef.current.unsubscribe();
                    conversationSubscriptionRef.current = null;
                }
            } catch {}

            try {
                client.deactivate();
            } catch {}

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

        if (!conversationId || !isActive) {
            return;
        }

        loadConversationMessages(conversationId);
        subscribeConversationTopic(conversationId);
    }, [createdChatRequest?.conversationId, createdChatRequest?.status]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [conversationMessages]);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const res = await apiFetch(REQUESTS_API);
            if (!res.ok) throw new Error("Failed to load requests");
            const data = await res.json();
            setRequests(data);
        } catch (err) {
            setError(err.message || "Failed to load requests");
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
            setChatError(err.message || "Failed to load conversation messages");
        } finally {
            setMessagesLoading(false);
        }
    };

    const subscribeConversationTopic = (conversationId) => {
        const client = stompClientRef.current;
        if (!client || !client.connected) {
            return;
        }

        if (subscribedConversationIdRef.current === conversationId) {
            return;
        }

        try {
            if (conversationSubscriptionRef.current) {
                conversationSubscriptionRef.current.unsubscribe();
                conversationSubscriptionRef.current = null;
            }
        } catch {}

        conversationSubscriptionRef.current = client.subscribe(
            `/topic/conversation/${conversationId}`,
            (message) => {
                const body = message?.body || "";
                let parsed = null;

                try {
                    parsed = JSON.parse(body);
                } catch {
                    parsed = null;
                }

                if (!parsed) {
                    return;
                }

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
            setError("");
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
            setError(err.message || "Failed to submit request");
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
            setChatError("");
            setChatSuccess("");
            setChatEventText("");
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
            setChatSuccess("Live chat request created successfully.");

            setChatForm({
                reason: "Customer Support",
                comment: ""
            });
        } catch (err) {
            setChatError(err.message || "Failed to create chat request");
        } finally {
            setChatSubmitting(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        const conversationId = createdChatRequest?.conversationId;
        const status = String(createdChatRequest?.status || "").toUpperCase();

        if (!conversationId || status !== "ACTIVE") {
            return;
        }

        const trimmed = messageText.trim();
        if (!trimmed) {
            return;
        }

        try {
            setSendingMessage(true);
            setChatError("");

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
            setChatError(err.message || "Failed to send message");
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

    function getChatStatusBadge(status) {
        const value = String(status || "").toLowerCase();
        if (value === "active") return "success";
        if (value === "pending") return "warning";
        if (value === "closed") return "secondary";
        return "primary";
    }

    const cardBase = darkMode
        ? "bg-dark text-light border-secondary"
        : "bg-white text-dark shadow-sm";

    const openDetails = (req) => {
        setSelectedRequest(req);
        setShowDetails(true);
    };

    const currentUser = JSON.parse(localStorage.getItem("tc_user") || "{}");
    const currentUserId = currentUser?.userId ?? currentUser?.raw?.userId ?? null;
    const isActiveConversation = String(createdChatRequest?.status || "").toUpperCase() === "ACTIVE";

    return (
        <>
            <Container className="py-4">
                <h2 className="fw-bold mb-4">Customer Support</h2>

                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError("")}>
                        {error}
                    </Alert>
                )}

                <Row className="g-4">
                    <Col lg={4}>
                        <Card className={cardBase} style={{ borderRadius: 18 }}>
                            <Card.Body className="p-4">
                                <h4 className="mb-3">Submit a Service Request</h4>
                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Request Type</Form.Label>
                                        <Form.Select
                                            name="requestType"
                                            value={formData.requestType}
                                            onChange={handleChange}
                                        >
                                            {requestTypes.map((t) => (
                                                <option key={t} value={t}>
                                                    {t}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Priority</Form.Label>
                                        <Form.Select
                                            name="priority"
                                            value={formData.priority}
                                            onChange={handleChange}
                                        >
                                            {priorities.map((p) => (
                                                <option key={p} value={p}>
                                                    {p}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Description</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={4}
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            required
                                            placeholder="Please describe your issue..."
                                        />
                                    </Form.Group>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="w-100"
                                        disabled={submitting}
                                        style={{ borderRadius: 12 }}
                                    >
                                        {submitting ? "Submitting..." : "Submit Request"}
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={8}>
                        <Card className={cardBase} style={{ borderRadius: 18 }}>
                            <Card.Body className="p-4">
                                <h4 className="mb-3">My Service Requests</h4>

                                {loading ? (
                                    <div className="text-center py-4">
                                        <Spinner animation="border" />
                                    </div>
                                ) : requests.length > 0 ? (
                                    <Table
                                        responsive
                                        hover
                                        className={`align-middle ${darkMode ? "table-dark" : ""}`}
                                    >
                                        <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                            <th>Technician</th>
                                            <th>Created</th>
                                            <th>Action</th>
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
                                                        : "—"}
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
                                    <div className="text-center py-4 text-muted">
                                        You have no service requests.
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row className="g-4 mt-1">
                    <Col>
                        <Card className={cardBase} style={{ borderRadius: 18 }}>
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                                    <div>
                                        <h4 className="mb-2">Live Chat Support</h4>
                                        <p className="text-muted mb-3">
                                            Start a live chat request. This first step creates the request and opens the customer chat panel.
                                        </p>
                                    </div>

                                    <div className="d-flex align-items-center gap-2">
                                        <span className="small text-muted">Socket:</span>
                                        <Badge bg={chatSocketConnected ? "success" : "secondary"}>
                                            {chatSocketConnected ? "Connected" : "Offline"}
                                        </Badge>
                                    </div>
                                </div>

                                {chatError && (
                                    <Alert
                                        variant="danger"
                                        dismissible
                                        onClose={() => setChatError("")}
                                    >
                                        {chatError}
                                    </Alert>
                                )}

                                {chatSuccess && (
                                    <Alert
                                        variant="success"
                                        dismissible
                                        onClose={() => setChatSuccess("")}
                                    >
                                        {chatSuccess}
                                    </Alert>
                                )}

                                <Form onSubmit={handleStartChatRequest}>
                                    <Row className="g-3">
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Reason</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="reason"
                                                    value={chatForm.reason}
                                                    onChange={handleChatFieldChange}
                                                    placeholder="Customer Support"
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>

                                        <Col md={8}>
                                            <Form.Group>
                                                <Form.Label>Comment</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="comment"
                                                    value={chatForm.comment}
                                                    onChange={handleChatFieldChange}
                                                    placeholder="Briefly describe what you need help with..."
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <div className="mt-3 d-flex gap-2 flex-wrap">
                                        <Button
                                            type="submit"
                                            variant="success"
                                            disabled={chatSubmitting}
                                            style={{ borderRadius: 12 }}
                                        >
                                            {chatSubmitting ? "Starting Chat..." : "Start Live Chat"}
                                        </Button>

                                        {createdChatRequest && (
                                            <Button
                                                type="button"
                                                variant="outline-primary"
                                                onClick={() => setChatDrawerOpen(true)}
                                                style={{ borderRadius: 12 }}
                                            >
                                                Open Chat Panel
                                            </Button>
                                        )}
                                    </div>
                                </Form>

                                {createdChatRequest && (
                                    <div className="mt-4">
                                        <hr />
                                        <h6 className="fw-bold mb-2">Created Chat Request</h6>
                                        <div className="small">
                                            <div>
                                                <strong>Request ID:</strong>{" "}
                                                {createdChatRequest.requestId ?? createdChatRequest.id ?? "—"}
                                            </div>
                                            <div>
                                                <strong>Status:</strong>{" "}
                                                {createdChatRequest.status ?? "—"}
                                            </div>
                                            <div>
                                                <strong>Reason:</strong>{" "}
                                                {createdChatRequest.reason ?? chatForm.reason}
                                            </div>
                                            <div>
                                                <strong>Comment:</strong>{" "}
                                                {createdChatRequest.comment ?? "—"}
                                            </div>
                                            {createdChatRequest.conversationId != null && (
                                                <div>
                                                    <strong>Conversation ID:</strong>{" "}
                                                    {createdChatRequest.conversationId}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {createdChatRequest && (
                <div
                    style={{
                        position: "fixed",
                        right: "24px",
                        bottom: "0",
                        width: "380px",
                        maxWidth: "calc(100vw - 24px)",
                        zIndex: 1050
                    }}
                >
                    {!chatDrawerOpen ? (
                        <Button
                            onClick={() => setChatDrawerOpen(true)}
                            variant="light"
                            className="shadow border d-flex align-items-center justify-content-between px-3"
                            style={{
                                width: "280px",
                                height: "44px",
                                borderTopLeftRadius: 12,
                                borderTopRightRadius: 12,
                                borderBottomLeftRadius: 0,
                                borderBottomRightRadius: 0,
                                marginLeft: "auto"
                            }}
                        >
                            <span className="fw-semibold">Customer Chat</span>
                            <Badge bg={getChatStatusBadge(createdChatRequest.status)}>
                                {createdChatRequest.status ?? "Pending"}
                            </Badge>
                        </Button>
                    ) : (
                        <Card
                            className={`shadow ${darkMode ? "bg-dark text-light border-secondary" : "bg-white"}`}
                            style={{
                                borderTopLeftRadius: 14,
                                borderTopRightRadius: 14,
                                borderBottomLeftRadius: 0,
                                borderBottomRightRadius: 0,
                                overflow: "hidden"
                            }}
                        >
                            <Card.Header
                                className={`d-flex justify-content-between align-items-center ${
                                    darkMode ? "bg-dark text-light border-secondary" : "bg-light"
                                }`}
                            >
                                <div>
                                    <div className="fw-bold">Customer Support Chat</div>
                                    <div style={{ fontSize: "0.85rem" }}>
                                        Request #{createdChatRequest.requestId ?? createdChatRequest.id ?? "—"} ·{" "}
                                        <Badge bg={getChatStatusBadge(createdChatRequest.status)}>
                                            {createdChatRequest.status ?? "Pending"}
                                        </Badge>
                                    </div>
                                </div>

                                <Button
                                    size="sm"
                                    variant="outline-secondary"
                                    onClick={() => setChatDrawerOpen(false)}
                                >
                                    Minimize
                                </Button>
                            </Card.Header>

                            <Card.Body style={{ height: "340px", overflowY: "auto" }}>
                                <div className="mb-3">
                                    <div className="fw-semibold mb-1">Reason</div>
                                    <div>{createdChatRequest.reason ?? "—"}</div>
                                </div>

                                <div className="mb-3">
                                    <div className="fw-semibold mb-1">Comment</div>
                                    <div>{createdChatRequest.comment ?? "—"}</div>
                                </div>

                                {createdChatRequest.conversationId != null && (
                                    <div className="mb-3">
                                        <div className="fw-semibold mb-1">Conversation ID</div>
                                        <div>{createdChatRequest.conversationId}</div>
                                    </div>
                                )}

                                <hr />

                                {isActiveConversation ? (
                                    <>
                                        <div className="text-success mb-3">
                                            <p className="mb-2 fw-semibold">
                                                Your chat request has been accepted.
                                            </p>
                                            <p className="mb-0">
                                                The conversation is now active.
                                            </p>
                                        </div>

                                        <div className="mb-2 fw-semibold">Messages</div>

                                        {messagesLoading ? (
                                            <div className="text-center py-3">
                                                <Spinner animation="border" size="sm" />
                                            </div>
                                        ) : conversationMessages.length > 0 ? (
                                            <div className="d-flex flex-column gap-2">
                                                {conversationMessages.map((msg) => {
                                                    const mine = Number(msg.fromUserId) === Number(currentUserId);

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
                                                                    {msg.sentAt ? new Date(msg.sentAt).toLocaleString() : ""}
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
                                ) : (
                                    <div className="text-muted">
                                        <p className="mb-2">
                                            Your chat request has been created successfully.
                                        </p>
                                        <p className="mb-2">
                                            Waiting for an employee to accept the request.
                                        </p>
                                        <p className="mb-0">
                                            This panel will update automatically when your request becomes active.
                                        </p>
                                    </div>
                                )}

                                {chatEventText && (
                                    <div className="mt-3">
                                        <hr />
                                        <div className="small text-muted">
                                            <strong>Latest socket event:</strong>
                                            <div className="mt-1" style={{ wordBreak: "break-word" }}>
                                                {chatEventText}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card.Body>

                            <Card.Footer
                                className={`${darkMode ? "bg-dark border-secondary" : "bg-light"}`}
                            >
                                <Form onSubmit={handleSendMessage}>
                                    <div className="d-flex gap-2">
                                        <Form.Control
                                            type="text"
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            placeholder={
                                                isActiveConversation
                                                    ? "Type a message..."
                                                    : "Message input stays disabled until the request becomes active..."
                                            }
                                            disabled={!isActiveConversation || sendingMessage}
                                        />
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            disabled={!isActiveConversation || sendingMessage || !messageText.trim()}
                                        >
                                            {sendingMessage ? "Sending..." : "Send"}
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Footer>
                        </Card>
                    )}
                </div>
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