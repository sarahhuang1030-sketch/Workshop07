import React, { useEffect, useState } from "react";
import { Container, Card, Button, Spinner, Table, Collapse, Alert } from "react-bootstrap";
import { FileText } from "lucide-react";
import { apiFetch } from "../../services/api";

const formatMoney = (n) =>
    n == null || Number.isNaN(Number(n))
        ? "—"
        : Number(n).toLocaleString(undefined, { style: "currency", currency: "CAD" });

export default function SalesBilling({ darkMode = false }) {

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [openInvoiceId, setOpenInvoiceId] = useState(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadInvoices() {
            try {
                setLoading(true);

                const url = search
                    ? `/api/invoices/search?keyword=${encodeURIComponent(search)}`
                    : "/api/invoices/all";

                const res = await apiFetch(url);

                if (!res.ok) throw new Error(`Failed to fetch invoices: ${res.status}`);

                const data = await res.json();

                const invoicesArray = Array.isArray(data) ? data : [];

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

    }, [search]);

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" />
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

    return (
        <Container className="py-5">

            <h2>Billing History</h2>

            {/* SEARCH */}
            <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search invoice number or customer name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {invoices.map((inv) => (
                <Card key={inv.invoiceNumber} className="mb-3">
                    <Card.Body>

                        <div className="d-flex justify-content-between">
                            <div>
                                <div className="fw-bold">
                                    Invoice #{inv.invoiceNumber}
                                </div>

                                {/* ✅ CUSTOMER NAME FIX */}
                                <div className="text-muted small">
                                    Customer: {inv.customerName || "—"}
                                </div>
                            </div>

                            <Button
                                size="sm"
                                onClick={() =>
                                    setOpenInvoiceId(
                                        openInvoiceId === inv.invoiceNumber
                                            ? null
                                            : inv.invoiceNumber
                                    )
                                }
                            >
                                {openInvoiceId === inv.invoiceNumber ? "Collapse" : "Expand"}
                            </Button>
                        </div>

                        <Collapse in={openInvoiceId === inv.invoiceNumber}>
                            <div className="mt-3">
                                <div>Status: {inv.status}</div>

                                <Table bordered size="sm">
                                    <thead>
                                    <tr>
                                        <th>Description</th>
                                        <th>Qty</th>
                                        <th>Total</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {inv.items?.map((i, idx) => (
                                        <tr key={idx}>
                                            <td>{i.description}</td>
                                            <td>{i.quantity}</td>
                                            <td>{formatMoney(i.lineTotal)}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>

                                <div><b>Total:</b> {formatMoney(inv.total)}</div>
                            </div>
                        </Collapse>

                    </Card.Body>
                </Card>
            ))}

        </Container>
    );
}