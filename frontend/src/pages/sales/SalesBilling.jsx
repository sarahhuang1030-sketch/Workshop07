import React, { useEffect, useState } from "react";
import { Container, Card, Button, Spinner, Table, Collapse, Alert } from "react-bootstrap";
import { FileText } from "lucide-react";
import { apiFetch } from "../../services/api";

const formatMoney = (n) =>
    n == null || Number.isNaN(Number(n))
        ? "—"
        : Number(n).toLocaleString(undefined, { style: "currency", currency: "CAD" });

export default function SalesBilling({ darkMode = false }) {

    const [groupedInvoices, setGroupedInvoices] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [openInvoiceId, setOpenInvoiceId] = useState(null);
    const [openCustomerId, setOpenCustomerId] = useState(null);
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

                // Group by customer
                const grouped = invoicesArray.reduce((acc, inv) => {
                    const customerName = inv.customerName || "Unknown Customer";
                    if (!acc[customerName]) {
                        acc[customerName] = [];
                    }
                    acc[customerName].push(inv);
                    return acc;
                }, {});

                if (isMounted) setGroupedInvoices(grouped);

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
            <div className="mb-4">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search invoice number or customer name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ borderRadius: 12 }}
                />
            </div>

            {Object.entries(groupedInvoices).map(([customerName, customerInvoices]) => (
                <Card key={customerName} className={`mb-3 ${darkMode ? "bg-dark text-light border-secondary" : ""}`} style={{ borderRadius: 18 }}>
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">{customerName}</h5>
                            <Button
                                variant={darkMode ? "outline-light" : "outline-primary"}
                                size="sm"
                                onClick={() => setOpenCustomerId(openCustomerId === customerName ? null : customerName)}
                            >
                                {openCustomerId === customerName ? "Hide Invoices" : `Show Invoices (${customerInvoices.length})`}
                            </Button>
                        </div>

                        <Collapse in={openCustomerId === customerName}>
                            <div className="mt-3">
                                {customerInvoices.map((inv) => (
                                    <Card key={inv.invoiceNumber} className={`mb-2 ${darkMode ? "bg-dark border-secondary" : "bg-light"}`} style={{ borderRadius: 14 }}>
                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <div className="fw-bold">Invoice #{inv.invoiceNumber}</div>
                                                    <div className="small text-muted">{inv.issueDate} • {inv.status}</div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => setOpenInvoiceId(openInvoiceId === inv.invoiceNumber ? null : inv.invoiceNumber)}
                                                >
                                                    {openInvoiceId === inv.invoiceNumber ? "Collapse" : "Details"}
                                                </Button>
                                            </div>

                                            <Collapse in={openInvoiceId === inv.invoiceNumber}>
                                                <div className="mt-3">
                                                    <div className="mb-2 small">
                                                        <div><strong>Start Date:</strong> {inv.startDate || "—"}</div>
                                                        <div><strong>Due Date:</strong> {inv.dueDate || "—"}</div>
                                                    </div>

                                                    <Table bordered size="sm" className={darkMode ? "table-dark" : ""}>
                                                        <thead>
                                                        <tr>
                                                            <th>Type</th>
                                                            <th>Description</th>
                                                            <th>Qty</th>
                                                            <th>Total</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        {inv.items?.map((i, idx) => (
                                                            <tr key={idx}>
                                                                <td className="text-capitalize">{i.itemType || "—"}</td>
                                                                <td>{i.description}</td>
                                                                <td>{i.quantity}</td>
                                                                <td>{formatMoney(i.lineTotal)}</td>
                                                            </tr>
                                                        ))}
                                                        </tbody>
                                                    </Table>

                                                    <div className="text-end">
                                                        <span className="me-2">Price:</span>
                                                        <strong style={{ fontSize: "1.1rem" }}>{formatMoney(inv.total)}</strong>
                                                    </div>
                                                </div>
                                            </Collapse>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </div>
                        </Collapse>
                    </Card.Body>
                </Card>
            ))}

        </Container>
    );
}