import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Card, Badge, Button, Spinner } from "react-bootstrap";
import { apiFetch } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../context/ChatContext";

import EmployeeChatRequestList from "./EmployeeChatRequestList";
import EmployeeCustomerInfoPanel from "./EmployeeCustomerInfoPanel";

function formatDateTime(value) {
    if (!value) return "—";
    try {
        return new Date(value).toLocaleString();
    } catch {
        return value;
    }
}

function getStatusBadge(status) {
    const value = String(status || "").toUpperCase();

    if (value === "PENDING") return "warning";
    if (value === "ACTIVE") return "success";
    if (value === "CLOSED") return "secondary";
    if (value === "CANCELLED") return "dark";

    return "secondary";
}

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

function getCustomerDisplayName(source) {
    if (!source) return "Customer";
    return (
        source.customerName ||
        source.displayName ||
        source.fullName ||
        [source.firstName, source.lastName].filter(Boolean).join(" ").trim() ||
        (source.customerId ? `Customer #${source.customerId}` : "Customer")
    );
}

function normalizeConversation(c) {
    return {
        conversationId: c.conversationId,
        otherUserId: c.otherUserId,
        customerUserId: c.customerUserId ?? c.otherUserId ?? null,
        customerId: c.customerId ?? null,
        customerName:
            c.customerName ||
            c.displayName ||
            `Customer #${c.customerId || c.customerUserId || c.otherUserId}`,
        status: c.status,
        reason: c.reason,
        createdAt: c.createdAt,
        lastMessageAt: c.lastMessageAt,
        requestId: c.requestId ?? null
    };
}

export default function EmployeeChatWorkspace({ role = "agent" }) {
    const [requests, setRequests] = useState([]);
    const [requestsLoading, setRequestsLoading] = useState(false);

    const [conversations, setConversations] = useState([]);
    const [conversationsLoading, setConversationsLoading] = useState(false);

    const [customerConversationHistory, setCustomerConversationHistory] = useState([]);
    const [customerConversationHistoryLoading, setCustomerConversationHistoryLoading] = useState(false);

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const [selectedMessages, setSelectedMessages] = useState([]);
    const [selectedMessagesLoading, setSelectedMessagesLoading] = useState(false);

    const [customerLoading, setCustomerLoading] = useState(false);

    const navigate = useNavigate();
    const { openConversationTab, lastEvent } = useChat();

    const [requestSearch, setRequestSearch] = useState("");
    const [requestFilter, setRequestFilter] = useState(
        role === "manager" ? "all" : "pending"
    );

    const storedUser = JSON.parse(localStorage.getItem("tc_user") || "{}");
    const currentUserId = storedUser?.userId ?? storedUser?.raw?.userId ?? null;
    const isManager = role === "manager";

    useEffect(() => {
        if (!currentUserId) return;

        loadRequests();
        loadConversations();
    }, [currentUserId]);

    useEffect(() => {
        if (!conversations.length) return;

        if (selectedConversation?.conversationId) {
            const latestSelected = conversations.find(
                (c) =>
                    Number(c.conversationId) === Number(selectedConversation.conversationId)
            );

            if (latestSelected) {
                setSelectedConversation((prev) => {
                    if (!prev) return prev;

                    const prevStatus = String(prev.status || "").toUpperCase();
                    const nextStatus = String(latestSelected.status || "").toUpperCase();

                    if (
                        prevStatus !== nextStatus ||
                        prev.customerName !== latestSelected.customerName ||
                        prev.lastMessageAt !== latestSelected.lastMessageAt
                    ) {
                        return { ...prev, ...latestSelected };
                    }

                    return prev;
                });
            }
        }
    }, [conversations, selectedConversation]);

    useEffect(() => {
        if (!lastEvent) return;

        const { type, payload } = lastEvent;

        console.log("[WORKSPACE REFRESH]", type);

        if (
            type === "CHAT_REQUEST_CREATED" ||
            type === "CHAT_REQUEST_ACCEPTED" ||
            type === "CHAT_REQUEST_CLOSED"
        ) {
            loadRequests();
        }

        if (
            type === "NEW_MESSAGE" ||
            type === "CHAT_REQUEST_ACCEPTED" ||
            type === "CHAT_REQUEST_CLOSED"
        ) {
            loadConversations();
        }

        if (
            type === "NEW_MESSAGE" &&
            payload?.conversationId &&
            Number(payload.conversationId) === Number(selectedConversation?.conversationId)
        ) {
            loadMessages(payload.conversationId);
        }

        if (
            (type === "NEW_MESSAGE" ||
                type === "CHAT_REQUEST_ACCEPTED" ||
                type === "CHAT_REQUEST_CLOSED") &&
            (selectedConversation?.customerUserId || selectedConversation?.otherUserId)
        ) {
            loadCustomerConversationHistory(
                selectedConversation?.customerUserId || selectedConversation?.otherUserId
            );
        }
    }, [lastEvent, selectedConversation]);

    const loadRequests = async () => {
        setRequestsLoading(true);
        try {
            const res = await apiFetch("/api/chat/chat-requests");

            if (!res.ok) {
                console.error("Failed to load requests:", res.status);
                setRequests([]);
                return;
            }

            const data = await res.json();
            setRequests(safeArray(data));
        } catch (err) {
            console.error("Failed to load requests", err);
            setRequests([]);
        } finally {
            setRequestsLoading(false);
        }
    };

    const loadConversations = async () => {
        setConversationsLoading(true);
        try {
            const res = await apiFetch(`/api/chat/conversations?userId=${currentUserId}`);

            if (!res.ok) {
                console.error("Failed to load conversations:", res.status);
                setConversations([]);
                return;
            }

            const data = await res.json();
            setConversations(safeArray(data).map(normalizeConversation));
        } catch (err) {
            console.error("Failed to load conversations", err);
            setConversations([]);
        } finally {
            setConversationsLoading(false);
        }
    };

    const loadCustomerConversationHistory = async (customerUserId) => {
        if (!customerUserId) {
            setCustomerConversationHistory([]);
            return;
        }

        setCustomerConversationHistoryLoading(true);
        try {
            const res = await apiFetch(`/api/chat/conversations/customer/${customerUserId}`);

            if (!res.ok) {
                console.error("Failed to load customer conversation history:", res.status);
                setCustomerConversationHistory([]);
                return;
            }

            const data = await res.json();
            setCustomerConversationHistory(safeArray(data).map(normalizeConversation));
        } catch (err) {
            console.error("Failed to load customer conversation history", err);
            setCustomerConversationHistory([]);
        } finally {
            setCustomerConversationHistoryLoading(false);
        }
    };

    const loadMessages = async (conversationId) => {
        if (!conversationId) {
            setSelectedMessages([]);
            return;
        }

        setSelectedMessagesLoading(true);

        try {
            const res = await apiFetch(`/api/chat/${conversationId}/messages`);

            if (!res.ok) {
                console.error("Failed to load messages:", res.status);
                setSelectedMessages([]);
                return;
            }

            const data = await res.json();
            setSelectedMessages(safeArray(data));
        } catch (err) {
            console.error("Failed to load messages", err);
            setSelectedMessages([]);
        } finally {
            setSelectedMessagesLoading(false);
        }
    };

    const loadCustomer = async (source) => {
        const customerId =
            source?.customerId ??
            source?.customerUserId ??
            source?.otherUserId ??
            selectedRequest?.customerId ??
            null;

        if (!customerId) {
            setSelectedCustomer(null);
            return;
        }

        setCustomerLoading(true);

        try {
            const res = await apiFetch(`/api/customers/${customerId}/detail`);

            if (!res.ok) {
                console.error("Failed to load customer:", res.status);

                setSelectedCustomer({
                    customerId,
                    customerUserId:
                        source?.customerUserId ?? source?.otherUserId ?? null,
                    fullName: source?.customerName || `Customer #${customerId}`,
                    email: "—",
                    phone: "—",
                    address: "—",
                    city: "",
                    province: "",
                    postalCode: "",
                    planName: "—",
                    subscriptionStatus: "—"
                });
                return;
            }

            const data = await res.json();

            let planName = "—";
            let subscriptionStatus = "—";

            try {
                const subRes = await apiFetch("/api/manager/subscriptions");

                if (subRes.ok) {
                    const subs = await subRes.json();
                    const matchingSubscription = safeArray(subs).find(
                        (s) => Number(s.customerId) === Number(customerId)
                    );

                    if (matchingSubscription) {
                        planName =
                            matchingSubscription.planName ||
                            matchingSubscription.currentPlan ||
                            "—";

                        subscriptionStatus =
                            matchingSubscription.status ||
                            "—";
                    }
                }
            } catch (subErr) {
                console.warn("Subscription load failed", subErr);
            }

            const fullName =
                [data.firstName, data.lastName].filter(Boolean).join(" ").trim() ||
                source?.customerName ||
                `Customer #${customerId}`;

            setSelectedCustomer({
                customerId: data.customerId ?? customerId,
                customerUserId:
                    source?.customerUserId ?? source?.otherUserId ?? null,
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                fullName,
                email: data.email || "—",
                phone: data.homePhone || "—",
                homePhone: data.homePhone || "—",
                address: data.street1 || "—",
                addressLine1: data.street1 || "—",
                street1: data.street1 || "",
                street2: data.street2 || "",
                city: data.city || "",
                province: data.province || "",
                postalCode: data.postalCode || "",
                customerType: data.customerType || "",
                planName,
                subscriptionName: planName,
                subscriptionStatus,
                accountStatus: subscriptionStatus
            });
        } catch (err) {
            console.error("Failed to load customer", err);

            setSelectedCustomer({
                customerId,
                customerUserId:
                    source?.customerUserId ?? source?.otherUserId ?? null,
                fullName: source?.customerName || `Customer #${customerId}`,
                email: "—",
                phone: "—",
                address: "—",
                city: "",
                province: "",
                postalCode: "",
                planName: "—",
                subscriptionStatus: "—"
            });
        } finally {
            setCustomerLoading(false);
        }
    };

    const handleOpenProfile = (customer, conversation) => {
        const customerId =
            customer?.customerId ||
            conversation?.customerId ||
            selectedRequest?.customerId ||
            null;

        if (!customerId) return;

        if (role === "manager") {
            navigate("/manager/users");
            return;
        }

        navigate("/sales/customers");
    };

    const clearPageSelection = () => {
        setSelectedRequest(null);
        setSelectedConversation(null);
        setSelectedMessages([]);
    };

    const openConversationOnPage = (conversation) => {
        if (!conversation) return;

        setSelectedRequest(null);
        setSelectedConversation(conversation);
        loadMessages(conversation.conversationId);
        loadCustomer(conversation);
        loadCustomerConversationHistory(
            conversation.customerUserId || conversation.otherUserId || null
        );
    };

    const openConversationInChat = (conversation) => {
        if (!conversation?.conversationId) return;

        const fullConversation =
            conversations.find(
                (c) =>
                    Number(c.conversationId) === Number(conversation.conversationId)
            ) ||
            customerConversationHistory.find(
                (c) =>
                    Number(c.conversationId) === Number(conversation.conversationId)
            ) ||
            conversation;

        openConversationTab({
            conversationId: fullConversation.conversationId,
            customerName:
                fullConversation.customerName ||
                `Customer #${
                    fullConversation.customerId ||
                    fullConversation.customerUserId ||
                    fullConversation.otherUserId
                }`,
            status: fullConversation.status,
            otherUserId: fullConversation.otherUserId,
            customerUserId: fullConversation.customerUserId,
            customerId: fullConversation.customerId,
            reason: fullConversation.reason,
            createdAt: fullConversation.createdAt,
            lastMessageAt: fullConversation.lastMessageAt,
            requestId: fullConversation.requestId ?? null
        });
    };

    const handleAcceptRequest = async (req) => {
        try {
            const res = await apiFetch(
                `/api/chat/chat-requests/${req.requestId}/accept?employeeUserId=${currentUserId}`,
                { method: "POST" }
            );

            if (!res.ok) {
                console.error("Accept request failed:", res.status);
                return;
            }

            const dto = await res.json();

            const conversation = {
                conversationId: dto.conversationId,
                status: dto.status,
                customerUserId: dto.customerUserId,
                customerId: dto.customerId,
                assignedEmployeeUserId: dto.assignedEmployeeUserId,
                reason: dto.reason,
                comment: dto.comment,
                requestId: dto.requestId,
                otherUserId: dto.customerUserId,
                requestedAt: dto.requestedAt,
                acceptedAt: dto.acceptedAt,
                closedAt: dto.closedAt,
                createdAt: dto.acceptedAt || dto.requestedAt || "",
                lastMessageAt: dto.acceptedAt || dto.requestedAt || "",
                customerName:
                    dto.customerName ||
                    selectedCustomer?.fullName ||
                    selectedRequest?.customerName ||
                    `Customer #${dto.customerId || dto.customerUserId}`
            };

            setSelectedRequest((prev) => ({
                ...(prev || {}),
                ...dto,
                customerName:
                    dto.customerName ||
                    prev?.customerName ||
                    selectedCustomer?.fullName ||
                    `Customer #${dto.customerId || dto.customerUserId}`
            }));

            setSelectedConversation(conversation);
            loadCustomer(conversation);
            loadCustomerConversationHistory(dto.customerUserId);
            loadMessages(dto.conversationId);

            setConversations((prev) => {
                const exists = prev.some(
                    (c) => Number(c.conversationId) === Number(conversation.conversationId)
                );

                if (exists) return prev;

                const normalized = {
                    ...conversation,
                    customerName:
                        conversation.customerName ||
                        `Customer #${conversation.customerId || conversation.customerUserId}`
                };

                return [normalized, ...prev];
            });

            openConversationInChat(conversation);
            loadRequests();
            loadConversations();
        } catch (err) {
            console.error("Accept request failed", err);
        }
    };

    const handleCancelRequest = async (req) => {
        if (!req?.requestId) return;

        try {
            const res = await apiFetch(`/api/chat/chat-requests/${req.requestId}/cancel`, {
                method: "POST"
            });

            if (!res.ok) {
                console.error("Cancel request failed:", res.status);
                return;
            }

            setSelectedRequest((prev) =>
                prev ? { ...prev, status: "CANCELLED" } : prev
            );

            loadRequests();
            loadConversations();
        } catch (err) {
            console.error("Cancel request failed", err);
        }
    };

    const handleCloseRequest = async (req) => {
        const conversationId =
            req?.conversationId || selectedConversation?.conversationId;

        if (!conversationId) return;

        try {
            const res = await apiFetch(`/api/chat/${conversationId}/close`, {
                method: "POST"
            });

            if (!res.ok) {
                console.error("Close request failed:", res.status);
                return;
            }

            setSelectedRequest((prev) =>
                prev ? { ...prev, status: "CLOSED" } : prev
            );

            setSelectedConversation((prev) =>
                prev ? { ...prev, status: "CLOSED" } : prev
            );

            setConversations((prev) =>
                prev.map((c) =>
                    Number(c.conversationId) === Number(conversationId)
                        ? { ...c, status: "CLOSED" }
                        : c
                )
            );

            setCustomerConversationHistory((prev) =>
                prev.map((c) =>
                    Number(c.conversationId) === Number(conversationId)
                        ? { ...c, status: "CLOSED" }
                        : c
                )
            );

            loadRequests();
            loadConversations();

            if (selectedConversation?.customerUserId) {
                loadCustomerConversationHistory(selectedConversation.customerUserId);
            }
        } catch (err) {
            console.error("Close request failed", err);
        }
    };

    const customerContacts = useMemo(() => {
        const map = new Map();

        conversations.forEach((conversation) => {
            const customerKey =
                conversation.customerId ??
                conversation.customerUserId ??
                conversation.otherUserId ??
                conversation.userId ??
                null;

            if (customerKey == null) return;

            const existing = map.get(customerKey);

            const contact = {
                customerKey,
                customerId: conversation.customerId ?? null,
                customerUserId: conversation.customerUserId ?? conversation.otherUserId ?? null,
                displayName:
                    conversation.customerName ||
                    conversation.displayName ||
                    `Customer #${conversation.customerId || customerKey}`,
                hasActiveConversation:
                    String(conversation.status || "").toUpperCase() === "ACTIVE",
                lastActivity:
                    conversation.lastMessageAt ||
                    conversation.updatedAt ||
                    conversation.createdAt ||
                    null
            };

            if (!existing) {
                map.set(customerKey, contact);
            } else {
                existing.hasActiveConversation =
                    existing.hasActiveConversation || contact.hasActiveConversation;

                if (
                    contact.lastActivity &&
                    (!existing.lastActivity ||
                        new Date(contact.lastActivity) > new Date(existing.lastActivity))
                ) {
                    existing.lastActivity = contact.lastActivity;
                }
            }
        });

        return Array.from(map.values()).sort((a, b) => {
            if (!a.lastActivity && !b.lastActivity) return 0;
            if (!a.lastActivity) return 1;
            if (!b.lastActivity) return -1;
            return new Date(b.lastActivity) - new Date(a.lastActivity);
        });
    }, [conversations]);

    const selectedCustomerId =
        selectedConversation?.customerId ??
        selectedRequest?.customerId ??
        selectedCustomer?.customerId ??
        null;

    const selectedCustomerUserId =
        selectedConversation?.customerUserId ??
        selectedConversation?.otherUserId ??
        selectedRequest?.customerUserId ??
        selectedCustomer?.customerUserId ??
        null;

    const conversationsForSelectedCustomer = useMemo(() => {
        if (selectedCustomerId == null && selectedCustomerUserId == null) return [];

        return customerConversationHistory
            .filter((conversation) => {
                const conversationCustomerId = conversation.customerId ?? null;
                const conversationCustomerUserId =
                    conversation.customerUserId ?? conversation.otherUserId ?? null;

                const idMatches =
                    selectedCustomerId != null &&
                    conversationCustomerId != null &&
                    Number(conversationCustomerId) === Number(selectedCustomerId);

                const userIdMatches =
                    selectedCustomerUserId != null &&
                    conversationCustomerUserId != null &&
                    Number(conversationCustomerUserId) === Number(selectedCustomerUserId);

                return idMatches || userIdMatches;
            })
            .sort((a, b) => {
                const aDate = a.lastMessageAt || a.createdAt || "";
                const bDate = b.lastMessageAt || b.createdAt || "";
                return new Date(bDate) - new Date(aDate);
            });
    }, [customerConversationHistory, selectedCustomerId, selectedCustomerUserId]);

    const requestCustomerName = getCustomerDisplayName(
        selectedCustomer || selectedRequest || selectedConversation
    );

    const selectedRequestStatus = String(selectedRequest?.status || "").toUpperCase();
    const canAccept = selectedRequestStatus === "PENDING";
    const canCancel = selectedRequestStatus === "PENDING";
    const canOpenChat = !!selectedRequest?.conversationId;
    const canClose = selectedRequestStatus === "ACTIVE" && !!selectedRequest?.conversationId;

    return (
        <Container fluid className="py-3">
            <Row className="g-3">
                <Col lg={6}>
                    <div style={{ height: "100%" }}>
                        <EmployeeChatRequestList
                            role={role}
                            requests={requests}
                            loading={requestsLoading}
                            searchValue={requestSearch}
                            filterValue={requestFilter}
                            onSearchChange={setRequestSearch}
                            onFilterChange={setRequestFilter}
                            onSelectRequest={(req) => {
                                setSelectedCustomer(null);
                                setSelectedRequest(req);

                                if (req?.conversationId) {
                                    const matchingConversation =
                                        customerConversationHistory.find(
                                            (c) =>
                                                Number(c.conversationId) === Number(req.conversationId)
                                        ) ||
                                        conversations.find(
                                            (c) =>
                                                Number(c.conversationId) === Number(req.conversationId)
                                        ) || {
                                            conversationId: req.conversationId,
                                            status: req.status,
                                            customerUserId: req.customerUserId,
                                            customerId: req.customerId,
                                            otherUserId: req.customerUserId,
                                            reason: req.reason,
                                            comment: req.comment,
                                            requestId: req.requestId,
                                            assignedEmployeeUserId: req.assignedEmployeeUserId,
                                            requestedAt: req.requestedAt,
                                            acceptedAt: req.acceptedAt,
                                            closedAt: req.closedAt,
                                            customerName:
                                                req.customerName || `Customer #${req.customerId || req.customerUserId}`
                                        };

                                    setSelectedConversation(matchingConversation);
                                    loadMessages(matchingConversation.conversationId);
                                } else {
                                    setSelectedConversation(null);
                                    setSelectedMessages([]);
                                }

                                loadCustomer({
                                    customerId: req.customerId,
                                    customerUserId: req.customerUserId,
                                    otherUserId: req.customerUserId,
                                    customerName:
                                        req.customerName || `Customer #${req.customerId || req.customerUserId}`
                                });

                                loadCustomerConversationHistory(req.customerUserId);
                            }}
                        />
                    </div>
                </Col>

                <Col lg={6}>
                    <Card
                        className="border-0 h-100"
                        style={{
                            borderRadius: 20,
                            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)"
                        }}
                    >
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h5 className="fw-bold mb-1">Request Detail</h5>
                                    <div className="text-muted small">
                                        Review and manage the selected chat request
                                    </div>
                                </div>

                                {selectedRequest?.status && (
                                    <Badge bg={getStatusBadge(selectedRequest.status)}>
                                        {selectedRequest.status}
                                    </Badge>
                                )}
                            </div>

                            {!selectedRequest ? (
                                <div className="text-muted text-center py-5">
                                    Select a chat request to view its details.
                                </div>
                            ) : (
                                <>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <div className="small text-muted mb-1">Customer</div>
                                            <div className="fw-semibold">{requestCustomerName}</div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="small text-muted mb-1">Customer ID</div>
                                            <div className="fw-semibold">
                                                #{selectedRequest.customerId}
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="small text-muted mb-1">Requested At</div>
                                            <div className="fw-semibold">
                                                {formatDateTime(selectedRequest.requestedAt)}
                                            </div>
                                        </div>

                                        {isManager && (
                                            <>
                                                <div className="col-md-6">
                                                    <div className="small text-muted mb-1">Request ID</div>
                                                    <div className="fw-semibold">
                                                        #{selectedRequest.requestId}
                                                    </div>
                                                </div>

                                                <div className="col-md-6">
                                                    <div className="small text-muted mb-1">Accepted At</div>
                                                    <div className="fw-semibold">
                                                        {formatDateTime(selectedRequest.acceptedAt)}
                                                    </div>
                                                </div>

                                                <div className="col-md-6">
                                                    <div className="small text-muted mb-1">Assigned Employee</div>
                                                    <div className="fw-semibold">
                                                        {selectedRequest.assignedEmployeeUserId
                                                            ? `User #${selectedRequest.assignedEmployeeUserId}`
                                                            : "—"}
                                                    </div>
                                                </div>

                                                <div className="col-md-6">
                                                    <div className="small text-muted mb-1">Conversation</div>
                                                    <div className="fw-semibold">
                                                        {selectedRequest.conversationId
                                                            ? `#${selectedRequest.conversationId}`
                                                            : "Not created yet"}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {!isManager && selectedRequest.conversationId && (
                                            <div className="col-md-6">
                                                <div className="small text-muted mb-1">Conversation</div>
                                                <div className="fw-semibold">
                                                    #{selectedRequest.conversationId}
                                                </div>
                                            </div>
                                        )}

                                        <div className="col-12">
                                            <div className="small text-muted mb-1">Reason</div>
                                            <div className="fw-semibold">
                                                {selectedRequest.reason || "—"}
                                            </div>
                                        </div>

                                        <div className="col-12">
                                            <div className="small text-muted mb-2">Comment</div>
                                            <div
                                                style={{
                                                    minHeight: "90px",
                                                    maxHeight: "180px",
                                                    overflowY: "auto",
                                                    padding: "12px 14px",
                                                    borderRadius: 14,
                                                    background: "#f8fafc",
                                                    border: "1px solid #e5e7eb",
                                                    whiteSpace: "pre-wrap",
                                                    wordBreak: "break-word",
                                                    lineHeight: 1.5
                                                }}
                                            >
                                                {selectedRequest.comment || "—"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 d-flex gap-2 flex-wrap">
                                        {canAccept && (
                                            <Button
                                                variant="primary"
                                                onClick={() => handleAcceptRequest(selectedRequest)}
                                                style={{ borderRadius: 12 }}
                                            >
                                                Accept Request
                                            </Button>
                                        )}

                                        {canCancel && (
                                            <Button
                                                variant="outline-danger"
                                                onClick={() => handleCancelRequest(selectedRequest)}
                                                style={{ borderRadius: 12 }}
                                            >
                                                Cancel Request
                                            </Button>
                                        )}

                                        {canOpenChat && (
                                            <Button
                                                variant="outline-primary"
                                                onClick={() =>
                                                    openConversationInChat({
                                                        conversationId: selectedRequest.conversationId,
                                                        status: selectedRequest.status,
                                                        customerUserId: selectedRequest.customerUserId,
                                                        customerId: selectedRequest.customerId,
                                                        otherUserId: selectedRequest.customerUserId,
                                                        reason: selectedRequest.reason,
                                                        comment: selectedRequest.comment,
                                                        requestId: selectedRequest.requestId,
                                                        assignedEmployeeUserId:
                                                        selectedRequest.assignedEmployeeUserId,
                                                        requestedAt: selectedRequest.requestedAt,
                                                        acceptedAt: selectedRequest.acceptedAt,
                                                        closedAt: selectedRequest.closedAt,
                                                        customerName: requestCustomerName
                                                    })
                                                }
                                                style={{ borderRadius: 12 }}
                                            >
                                                Open in Chat Drawer
                                            </Button>
                                        )}

                                        {canClose && (
                                            <Button
                                                variant="outline-dark"
                                                onClick={() => handleCloseRequest(selectedRequest)}
                                                style={{ borderRadius: 12 }}
                                            >
                                                Close Request
                                            </Button>
                                        )}
                                    </div>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-3 mt-1">
                <Col lg={5}>
                    <Card
                        className="border-0 h-100"
                        style={{
                            borderRadius: 20,
                            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)"
                        }}
                    >
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h5 className="fw-bold mb-1">Customers / Contacts</h5>
                                    <div className="text-muted small">
                                        Customers with conversation history
                                    </div>
                                </div>

                                <Badge bg="secondary">{customerContacts.length}</Badge>
                            </div>

                            <div style={{ maxHeight: "520px", overflowY: "auto" }}>
                                {conversationsLoading ? (
                                    <div className="text-center py-4">
                                        <Spinner animation="border" />
                                    </div>
                                ) : customerContacts.length === 0 ? (
                                    <div className="text-muted text-center py-4">
                                        No customers with conversations yet.
                                    </div>
                                ) : (
                                    customerContacts.map((contact) => {
                                        const isSelected =
                                            (selectedCustomerId != null &&
                                                contact.customerId != null &&
                                                Number(contact.customerId) === Number(selectedCustomerId)) ||
                                            (selectedCustomerUserId != null &&
                                                contact.customerUserId != null &&
                                                Number(contact.customerUserId) === Number(selectedCustomerUserId));

                                        return (
                                            <div
                                                key={contact.customerKey}
                                                className="mb-2 p-3"
                                                style={{
                                                    borderRadius: 14,
                                                    cursor: "pointer",
                                                    border: isSelected
                                                        ? "2px solid #2563eb"
                                                        : "1px solid #e5e7eb",
                                                    background: isSelected ? "#eff6ff" : "#f8fafc"
                                                }}
                                                onClick={() => {
                                                    clearPageSelection();

                                                    const conversation =
                                                        conversations.find(
                                                            (c) =>
                                                                (contact.customerId != null &&
                                                                    c.customerId != null &&
                                                                    Number(c.customerId) === Number(contact.customerId)) ||
                                                                (contact.customerUserId != null &&
                                                                    (c.customerUserId != null || c.otherUserId != null) &&
                                                                    Number(c.customerUserId ?? c.otherUserId) === Number(contact.customerUserId))
                                                        ) || null;

                                                    if (conversation) {
                                                        openConversationOnPage(conversation);
                                                    } else {
                                                        setSelectedCustomer({
                                                            fullName: contact.displayName,
                                                            email: "—",
                                                            phone: "—",
                                                            address: "—",
                                                            planName: "—",
                                                            customerId: contact.customerId || null,
                                                            customerUserId: contact.customerUserId || null
                                                        });

                                                        loadCustomerConversationHistory(
                                                            contact.customerUserId || null
                                                        );
                                                    }
                                                }}
                                            >
                                                <div className="d-flex justify-content-between align-items-start gap-2">
                                                    <div>
                                                        <div className="fw-semibold">
                                                            {contact.displayName}
                                                        </div>
                                                        <div className="text-muted small">
                                                            Customer #{contact.customerId || contact.customerKey}
                                                        </div>
                                                    </div>

                                                    {contact.hasActiveConversation && (
                                                        <Badge bg="success">Active</Badge>
                                                    )}
                                                </div>

                                                <div className="text-muted small mt-2">
                                                    Last activity: {formatDateTime(contact.lastActivity)}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={7}>
                    <div className="d-flex flex-column gap-3 h-100">
                        <Card
                            className="border-0"
                            style={{
                                borderRadius: 20,
                                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)"
                            }}
                        >
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h5 className="fw-bold mb-1">Conversation List</h5>
                                        <div className="text-muted small">
                                            All conversations for the selected customer
                                        </div>
                                    </div>

                                    <Badge bg="secondary">
                                        {conversationsForSelectedCustomer.length}
                                    </Badge>
                                </div>

                                <div style={{ maxHeight: "230px", overflowY: "auto" }}>
                                    {selectedCustomerId == null && selectedCustomerUserId == null ? (
                                        <div className="text-muted text-center py-3">
                                            Select a customer or request to view conversations.
                                        </div>
                                    ) : customerConversationHistoryLoading ? (
                                        <div className="text-center py-4">
                                            <Spinner animation="border" />
                                        </div>
                                    ) : conversationsForSelectedCustomer.length === 0 ? (
                                        <div className="text-muted text-center py-3">
                                            No conversations found for this customer.
                                        </div>
                                    ) : (
                                        conversationsForSelectedCustomer.map((conversation) => {
                                            const isSelected =
                                                Number(conversation.conversationId) ===
                                                Number(selectedConversation?.conversationId);

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
                                                        background: isSelected ? "#eff6ff" : "#f8fafc"
                                                    }}
                                                    onClick={() => openConversationOnPage(conversation)}
                                                >
                                                    <div className="d-flex justify-content-between align-items-start gap-2">
                                                        <div>
                                                            <div className="fw-semibold">
                                                                Conversation #{conversation.conversationId}
                                                            </div>
                                                            <div className="text-muted small">
                                                                {conversation.reason || "No reason available"}
                                                            </div>
                                                        </div>

                                                        <Badge bg={getStatusBadge(conversation.status)}>
                                                            {conversation.status || "ACTIVE"}
                                                        </Badge>
                                                    </div>

                                                    <div className="mt-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
                                                        <div className="text-muted small">
                                                            Created: {formatDateTime(conversation.createdAt)}
                                                        </div>

                                                        <Button
                                                            size="sm"
                                                            variant="outline-primary"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openConversationInChat(conversation);
                                                            }}
                                                            style={{ borderRadius: 10 }}
                                                        >
                                                            Open in Chat Drawer
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </Card.Body>
                        </Card>

                        <Card
                            className="border-0 flex-grow-1"
                            style={{
                                borderRadius: 20,
                                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)"
                            }}
                        >
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h5 className="fw-bold mb-1">Message History</h5>
                                        <div className="text-muted small">
                                            Read-only history for the selected conversation
                                        </div>
                                    </div>

                                    {selectedConversation?.status && (
                                        <Badge bg={getStatusBadge(selectedConversation.status)}>
                                            {selectedConversation.status}
                                        </Badge>
                                    )}
                                </div>

                                <div style={{ maxHeight: "270px", overflowY: "auto" }}>
                                    {!selectedConversation ? (
                                        <div className="text-muted text-center py-4">
                                            Select a conversation to review its message history.
                                        </div>
                                    ) : selectedMessagesLoading ? (
                                        <div className="text-center py-4">
                                            <Spinner animation="border" />
                                        </div>
                                    ) : selectedMessages.length === 0 ? (
                                        <div className="text-muted text-center py-4">
                                            No messages in this conversation yet.
                                        </div>
                                    ) : (
                                        selectedMessages.map((msg, index) => {
                                            const mine =
                                                Number(msg.fromUserId) === Number(currentUserId);

                                            return (
                                                <div
                                                    key={msg.messageId || index}
                                                    className={`d-flex mb-3 ${
                                                        mine
                                                            ? "justify-content-end"
                                                            : "justify-content-start"
                                                    }`}
                                                >
                                                    <div
                                                        style={{
                                                            maxWidth: "78%",
                                                            padding: "10px 12px",
                                                            borderRadius: 14,
                                                            background: mine ? "#dbeafe" : "#f1f5f9",
                                                            color: "#0f172a",
                                                            wordBreak: "break-word"
                                                        }}
                                                    >
                                                        <div
                                                            className="small text-muted mb-1"
                                                            style={{ fontSize: "0.75rem" }}
                                                        >
                                                            {mine ? "You" : `User #${msg.fromUserId}`}
                                                        </div>

                                                        <div>{msg.messageText}</div>

                                                        <div
                                                            className="small text-muted mt-1"
                                                            style={{ fontSize: "0.72rem" }}
                                                        >
                                                            {formatDateTime(msg.sentAt)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                </Col>
            </Row>

            <Row className="g-3 mt-1" style={{ paddingBottom: "150px" }}>
                <Col lg={12}>
                    <EmployeeCustomerInfoPanel
                        customer={selectedCustomer}
                        conversation={selectedConversation}
                        loading={customerLoading}
                        onOpenProfile={handleOpenProfile}
                    />
                </Col>
            </Row>
        </Container>
    );
}