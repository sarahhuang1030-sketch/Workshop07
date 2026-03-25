import React, { useEffect, useState } from "react";
import { Container, Card, Button, Spinner, Table, Collapse, Alert } from "react-bootstrap";
import { FileText } from "lucide-react";
import { apiFetch } from "../../services/api";

// Format number as CAD currency
const formatMoney = (n) =>
    n == null || Number.isNaN(Number(n))
        ? "—"
        : Number(n).toLocaleString(undefined, { style: "currency", currency: "CAD" });

export default function SalesBilling({ darkMode = false }) {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [openInvoiceId, setOpenInvoiceId] = useState(null); // track expanded invoice
    const [role, setRole] = useState(null); // store current user role

    useEffect(() => {
        let isMounted = true;

        async function loadInvoices() {
            try {
                // 1️⃣ Fetch current user info to get role
                const userRes = await apiFetch("/api/users/me"); // endpoint returns { username, role, ... }
                if (!userRes.ok) throw new Error(`Failed to fetch user info: ${userRes.status}`);
                const userData = await userRes.json();
                if (isMounted) setRole(userData.role);

                // 2️⃣ Decide invoice API based on role
                const invoiceEndpoint =
                    userData.role && userData.role.toUpperCase() === "CUSTOMER"
                        ? "/api/invoices/me/all"
                        : "/api/invoices/all";

                const res = await apiFetch(invoiceEndpoint);
                if (!res.ok) throw new Error(`Failed to fetch invoices: ${res.status}`);
                const data = await res.json();
                if (isMounted) setInvoices(data);
            } catch (err) {
                console.error(err);
                if (isMounted) setError(err.message || "Failed to load invoices");
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadInvoices();
        return () => {
            isMounted = false;
        };
    }, []);

    if (loading)
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" />
                <div className={`mt-2 ${darkMode ? "text-light-50 text-secondary" : "text-muted"}`}>
                    Loading invoices…
                </div>
            </Container>
        );

    if (error)
        return (
            <Container className="py-5">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );

    if (!invoices.length)
        return (
            <Container className="py-5 text-center">
                <Alert variant="info">No invoices found.</Alert>
            </Container>
        );

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
                                    {inv.items?.map((item, idx) => (
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