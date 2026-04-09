import React, { useEffect, useState } from "react";
import { Container, Table, Spinner, Alert } from "react-bootstrap";
import { apiFetch } from "../../services/api";

export default function CustomerBillingHistory() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const res = await apiFetch("/api/invoices/user/all");
            const json = await res.json();
            setData(json);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) return <Spinner className="m-5" />;

    return (
        <Container className="py-4">
            <h2>Invoice History</h2>

            <Table striped bordered>
                <thead>
                <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Package Name</th>
                    <th>Due Date</th>
                    <th>Details</th>
                    <th>Status</th>
                    <th>Total</th>
                </tr>
                </thead>
                <tbody>
                {data.map((inv) => (
                    <tr key={inv.invoiceNumber}>
                        <td>{inv.invoiceNumber}</td>
                        <td>{inv.issueDate}</td>
                        <td>{inv.items?.[0]?.description || "—"}</td>
                        <td>{inv.dueDate || "—"}</td>
                        <td>
                            {inv.items?.map(i => `${i.description} (x${i.quantity})`).join(", ") || "—"}
                        </td>
                        <td>{inv.status}</td>
                        <td>{inv.total}</td>
                    </tr>
                ))}
                </tbody>
            </Table>
        </Container>
    );
}