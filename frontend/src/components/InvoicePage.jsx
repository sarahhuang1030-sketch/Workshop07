import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Table, Spinner, Alert, Button } from "react-bootstrap";
import { apiFetch } from "../services/api";

const formatMoney = (n) =>
    n == null || Number.isNaN(Number(n))
        ? "—"
        : Number(n).toLocaleString(undefined, { style: "currency", currency: "CAD" });

export default function InvoicePage({ invoiceNumber, darkMode = false }) {
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadInvoice() {
            try {
                const res = await apiFetch(`/api/invoices/${invoiceNumber}`);
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
        return () => { isMounted = false; };
    }, [invoiceNumber]);

    if (loading) return (
        <Container className="py-5 text-center">
            <Spinner animation="border" />
            <div className={`mt-2 ${darkMode ? "text-light-50 text-secondary" : "text-muted"}`}>
                Loading invoice…
            </div>
        </Container>
    );

    if (error) return (
        <Container className="py-5">
            <Alert variant="danger">{error}</Alert>
        </Container>
    );

    if (!invoice) return null;

    return (
        <Container className="py-5">
            <Button variant="secondary" className="mb-3" onClick={() => navigate(-1)}>
                ← Back
            </Button>

            <Card className={darkMode ? "bg-dark text-light" : "bg-white"}>
                <Card.Body>
                    <h3>Invoice {invoice.invoiceNumber}</h3>
                    <div>Status: {invoice.status}</div>
                    <div>Issue Date: {invoice.issueDate}</div>
                    <div>Due Date: {invoice.dueDate}</div>
                    <hr />

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
                        {invoice.items?.map((item, idx) => (
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

                    <hr />
                    <div><strong>Subtotal:</strong> {formatMoney(invoice.subtotal)}</div>
                    <div><strong>Tax:</strong> {formatMoney(invoice.taxTotal)}</div>
                    <div><strong>Total:</strong> {formatMoney(invoice.total)}</div>
                    <div><strong>Paid With:</strong> {invoice.paidByAccount ? `${invoice.paidByAccount.method} ••••${invoice.paidByAccount.last4}` : "Temporary Card"}</div>
                </Card.Body>
            </Card>
        </Container>
    );
}