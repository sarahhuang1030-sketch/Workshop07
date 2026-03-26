import React, { useEffect, useState } from "react";
import { Container, Card, Button, Spinner, Table, Collapse, Alert } from "react-bootstrap";
import { FileText } from "lucide-react";
import { apiFetch } from "../../services/api";

// Utility: format number as CAD currency
const formatMoney = (n) =>
    n == null || Number.isNaN(Number(n))
        ? "—"
        : Number(n).toLocaleString(undefined, { style: "currency", currency: "CAD" });

export default function SalesBilling({ darkMode = false }) {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [openInvoiceId, setOpenInvoiceId] = useState(null); // track expanded invoice

    useEffect(() => {
        let isMounted = true;

        async function loadInvoices() {
            try {
                // Fetch invoices from backend
                const res = await apiFetch("/api/invoices/all");
                if (!res.ok) throw new Error(`Failed to fetch invoices: ${res.status}`);

                const data = await res.json();
                console.log("Fetched invoices:", data); // DEBUG: check backend response

                // Safety: ensure invoices is always an array
                const invoicesArray = Array.isArray(data) ? data : data.invoices ?? [];

                if (isMounted) setInvoices(invoicesArray);
            } catch (err) {
                console.error(err);
                if (isMounted) setError(err.message || "Failed to load invoices");
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadInvoices();

        return () => { isMounted = false; };
    }, []);

    // ---------------- Render Loading ----------------
    if (loading)
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" />
                <div className={`mt-2 ${darkMode ? "text-light-50 text-secondary" : "text-muted"}`}>
                    Loading invoices…
                </div>
            </Container>
        );

    // ---------------- Render Error ----------------
    if (error)
        return (
            <Container className="py-5">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );

    // ---------------- Render Empty ----------------
    if (!invoices.length)
        return (
            <Container className="py-5 text-center">
                <Alert variant="info">No invoices found.</Alert>
            </Container>
        );

    // ---------------- Render Invoices ----------------
    return (
        <Container className="py-5">
            <h2>Billing History</h2>
            <p>View all invoices and expand to see full details.</p>

            {invoices.map((inv) => (
                <Card
                    key={inv.invoiceNumber}
                    className={`${darkMode ? "bg-dark text-light" : "bg-white"} mb-3 shadow-sm`}
                    style={{ borderRadius: 16 }}
                >
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-2">
                                <FileText size={18} />
                                <div className="fw-bold">Invoice #{inv.invoiceNumber}</div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() =>
                                    setOpenInvoiceId(openInvoiceId === inv.invoiceNumber ? null : inv.invoiceNumber)
                                }
                            >
                                {openInvoiceId === inv.invoiceNumber ? "Collapse" : "Expand"}
                            </Button>
                        </div>

                        <Collapse in={openInvoiceId === inv.invoiceNumber}>
                            <div className="mt-3">
                                <div>Status: {inv.status}</div>
                                <div>Issue Date: {inv.issueDate}</div>
                                <div>Due Date: {inv.dueDate}</div>
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
                                    {Array.isArray(inv.items) && inv.items.length ? (
                                        inv.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.description}</td>
                                                <td>{item.quantity}</td>
                                                <td>{formatMoney(item.unitPrice)}</td>
                                                <td>{formatMoney(item.discountAmount)}</td>
                                                <td>{formatMoney(item.lineTotal)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="text-center">
                                                No items in this invoice
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </Table>

                                <hr />
                                <div>
                                    <strong>Subtotal:</strong> {formatMoney(inv.subtotal)}
                                </div>
                                <div>
                                    <strong>Tax:</strong> {formatMoney(inv.taxTotal)}
                                </div>
                                <div>
                                    <strong>Total:</strong> {formatMoney(inv.total)}
                                </div>
                                <div className="mt-2">
                                    <strong>Paid With:</strong>{" "}
                                    {inv.paidByAccount
                                        ? `${inv.paidByAccount.method} ••••${inv.paidByAccount.last4}`
                                        : "Temporary Card"}
                                </div>
                            </div>
                        </Collapse>
                    </Card.Body>
                </Card>
            ))}

            <div className="text-muted small mt-2">Total invoices: {invoices.length}</div>
        </Container>
    );
}