import React, { useState, useMemo } from "react";
import { Container, Card, Button, Form, Alert } from "react-bootstrap";
import { useStripe } from "@stripe/react-stripe-js";
import { useCart } from "../context/CartContext";
import { apiFetch } from "../services/api";
import PaymentCardUI from "../components/PaymentCardUI";
import { useNavigate } from "react-router-dom";

// Province tax rates
const PROVINCE_TAX = { ON: 0.13, BC: 0.12, AB: 0.05, QC: 0.14975 };

export default function CheckoutPage() {
    const stripe = useStripe();
    const { plan, addOns, total, clearCart } = useCart();

    const [paymentMethod, setPaymentMethod] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [orderNumber, setOrderNumber] = useState("");
    const [billingCycle, setBillingCycle] = useState("monthly");
    const [province, setProvince] = useState("ON");
    const navigate = useNavigate();

    // -----------------------------
    // Compute subtotal, tax, final total
    // -----------------------------
    const pricing = useMemo(() => {
        const taxRate = PROVINCE_TAX[province] || 0.13;
        const subtotal = billingCycle === "yearly" ? total * 12 * 0.9 : total;
        const tax = subtotal * taxRate;
        return { subtotal, tax, finalTotal: subtotal + tax };
    }, [billingCycle, province, total]);

    // Plan monthly price (FIXED)
    const planMonthly = Number(
        plan?.totalPrice ??
        plan?.price ??
        plan?.monthlyPrice ??
        0
    );

    // -----------------------------
    // Handle Checkout
    // -----------------------------
    const handleCheckout = async () => {
        if (!paymentMethod) return alert("Please select a payment card.");

        if (!paymentMethod.stripePaymentMethodId) {
            return alert("Selected card is invalid.");
        }

        try {
            const queryParams = new URLSearchParams();
            if (paymentMethod.stripeCustomerId) {
                queryParams.append("stripeCustomerId", paymentMethod.stripeCustomerId);
            }
            queryParams.append("paymentMethodId", paymentMethod.stripePaymentMethodId);

            const intentRes = await apiFetch(`/api/payment-intent?${queryParams.toString()}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: Math.round(pricing.finalTotal * 100) }),
            });

            const intentData = await intentRes.json();
            if (!intentData.clientSecret) return alert("Payment setup failed.");

            const result = await stripe.confirmCardPayment(intentData.clientSecret, {
                payment_method: paymentMethod.stripePaymentMethodId,
            });

            if (result.error) return alert("Payment failed: " + result.error.message);

            // -----------------------------
            // FIXED invoice items
            // -----------------------------
            const invoiceRes = await apiFetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paymentAccountId: paymentMethod.accountId || null,
                    subtotal: pricing.subtotal,
                    tax: pricing.tax,
                    total: pricing.finalTotal,
                    billingCycle,
                    paymentIntentId: result.paymentIntent.id,
                    promoCode: null,
                    items: [
                        {
                            description: plan.name,
                            quantity: 1,
                            unitPrice: planMonthly,
                            lineTotal: planMonthly,
                        },
                        ...addOns.map(a => ({
                            description: a.addOnName,
                            quantity: 1,
                            unitPrice: a.monthlyPrice,
                            lineTotal: a.monthlyPrice
                        }))
                    ],
                }),
            });

            const invoice = await invoiceRes.json();
            setOrderNumber(invoice.invoiceNumber);
            setSubmitted(true);
            clearCart();

        } catch (err) {
            console.error(err);
            alert("Checkout failed.");
        }
    };

    if (submitted) {
        return (
            <Container className="py-5 text-center">
                <Alert variant="success">
                    🎉 Payment Successful<br />
                    Order Number: {orderNumber}
                </Alert>

                <Button
                    variant="primary"
                    size="lg"
                    className="mt-3"
                    onClick={() => navigate(`/customer/billing`)}
                >
                    View Invoice
                </Button>
            </Container>
        );
    }

    return (
        <Container style={{ maxWidth: 700 }} className="py-5">
            <h2 className="mb-4">Checkout</h2>

            <Card className="mb-3 p-3">
                <h5>Billing Cycle</h5>
                <Form.Check
                    label="Monthly"
                    checked={billingCycle === "monthly"}
                    onChange={() => setBillingCycle("monthly")}
                />
                <Form.Check
                    label="Yearly (10% OFF)"
                    checked={billingCycle === "yearly"}
                    onChange={() => setBillingCycle("yearly")}
                />
            </Card>

            <Card className="mb-3 p-3">
                <h5>Province</h5>
                <Form.Select value={province} onChange={(e) => setProvince(e.target.value)}>
                    {Object.keys(PROVINCE_TAX).map((p) => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </Form.Select>
            </Card>

            <PaymentCardUI onCardSelect={setPaymentMethod} />

            {/* -----------------------------
               FIXED ORDER SUMMARY DISPLAY
            ----------------------------- */}
            <Card className="mt-3 p-3">
                <h5>Order Summary</h5>

                {plan && (
                    <div>
                        <strong>Plan:</strong> {plan.name}
                        <div className="text-muted small">
                            {plan.serviceType === "Mobile"
                                ? `${plan.lines ?? 1} line(s) • $${Number(plan.pricePerLine ?? plan.price ?? 0).toFixed(2)}/line`
                                : "Home Internet Plan"}
                        </div>
                        <div>${planMonthly.toFixed(2)}/mo</div>
                    </div>
                )}

                {addOns.length > 0 && (
                    <ul>
                        {addOns.map(a => (
                            <li key={a.addOnId}>
                                {a.addOnName} (${a.monthlyPrice}/mo)
                            </li>
                        ))}
                    </ul>
                )}

                <hr />
                <div>Subtotal: ${pricing.subtotal.toFixed(2)}</div>
                <div>Tax: ${pricing.tax.toFixed(2)}</div>
                <hr />
                <div className="fw-bold">Total: ${pricing.finalTotal.toFixed(2)}</div>
            </Card>

            <Button className="mt-4 w-100" size="lg" onClick={handleCheckout}>
                Pay ${pricing.finalTotal.toFixed(2)}
            </Button>
        </Container>
    );
}