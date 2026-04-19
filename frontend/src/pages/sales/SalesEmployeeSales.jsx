import { useEffect, useState, useMemo } from "react";
import {
    Container, Table, Card, Spinner, Alert, Badge, Form, Row, Col
} from "react-bootstrap";
import { apiFetch } from "../../services/api";

export default function SalesEmployeeSales({ darkMode = false }) {

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const cardClass = darkMode ? "bg-dark text-light border-secondary" : "bg-white";
    const tableClass = darkMode ? "table-dark" : "";

    async function loadData() {
        try {
            setLoading(true);
            setError("");
            const res = await apiFetch("/api/invoices/my-sales/all");
            // const res = await apiFetch("/api/invoices/my-sales");
            if (!res.ok) throw new Error("Failed to load invoices");
            const data = await res.json();
            console.log("invoices data:", data);
            setInvoices(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Failed to load invoices");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadData(); }, []);

    const filteredInvoices = useMemo(() => {
        const kw = search.toLowerCase();
        if (!kw) return invoices;
        return invoices.filter(inv =>
            inv.invoiceNumber?.toLowerCase().includes(kw) ||
            inv.customerName?.toLowerCase().includes(kw) ||
            inv.status?.toLowerCase().includes(kw)
        );
    }, [invoices, search]);

    const totalRevenue = useMemo(() => {
        return filteredInvoices
            .filter(inv => inv.status?.toUpperCase() === "PAID")
            .reduce((sum, inv) => sum + Number(inv.total || 0), 0);
    }, [filteredInvoices]);

    const statusColor = (status) => {
        switch (status?.toUpperCase()) {
            case "PAID":     return "success";
            case "PENDING":  return "warning";
            case "UNPAID":   return "danger";
            case "APPROVED": return "info";
            default:         return "secondary";
        }
    };

    return (
        <Container className="py-4">
            <h2 className="mb-3">Invoice Sales</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="mb-3">
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={8}>
                            <Form.Control
                                placeholder="Search invoice number / customer / status..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </Col>
                        <Col md={4} className="text-end">
                            <h5 className="mb-0">
                                Total: <span style={{ color: "green" }}>
                                    ${totalRevenue.toFixed(2)}
                                </span>
                            </h5>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className={cardClass} style={{ borderRadius: 16 }}>
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <Table responsive hover className={tableClass}>
                            <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Customer</th>
                                <th>Status</th>
                                <th>Subtotal</th>
                                <th>Tax</th>
                                <th>Total</th>
                                <th>Issue Date</th>
                                <th>Due Date</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredInvoices.length > 0 ? (
                                filteredInvoices.map((inv) => (
                                    <tr key={inv.invoiceNumber}>
                                        <td><b>{inv.invoiceNumber}</b></td>
                                        <td>{inv.customerName || "—"}</td>
                                        <td>
                                            <Badge bg={statusColor(inv.status)}>
                                                {inv.status || "—"}
                                            </Badge>
                                        </td>
                                        <td>${Number(inv.subtotal || 0).toFixed(2)}</td>
                                        <td>${Number(inv.taxTotal || 0).toFixed(2)}</td>
                                        <td><b>${Number(inv.total || 0).toFixed(2)}</b></td>
                                        <td>{inv.issueDate || "—"}</td>
                                        <td>{inv.dueDate || "—"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center">
                                        No invoices found
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
}