import React, { useState, useMemo, useEffect } from "react";
import { Container, Card, Button, Form, Alert, Spinner, Row, Col } from "react-bootstrap";
import { useStripe } from "@stripe/react-stripe-js";
import { useCart } from "../context/CartContext";
import { apiFetch } from "../services/api";
import PaymentCardUI from "../components/PaymentCardUI";
import { useNavigate, useLocation } from "react-router-dom";
import "../style/style.css";

/* =========================
   Province tax rates
========================= */
const PROVINCE_TAX = {
    ON: 0.13,
    BC: 0.12,
    AB: 0.05,
    QC: 0.14975,
};

const PROVINCE_LABELS = {
    ON: "Ontario",
    BC: "British Columbia",
    AB: "Alberta",
    QC: "Quebec",
};

export default function CheckoutPage() {
    const stripe = useStripe();
    const { plans, addOns, devices, clearCart } = useCart();

    const [paymentMethod, setPaymentMethod] = useState(null);
    const [submitted, setSubmitted]         = useState(false);
    const [orderNumber, setOrderNumber]     = useState("");
    const [billingCycle, setBillingCycle]   = useState("monthly");

    const [externalInvoice, setExternalInvoice] = useState(null);
    const [loadingInvoice, setLoadingInvoice]   = useState(false);

    const [quote, setQuote]               = useState(null);
    const [loadingQuote, setLoadingQuote] = useState(false);

    const [billingAddress, setBillingAddress] = useState({
        street1: "", street2: "", city: "",
        province: "ON", postalCode: "", country: "Canada",
    });
    const [addressLoaded, setAddressLoaded]         = useState(false);
    const [postalCodeError, setPostalCodeError]     = useState("");
    const [postalCodeTouched, setPostalCodeTouched] = useState(false);

    /* province 自动从 billingAddress 读取，不再独立维护 */
    const province = billingAddress.province || "ON";
    const taxRate  = PROVINCE_TAX[province] ?? 0.13;

    /* =========================
       POSTAL CODE HELPERS
    ========================= */
    const formatPostalCode = (raw) => {
        const clean = raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
        return clean.length > 3 ? clean.slice(0, 3) + " " + clean.slice(3) : clean;
    };

    const POSTAL_REGEX = /^[A-Z]\d[A-Z] \d[A-Z]\d$/;

    const handlePostalCodeChange = (e) => {
        const formatted = formatPostalCode(e.target.value);
        setBillingAddress((prev) => ({ ...prev, postalCode: formatted }));
        setPostalCodeTouched(true);
        if (postalCodeError) setPostalCodeError("");
    };

    const handlePostalCodeBlur = () => {
        const val = billingAddress.postalCode.trim();
        if (!val) {
            setPostalCodeError("Postal code is required.");
        } else if (!POSTAL_REGEX.test(val)) {
            setPostalCodeError("Must be in format A1A 1A1 (e.g. M5V 3A8).");
        } else {
            setPostalCodeError("");
        }
    };

    const navigate = useNavigate();
    const location = useLocation();

    const queryParams   = new URLSearchParams(location.search);
    const invoiceNumber = queryParams.get("invoiceNumber");
    const quoteId       = queryParams.get("quoteId");

    /* =========================
       LOAD INVOICE / QUOTE / ADDRESS
    ========================= */
    useEffect(() => {
        if (invoiceNumber) loadInvoice(invoiceNumber);
        if (quoteId)       loadQuote(quoteId);
        loadAddress();
    }, [invoiceNumber, quoteId]);

    const loadInvoice = async (num) => {
        try {
            setLoadingInvoice(true);
            const res = await apiFetch(`/api/invoices/${num}`);
            if (!res.ok) throw new Error("Invoice not found");
            setExternalInvoice(await res.json());
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
            setQuote(await res.json());
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
                        street1:    data.street1,
                        street2:    data.street2 || "",
                        city:       data.city,
                        province:   data.province || "ON",
                        postalCode: data.postalCode,
                        country:    data.country || "Canada",
                    });
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
        if (externalInvoice) {
            const subtotal = Number(externalInvoice.subtotal ?? 0);
            const tax = subtotal * taxRate;
            return {
                subtotal, yearlyDiscount: 0, tax, finalTotal: subtotal + tax,
                hasRecurringItems: true, hasOneTimeItems: false, isExternal: true,
            };
        }

        let baseSubtotal = 0, recurringMonthly = 0, hasRecurring = false, isQuote = false;

        if (quote) {
            baseSubtotal     = Number(quote.amount || 0);
            recurringMonthly = baseSubtotal;
            hasRecurring     = true;
            isQuote          = true;
        } else {
            const recurringPlans = plans.reduce(
                (sum, p) => sum + Number(p?.totalPrice ?? p?.price ?? p?.monthlyPrice ?? 0), 0
            );
            const recurringAddOns = addOns.reduce(
                (sum, a) => sum + Number(a?.monthlyPrice ?? a?.price ?? 0), 0
            );
            const financedDevices = devices
                .filter((d) => d.pricingType === "monthly")
                .reduce((sum, d) => sum + Number(d?.monthlyPrice ?? 0), 0);
            const outrightDevices = devices
                .filter((d) => d.pricingType === "full")
                .reduce((sum, d) => sum + Number(d?.fullPrice ?? 0), 0);

            recurringMonthly = recurringPlans + recurringAddOns + financedDevices;
            baseSubtotal     = recurringMonthly + outrightDevices;
            hasRecurring     = recurringMonthly > 0;
        }

        const yearlyBase     = recurringMonthly * 12;
        const yearlyDiscount = (billingCycle === "yearly" && hasRecurring) ? yearlyBase * 0.1 : 0;
        const yearlyNet      = yearlyBase - yearlyDiscount;

        const calculatedSubtotal = (billingCycle === "yearly" && hasRecurring)
            ? yearlyNet + (baseSubtotal - recurringMonthly)
            : baseSubtotal;

        const tax        = calculatedSubtotal * taxRate;
        const finalTotal = calculatedSubtotal + tax;

        return {
            subtotal: calculatedSubtotal, tax, finalTotal,
            monthlyRecurring: recurringMonthly, yearlyBase, yearlyDiscount, yearlyNet,
            hasRecurringItems: hasRecurring, isExternal: false, isQuote,
        };
    }, [plans, addOns, devices, billingCycle, taxRate, externalInvoice, quote]);

    /* =========================
       HANDLE CHECKOUT
    ========================= */
    const handleCheckout = async () => {
        if (!paymentMethod) return alert("Please select a payment card.");
        if (!stripe)        return alert("Stripe not ready.");
        if (!billingAddress.street1 || !billingAddress.city || !billingAddress.postalCode)
            return alert("Please complete your billing address.");

        const POSTAL_RE = /^[A-Z]\d[A-Z] \d[A-Z]\d$/;
        if (!POSTAL_RE.test(billingAddress.postalCode.trim())) {
            setPostalCodeError("Must be in format A1A 1A1 (e.g. M5V 3A8).");
            return alert("Please enter a valid Canadian postal code (e.g. M5V 3A8).");
        }

        try {
            const payload = {
                paymentMethodId: paymentMethod.stripePaymentMethodId,
                amount:          Math.round((pricing.finalTotal ?? 0) * 100),
                saveCard:        !paymentMethod.isTemporary,
                quoteId:         quoteId || null,
            };

            const intentRes  = await apiFetch("/api/payment-intent", { method: "POST", body: JSON.stringify(payload) });
            const intentData = await intentRes.json();
            if (!intentRes.ok) return alert(intentData.error || "Payment setup failed");

            const result = await stripe.confirmCardPayment(intentData.clientSecret, {
                payment_method: paymentMethod.stripePaymentMethodId,
            });
            if (result.error) { alert(result.error.message); return; }

            const isYearly = billingCycle === "yearly" && pricing.hasRecurringItems;
            const checkoutItems = [];

            plans.forEach(p => {
                const unitPrice  = p.pricePerLine || p.totalPrice || p.price || 0;
                const qty        = p.lines || 1;
                const gross      = unitPrice * qty * (isYearly ? 12 : 1);
                const discount   = isYearly ? parseFloat((gross * 0.10).toFixed(2)) : 0;
                const lineTotal  = parseFloat((gross - discount).toFixed(2));
                checkoutItems.push({
                    description:    p.name,
                    quantity:       qty,
                    unitPrice:      isYearly ? unitPrice * 12 : unitPrice,
                    discountAmount: discount,
                    lineTotal,
                    itemType:       "plan",
                    serviceType:    p.serviceType,
                    id:             p.planId,
                    billingCycle,
                    subscribers:    p.subscribers?.map(s => s.fullName) || [],
                });
            });

            addOns.forEach(a => {
                const unitPrice  = a.monthlyPrice || a.price || 0;
                const gross      = unitPrice * (isYearly ? 12 : 1);
                const discount   = isYearly ? parseFloat((gross * 0.10).toFixed(2)) : 0;
                const lineTotal  = parseFloat((gross - discount).toFixed(2));
                checkoutItems.push({
                    description:    a.addOnName,
                    quantity:       1,
                    unitPrice:      isYearly ? unitPrice * 12 : unitPrice,
                    discountAmount: discount,
                    lineTotal,
                    itemType:       "addon",
                    serviceType:    a.serviceType,
                    id:             a.addOnId,
                    billingCycle,
                });
            });

            devices.forEach(d => {
                const unitPrice = d.totalPrice || 0;
                checkoutItems.push({
                    description:    `${d.brand} ${d.model} (${d.storage}, ${d.color})`,
                    quantity:       1,
                    unitPrice,
                    discountAmount: 0,
                    lineTotal:      unitPrice,
                    itemType:       "device",
                    phoneId:        d.phoneId || d.id,
                    pricingType:    d.pricingType,
                    billingCycle,
                    subscribers:    [d.assignedSubscriberName],
                });
            });

            const invoiceRes = await apiFetch("/api/checkout/v1", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paymentAccountId: paymentMethod.accountId || null,
                    subtotal:         pricing.subtotal ?? 0,
                    tax:              pricing.tax ?? 0,
                    total:            pricing.finalTotal ?? 0,
                    billingCycle:     pricing.hasRecurringItems ? billingCycle : "one-time",
                    paymentIntentId:  result.paymentIntent.id,
                    quoteId:          quoteId || null,
                    items:            checkoutItems,
                    ...billingAddress,
                }),
            });

            const invoice = await invoiceRes.json();
            if (!invoiceRes.ok) return alert(invoice.error || "Checkout failed");

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
            <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f3ff, #fce7f3, #dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", boxShadow: "0 8px 32px rgba(79,70,229,0.35)" }}>
                        <span style={{ fontSize: "2rem", lineHeight: 1 }}>✓</span>
                    </div>
                    <h2 className="fw-bold mb-2" style={{ fontSize: "1.75rem" }}>Payment Successful!</h2>
                    <p className="tc-muted-light mb-1" style={{ fontSize: "1rem" }}>Your order has been confirmed.</p>
                    <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "2rem" }}>
                        Order Number:&nbsp;
                        <strong style={{ color: "#4f46e5", fontFamily: "monospace" }}>{orderNumber}</strong>
                    </p>
                    <Button
                        className="rounded-pill px-5 py-2 fw-bold"
                        style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", border: "none", boxShadow: "0 4px 20px rgba(79,70,229,0.35)", fontSize: "0.95rem" }}
                        onClick={() => navigate(`/customer/invoice/${orderNumber}`)}
                    >
                        View Invoice
                    </Button>
                </div>
            </div>
        );
    }

    /* =========================
       SECTION HEADER HELPER
    ========================= */
    const SectionLabel = ({ icon, children }) => (
        <div className="d-flex align-items-center gap-2 mb-3">
            <div style={{ width: 32, height: 32, borderRadius: "8px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0 }}>
                {icon}
            </div>
            <h5 className="fw-bold mb-0" style={{ fontSize: "1rem" }}>{children}</h5>
        </div>
    );

    /* =========================
       MAIN UI
    ========================= */
    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f3ff 0%, #fce7f3 50%, #dbeafe 100%)", padding: "3rem 0 5rem" }}>
            <Container style={{ maxWidth: 680 }}>

                <div className="mb-4">
                    <div className="tc-section-chip tc-section-chip-light mb-2">Secure Checkout</div>
                    <h2 className="fw-bold mb-0" style={{ fontSize: "clamp(1.6rem, 3vw, 2rem)" }}>
                        Complete Your Order
                    </h2>
                </div>

                {loadingInvoice && (
                    <div className="text-center mb-4">
                        <Spinner animation="border" variant="primary" />
                        <div className="tc-muted-light mt-2 small">Loading invoice…</div>
                    </div>
                )}

                {/* ── Billing Cycle ── */}
                {pricing.hasRecurringItems && (
                    <Card className="mb-3 border-0 shadow-sm" style={{ borderRadius: "1rem", overflow: "hidden" }}>
                        <Card.Body className="p-4">
                            <SectionLabel icon="🔁">Billing Cycle</SectionLabel>
                            <div className="d-flex gap-3 flex-wrap">
                                <label
                                    className="d-flex align-items-start gap-3 flex-fill p-3"
                                    style={{ cursor: "pointer", border: `2px solid ${billingCycle === "monthly" ? "#4f46e5" : "#e5e7eb"}`, borderRadius: "0.75rem", background: billingCycle === "monthly" ? "rgba(79,70,229,0.05)" : "#fff", transition: "all 0.2s ease" }}
                                >
                                    <Form.Check type="radio" checked={billingCycle === "monthly"} onChange={() => setBillingCycle("monthly")} style={{ marginTop: 2 }} />
                                    <div>
                                        <div className="fw-semibold" style={{ fontSize: "0.95rem" }}>Monthly</div>
                                        <div className="tc-muted-light" style={{ fontSize: "0.8rem" }}>Pay month to month</div>
                                    </div>
                                </label>
                                <label
                                    className="d-flex align-items-start gap-3 flex-fill p-3"
                                    style={{ cursor: "pointer", border: `2px solid ${billingCycle === "yearly" ? "#4f46e5" : "#e5e7eb"}`, borderRadius: "0.75rem", background: billingCycle === "yearly" ? "rgba(79,70,229,0.05)" : "#fff", transition: "all 0.2s ease" }}
                                >
                                    <Form.Check type="radio" checked={billingCycle === "yearly"} onChange={() => setBillingCycle("yearly")} style={{ marginTop: 2 }} />
                                    <div>
                                        <div className="fw-semibold d-flex align-items-center gap-2" style={{ fontSize: "0.95rem" }}>
                                            Yearly
                                            <span className="tc-badge-hot px-2 py-0" style={{ fontSize: "0.65rem", borderRadius: "999px", fontWeight: 700, letterSpacing: "0.5px" }}>10% OFF</span>
                                        </div>
                                        <div className="tc-muted-light" style={{ fontSize: "0.8rem" }}>Save with annual billing</div>
                                    </div>
                                </label>
                            </div>
                        </Card.Body>
                    </Card>
                )}

                {/* ── Billing Address ── */}
                <Card className="mb-3 border-0 shadow-sm" style={{ borderRadius: "1rem" }}>
                    <Card.Body className="p-4">
                        <SectionLabel icon="🏠">Billing Address</SectionLabel>

                        {addressLoaded ? (
                            <div
                                className="mb-3 px-3 py-2 d-flex align-items-center gap-2"
                                style={{ background: "rgba(79,70,229,0.06)", border: "1px solid rgba(79,70,229,0.18)", borderRadius: "0.6rem", fontSize: "0.85rem", color: "#4f46e5" }}
                            >
                                <span>📌</span>
                                <span>
                                    {billingAddress.street1}, {billingAddress.city},{" "}
                                    {billingAddress.province}, {billingAddress.postalCode}
                                </span>
                            </div>
                        ) : (
                            <Alert variant="warning" className="py-2 mb-3" style={{ fontSize: "0.82rem", borderRadius: "0.6rem" }}>
                                No billing address found. Please enter it below.
                            </Alert>
                        )}

                        <Row className="g-2">
                            <Col md={12}>
                                <Form.Control
                                    size="sm"
                                    placeholder="Street Address"
                                    value={billingAddress.street1}
                                    onChange={(e) => setBillingAddress({ ...billingAddress, street1: e.target.value })}
                                    style={{ borderRadius: "0.6rem", border: "1.5px solid #e5e7eb" }}
                                />
                            </Col>
                            <Col md={4}>
                                <Form.Control
                                    size="sm"
                                    placeholder="City"
                                    value={billingAddress.city}
                                    onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                                    style={{ borderRadius: "0.6rem", border: "1.5px solid #e5e7eb" }}
                                />
                            </Col>
                            {/* Province 输入框（文字，不是下拉），同步到税率 */}
                            <Col md={4}>
                                <Form.Select
                                    size="sm"
                                    value={billingAddress.province}
                                    onChange={(e) =>
                                        setBillingAddress({ ...billingAddress, province: e.target.value })
                                    }
                                    style={{ borderRadius: "0.6rem", border: "1.5px solid #e5e7eb" }}
                                >
                                    {Object.entries(PROVINCE_LABELS).map(([code, label]) => (
                                        <option key={code} value={code}>{label}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col md={4}>
                                <Form.Control
                                    size="sm"
                                    placeholder="Postal Code (A1A 1A1)"
                                    value={billingAddress.postalCode}
                                    onChange={handlePostalCodeChange}
                                    onBlur={handlePostalCodeBlur}
                                    maxLength={7}
                                    isInvalid={!!postalCodeError}
                                    isValid={postalCodeTouched && !postalCodeError && POSTAL_REGEX.test(billingAddress.postalCode)}
                                    style={{
                                        borderRadius: "0.6rem",
                                        border: `1.5px solid ${postalCodeError ? "#ef4444" : postalCodeTouched && !postalCodeError && POSTAL_REGEX.test(billingAddress.postalCode) ? "#22c55e" : "#e5e7eb"}`,
                                        fontFamily: "monospace",
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                    }}
                                />
                                {postalCodeError && (
                                    <div style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <span>⚠</span> {postalCodeError}
                                    </div>
                                )}
                                {postalCodeTouched && !postalCodeError && POSTAL_REGEX.test(billingAddress.postalCode) && (
                                    <div style={{ fontSize: "0.75rem", color: "#16a34a", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <span>✓</span> Valid Canadian postal code
                                    </div>
                                )}
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* ── Payment Card ── */}
                <Card className="mb-3 border-0 shadow-sm" style={{ borderRadius: "1rem", overflow: "hidden" }}>
                    <Card.Body className="p-4">
                        <SectionLabel icon="💳">Payment Method</SectionLabel>
                        <PaymentCardUI onCardSelect={setPaymentMethod} />
                    </Card.Body>
                </Card>

                {/* ── Order Summary ── */}
                <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: "1rem", overflow: "hidden" }}>
                    <Card.Body className="p-4">
                        <SectionLabel icon="🧾">Order Summary</SectionLabel>

                        {billingCycle === "yearly" && pricing.hasRecurringItems && (
                            <>
                                <div className="d-flex justify-content-between mb-2" style={{ fontSize: "0.9rem" }}>
                                    <span className="tc-muted-light">12-Month Recurring Total</span>
                                    <span className="fw-semibold">${pricing.yearlyBase.toFixed(2)}</span>
                                </div>
                                <div
                                    className="d-flex justify-content-between mb-2 px-3 py-2"
                                    style={{ fontSize: "0.88rem", background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: "0.5rem", color: "#15803d" }}
                                >
                                    <span>🎉 Yearly Discount (10%)</span>
                                    <span className="fw-semibold">-${pricing.yearlyDiscount.toFixed(2)}</span>
                                </div>
                                <hr style={{ borderColor: "#f3f4f6", margin: "0.75rem 0" }} />
                            </>
                        )}

                        <div className="d-flex justify-content-between mb-2" style={{ fontSize: "0.9rem" }}>
                            <span className="tc-muted-light">Subtotal</span>
                            <span className="fw-semibold">${pricing.subtotal.toFixed(2)}</span>
                        </div>

                        {/* 税率行：显示省份名称 + 税率，自动计算 */}
                        <div className="d-flex justify-content-between mb-2" style={{ fontSize: "0.9rem" }}>
                            <span className="tc-muted-light">
                                Tax — {PROVINCE_LABELS[province] || province} ({(taxRate * 100).toFixed(2)}%)
                            </span>
                            <span className="fw-semibold">${pricing.tax.toFixed(2)}</span>
                        </div>

                        <hr style={{ borderColor: "#f3f4f6", margin: "0.75rem 0" }} />
                        <div
                            className="d-flex justify-content-between align-items-center px-3 py-3"
                            style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.07), rgba(124,58,237,0.07))", borderRadius: "0.75rem", border: "1px solid rgba(79,70,229,0.12)" }}
                        >
                            <span className="fw-bold" style={{ fontSize: "1rem" }}>Total Due Today</span>
                            <span
                                className="fw-bold"
                                style={{ fontSize: "1.4rem", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                            >
                                ${pricing.finalTotal.toFixed(2)}
                            </span>
                        </div>
                    </Card.Body>
                </Card>

                {/* ── Pay Button ── */}
                <Button
                    className="w-100 fw-bold rounded-pill"
                    size="lg"
                    style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", border: "none", boxShadow: "0 6px 28px rgba(79,70,229,0.4)", fontSize: "1.05rem", padding: "0.85rem", letterSpacing: "0.3px", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 36px rgba(79,70,229,0.5)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "0 6px 28px rgba(79,70,229,0.4)"; }}
                    onClick={handleCheckout}
                >
                    🔒 Pay ${(pricing.finalTotal ?? 0).toFixed(2)}
                </Button>

                <div className="d-flex justify-content-center gap-4 mt-3" style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
                    <span>🔐 SSL Encrypted</span>
                    <span>🛡️ Secure Payment</span>
                    <span>↩️ Cancel Anytime</span>
                </div>

            </Container>
        </div>
    );
}