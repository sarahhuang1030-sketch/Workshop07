import { useEffect, useMemo, useState } from "react";
import {
    Card,
    Container,
    Spinner,
    Alert,
    Table,
    Badge,
    Button,
    Form,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";

export default function SalesEmployeeSales({ darkMode = false }) {
    const navigate = useNavigate();

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("totalSales");
    const [sortDirection, setSortDirection] = useState("desc");

    const cardClass = darkMode ? "bg-dark text-light border-secondary" : "bg-white";
    const tableClass = darkMode ? "table-dark" : "";

    // Fetch ONLY current user's sales
    async function loadEmployeeSales() {
        try {
            setLoading(true);
            setError("");

            const res = await apiFetch("/api/manager/reports/my-sales");

            if (!res.ok) {
                const text = await res.text(); // 👈 show backend error
                throw new Error(text || "Failed to load your sales");
            }

            const data = await res.json();

            // Wrap into array for table reuse
            setRows(data ? [data] : []);

        } catch (err) {
            console.error("API ERROR:", err);
            setError(err.message || "Failed to load your sales");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadEmployeeSales();
    }, []);

    const filteredAndSortedRows = useMemo(() => {
        const q = search.trim().toLowerCase();

        const filtered = rows.filter((row) => {
            const fullName = `${row.firstName || ""} ${row.lastName || ""}`.toLowerCase();
            return !q || fullName.includes(q);
        });

        const sorted = [...filtered].sort((a, b) => {
            let aValue;
            let bValue;

            if (sortBy === "employeeName") {
                aValue = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
                bValue = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();
            } else if (sortBy === "salesCount") {
                aValue = Number(a.salesCount || 0);
                bValue = Number(b.salesCount || 0);
            } else if (sortBy === "totalSales") {
                aValue = Number(a.totalSales || 0);
                bValue = Number(b.totalSales || 0);
            } else {
                aValue = 0;
                bValue = 0;
            }

            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [rows, search, sortBy, sortDirection]);

    function toggleSortDirection() {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    }

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                    <h2 className="mb-1">My Sales</h2>
                    <div className="text-muted">
                        View your personal sales performance.
                    </div>
                </div>

                <Button
                    variant="outline-secondary"
                    onClick={() => navigate("/manager")}
                    style={{ borderRadius: 12 }}
                >
                    Go Back
                </Button>
            </div>

            <div className="d-flex justify-content-end align-items-center gap-2 flex-wrap mb-3">
                <Form.Control
                    type="text"
                    placeholder="Filter by employee name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: 280 }}
                />

                <Form.Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ maxWidth: 220 }}
                >
                    <option value="employeeName">Sort by Employee Name</option>
                    <option value="salesCount">Sort by Sales Count</option>
                    <option value="totalSales">Sort by Total Sales</option>
                </Form.Select>

                <Button variant="outline-primary" onClick={toggleSortDirection}>
                    {sortDirection === "asc" ? "Ascending" : "Descending"}
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className={cardClass} style={{ borderRadius: 18 }}>
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <Table responsive hover className={`align-middle mb-0 ${tableClass}`}>
                            <thead>
                            <tr>
                                <th>Employee ID</th>
                                <th>Employee</th>
                                <th>Sales Count</th>
                                <th>Total Sales</th>
                                <th>Last Sale Date</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredAndSortedRows.length > 0 ? (
                                filteredAndSortedRows.map((row) => (
                                    <tr key={row.employeeId}>
                                        <td>{row.employeeId}</td>
                                        <td>
                                            {row.firstName} {row.lastName}
                                        </td>
                                        <td>
                                            <Badge bg="primary">{row.salesCount ?? 0}</Badge>
                                        </td>
                                        <td>${Number(row.totalSales ?? 0).toFixed(2)}</td>
                                        <td>{row.lastSaleDate || "—"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center">
                                        No employee sales found.
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