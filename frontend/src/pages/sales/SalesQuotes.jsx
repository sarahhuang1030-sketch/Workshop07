import React, { useEffect, useState } from "react";
import { Container, Table, Button } from "react-bootstrap";
import { apiFetch } from "../../services/api";

export default function SalesQuotes() {
    const [quotes, setQuotes] = useState([]);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        const res = await apiFetch("/api/quotes");

        if (!res.ok) {
            console.error("Failed to load quotes");
            setQuotes([]);
            return;
        }

        const data = await res.json();

        setQuotes(Array.isArray(data) ? data : []);
    }

    async function approve(id) {
        await apiFetch(`/api/quotes/${id}/approve`, { method: "PATCH" });
        load();
    }

    return (
        <Container className="py-4">
            <h3>Quotes</h3>

            <Table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th></th>
                </tr>
                </thead>

                <tbody>
                {quotes.map(q => (
                    <tr key={q.id}>
                        <td>{q.id}</td>
                        <td>{q.customerId}</td>
                        <td>${q.amount}</td>
                        <td>{q.status}</td>
                        <td>
                            {q.status === "PENDING" && (
                                <Button size="sm" onClick={() => approve(q.id)}>
                                    Approve
                                </Button>
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </Table>
        </Container>
    );
}