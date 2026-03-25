import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Spinner } from "react-bootstrap";
import { Users, FileText, Clock, CreditCard, ArrowRight, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";

/* ===== Reusable Stat Card Component ===== */
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
                                style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(0,0,0,0.05)" }}
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

/* ===== Reusable Management Card Component ===== */
function ManageCard({ title, desc, icon: Icon, to, onGo }) {
    return (
        <Card className="shadow-sm h-100 border-0" style={{ borderRadius: 16 }}>
            <Card.Body className="d-flex flex-column p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex gap-3 align-items-center">
                        {Icon && (
                            <div
                                className="d-flex align-items-center justify-content-center"
                                style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(0,0,0,0.05)" }}
                            >
                                <Icon size={22} />
                            </div>
                        )}
                        <div>
                            <div className="fw-bold">{title}</div>
                            <div className="text-muted small">{desc}</div>
                        </div>
                    </div>
                </div>

                <Button
                    className="mt-auto w-100 d-flex justify-content-center align-items-center gap-2"
                    onClick={() => onGo(to)}
                    style={{ borderRadius: 12 }}
                >
                    Open <ArrowRight size={16} />
                </Button>
            </Card.Body>
        </Card>
    );
}

/* ===== Main Sales Dashboard Component ===== */
export default function SalesDashboard() {
    const nav = useNavigate();
    const go = (to) => nav(to);

    // Dashboard summary state
    const [summary, setSummary] = useState({
        customers: null,
        invoices: null,
        pendingQuotes: null,
        revenue: null,          // Total revenue (closed deals)
        monthlyRevenue: null,   // Monthly revenue, calculated
    });

    // ================= Load Dashboard Summary =================
    useEffect(() => {
        async function loadSummary() {
            try {
                // --- Fetch all customers ---
                const custRes = await apiFetch("/api/customers/all");
                const custData = await custRes.json();
                const customersArray = Array.isArray(custData) ? custData : custData.customers ?? [];

                // --- Fetch all quotes ---
                const quotesRes = await apiFetch("/api/quotes");
                const quotesData = await quotesRes.json();
                const quotesArray = Array.isArray(quotesData) ? quotesData : quotesData.quotes ?? [];

                // --- Fetch all invoices ---
                const invoicesRes = await apiFetch("/api/invoices/all");
                const invoicesData = await invoicesRes.json();
                const invoicesArray = Array.isArray(invoicesData) ? invoicesData : invoicesData.invoices ?? [];

                // --- Calculate Monthly Revenue ---
                // Only sum invoices marked as "PAID" or "ACTIVE" for current month
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                const monthlyRevenue = invoicesArray
                    .filter(inv => {
                        const invDate = new Date(inv.date); // Assuming `date` field exists
                        return (
                            inv.status === "PAID" &&
                            invDate.getMonth() === currentMonth &&
                            invDate.getFullYear() === currentYear
                        );
                    })
                    .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

                // --- Update state ---
                setSummary({
                    customers: customersArray.length,
                    invoices: invoicesArray.length,
                    pendingQuotes: quotesArray.filter(q => q.status === "PENDING").length,
                    revenue: invoicesArray.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0), // total revenue
                    monthlyRevenue,
                });

            } catch (e) {
                console.error("Failed to load dashboard summary", e);
                // Fallback values
                setSummary({
                    customers: 0,
                    invoices: 0,
                    pendingQuotes: 0,
                    revenue: 0,
                    monthlyRevenue: 0,
                });
            }
        }

        loadSummary();
    }, []);

    // ================= Render Dashboard =================
    return (
        <Container className="py-4">
            {/* Header */}
            <div className="mb-4">
                <h2 className="fw-bold">Sales Dashboard</h2>
                <p className="text-muted mb-0">Overview of customers, invoices, and pending quotes.</p>
            </div>

            {/* Stats Row */}
            <Row className="g-3">
                <Col md={3}>
                    <Stat title="Customers" value={summary.customers} hint="Assigned to you" icon={Users}>
                        <Button size="sm" onClick={() => go("/sales/customers")}>View</Button>
                    </Stat>
                </Col>
                <Col md={3}>
                    <Stat title="Invoices" value={summary.invoices} hint="All billing invoices" icon={FileText}>
                        <Button size="sm" onClick={() => go("/sales/history")}>View</Button>
                    </Stat>
                </Col>
                <Col md={3}>
                    <Stat title="Pending Quotes" value={summary.pendingQuotes} hint="Awaiting approval" icon={Clock}>
                        <Button size="sm" onClick={() => go("/sales/quotes")}>Details</Button>
                    </Stat>
                </Col>
                <Col md={3}>
                    <Stat
                        title="Revenue (All Time)"
                        value={summary.revenue ? `$${summary.revenue.toLocaleString()}` : null}
                        hint="Total closed deals"
                        icon={CreditCard}
                    />
                </Col>
                <Col md={3}>
                    <Stat
                        title="Monthly Revenue"
                        value={summary.monthlyRevenue ? `$${summary.monthlyRevenue.toLocaleString()}` : null}
                        hint="Current month only"
                        icon={Package}
                    />
                </Col>
            </Row>

            {/* Management Cards */}
            <Row className="g-3 mt-3">
                <Col md={6} lg={4}>
                    <ManageCard title="Unpaid Billing" desc="Transaction and payment history." icon={FileText} to="/sales/history" onGo={go} />
                </Col>
                <Col md={6} lg={4}>
                    <ManageCard title="Quotes & Deals" desc="Create quotes and convert to sales." icon={FileText} to="/sales/quotes" onGo={go} />
                </Col>
                <Col md={6} lg={4}>
                    <ManageCard title="Follow-ups" desc="Track leads and reminders." icon={Clock} to="/sales/followups" onGo={go} />
                </Col>
            </Row>
        </Container>
    );
}