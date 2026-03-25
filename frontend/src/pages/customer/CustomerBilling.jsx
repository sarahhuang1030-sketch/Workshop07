import React, { useState, useEffect } from "react";
import { Container, Card, Table, Spinner, Alert, Button } from "react-bootstrap";
import { FileText } from "lucide-react";
import { apiFetch } from "../../services/api";

// Utility function: format number as CAD currency
const formatMoney = (n) =>
    n == null || Number.isNaN(Number(n))
        ? "—"
        : Number(n).toLocaleString(undefined, { style: "currency", currency: "CAD" });

// CustomerBilling component: full invoice details on same page
export default function CustomerBilling({ darkMode = false }) {
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadInvoice() {
            try {
                const res = await apiFetch("/api/invoices/latest");
                if (!res.ok) throw new Error(`Failed to fetch invoice: ${res.status}`);
                const data = await res.json();
                if (isMounted) setInvoice(data);
            } catch (err) {
                if (isMounted) setError(err.message || "Error loading invoice");
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadInvoice();
        return () => {
            isMounted = false;
        };
    }, []);

    if (loading)
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" />
                <div className={`mt-2 ${darkMode ? "text-light-50 text-secondary" : "text-muted"}`}>
                    Loading invoice…
                </div>
            </Container>
        );

    if (error)
        return (
            <Container className="py-5">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );

    if (!invoice || !invoice.items?.length)
        return (
            <Container className="py-5 text-center">
                <Alert variant="info">You have no invoices yet. Please subscribe to a plan first.</Alert>
                <Button variant="primary" onClick={() => (window.location.href = "/plans")}>
                    Subscribe Now
                </Button>
            </Container>
        );

    return (
        <Container className="py-5">
            <h2>Billing</h2>
            <p>View your latest invoice, including plan and add-ons details.</p>

            <Card className={`${darkMode ? "bg-dark text-light" : "bg-white"} mt-3`} style={{ borderRadius: 18 }}>
                <Card.Body>
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <FileText size={18} />
                        <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>
                            Invoice #{invoice.invoiceNumber}
                        </div>
                    </div>

                    <div>Status: {invoice.status}</div>
                    <div>Issue Date: {invoice.issueDate}</div>
                    <div>Due Date: {invoice.dueDate}</div>
                    <hr />

                    {/* Invoice Items Table */}
                    <Table striped bordered hover responsive className={darkMode ? "table-dark" : ""}>
                        <thead>
                        <tr>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Discount</th>
                            <th>Line Total</th>
                        </tr>
                        </thead>
                        <tbody>
                        {invoice.items.map((item, idx) => (
                            <tr key={idx}>
                                <td>{item.description}</td>
                                <td>{item.quantity}</td>
                                <td>{formatMoney(item.unitPrice)}</td>
                                <td>{formatMoney(item.discountAmount)}</td>
                                <td>{formatMoney(item.lineTotal)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>

                    {/* Totals */}
                    <hr />
                    <div>
                        <strong>Subtotal:</strong> {formatMoney(invoice.subtotal)}
                    </div>
                    <div>
                        <strong>Tax:</strong> {formatMoney(invoice.taxTotal)}
                    </div>
                    <div>
                        <strong>Total:</strong> {formatMoney(invoice.total)}
                    </div>

                    {/* Payment Method */}
                    <div className="mt-2">
                        <strong>Paid With:</strong>{" "}
                        {invoice.paidByAccount
                            ? `${invoice.paidByAccount.method} ••••${invoice.paidByAccount.last4}`
                            : "Temporary Card"}
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
}