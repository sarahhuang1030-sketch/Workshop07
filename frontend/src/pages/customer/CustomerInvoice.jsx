import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
    Container,
    Card,
    Spinner,
    Alert,
    Table,
    Row,
    Col,
    Badge
} from "react-bootstrap";
import { apiFetch } from "../../services/api";

/* =========================
   FORMAT MONEY
========================= */
function formatMoney(val) {
    const num = Number(val);
    if (!isFinite(num)) return "$0.00";
    return num.toLocaleString("en-CA", {
        style: "currency",
        currency: "CAD",
    });
}

export default function CustomerInvoice() {
    const { invoiceNumber } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await apiFetch(`/api/invoices/${invoiceNumber}`);
                const data = await res.json();
                setInvoice(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [invoiceNumber]);

    /* =========================
       LOADING STATE
    ========================= */
    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner />
            </Container>
        );
    }

    /* =========================
       ERROR STATE
    ========================= */
    if (!invoice) {
        return (
            <Container className="py-5">
                <Alert variant="danger">Invoice not found</Alert>
            </Container>
        );
    }

    /* =========================
       CALCULATIONS
    ========================= */

    // total discount from all items
    const totalDiscount = (invoice.items || []).reduce(
        (sum, i) => sum + Number(i.discountAmount || 0),
        0
    );

    // safer subtotal (in case backend subtotal is wrong)
    const calculatedSubtotal = (invoice.items || []).reduce(
        (sum, i) =>
            sum +
            Number(i.unitPrice || 0) * Number(i.quantity || 1),
        0
    );

    /* =========================
       PAYMENT DISPLAY FIX
    ========================= */
    function renderPayment() {
        // Case 1: saved card
        if (invoice.paidByAccount?.last4) {
            return `${invoice.paidByAccount.method || "Card"} •••• ${invoice.paidByAccount.last4}`;
        }

        // Case 2: Stripe (no saved account)
        if (invoice.stripePaymentIntentId) {
            return "Stripe (Online Payment)";
        }

        // Case 3: fallback
        return "N/A";
    }

    return (
        <Container className="py-5" style={{ maxWidth: 900 }}>
            <Card className="shadow-sm p-4">

                {/* ================= HEADER ================= */}
                <Row className="mb-4 align-items-start">
                    <Col>
                        <h2 className="fw-bold mb-0">INVOICE</h2>
                        <div className="text-muted">
                            #{invoice.invoiceNumber}
                        </div>
                    </Col>

                    <Col className="text-end">
                        <Badge
                            bg={
                                invoice.status === "PAID"
                                    ? "success"
                                    : invoice.status === "PENDING"
                                        ? "warning"
                                        : "secondary"
                            }
                        >
                            {invoice.status}
                        </Badge>

                        <div className="mt-2 small text-muted">
                            Issue: {invoice.issueDate}
                        </div>
                        <div className="small text-muted">
                            Due: {invoice.dueDate}
                        </div>
                    </Col>
                </Row>

                {/* ================= CUSTOMER + PAYMENT ================= */}
                <Row className="mb-4">
                    <Col md={6}>
                        <h6 className="fw-bold">Billed To</h6>
                        <div>{invoice.customerName || "Customer"}</div>
                    </Col>

                    <Col md={6} className="text-md-end mt-3 mt-md-0">
                        <h6 className="fw-bold">Payment Method</h6>
                        <div>{renderPayment()}</div>
                    </Col>
                </Row>

                {/* ================= ITEMS ================= */}
                <Table bordered hover responsive className="mb-4">
                    <thead className="table-light">
                    <tr>
                        <th>Description</th>
                        <th className="text-center">Qty</th>
                        <th className="text-end">Unit Price</th>
                        <th className="text-end">Discount</th>
                        <th className="text-end">Line Total</th>
                    </tr>
                    </thead>

                    <tbody>
                    {invoice.items?.map((item, idx) => (
                        <tr key={idx}>
                            <td>{item.description}</td>

                            <td className="text-center">
                                {item.quantity || 1}
                            </td>

                            <td className="text-end">
                                {formatMoney(item.unitPrice)}
                            </td>

                            <td className="text-end text-danger">
                                {formatMoney(item.discountAmount || 0)}
                            </td>

                            <td className="text-end fw-semibold">
                                {formatMoney(item.lineTotal)}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </Table>

                {/* ================= SUMMARY ================= */}
                <Row>
                    <Col md={6}></Col>

                    <Col md={6}>

                        {/* Subtotal */}
                        <div className="d-flex justify-content-between">
                            <span>Subtotal</span>
                            <span>{formatMoney(calculatedSubtotal)}</span>
                        </div>

                        {/* Discount */}
                        {totalDiscount > 0 && (
                            <div className="d-flex justify-content-between text-danger">
                                <span>Discount</span>
                                <span>-{formatMoney(totalDiscount)}</span>
                            </div>
                        )}

                        {/* Tax */}
                        <div className="d-flex justify-content-between">
                            <span>Tax</span>
                            <span>{formatMoney(invoice.taxTotal)}</span>
                        </div>

                        <hr />

                        {/* Total */}
                        <div className="d-flex justify-content-between fw-bold fs-5">
                            <span>Total</span>
                            <span>{formatMoney(invoice.total)}</span>
                        </div>

                    </Col>
                </Row>

            </Card>
        </Container>
    );
}