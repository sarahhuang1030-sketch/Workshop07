// import React, { useState, useMemo } from "react";
// import { Container, Card, Button, Form, Alert, Spinner } from "react-bootstrap";
// import { useStripe } from "@stripe/react-stripe-js";
// import { useCart } from "../context/CartContext";
// import PaymentForm from "../components/PaymentForm";
//
// const PROVINCE_TAX = { ON: 0.13, BC: 0.12, AB: 0.05, QC: 0.14975 };
//
// export default function CheckoutPage() {
//
//     const stripe = useStripe();
//     const { plan, addOns, total, clearCart } = useCart();
//
//     const [paymentMethod, setPaymentMethod] = useState(null);
//     const [submitted, setSubmitted] = useState(false);
//     const [orderNumber, setOrderNumber] = useState("");
//     const [loading, setLoading] = useState(false);
//
//     const [billingCycle, setBillingCycle] = useState("monthly");
//     const [province, setProvince] = useState("ON");
//
//     const pricing = useMemo(() => {
//         const taxRate = PROVINCE_TAX[province] || 0.13;
//         let subtotal = total;
//         if (billingCycle === "yearly") subtotal = subtotal * 12 * 0.9;
//         const tax = subtotal * taxRate;
//         return { subtotal, tax, finalTotal: subtotal + tax };
//     }, [billingCycle, province, total]);
//
//     const handleCheckout = async () => {
//         if (!stripe) return alert("Stripe is still loading.");
//         if (!paymentMethod?.stripePaymentMethodId) return alert("Select a payment card.");
//
//         try {
//             setLoading(true);
//
//             const res = await fetch(`/api/payment-intent?stripeCustomerId=${paymentMethod.stripeCustomerId}&paymentMethodId=${paymentMethod.stripePaymentMethodId}`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ amount: Math.round(pricing.finalTotal * 100) })
//             });
//
//             const data = await res.json();
//
//             const result = await stripe.confirmCardPayment(data.clientSecret, { payment_method: paymentMethod.stripePaymentMethodId });
//
//             if (result.error) {
//                 alert("Payment failed: " + result.error.message);
//                 return;
//             }
//
//             setOrderNumber(result.paymentIntent.id);
//             setSubmitted(true);
//             clearCart();
//
//         } catch (err) {
//             console.error(err);
//             alert("Checkout failed");
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     if (submitted) return (
//         <Container className="py-5">
//             <Alert variant="success">
//                 <h4>🎉 Payment Successful</h4>
//                 <p>Thank you for your purchase.</p>
//                 <strong>Order Number: {orderNumber}</strong>
//             </Alert>
//         </Container>
//     );
//
//     return (
//         <Container style={{ maxWidth: 700 }} className="py-5">
//             <h2 className="mb-4">Checkout</h2>
//
//             <Card className="mb-3 p-3">
//                 <h5>Billing Cycle</h5>
//                 <Form.Check label="Monthly" checked={billingCycle === "monthly"} onChange={() => setBillingCycle("monthly")} />
//                 <Form.Check label="Yearly (10% OFF)" checked={billingCycle === "yearly"} onChange={() => setBillingCycle("yearly")} />
//             </Card>
//
//             <Card className="mb-3 p-3">
//                 <h5>Province</h5>
//                 <Form.Select value={province} onChange={e => setProvince(e.target.value)}>
//                     {Object.keys(PROVINCE_TAX).map(p => <option key={p} value={p}>{p}</option>)}
//                 </Form.Select>
//             </Card>
//
//             <PaymentForm onPaymentSaved={setPaymentMethod} />
//
//             <Card className="mt-3 p-3">
//                 <h5>Order Summary</h5>
//                 {plan && <div><strong>Plan:</strong> {plan.name} (${plan.price}/mo)</div>}
//                 {addOns.length > 0 && <ul>{addOns.map(a => <li key={a.addOnId}>{a.addOnName} (${a.monthlyPrice}/mo)</li>)}</ul>}
//                 <hr />
//                 <div>Subtotal: ${pricing.subtotal.toFixed(2)}</div>
//                 <div>Tax: ${pricing.tax.toFixed(2)}</div>
//                 <hr />
//                 <div className="fw-bold">Total: ${pricing.finalTotal.toFixed(2)}</div>
//             </Card>
//
//             <Button className="mt-4 w-100" size="lg" onClick={handleCheckout} disabled={loading}>
//                 {loading ? <><Spinner animation="border" size="sm" className="me-2" />Processing Payment...</> : `Pay $${pricing.finalTotal.toFixed(2)}`}
//             </Button>
//         </Container>
//     );
// }

import React, { useState, useMemo } from "react";
import { Container, Card, Button, Form, Alert } from "react-bootstrap";
import { useStripe } from "@stripe/react-stripe-js";

import { useCart } from "../context/CartContext";
import PaymentForm from "../components/PaymentForm";
import { apiFetch } from "../services/api";

// Province tax rates
const PROVINCE_TAX = {
    ON: 0.13,
    BC: 0.12,
    AB: 0.05,
    QC: 0.14975
};

export default function CheckoutPage() {
    const stripe = useStripe();

    const { plan, addOns, total, clearCart } = useCart();

    const [paymentMethod, setPaymentMethod] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [orderNumber, setOrderNumber] = useState("");
    const [billingCycle, setBillingCycle] = useState("monthly");
    const [province, setProvince] = useState("ON");

    /**
     * Calculate pricing
     */
    const pricing = useMemo(() => {
        const taxRate = PROVINCE_TAX[province] || 0.13;

        let subtotal = total;
        if (billingCycle === "yearly") {
            subtotal = subtotal * 12 * 0.9; // 10% discount
        }

        const tax = subtotal * taxRate;
        const finalTotal = subtotal + tax;

        return { subtotal, tax, finalTotal };
    }, [billingCycle, province, total]);

    /**
     * Handle checkout flow
     */
    const handleCheckout = async () => {
        if (!paymentMethod) return alert("Please select a payment card.");

        try {
            const intentRes = await apiFetch(
                `/api/payment-intent?stripeCustomerId=${paymentMethod.stripeCustomerId}&paymentMethodId=${paymentMethod.stripePaymentMethodId}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ amount: Math.round(pricing.finalTotal * 100) })
                }
            );

            const intentData = await intentRes.json();

            const result = await stripe.confirmCardPayment(intentData.clientSecret, {
                payment_method: paymentMethod.stripePaymentMethodId
            });

            if (result.error) return alert("Payment failed: " + result.error.message);

            const invoiceRes = await apiFetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paymentAccountId: paymentMethod.accountId, // ⚠️ 这里如果没有 accountId，可以改用 stripePaymentMethodId
                    subtotal: pricing.subtotal,
                    tax: pricing.tax,
                    total: pricing.finalTotal,
                    billingCycle,
                    paymentIntentId: result.paymentIntent.id,
                    promoCode: null,
                    items: []
                })
            });

            const invoice = await invoiceRes.json();
            setOrderNumber(invoice.invoiceNumber);
            setSubmitted(true);
            clearCart();

        } catch (err) {
            console.error(err);
            alert("Checkout failed. See console for details.");
        }
    };

    /**
     * Success page
     */
    if (submitted) {
        return (
            <Container className="py-5">
                <Alert variant="success">
                    🎉 Payment Successful
                    <br />
                    Order Number: {orderNumber}
                </Alert>
            </Container>
        );
    }

    /**
     * Main UI
     */
    return (
        <Container style={{ maxWidth: 700 }} className="py-5">
            <h2 className="mb-4">Checkout</h2>

            {/* Billing Cycle */}
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

            {/* Province */}
            <Card className="mb-3 p-3">
                <h5>Province</h5>
                <Form.Select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                >
                    {Object.keys(PROVINCE_TAX).map((p) => (
                        <option key={p} value={p}>
                            {p}
                        </option>
                    ))}
                </Form.Select>
            </Card>

            {/* Payment */}
            <PaymentForm onPaymentSaved={setPaymentMethod} />

            {/* Order Summary */}
            <Card className="mt-3 p-3">
                <h5>Order Summary</h5>

                {plan && (
                    <div>
                        <strong>Plan:</strong> {plan.name} (${plan.price}/mo)
                    </div>
                )}

                {addOns.length > 0 && (
                    <ul>
                        {addOns.map((a) => (
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

                <div className="fw-bold">
                    Total: ${pricing.finalTotal.toFixed(2)}
                </div>
            </Card>

            <Button
                className="mt-4 w-100"
                size="lg"
                onClick={handleCheckout}
            >
                Pay ${pricing.finalTotal.toFixed(2)}
            </Button>
        </Container>
    );
}