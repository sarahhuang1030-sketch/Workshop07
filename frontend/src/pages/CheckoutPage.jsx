import React, { useState, useMemo } from "react";
import { Container, Card, Button, Form, Alert } from "react-bootstrap";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import PaymentForm from "../components/PaymentForm.jsx";

const PROVINCE_TAX = {
    ON: 0.13, BC: 0.12, AB: 0.05, QC: 0.14975,
    MB: 0.12, SK: 0.11, NS: 0.15, NB: 0.15,
    PE: 0.15, NL: 0.15,
};

export default function CheckoutPage({ user }) {
    const { plan, addOns, total, clearCart } = useCart();
    const navigate = useNavigate();

    // Initialize only after confirming user existence.
    const [selectedAccountId] = useState(user?.paymentAccount?.accountId || null);

    const [billingCycle, setBillingCycle] = useState("monthly");
    const [province, setProvince] = useState("ON");
    const [submitted, setSubmitted] = useState(false);
    const [orderNumber, setOrderNumber] = useState("");
    const [promoInput] = useState("");

    const pricing = useMemo(() => {
        const taxRate = PROVINCE_TAX[province] || 0.13;
        let subtotal = total;
        if (billingCycle === "yearly") subtotal = subtotal * 12 * 0.9;

        const tax = subtotal * taxRate;
        const finalTotal = subtotal + tax;
        const todayDue = billingCycle === "monthly" ? 0 : finalTotal;

        return { subtotal, taxTotal: tax, finalTotal, todayDue, taxRate };
    }, [total, billingCycle, province]);

    if (!plan && !submitted) {
        return (
            <Container className="py-5">
                <Alert variant="warning">Your cart is empty.</Alert>
            </Container>
        );
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            if (!user || !selectedAccountId) {
                alert("⚠️ The user or payment account has not set up！");
                return;
            }

            const payload = {
                customerId: user.customerId,
                paymentAccountId: selectedAccountId,
                billingCycle,
                subtotal: pricing.subtotal,
                tax: pricing.taxTotal,
                total: pricing.finalTotal,
                promoCode: promoInput || null
            };

            console.log("Checkout payload:", payload);

            const res = await apiFetch("/api/checkout", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(await res.text());

            const result = await res.json();
            setOrderNumber(result.invoiceNumber);
            setSubmitted(true);
            clearCart();
        } catch (err) {
            console.error("Checkout detailed error:", err);
            alert("Checkout failed. View console debugging information.");
        }
    }

    return (
        <Container className="py-5" style={{ maxWidth: 700 }}>
            <h1 className="fw-black mb-4">Checkout</h1>

            {submitted ? (
                <div>
                    <Alert variant="success">
                        <h5>🎉 Payment Successful!</h5>
                        <div>Your subscription is now active.</div>
                        <hr />
                        <div><strong>Order Number:</strong> {orderNumber}</div>
                    </Alert>

                    <Button className="mt-3" onClick={() => navigate("/billing")}>View Invoice</Button>
                    <Button className="mt-3 ms-2" variant="secondary" onClick={() => navigate("/plans")}>Back to Plans</Button>
                </div>
            ) : (
                <Form onSubmit={handleSubmit}>
                    <Card className="mb-4">
                        <Card.Body>
                            <h5 className="fw-bold mb-3">Billing Cycle</h5>
                            <Form.Check
                                type="radio"
                                label="Monthly"
                                checked={billingCycle === "monthly"}
                                onChange={() => setBillingCycle("monthly")}
                            />
                            <Form.Check
                                type="radio"
                                label="Yearly (10% OFF)"
                                checked={billingCycle === "yearly"}
                                onChange={() => setBillingCycle("yearly")}
                            />
                        </Card.Body>
                    </Card>

                    <Card className="mb-4">
                        <Card.Body>
                         <PaymentForm/>
                        </Card.Body>
                    </Card>

                    <Card className="mb-4">
                        <Card.Body>
                            <h5 className="fw-bold mb-3">Province</h5>
                            <Form.Select value={province} onChange={(e) => setProvince(e.target.value)}>
                                {Object.keys(PROVINCE_TAX).map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </Form.Select>
                        </Card.Body>
                    </Card>

                    <Card className="mb-4">
                        <Card.Body>
                            <h5 className="fw-bold mb-3">Order Summary</h5>
                            <div><strong>Plan:</strong> {plan.name} (${plan.price}/mo)</div>
                            {addOns.length > 0 && (
                                <div className="mt-2">
                                    <strong>Add-ons:</strong>
                                    <ul className="mb-0">
                                        {addOns.map(a => (
                                            <li key={a.addOnId}>{a.addOnName} (${a.monthlyPrice}/mo)</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <hr />
                            <div>Subtotal: ${pricing.subtotal.toFixed(2)}</div>
                            <div>Tax ({(pricing.taxRate*100).toFixed(2)}%): ${pricing.taxTotal.toFixed(2)}</div>
                            <hr />
                            <div className="fw-bold">Total: ${pricing.finalTotal.toFixed(2)}</div>
                            <div className="mt-2 text-primary fw-bold">Today Due: ${pricing.todayDue.toFixed(2)}</div>
                        </Card.Body>
                    </Card>

                    <Button size="lg" type="submit" className="w-100 fw-bold">
                        Pay ${pricing.todayDue.toFixed(2)}
                    </Button>
                </Form>
            )}
        </Container>
    );
}