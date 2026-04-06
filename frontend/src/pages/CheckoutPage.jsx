import React, { useState, useMemo } from "react";
import { Container, Card, Button, Form, Alert } from "react-bootstrap";
import { useStripe } from "@stripe/react-stripe-js";
import { useCart } from "../context/CartContext";
import { apiFetch } from "../services/api";
import PaymentCardUI from "../components/PaymentCardUI";
import { useNavigate } from "react-router-dom";

/* =========================
   Province tax rates
========================= */
const PROVINCE_TAX = {
    ON: 0.13,
    BC: 0.12,
    AB: 0.05,
    QC: 0.14975,
};

export default function CheckoutPage() {
    const stripe = useStripe();
    const { plans, addOns, total, clearCart } = useCart();

    const [paymentMethod, setPaymentMethod] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [orderNumber, setOrderNumber] = useState("");
    const [billingCycle, setBillingCycle] = useState("monthly");
    const [province, setProvince] = useState("ON");

    const navigate = useNavigate();

    /* =========================
       PRICING CALCULATION
       Clear breakdown:
       Base → Discount → Subtotal → Tax → Total
    ========================= */
    const pricing = useMemo(() => {
        const taxRate = PROVINCE_TAX[province] || 0.13;

        // Base monthly price (sum of cart)
        const baseMonthly = total;

        // Yearly base (12 months before discount)
        const yearlyBase = baseMonthly * 12;

        // Yearly discount (10% off)
        const yearlyDiscount =
            billingCycle === "yearly" ? yearlyBase * 0.1 : 0;

        // Subtotal after discount
        const subtotal =
            billingCycle === "yearly"
                ? yearlyBase - yearlyDiscount
                : baseMonthly;

        // Tax calculation
        const tax = subtotal * taxRate;

        // Final total
        const finalTotal = subtotal + tax;

        return {
            baseMonthly,
            yearlyBase,
            yearlyDiscount,
            subtotal,
            tax,
            finalTotal,
        };
    }, [billingCycle, province, total]);

    /* =========================
       HANDLE CHECKOUT
    ========================= */
    const handleCheckout = async () => {
        if (!paymentMethod) return alert("Please select a payment card.");
        if (!paymentMethod.stripePaymentMethodId) {
            return alert("Invalid payment method.");
        }

        try {
            /* -------------------------
               1. Create Stripe PaymentIntent
            ------------------------- */
            const payload = {
                paymentMethodId: paymentMethod.stripePaymentMethodId,
                amount: Math.round(pricing.finalTotal * 100), // cents
                saveCard: !paymentMethod.isTemporary,
            };

            const intentRes = await apiFetch("/api/payment-intent", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            const intentData = await intentRes.json();

            if (!intentRes.ok) {
                return alert(intentData.error || "Payment setup failed");
            }

            /* -------------------------
               2. Confirm payment with Stripe
            ------------------------- */
            // const result = await stripe.confirmCardPayment(
            //     intentData.clientSecret,
            //     {
            //         payment_method: paymentMethod.stripePaymentMethodId,
            //     }
            // );
            //
            // if (result.error) {
            //     return alert(result.error.message);
            // }

            const result = await stripe.confirmCardPayment(intentData.clientSecret, {
                payment_method: paymentMethod.stripePaymentMethodId,
            });

            if (result.error) {
                alert(result.error.message);
                return;
            }

            // if (result.paymentIntent.status === "succeeded") {
            //     await apiFetch("/api/invoices/mark-paid", {
            //         method: "POST",
            //         body: JSON.stringify({
            //             invoiceNumber,
            //             paymentIntentId: result.paymentIntent.id,
            //             paymentMethodId: result.paymentIntent.payment_method
            //         })
            //     });
            // }

            /* -------------------------
               3. Build invoice items
               IMPORTANT:
               Include discount per item (for invoice page)
            ------------------------- */
            const invoiceItems = [
                ...plans.map((plan) => {
                    const basePrice = Number(
                        plan.totalPrice ??
                        plan.price ??
                        plan.monthlyPrice ??
                        0
                    );

                    const isYearly = billingCycle === "yearly";

                    const yearlyBase = basePrice * 12;
                    const discount = isYearly ? yearlyBase * 0.1 : 0;

                    return {
                        description:
                            plan.serviceType === "Mobile"
                                ? `${plan.name} - ${(
                                    plan.subscribers
                                        ?.map((s) => s.fullName)
                                        .filter(Boolean)
                                        .join(", ")
                                ) || `${plan.lines ?? 1} line(s)`}`
                                : plan.name,

                        quantity: 1,

                        // unit price before discount
                        unitPrice: isYearly ? yearlyBase : basePrice,

                        // discount amount
                        discountAmount: discount,

                        // final line total
                        lineTotal: isYearly
                            ? yearlyBase - discount
                            : basePrice,

                        subscribers:
                            plan.subscribers?.map((s) => s.fullName) || [],
                    };
                }),

                ...addOns.map((a) => ({
                    description: a.addOnName,
                    quantity: 1,
                    unitPrice: Number(a.monthlyPrice ?? a.price ?? 0),
                    discountAmount: 0,
                    lineTotal: Number(a.monthlyPrice ?? a.price ?? 0),
                })),
            ];

            /* -------------------------
               4. Call backend checkout
            ------------------------- */
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
                    items: invoiceItems,
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

    /* =========================
       SUCCESS PAGE
    ========================= */
    if (submitted) {
        return (
            <Container className="py-5 text-center">
                <Alert variant="success">
                    🎉 Payment Successful
                    <br />
                    Order Number: {orderNumber}
                </Alert>

                <Button
                    variant="primary"
                    size="lg"
                    className="mt-3"
                    onClick={() =>
                        navigate(`/customer/invoice/${orderNumber}`)
                    }
                >
                    View Invoice
                </Button>
            </Container>
        );
    }

    /* =========================
       UI
    ========================= */
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
            <PaymentCardUI onCardSelect={setPaymentMethod} />

            {/* Order Summary */}
            <Card className="mt-3 p-3">
                <h5>Order Summary</h5>

                <hr />

                {/* Monthly view */}
                {billingCycle === "monthly" && (
                    <div className="d-flex justify-content-between">
                        <span>Monthly Subtotal</span>
                        <span>${pricing.baseMonthly.toFixed(2)}</span>
                    </div>
                )}

                {/* Yearly breakdown */}
                {billingCycle === "yearly" && (
                    <>
                        <div className="d-flex justify-content-between">
                            <span>Yearly Base (12 × monthly)</span>
                            <span>${pricing.yearlyBase.toFixed(2)}</span>
                        </div>

                        <div className="d-flex justify-content-between text-success">
                            <span>Yearly Discount (10%)</span>
                            <span>-${pricing.yearlyDiscount.toFixed(2)}</span>
                        </div>
                    </>
                )}

                {/* Subtotal */}
                <div className="d-flex justify-content-between">
                    <span>Subtotal</span>
                    <span>${pricing.subtotal.toFixed(2)}</span>
                </div>

                {/* Tax */}
                <div className="d-flex justify-content-between">
                    <span>
                        Tax ({(PROVINCE_TAX[province] * 100).toFixed(0)}%)
                    </span>
                    <span>${pricing.tax.toFixed(2)}</span>
                </div>

                <hr />

                {/* Total */}
                <div className="d-flex justify-content-between fw-bold fs-5">
                    <span>Total</span>
                    <span>${pricing.finalTotal.toFixed(2)}</span>
                </div>
            </Card>

            {/* Pay button */}
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