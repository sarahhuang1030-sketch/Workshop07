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
import { Container, Card, Button, Form, Alert, Spinner } from "react-bootstrap";
import { useStripe } from "@stripe/react-stripe-js";
import { useCart } from "../context/CartContext";
import PaymentForm from "../components/PaymentForm";

/**
 * Province tax rates (Canada example)
 */
const PROVINCE_TAX = { ON: 0.13, BC: 0.12, AB: 0.05, QC: 0.14975 };

export default function CheckoutPage() {
    const stripe = useStripe();
    const { plan, addOns, total, cartItems = [], clearCart } = useCart();
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [orderNumber, setOrderNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [billingCycle, setBillingCycle] = useState("monthly");
    const [province, setProvince] = useState("ON");

    // --- Pricing calculations ---
    const pricing = useMemo(() => {
        const taxRate = PROVINCE_TAX[province] || 0.13;
        let subtotal = total;
        if (billingCycle === "yearly") subtotal *= 12 * 0.9;
        const tax = subtotal * taxRate;
        return { subtotal, tax, finalTotal: subtotal + tax };
    }, [billingCycle, province, total]);

    // --- Handle checkout ---
    const handleCheckout = async () => {
        if (!stripe) return alert("Stripe is still loading.");
        if (!paymentMethod?.stripePaymentMethodId) return alert("Select a valid payment card.");

        try {
            setLoading(true);

            // 1️⃣ Create PaymentIntent on backend
            const intentRes = await fetch(`/api/payment-intent?stripeCustomerId=${paymentMethod.stripeCustomerId}&paymentMethodId=${paymentMethod.stripePaymentMethodId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: Math.round(pricing.finalTotal * 100) })
            });

            if (!intentRes.ok) throw new Error("Failed to create payment intent");
            const intentData = await intentRes.json();

            // 2️⃣ Confirm payment
            const result = await stripe.confirmCardPayment(intentData.clientSecret, { payment_method: paymentMethod.stripePaymentMethodId });
            if (result.error) return alert("Payment failed: " + result.error.message);

            // 3️⃣ Create invoice on backend
            const checkoutRes = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paymentAccountId: paymentMethod.id,
                    subtotal: pricing.subtotal,
                    tax: pricing.tax,
                    total: pricing.finalTotal,
                    promoCode: null,
                    billingCycle,
                    paymentIntentId: result.paymentIntent.id,
                    items: (cartItems || []).map(ci => ({
                        description: ci.name || "N/A",
                        quantity: ci.quantity != null ? ci.quantity : 1,
                        unitPrice: ci.price != null ? ci.price : 0,
                        lineTotal: (ci.quantity != null && ci.price != null) ? ci.quantity * ci.price : (ci.price != null ? ci.price : 0),
                        discountAmount: 0
                    }))
                })
            });

            if (!checkoutRes.ok) {
                const errorData = await checkoutRes.json();
                throw new Error(errorData.details || "Failed to create invoice");
            }
            const invoiceData = await checkoutRes.json();

            setOrderNumber(invoiceData.invoiceNumber || result.paymentIntent.id);
            setSubmitted(true);
            clearCart();
        } catch (err) {
            console.error("Checkout error:", err);
            alert("Checkout failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <Container className="py-5">
                <Alert variant="success">
                    <h4>🎉 Payment Successful</h4>
                    <p>Thank you for your purchase.</p>
                    <strong>Order Number: {orderNumber}</strong>
                </Alert>
            </Container>
        );
    }

    return (
        <Container style={{ maxWidth: 700 }} className="py-5">
            <h2 className="mb-4">Checkout</h2>

            {/* Billing cycle */}
            <Card className="mb-3 p-3">
                <h5>Billing Cycle</h5>
                <Form.Check label="Monthly" checked={billingCycle === "monthly"} onChange={() => setBillingCycle("monthly")} />
                <Form.Check label="Yearly (10% OFF)" checked={billingCycle === "yearly"} onChange={() => setBillingCycle("yearly")} />
            </Card>

            {/* Province */}
            <Card className="mb-3 p-3">
                <h5>Province</h5>
                <Form.Select value={province} onChange={(e) => setProvince(e.target.value)}>
                    {Object.keys(PROVINCE_TAX).map(p => <option key={p} value={p}>{p}</option>)}
                </Form.Select>
            </Card>

            {/* Payment */}
            <PaymentForm onPaymentSaved={setPaymentMethod} />

            {/* Order summary */}
            <Card className="mt-3 p-3">
                <h5>Order Summary</h5>
                {plan && <div><strong>Plan:</strong> {plan.name} (${plan.price}/mo)</div>}
                {addOns.length > 0 && (
                    <ul>{addOns.map(a => <li key={a.addOnId}>{a.addOnName} (${a.monthlyPrice}/mo)</li>)}</ul>
                )}
                <hr />
                <div>Subtotal: ${pricing.subtotal.toFixed(2)}</div>
                <div>Tax: ${pricing.tax.toFixed(2)}</div>
                <hr />
                <div className="fw-bold">Total: ${pricing.finalTotal.toFixed(2)}</div>
            </Card>

            <Button className="mt-4 w-100" size="lg" onClick={handleCheckout} disabled={loading}>
                {loading ? <><Spinner animation="border" size="sm" className="me-2" />Processing Payment...</> : `Pay $${pricing.finalTotal.toFixed(2)}`}
            </Button>
        </Container>
    );
}