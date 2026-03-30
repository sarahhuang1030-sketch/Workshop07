import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Spinner } from "react-bootstrap";
import { Users, FileText, Clock, Package, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";

/* =========================
   Reusable Stat Card
========================= */
function Stat({ title, value, hint, icon: Icon, children }) {
    return (
        <Card className="shadow-sm h-100 border-0" style={{ borderRadius: 16 }}>
            <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                    <div>
                        <div className="text-muted fw-semibold">{title}</div>
                        <div className="fw-bold fs-4">
                            {value ?? <Spinner animation="border" size="sm" />}
                        </div>
                        {hint && <div className="text-muted small">{hint}</div>}
                    </div>

                    <div className="d-flex flex-column align-items-end gap-2">
                        {Icon && (
                            <div
                                className="d-flex align-items-center justify-content-center"
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    background: "rgba(0,0,0,0.05)"
                                }}
                            >
                                <Icon size={22} />
                            </div>
                        )}
                        {children}
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}

/* =========================
   Safe Date Parser
   Handles multiple backend formats
========================= */
function parseDateSafe(dateStr) {
    if (!dateStr) return null;

    // Normalize date formats like "2026-03-29 10:00:00"
    const normalized = String(dateStr).replace(" ", "T");

    const date = new Date(normalized);
    return isNaN(date.getTime()) ? null : date;
}

/* =========================
   Normalize payment status
========================= */
function isPaidStatus(status) {
    const s = String(status || "").trim().toUpperCase();

    // Accept multiple backend variations
    return [
        "PAID",
        "COMPLETED",
        "SUCCESS",
        "SETTLED",
        "DONE",
        "FINISHED"
    ].includes(s);
}

/* =========================
   Main Dashboard
========================= */
export default function SalesDashboard() {
    const nav = useNavigate();
    const go = (to) => nav(to);

    const [summary, setSummary] = useState({
        customers: null,
        invoices: null,
        pendingQuotes: null,
        monthlyRevenue: null,
    });

    useEffect(() => {
        async function loadSummary() {
            try {
                /* =========================
                   Load Customers
                ========================= */
                const custRes = await apiFetch("/api/customers/all");
                const custData = await custRes.json();
                const customersArray = Array.isArray(custData)
                    ? custData
                    : custData.customers ?? [];

                /* =========================
                   Load Quotes
                ========================= */
                const quotesRes = await apiFetch("/api/quotes");
                const quotesData = await quotesRes.json();
                const quotesArray = Array.isArray(quotesData)
                    ? quotesData
                    : quotesData.quotes ?? [];

                /* =========================
                   Load Invoices
                ========================= */
                const invoicesRes = await apiFetch("/api/invoices/all");
                const invoicesData = await invoicesRes.json();

                const invoicesArray = Array.isArray(invoicesData)
                    ? invoicesData
                    : [];

                console.log("INVOICES SAMPLE:", invoicesArray[0]);

                /* =========================
                   Time reference
                ========================= */
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                /* =========================
                   Calculate Monthly Revenue
                ========================= */
                const monthlyRevenue = invoicesArray
                    .filter(inv => {
                        const date = parseDateSafe(inv.issueDate);
                        if (!date) return false;

                        const paid = isPaidStatus(inv.status);

                        const sameMonth =
                            date.getMonth() === currentMonth &&
                            date.getFullYear() === currentYear;

                        return paid && sameMonth;
                    })
                    .reduce((sum, inv) => {
                        // Remove currency symbols safely
                        const amount = Number(
                            String(inv.total || 0).replace(/[^0-9.-]/g, "")
                        );

                        return sum + (isNaN(amount) ? 0 : amount);
                    }, 0);

                /* =========================
                   Update UI State
                ========================= */
                setSummary({
                    customers: customersArray.length,
                    invoices: invoicesArray.length,
                    pendingQuotes: quotesArray.filter(q => q.status === "PENDING").length,
                    monthlyRevenue,
                });

            } catch (err) {
                console.error("Dashboard load failed:", err);

                setSummary({
                    customers: 0,
                    invoices: 0,
                    pendingQuotes: 0,
                    monthlyRevenue: 0,
                });
            }
        }

        loadSummary();
    }, []);

    return (
        <Container className="py-4">

            {/* Header */}
            <div className="mb-4">
                <h2 className="fw-bold">Sales Dashboard</h2>
                <p className="text-muted mb-0">
                    Overview of customers, invoices, and pending quotes.
                </p>
            </div>

            {/* Stats */}
            <Row className="g-3">
                <Col md={3}>
                    <Stat title="Customers" value={summary.customers} icon={Users}>
                        <Button size="sm" onClick={() => go("/sales/customers")}>
                            View
                        </Button>
                    </Stat>
                </Col>

                <Col md={3}>
                    <Stat title="Invoices" value={summary.invoices} icon={FileText}>
                        <Button size="sm" onClick={() => go("/sales/history")}>
                            View
                        </Button>
                    </Stat>
                </Col>

                <Col md={3}>
                    <Stat title="Pending Quotes" value={summary.pendingQuotes} icon={Clock}>
                        <Button size="sm" onClick={() => go("/sales/quotes")}>
                            Details
                        </Button>
                    </Stat>
                </Col>

                <Col md={3}>
                    <Stat
                        title="Monthly Revenue"
                        value={
                            summary.monthlyRevenue != null
                                ? `$${summary.monthlyRevenue.toLocaleString()}`
                                : <Spinner animation="border" size="sm" />
                        }
                        icon={Package}
                        hint="Paid invoices only"
                    />
                </Col>
            </Row>

            {/* Navigation */}
            <Row className="g-3 mt-3">
                <Col md={6} lg={4}>
                    <Card className="shadow-sm border-0" style={{ borderRadius: 16 }}>
                        <Card.Body className="p-4">
                            <div className="fw-bold">Invoices</div>
                            <div className="text-muted small mb-3">
                                Manage billing history
                            </div>
                            <Button onClick={() => go("/sales/history")}>
                                Open
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} lg={4}>
                    <Card className="shadow-sm border-0" style={{ borderRadius: 16 }}>
                        <Card.Body className="p-4">
                            <div className="fw-bold">Quotes</div>
                            <div className="text-muted small mb-3">
                                Create and manage quotes
                            </div>
                            <Button onClick={() => go("/sales/quotes")}>
                                Open
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} lg={4}>
                    <Card className="shadow-sm border-0" style={{ borderRadius: 16 }}>
                        <Card.Body className="p-4">
                            <div className="fw-bold">Follow-ups</div>
                            <div className="text-muted small mb-3">
                                Track customer activity
                            </div>
                            <Button onClick={() => go("/sales/followups")}>
                                Open
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

        </Container>
    );
}