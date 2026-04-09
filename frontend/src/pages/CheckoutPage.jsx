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

    const [quote, setQuote] = useState(null);
    const [loadingQuote, setLoadingQuote] = useState(false);

    const [billingAddress, setBillingAddress] = useState({
        street1: "",
        street2: "",
        city: "",
        province: "ON",
        postalCode: "",
        country: "Canada",
    });
    const [addressLoaded, setAddressLoaded] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const invoiceNumber = queryParams.get("invoiceNumber");
    const quoteId = queryParams.get("quoteId");

    /* =========================
       LOAD INVOICE / QUOTE / ADDRESS
    ========================= */
    useEffect(() => {
        if (invoiceNumber) {
            loadInvoice(invoiceNumber);
        }
        if (quoteId) {
            loadQuote(quoteId);
        }
        loadAddress();
    }, [invoiceNumber, quoteId]);

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

    const loadQuote = async (id) => {
        try {
            setLoadingQuote(true);
            const res = await apiFetch(`/api/quotes/${id}`);
            if (!res.ok) throw new Error("Quote not found");

            const data = await res.json();
            setQuote(data);
        } catch (err) {
            console.error(err);
            alert("Failed to load quote details.");
        } finally {
            setLoadingQuote(false);
        }
    };

    const loadAddress = async () => {
        try {
            const res = await apiFetch("/api/billing/address");
            if (res.ok) {
                const data = await res.json();
                if (data.street1) {
                    setBillingAddress({
                        street1: data.street1,
                        street2: data.street2,
                        city: data.city,
                        province: data.province || "ON",
                        postalCode: data.postalCode,
                        country: data.country || "Canada",
                    });
                    setProvince(data.province || "ON");
                    setAddressLoaded(true);
                }
            }
        } catch (err) {
            console.error("Failed to load address", err);
        }
    };

    /* =========================
       PRICING CALCULATION
    ========================= */
    const pricing = useMemo(() => {
        const taxRate = PROVINCE_TAX[province] || 0.13;

        if (externalInvoice) {
            const subtotal = Number(externalInvoice.subtotal ?? 0);
            const taxRate = PROVINCE_TAX[province] || 0.13;

            const yearlyDiscount = 0;

            const tax = subtotal * taxRate;
            const finalTotal = subtotal + tax;

            return {
                subtotal,
                yearlyDiscount,
                tax,
                finalTotal,
                hasRecurringItems: true,
                hasOneTimeItems: false,
                isExternal: true,
            };
        }

        let baseSubtotal = 0;
        let recurringMonthly = 0;
        let hasRecurring = false;
        let isQuote = false;

        if (quote) {
            baseSubtotal = Number(quote.amount || 0);
            recurringMonthly = baseSubtotal;
            hasRecurring = true;
            isQuote = true;
        } else {
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

            recurringMonthly = recurringPlans + recurringAddOns + financedDevices;
            const oneTimeSubtotal = outrightDevices;

            baseSubtotal = recurringMonthly + oneTimeSubtotal;
            hasRecurring = recurringMonthly > 0;
        }

        const yearlyBase = recurringMonthly * 12;
        const yearlyDiscount = (billingCycle === "yearly" && hasRecurring)
            ? yearlyBase * 0.1
            : 0;

        const yearlyNet = yearlyBase - yearlyDiscount;

        let calculatedSubtotal;

        if (billingCycle === "yearly" && hasRecurring) {
            calculatedSubtotal = yearlyNet + (baseSubtotal - recurringMonthly);
        } else {
            calculatedSubtotal = baseSubtotal;
        }

        const tax = calculatedSubtotal * taxRate;
        const finalTotal = calculatedSubtotal + tax;

        const monthlyRecurring = recurringMonthly;

        return {
            subtotal: calculatedSubtotal,
            tax,
            finalTotal,

            monthlyRecurring,
            yearlyBase,
            yearlyDiscount,
            yearlyNet,

            hasRecurringItems: hasRecurring,
            isExternal: false,
            isQuote
        };
    }, [plans, addOns, devices, billingCycle, province, externalInvoice, quote]);

    /* =========================
       HANDLE CHECKOUT
    ========================= */
    const handleCheckout = async () => {
        if (!paymentMethod) return alert("Please select a payment card.");
        if (!stripe) return alert("Stripe not ready.");
        if (!billingAddress.street1 || !billingAddress.city || !billingAddress.postalCode) {
            return alert("Please complete your billing address.");
        }

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

            const checkoutItems = [];

            // Add plans
            plans.forEach(p => {
                checkoutItems.push({
                    description: p.name,
                    quantity: p.lines || 1,
                    unitPrice: p.pricePerLine || p.totalPrice || p.price || 0,
                    lineTotal: p.totalPrice || p.price || 0,
                    itemType: "plan",
                    serviceType: p.serviceType,
                    id: p.planId,
                    subscribers: p.subscribers?.map(s => s.fullName) || []
                });
            });

            // Add addons
            addOns.forEach(a => {
                checkoutItems.push({
                    description: a.addOnName,
                    quantity: 1,
                    unitPrice: a.monthlyPrice || a.price || 0,
                    lineTotal: a.monthlyPrice || a.price || 0,
                    itemType: "addon",
                    serviceType: a.serviceType,
                    id: a.addOnId
                });
            });

            // Add devices
            devices.forEach(d => {
                checkoutItems.push({
                    description: `${d.brand} ${d.model} (${d.storage}, ${d.color})`,
                    quantity: 1,
                    unitPrice: d.totalPrice || 0,
                    lineTotal: d.totalPrice || 0,
                    itemType: "device",
                    phoneId: d.phoneId || d.id,
                    pricingType: d.pricingType,
                    subscribers: [d.assignedSubscriberName]
                });
            });

            const invoiceRes = await apiFetch("/api/checkout/v1", {
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
                    items: checkoutItems,
                    ...billingAddress
                }),
            });

            const invoice = await invoiceRes.json();

            if (!invoiceRes.ok) {
                return alert(invoice.error || "Checkout failed");
            }

            setOrderNumber(invoice.invoiceNumber);
            setSubmitted(true);

            if (!pricing.isExternal && !pricing.isQuote) clearCart();
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

            <Card className="mb-3 p-3">
                <h5>Billing Address</h5>
                {addressLoaded ? (
                    <div className="small text-muted mb-2">
                        {billingAddress.street1}, {billingAddress.city}, {billingAddress.province}, {billingAddress.postalCode}
                    </div>
                ) : (
                    <Alert variant="warning" className="py-2 small">
                        No billing address found. Please enter it below.
                    </Alert>
                )}
                <Row className="g-2">
                    <Col md={12}>
                        <Form.Control
                            size="sm"
                            placeholder="Street Address"
                            value={billingAddress.street1}
                            onChange={(e) => setBillingAddress({...billingAddress, street1: e.target.value})}
                        />
                    </Col>
                    <Col md={6}>
                        <Form.Control
                            size="sm"
                            placeholder="City"
                            value={billingAddress.city}
                            onChange={(e) => setBillingAddress({...billingAddress, city: e.target.value})}
                        />
                    </Col>
                    <Col md={6}>
                        <Form.Control
                            size="sm"
                            placeholder="Postal Code"
                            value={billingAddress.postalCode}
                            onChange={(e) => setBillingAddress({...billingAddress, postalCode: e.target.value})}
                        />
                    </Col>
                </Row>
            </Card>

            <PaymentCardUI onCardSelect={setPaymentMethod} />

            {/*<Card className="mt-3 p-3">*/}
            {/*    <h5>Order Summary</h5>*/}
            {/*    <hr />*/}



            {/*    {billingCycle === "yearly" && pricing.yearlyDiscount > 0 && (*/}
            {/*        <div className="d-flex justify-content-between text-success">*/}
            {/*            <span>Yearly Discount (10%)</span>*/}
            {/*            <span>-${pricing.yearlyDiscount.toFixed(2)}</span>*/}
            {/*        </div>*/}
            {/*    )}*/}

            {/*    <div className="d-flex justify-content-between">*/}
            {/*        <span>Subtotal</span>*/}
            {/*        <span>${pricing.subtotal.toFixed(2)}</span>*/}
            {/*    </div>*/}

            {/*    <div className="d-flex justify-content-between">*/}
            {/*        <span>Tax</span>*/}
            {/*        <span>${(pricing.tax ?? 0).toFixed(2)}</span>*/}
            {/*    </div>*/}

            {/*    <hr />*/}

            {/*    <div className="d-flex justify-content-between fw-bold fs-5">*/}
            {/*        <span>Total</span>*/}
            {/*        <span>${(pricing.finalTotal ?? 0).toFixed(2)}</span>*/}
            {/*    </div>*/}
            {/*</Card>*/}

            <Card className="mt-3 p-3">
                <h5>Order Summary</h5>
                <hr />

                {/* YEARLY BREAKDOWN */}
                {billingCycle === "yearly" && pricing.hasRecurringItems && (
                    <>
                        <div className="d-flex justify-content-between">
                            <span>12-Month Recurring Total</span>
                            <span>${pricing.yearlyBase.toFixed(2)}</span>
                        </div>

                        <div className="d-flex justify-content-between text-success">
                            <span>Yearly Discount (10%)</span>
                            <span>-${pricing.yearlyDiscount.toFixed(2)}</span>
                        </div>

                        <hr />
                    </>
                )}

                <div className="d-flex justify-content-between">
                    <span>Subtotal</span>
                    <span>${pricing.subtotal.toFixed(2)}</span>
                </div>

                <div className="d-flex justify-content-between">
                    <span>Tax</span>
                    <span>${pricing.tax.toFixed(2)}</span>
                </div>

                <hr />

                <div className="d-flex justify-content-between fw-bold fs-5">
                    <span>Total</span>
                    <span>${pricing.finalTotal.toFixed(2)}</span>
                </div>
            </Card>


            <Button className="mt-4 w-100" size="lg" onClick={handleCheckout}>
                Pay ${(pricing.finalTotal ?? 0).toFixed(2)}
            </Button>
        </Container>
    );
}