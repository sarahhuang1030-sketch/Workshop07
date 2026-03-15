import { useEffect, useState } from "react";
import { Card, Row, Col, Spinner, Alert, Table } from "react-bootstrap";
import { apiFetch } from "../../services/api";

const API_BASE = "/api/manager/reports/summary";

export default function ManagerReport({ darkMode = false }) {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const cardClass = darkMode ? "bg-dark text-light border-secondary" : "bg-white";
    const tableClass = darkMode ? "table-dark" : "";

    async function loadReport() {
        try {
            setLoading(true);
            setError("");

            const res = await apiFetch(API_BASE);
            if (!res.ok) throw new Error("Failed to load report summary");

            const data = await res.json();
            setReport(data);
        } catch (err) {
            setError(err.message || "Failed to load report summary");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadReport();
    }, []);

    const stats = report
        ? [
            { label: "Total Customers", value: report.totalCustomers ?? 0 },
            { label: "Active Subscriptions", value: report.activeSubscriptions ?? 0 },
            { label: "Suspended Subscriptions", value: report.suspendedSubscriptions ?? 0 },
            { label: "Open Invoices", value: report.openInvoices ?? 0 },
            { label: "Estimated Monthly Revenue", value: `$${Number(report.estimatedMonthlyRevenue ?? 0).toFixed(2)}` },
            { label: "Total Add-ons", value: report.totalAddons ?? 0 },
            { label: "Active Add-ons", value: report.activeAddons ?? 0 },
        ]
        : [];

    return (
        <div className="container py-4">
            <Card className={`shadow-sm ${cardClass}`}>
                <Card.Body>
                    <h2 className="mb-1">Manager Reports</h2>
                    <p className="text-muted">TeleConnect business summary and operational metrics.</p>

                    {error && <Alert variant="danger">{error}</Alert>}

                    {loading ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <>
                            <Row className="g-3 mb-4">
                                {stats.map((stat) => (
                                    <Col md={6} lg={4} key={stat.label}>
                                        <Card className={`h-100 shadow-sm ${cardClass}`}>
                                            <Card.Body>
                                                <div className="small text-muted">{stat.label}</div>
                                                <div className="fs-4 fw-bold">{stat.value}</div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                            <Table striped bordered hover className={tableClass}>
                                <thead>
                                <tr>
                                    <th>Metric</th>
                                    <th>Value</th>
                                </tr>
                                </thead>
                                <tbody>
                                {stats.map((stat) => (
                                    <tr key={stat.label}>
                                        <td>{stat.label}</td>
                                        <td>{stat.value}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
                        </>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}
