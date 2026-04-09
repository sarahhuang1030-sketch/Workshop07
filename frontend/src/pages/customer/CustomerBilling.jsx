import React, { useState, useEffect } from "react";
import { Container, Card, Table, Spinner, Alert, Button } from "react-bootstrap";
import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";

/* =========================
   FORMAT MONEY (CAD)
========================= */
const formatMoney = (n) =>
    n == null || Number.isNaN(Number(n))
        ? "—"
        : Number(n).toLocaleString(undefined, {
            style: "currency",
            currency: "CAD",
        });

/* =========================
   CUSTOMER BILLING
========================= */
export default function CustomerBilling({ darkMode = false }) {
    const nav = useNavigate();

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadInvoice() {
            try {
                const res = await apiFetch("/api/invoices/latest");
                if (!res.ok) throw new Error(`Failed: ${res.status}`);

                const data = await res.json();
                if (isMounted) setInvoice(data);

            } catch (err) {
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadInvoice();
        return () => (isMounted = false);
    }, []);

    /* =========================
       LOADING / ERROR STATES
    ========================= */
    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner />
                <div className="mt-2 text-muted">Loading invoice…</div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    if (!invoice || !invoice.items?.length) {
        return (
            <Container className="py-5 text-center">
                <Alert variant="info">No invoices yet.</Alert>
                <Button onClick={() => nav("/plans")}>Subscribe Now</Button>
            </Container>
        );
    }

    /* =========================
       MAIN UI
    ========================= */
    return (
        <Container className="py-5">

            {/* HEADER + BUTTON */}
            <div className="d-flex justify-content-between align-items-center">
                <div>
                    <h2>Billing</h2>
                    <p className="text-muted">Your latest invoice details</p>
                </div>

                <Button
                    variant={darkMode ? "outline-light" : "outline-primary"}
                    onClick={() => nav("/customer/billing/history")}
                >
                    View All Invoices
                </Button>
            </div>

            <Card className={`${darkMode ? "bg-dark text-light" : ""}`} style={{ borderRadius: 18 }}>
                <Card.Body>

                    {/* HEADER */}
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <FileText size={18} />
                        <strong>Invoice #{invoice.invoiceNumber}</strong>
                    </div>

                    <div>
                        <strong>Customer:</strong>{" "}
                        {invoice.customerName || "N/A"}
                    </div>

                    <div>Status: {invoice.status}</div>
                    <div>Issue Date: {invoice.issueDate}</div>
                    <div>Due Date: {invoice.dueDate}</div>

                    <hr />

                    {/* ITEMS */}
                    <Table bordered hover responsive className={darkMode ? "table-dark" : ""}>
                        <thead>
                        <tr>
                            <th>Item Type</th>
                            <th>Service Type</th>
                            <th>Details</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Discount</th>
                            <th>Total</th>
                        </tr>
                        </thead>

                        <tbody>
                        {invoice.items.map((item, i) => (
                            <tr key={i}>
                                <td className="text-capitalize">{item.itemType || "—"}</td>
                                <td className="text-capitalize">{item.serviceType || "—"}</td>
                                <td>{item.description}</td>
                                <td>{item.quantity}</td>
                                <td>{formatMoney(item.unitPrice)}</td>
                                <td>{formatMoney(item.discountAmount)}</td>
                                <td>{formatMoney(item.lineTotal)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>

                    <hr />

                    {/* TOTALS */}
                    <div><strong>Subtotal:</strong> {formatMoney(invoice.subtotal)}</div>
                    <div><strong>Tax:</strong> {formatMoney(invoice.taxTotal)}</div>
                    <div><strong>Total:</strong> {formatMoney(invoice.total)}</div>

                </Card.Body>
            </Card>
        </Container>
    );
}