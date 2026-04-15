import React, { useEffect, useMemo, useState } from "react";
import {
    Card, Row, Col, Form, Button,
    Table, Spinner, Badge, Pagination,
} from "react-bootstrap";
import { RefreshCw, Search, Eye } from "lucide-react";
import { apiFetch } from "../../services/api";

export default function AuditPage({ darkMode = false }) {
    const [logs, setLogs]         = useState([]);
    const [loading, setLoading]   = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError]       = useState("");

    const [search, setSearch]               = useState("");
    const [selectedModule, setSelectedModule] = useState("ALL");
    const [selectedAction, setSelectedAction] = useState("ALL");

    const PAGE_SIZE = 20;
    const [currentPage, setCurrentPage] = useState(1);

    async function fetchAuditLogs(isRefresh = false) {
        try {
            isRefresh ? setRefreshing(true) : setLoading(true);
            setError("");
            const res = await apiFetch("/api/manager/audit");
            if (!res.ok) throw new Error(`Failed to load audit logs (${res.status})`);
            const data = await res.json();
            setLogs(Array.isArray(data) ? data : []);
            setCurrentPage(1);
        } catch (err) {
            console.error("Audit log fetch error:", err);
            setError(err.message || "Failed to load audit logs.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => { fetchAuditLogs(); }, []);

    const modules = useMemo(() => {
        const u = [...new Set(logs.map(l => l.module).filter(Boolean))];
        return ["ALL", ...u];
    }, [logs]);

    const actions = useMemo(() => {
        const u = [...new Set(logs.map(l => l.action).filter(Boolean))];
        return ["ALL", ...u];
    }, [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const kw = search.trim().toLowerCase();
            const matchesSearch =
                !kw ||
                (log.target  || "").toLowerCase().includes(kw) ||
                (log.doneBy  || "").toLowerCase().includes(kw) ||
                (log.module  || "").toLowerCase().includes(kw) ||
                (log.action  || "").toLowerCase().includes(kw);
            return (
                matchesSearch &&
                (selectedModule === "ALL" || log.module === selectedModule) &&
                (selectedAction === "ALL" || log.action === selectedAction)
            );
        });
    }, [logs, search, selectedModule, selectedAction]);

    useEffect(() => { setCurrentPage(1); }, [search, selectedModule, selectedAction]);

    const totalPages    = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
    const paginatedLogs = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredLogs.slice(start, start + PAGE_SIZE);
    }, [filteredLogs, currentPage]);

    function formatDateTime(v) {
        if (!v) return "-";
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? v : d.toLocaleString();
    }

    function getActionBadge(action) {
        const v = (action || "").toLowerCase();
        if (v.includes("login"))  return "primary";
        if (v.includes("create")) return "success";
        if (v.includes("update")) return "warning";
        if (v.includes("delete")) return "danger";
        return "secondary";
    }

    function goToPage(page) {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    }

    const pageClass  = darkMode ? "bg-dark text-light border-secondary" : "bg-white text-dark";
    const inputClass = darkMode ? "bg-dark text-light border-secondary" : "";
    const startEntry = filteredLogs.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const endEntry   = Math.min(currentPage * PAGE_SIZE, filteredLogs.length);

    return (
        <div className="container-fluid container-lg py-4">
            <Card className={`shadow-sm ${pageClass}`}>
                <Card.Body>

                    {/* ── Header ── */}
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mb-4 gap-3">
                        <div>
                            <h3 className="mb-1">Audit Logs</h3>
                            <div className={darkMode ? "text-light-50" : "text-muted"}>
                                Track important system activity
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            onClick={() => fetchAuditLogs(true)}
                            disabled={refreshing}
                            className="d-inline-flex align-items-center gap-2 align-self-start align-self-lg-center"
                        >
                            <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
                            {refreshing ? "Refreshing..." : "Refresh"}
                        </Button>
                    </div>

                    {/* ── Filters ── */}
                    <Row className="g-2 mb-4">
                        {/* Search — full width on xs, 12 col on sm, 5 on md */}
                        <Col xs={12} md={5}>
                            <div className="position-relative">
                                <Search size={15} className="position-absolute top-50 translate-middle-y ms-3 text-muted" />
                                <Form.Control
                                    className={`ps-5 ${inputClass}`}
                                    type="text"
                                    placeholder="Search by target, user, module or action"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </Col>
                        <Col xs={6} sm={5} md={3}>
                            <Form.Select className={inputClass} value={selectedModule} onChange={e => setSelectedModule(e.target.value)}>
                                {modules.map(m => (
                                    <option key={m} value={m}>{m === "ALL" ? "Module – All" : m}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col xs={6} sm={5} md={3}>
                            <Form.Select className={inputClass} value={selectedAction} onChange={e => setSelectedAction(e.target.value)}>
                                {actions.map(a => (
                                    <option key={a} value={a}>{a === "ALL" ? "Action – All" : a}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col xs={12} sm={2} md={1} className="d-grid">
                            <Button variant="outline-secondary" onClick={() => { setSearch(""); setSelectedModule("ALL"); setSelectedAction("ALL"); setCurrentPage(1); }}>
                                Clear
                            </Button>
                        </Col>
                    </Row>

                    {/* ── Body ── */}
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                            <div className="mt-3">Loading audit logs…</div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-4 text-danger">
                            <p className="mb-3">{error}</p>
                            <Button variant="primary" onClick={() => fetchAuditLogs()}>Try Again</Button>
                        </div>
                    ) : (
                        <>
                            {/* Count row */}
                            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                <div className={darkMode ? "text-light-50" : "text-muted"} style={{ fontSize: "0.85rem" }}>
                                    Showing {startEntry}–{endEntry} of {filteredLogs.length} logs
                                </div>
                                <div className={darkMode ? "text-light-50" : "text-muted"} style={{ fontSize: "0.85rem" }}>
                                    Page {currentPage} of {totalPages}
                                </div>
                            </div>

                            {/* Table — scrollable on small screens */}
                            <div className="table-responsive" style={{ WebkitOverflowScrolling: "touch" }}>
                                <Table hover bordered className={`align-middle mb-0 ${darkMode ? "table-dark" : ""}`} style={{ minWidth: 480 }}>
                                    <thead>
                                    <tr>
                                        <th>Module</th>
                                        <th>Action</th>
                                        {/* 小屏隐藏 Done By */}
                                        <th className="d-none d-sm-table-cell">Done By</th>
                                        <th>Date &amp; Time</th>
                                        <th style={{ width: 56 }}>View</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {paginatedLogs.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-4">No audit logs found.</td></tr>
                                    ) : paginatedLogs.map(log => (
                                        <tr key={log.id}>
                                            <td style={{ whiteSpace: "nowrap" }}>{log.module || "-"}</td>
                                            <td>
                                                <Badge bg={getActionBadge(log.action)}>{log.action || "-"}</Badge>
                                            </td>
                                            <td className="d-none d-sm-table-cell">{log.doneBy || "-"}</td>
                                            <td style={{ whiteSpace: "nowrap", fontSize: "0.85rem" }}>
                                                {formatDateTime(log.timestamp)}
                                            </td>
                                            <td>
                                                <Button size="sm" variant="outline-primary" title="View details">
                                                    <Eye size={15} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            </div>

                            {/* Pagination — 小屏用 size="sm" 并居中 flex-wrap */}
                            {filteredLogs.length > PAGE_SIZE && (
                                <div className="d-flex justify-content-center mt-4" style={{ overflowX: "auto" }}>
                                    <Pagination size="sm" className="mb-0 flex-wrap justify-content-center">
                                        <Pagination.First onClick={() => goToPage(1)} disabled={currentPage === 1} />
                                        <Pagination.Prev  onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} />

                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter(page =>
                                                page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                                            )
                                            .map((page, index, arr) => {
                                                const showEllipsis = index > 0 && page - arr[index - 1] > 1;
                                                return (
                                                    <React.Fragment key={page}>
                                                        {showEllipsis && <Pagination.Ellipsis disabled />}
                                                        <Pagination.Item active={page === currentPage} onClick={() => goToPage(page)}>
                                                            {page}
                                                        </Pagination.Item>
                                                    </React.Fragment>
                                                );
                                            })}

                                        <Pagination.Next onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} />
                                        <Pagination.Last onClick={() => goToPage(totalPages)}      disabled={currentPage === totalPages} />
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
                </Card.Body>
            </Card>

            <style>{`
                .spin-icon { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}