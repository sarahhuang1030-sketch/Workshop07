import { useEffect, useState, useMemo } from "react";
import {
    Container,
    Table,
    Card,
    Spinner,
    Alert,
    Badge,
    Form,
    Row,
    Col
} from "react-bootstrap";
import { apiFetch } from "../../services/api";

export default function SalesEmployeeSales({ darkMode = false }) {

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const cardClass = darkMode ? "bg-dark text-light border-secondary" : "bg-white";
    const tableClass = darkMode ? "table-dark" : "";

    async function loadData() {
        try {
            setLoading(true);
            setError("");

            const res = await apiFetch("/api/manager/reports/my-sales/details");

            if (!res.ok) throw new Error(await res.text());

            const data = await res.json();
            setRows(data || []);

        } catch (err) {
            setError(err.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    // 🔍 Filtered rows
    const filteredRows = useMemo(() => {
        return rows.filter(r => {
            const keyword = search.toLowerCase();

            return (
                r.customerName?.toLowerCase().includes(keyword) ||
                r.planName?.toLowerCase().includes(keyword) ||
                r.status?.toLowerCase().includes(keyword) ||
                String(r.subscriptionId).includes(keyword)
            );
        });
    }, [rows, search]);

    // 💰 Total sales
    const totalSales = useMemo(() => {
        return filteredRows.reduce((sum, r) => {
            const total =
                Number(r.monthlyPrice || 0) +
                Number(r.addonTotal || 0);

            return sum + total;
        }, 0);
    }, [filteredRows]);

    return (
        <Container className="py-4">

            <h2 className="mb-3">My Sales Details</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            {/* 🔍 Search + Total */}
            <Card className="mb-3">
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={8}>
                            <Form.Control
                                placeholder="Search customer / plan / status / ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </Col>

                        <Col md={4} className="text-end">
                            <h5 className="mb-0">
                                Total: <span style={{ color: "green" }}>
                                    ${totalSales.toFixed(2)}
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
                                <th>ID</th>
                                <th>Customer</th>
                                <th>Plan</th>
                                <th>Status</th>
                                <th>Price</th>
                                <th>Addons</th>
                                <th>Total</th>
                                <th>Date</th>
                            </tr>
                            </thead>

                            <tbody>
                            {filteredRows.length > 0 ? (
                                filteredRows.map((r) => {

                                    const total =
                                        Number(r.monthlyPrice || 0) +
                                        Number(r.addonTotal || 0);

                                    return (
                                        <tr key={r.subscriptionId}>
                                            <td>{r.subscriptionId}</td>

                                            <td>
                                                <b>{r.customerName}</b>
                                                <div style={{ fontSize: 12, opacity: 0.7 }}>
                                                    #{r.customerId}
                                                </div>
                                            </td>

                                            <td>{r.planName}</td>

                                            <td>
                                                <Badge bg="info">{r.status}</Badge>
                                            </td>

                                            <td>${Number(r.monthlyPrice || 0).toFixed(2)}</td>

                                            <td>${Number(r.addonTotal || 0).toFixed(2)}</td>

                                            <td><b>${total.toFixed(2)}</b></td>

                                            <td>{r.startDate || "—"}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center">
                                        No results found
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