import React, { useState, useMemo, useEffect } from "react";
import { Container, Card, Button, Form, Alert, Spinner, Row, Col } from "react-bootstrap";
import { useStripe } from "@stripe/react-stripe-js";
import { useCart } from "../context/CartContext";
import { apiFetch } from "../services/api";
import PaymentCardUI from "../components/PaymentCardUI";
import { useNavigate, useLocation } from "react-router-dom";

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
    const { plans, addOns, devices, clearCart } = useCart();

    const [paymentMethod, setPaymentMethod] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [orderNumber, setOrderNumber] = useState("");
    const [billingCycle, setBillingCycle] = useState("monthly");
    const [province, setProvince] = useState("ON");

    const [externalInvoice, setExternalInvoice] = useState(null);
    const [loadingInvoice, setLoadingInvoice] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const invoiceNumber = queryParams.get("invoiceNumber");
    const quoteId = queryParams.get("quoteId");

    /* =========================
       LOAD INVOICE (external)
    ========================= */
    useEffect(() => {
        if (invoiceNumber) {
            loadInvoice(invoiceNumber);
        }
    }, [invoiceNumber]);

    const loadInvoice = async (num) => {
        try {
            setLoadingInvoice(true);
            const res = await apiFetch(`/api/invoices/${num}`);
            if (!res.ok) throw new Error("Invoice not found");

            const data = await res.json();
            setExternalInvoice(data);
        } catch (err) {
            console.error(err);
            alert("Failed to load invoice details.");
        } finally {
            setLoadingInvoice(false);
        }
    };

    /* =========================
       PRICING CALCULATION
    ========================= */
    const pricing = useMemo(() => {
        const taxRate = PROVINCE_TAX[province] || 0.13;

        if (externalInvoice) {
            const taxRate = PROVINCE_TAX[province] || 0.13;

            const subtotal = Number(externalInvoice.subtotal ?? 0);

            return {
                subtotal,

                tax: subtotal * taxRate,

                finalTotal: subtotal + subtotal * taxRate,

                hasRecurringItems: true,
                hasOneTimeItems: false,
                isExternal: true,
            };
        }

        const recurringPlans = plans.reduce(
            (sum, p) => sum + Number(p?.totalPrice ?? p?.price ?? p?.monthlyPrice ?? 0),
            0
        );

        const recurringAddOns = addOns.reduce(
            (sum, a) => sum + Number(a?.monthlyPrice ?? a?.price ?? 0),
            0
        );

        const financedDevices = devices
            .filter((d) => d.pricingType === "monthly")
            .reduce((sum, d) => sum + Number(d?.monthlyPrice ?? 0), 0);

        const outrightDevices = devices
            .filter((d) => d.pricingType === "full")
            .reduce((sum, d) => sum + Number(d?.fullPrice ?? 0), 0);

        const recurringMonthly = recurringPlans + recurringAddOns + financedDevices;

        const yearlyBase = recurringMonthly * 12;
        const yearlyDiscount = billingCycle === "yearly" ? yearlyBase * 0.1 : 0;

        const recurringSubtotal =
            billingCycle === "yearly"
                ? yearlyBase - yearlyDiscount
                : recurringMonthly;

        const oneTimeSubtotal = outrightDevices;

        const subtotal = recurringSubtotal + oneTimeSubtotal;
        const tax = subtotal * taxRate;
        const finalTotal = subtotal + tax;

        return {
            recurringPlans,
            recurringAddOns,
            financedDevices,
            outrightDevices,
            recurringMonthly,
            yearlyBase,
            yearlyDiscount,
            recurringSubtotal,
            oneTimeSubtotal,
            subtotal,
            tax,
            finalTotal,
            hasRecurringItems: recurringMonthly > 0,
            hasOneTimeItems: outrightDevices > 0,
            isExternal: false,
        };
    }, [plans, addOns, devices, billingCycle, province, externalInvoice]);

    /* =========================
       HANDLE CHECKOUT
    ========================= */
    const handleCheckout = async () => {
        if (!paymentMethod) return alert("Please select a payment card.");
        if (!stripe) return alert("Stripe not ready.");

        try {
            const payload = {
                paymentMethodId: paymentMethod.stripePaymentMethodId,
                amount: Math.round((pricing.finalTotal ?? 0) * 100),
                saveCard: !paymentMethod.isTemporary,
                quoteId: quoteId || null,
            };

            const intentRes = await apiFetch("/api/payment-intent", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            const intentData = await intentRes.json();
            if (!intentRes.ok) return alert(intentData.error || "Payment setup failed");

            const result = await stripe.confirmCardPayment(intentData.clientSecret, {
                payment_method: paymentMethod.stripePaymentMethodId,
            });

            if (result.error) {
                alert(result.error.message);
                return;
            }

            const invoiceRes = await apiFetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paymentAccountId: paymentMethod.accountId || null,
                    subtotal: pricing.subtotal ?? 0,
                    tax: pricing.tax ?? 0,
                    total: pricing.finalTotal ?? 0,
                    billingCycle: pricing.hasRecurringItems ? billingCycle : "one-time",
                    paymentIntentId: result.paymentIntent.id,
                    quoteId: quoteId || null,
                    items: [],
                }),
            });

            const invoice = await invoiceRes.json();

            setOrderNumber(invoice.invoiceNumber);
            setSubmitted(true);

            if (!pricing.isExternal) clearCart();
        } catch (err) {
            console.error(err);
            alert("Checkout failed.");
        }
    };

    /* =========================
       SUCCESS SCREEN
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
                    className="mt-3"
                    onClick={() => navigate(`/customer/invoice/${orderNumber}`)}
                >
                    View Invoice
                </Button>
            </Container>
        );
    }

    /* =========================
       MAIN UI
    ========================= */
    return (
        <Container style={{ maxWidth: 700 }} className="py-5">
            <h2 className="mb-4">Checkout</h2>

            {loadingInvoice && (
                <div className="text-center mb-3">
                    <Spinner animation="border" />
                </div>
            )}

            {pricing.hasRecurringItems && (
                <Card className="mb-3 p-3">
                    <h5>Billing Cycle</h5>
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
                </Card>
            )}

            <Card className="mb-3 p-3">
                <h5>Province</h5>
                <Form.Select value={province} onChange={(e) => setProvince(e.target.value)}>
                    {Object.keys(PROVINCE_TAX).map((p) => (
                        <option key={p} value={p}>
                            {p}
                        </option>
                    ))}
                </Form.Select>
            </Card>

            <PaymentCardUI onCardSelect={setPaymentMethod} />

            <Card className="mt-3 p-3">
                <h5>Order Summary</h5>
                <hr />

                <div className="d-flex justify-content-between">
                    <span>Subtotal</span>
                    <span>${(pricing.subtotal ?? 0).toFixed(2)}</span>
                </div>

                <div className="d-flex justify-content-between">
                    <span>Tax</span>
                    <span>${(pricing.tax ?? 0).toFixed(2)}</span>
                </div>

                <hr />

                <div className="d-flex justify-content-between fw-bold fs-5">
                    <span>Total</span>
                    <span>${(pricing.finalTotal ?? 0).toFixed(2)}</span>
                </div>
            </Card>

            <Button className="mt-4 w-100" size="lg" onClick={handleCheckout}>
                Pay ${(pricing.finalTotal ?? 0).toFixed(2)}
            </Button>
        </Container>
    );
}