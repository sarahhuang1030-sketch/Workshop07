import React, { useEffect, useMemo, useState } from "react";
import {
    Card,
    Row,
    Col,
    Form,
    Button,
    Table,
    Spinner,
    Badge,
} from "react-bootstrap";
import { RefreshCw, Search, Eye } from "lucide-react";
import { apiFetch } from "../../services/api";

export default function AuditPage({ darkMode = false }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [selectedModule, setSelectedModule] = useState("ALL");
    const [selectedAction, setSelectedAction] = useState("ALL");

    async function fetchAuditLogs(isRefresh = false) {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const res = await apiFetch("/api/manager/audit");

            if (!res.ok) {
                throw new Error(`Failed to load audit logs (${res.status})`);
            }

            const data = await res.json();
            setLogs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Audit log fetch error:", err);
            setError(err.message || "Failed to load audit logs.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        fetchAuditLogs();
    }, []);

    const modules = useMemo(() => {
        const uniqueModules = [...new Set(logs.map((log) => log.module).filter(Boolean))];
        return ["ALL", ...uniqueModules];
    }, [logs]);

    const actions = useMemo(() => {
        const uniqueActions = [...new Set(logs.map((log) => log.action).filter(Boolean))];
        return ["ALL", ...uniqueActions];
    }, [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            const keyword = search.trim().toLowerCase();

            const matchesSearch =
                !keyword ||
                (log.target || "").toLowerCase().includes(keyword) ||
                (log.doneBy || "").toLowerCase().includes(keyword) ||
                (log.module || "").toLowerCase().includes(keyword) ||
                (log.action || "").toLowerCase().includes(keyword);

            const matchesModule =
                selectedModule === "ALL" || log.module === selectedModule;

            const matchesAction =
                selectedAction === "ALL" || log.action === selectedAction;

            return matchesSearch && matchesModule && matchesAction;
        });
    }, [logs, search, selectedModule, selectedAction]);

    function formatDateTime(dateValue) {
        if (!dateValue) return "-";
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return dateValue;
        return date.toLocaleString();
    }

    function getActionBadge(action) {
        const value = (action || "").toLowerCase();

        if (value.includes("login")) return "primary";
        if (value.includes("create")) return "success";
        if (value.includes("update")) return "warning";
        if (value.includes("delete")) return "danger";
        return "secondary";
    }

    const pageClass = darkMode
        ? "bg-dark text-light border-secondary"
        : "bg-white text-dark";

    const inputClass = darkMode
        ? "bg-dark text-light border-secondary"
        : "";

    return (
        <div className="container py-4">
            <Card className={`shadow-sm ${pageClass}`}>
                <Card.Body>
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mb-4 gap-3">
                        <div>
                            <h3 className="mb-1">Audit Logs</h3>
                            <div className={darkMode ? "text-light-50" : "text-muted"}>
                                Track important system activity across TeleConnect
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            onClick={() => fetchAuditLogs(true)}
                            disabled={refreshing}
                            className="d-inline-flex align-items-center gap-2"
                        >
                            <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
                            {refreshing ? "Refreshing..." : "Refresh"}
                        </Button>
                    </div>

                    <Row className="g-3 mb-4">
                        <Col md={5}>
                            <div className="position-relative">
                                <Search
                                    size={16}
                                    className="position-absolute top-50 translate-middle-y ms-3 text-muted"
                                />
                                <Form.Control
                                    className={`ps-5 ${inputClass}`}
                                    type="text"
                                    placeholder="Search by target, user, module, or action"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </Col>

                        <Col md={3}>
                            <Form.Select
                                className={inputClass}
                                value={selectedModule}
                                onChange={(e) => setSelectedModule(e.target.value)}
                            >
                                {modules.map((module) => (
                                    <option key={module} value={module}>
                                        {module === "ALL" ? "Module - All" : module}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>

                        <Col md={3}>
                            <Form.Select
                                className={inputClass}
                                value={selectedAction}
                                onChange={(e) => setSelectedAction(e.target.value)}
                            >
                                {actions.map((action) => (
                                    <option key={action} value={action}>
                                        {action === "ALL" ? "Action - All" : action}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>

                        <Col md={1} className="d-grid">
                            <Button
                                variant="outline-secondary"
                                onClick={() => {
                                    setSearch("");
                                    setSelectedModule("ALL");
                                    setSelectedAction("ALL");
                                }}
                            >
                                Clear
                            </Button>
                        </Col>
                    </Row>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                            <div className="mt-3">Loading audit logs...</div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-4 text-danger">
                            <p className="mb-3">{error}</p>
                            <Button variant="primary" onClick={() => fetchAuditLogs()}>
                                Try Again
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className={darkMode ? "text-light-50" : "text-muted"}>
                                    Showing {filteredLogs.length} of {logs.length} logs
                                </div>
                            </div>

                            <div className="table-responsive">
                                <Table
                                    hover
                                    bordered
                                    className={`align-middle mb-0 ${darkMode ? "table-dark" : ""}`}
                                >
                                    <thead>
                                    <tr>
                                        <th>Target</th>
                                        <th>Module</th>
                                        <th>Action</th>
                                        <th>Done By</th>
                                        <th>Date & Time</th>
                                        <th>View</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-4">
                                                No audit logs found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLogs.map((log) => (
                                            <tr key={log.id}>
                                                <td>{log.target || "-"}</td>
                                                <td>{log.module || "-"}</td>
                                                <td>
                                                    <Badge bg={getActionBadge(log.action)}>
                                                        {log.action || "-"}
                                                    </Badge>
                                                </td>
                                                <td>{log.doneBy || "-"}</td>
                                                <td>{formatDateTime(log.timestamp)}</td>
                                                <td>
                                                    <Button
                                                        size="sm"
                                                        variant="outline-primary"
                                                        title="View details"
                                                    >
                                                        <Eye size={16} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    </tbody>
                                </Table>
                            </div>
                        </>
                    )}
                </Card.Body>
            </Card>

            <style>
                {`
          .spin-icon {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
            </style>
        </div>
    );
}