// import React, { useState, useEffect } from "react";
// import { Container, Row, Col, Card, Badge, Spinner, Alert, Button, Table } from "react-bootstrap";
// import { Package, FileText } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { apiFetch } from "../services/api";
// import InvoicePage from "./InvoicePage";
//
// // Utility function: format number as CAD currency
// const formatMoney = (n) =>
//     n == null || Number.isNaN(Number(n))
//         ? "—"
//         : Number(n).toLocaleString(undefined, { style: "currency", currency: "CAD" });
//
// // Default plan structure to avoid crashes if user plan is missing
// const defaultPlan = {
//     status: "Inactive",
//     name: "—",
//     monthlyPrice: null,
//     startedAt: null,
//     features: [],
//     addOns: [],
// };
//
// // SubscriptionPage component
// export default function SubscriptionPage({ user: userProp, darkMode = false }) {
//     const [loading, setLoading] = useState(!userProp); // Loading state for subscription
//     const [error, setError] = useState("");
//     const [profile, setProfile] = useState({ plan: defaultPlan });
//     const [latestInvoice, setLatestInvoice] = useState(null);
//     const [invoiceLoading, setInvoiceLoading] = useState(true);
//     const navigate = useNavigate();
//
//     const cardBase = darkMode ? "bg-dark border-secondary" : "bg-white";
//     const mutedClass = darkMode ? "text-light-50 text-secondary" : "text-muted";
//
//     // Fetch subscription info and latest invoice
//     useEffect(() => {
//         let isMounted = true;
//
//         // Load subscription profile
//         async function loadProfile() {
//             try {
//                 const res = await apiFetch("/api/me/subscription");
//
//                 if (res.status === 401) {
//                     if (isMounted) {
//                         setError("Unauthorized");
//                         setLoading(false);
//                     }
//                     return;
//                 }
//
//                 if (res.status === 204 || res.status === 404) {
//                     if (isMounted) {
//                         setProfile(prev => ({ ...prev, plan: defaultPlan }));
//                         setError("");
//                         setLoading(false);
//                     }
//                     return;
//                 }
//
//                 const data = await res.json();
//                 if (isMounted) {
//                     setProfile(prev => ({
//                         ...prev,
//                         plan: data.plan ?? prev.plan,
//                     }));
//                     setLoading(false);
//                 }
//             } catch (err) {
//                 if (isMounted) {
//                     setError(err.message || "Failed to load subscription data.");
//                     setLoading(false);
//                 }
//             }
//         }
//
//         // Load latest invoice
//         async function loadLatestInvoice() {
//             try {
//                 const res = await apiFetch("/api/invoices/latest");
//                 if (res.ok) {
//                     const data = await res.json();
//                     if (isMounted) setLatestInvoice(data);
//                 }
//             } catch {
//                 // Ignore errors silently for invoices
//             } finally {
//                 if (isMounted) setInvoiceLoading(false);
//             }
//         }
//
//         if (userProp?.plan) setProfile(prev => ({ ...prev, plan: userProp.plan }));
//
//         loadProfile();
//         loadLatestInvoice();
//
//         return () => { isMounted = false; };
//     }, [userProp]);
//
//     // Loading state UI
//     if (loading) {
//         return (
//             <Container className="py-5 text-center">
//                 <Spinner animation="border" />
//                 <div className={`mt-2 ${mutedClass}`}>Loading subscription data…</div>
//             </Container>
//         );
//     }
//
//     // Error state UI
//     if (error) {
//         return (
//             <Container className="py-5">
//                 <Alert variant="danger">{error}</Alert>
//             </Container>
//         );
//     }
//
//     const hasPlan = profile?.plan?.status === "Active" && profile.plan.name !== "—";
//
//     return (
//         <Container className="py-4 py-md-5 px-4">
//             {/* Subscription Card */}
//             <Card className={cardBase} style={{ borderRadius: 22 }}>
//                 <Card.Body className="p-4">
//                     {/* Header */}
//                     <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
//                         <div>
//                             <div className={`${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900, fontSize: "1.25rem" }}>
//                                 Your current plan
//                             </div>
//                             <div className={mutedClass}>Plan and subscription details.</div>
//                         </div>
//
//                         <Badge
//                             bg={profile.plan.status === "Active" ? "success" : "secondary"}
//                             style={{ borderRadius: 999, padding: "0.45rem 0.75rem", width: "fit-content" }}
//                         >
//                             {profile.plan.status || "Inactive"}
//                         </Badge>
//                     </div>
//
//                     {/* Plan Info */}
//                     <Row className="g-3 mt-3">
//                         <Col>
//                             <div className={`p-3 ${darkMode ? "tc-card-dark" : "bg-light"}`} style={{ borderRadius: 18 }}>
//                                 <div className="d-flex align-items-center gap-2">
//                                     <Package size={18} />
//                                     <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>Plan</div>
//                                 </div>
//
//                                 {/* Main plan and price */}
//                                 <div className={`mt-2 ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900, fontSize: "1.4rem" }}>
//                                     {latestInvoice?.items?.[0]?.description || profile.plan.name || "—"}
//                                 </div>
//
//                                 <div className={mutedClass}>
//                                     {latestInvoice?.items?.[0]?.lineTotal != null
//                                         ? `${formatMoney(latestInvoice.items[0].lineTotal)}/month`
//                                         : profile.plan.monthlyPrice != null
//                                             ? `${formatMoney(profile.plan.monthlyPrice)}/month`
//                                             : "—"}
//                                 </div>
//
//                                 {/* Add-ons */}
//                                 {latestInvoice?.items?.length > 1 && (
//                                     <div className="mt-3">
//                                         {latestInvoice.items.slice(1).map((item, idx) => (
//                                             <div
//                                                 key={idx}
//                                                 className={`${darkMode ? "text-light" : "text-dark"}`}
//                                                 style={{ fontSize: "0.95rem", marginBottom: 2 }}
//                                             >
//                                                 • {item.description} ({formatMoney(item.lineTotal)})
//                                             </div>
//                                         ))}
//                                     </div>
//                                 )}
//
//                                 {/* Conditional Buttons */}
//                                 <div className="mt-3 d-flex gap-2 flex-wrap">
//                                     {!latestInvoice ? (
//                                         <Button
//                                             variant="primary"
//                                             className="fw-bold"
//                                             style={{ borderRadius: 14 }}
//                                             onClick={() => window.location.href = "http://localhost:5173/plans"}
//                                         >
//                                             Subscribe Now
//                                         </Button>
//                                     ) : (
//                                         <Button
//                                             variant="outline-primary"
//                                             className="fw-bold"
//                                             style={{ borderRadius: 14 }}
//                                             onClick={() => navigate("./pages/customer/CustomerBilling")}
//                                         >
//                                             Check Invoice
//                                         </Button>
//                                     )}
//                                 </div>
//                             </div>
//                         </Col>
//                     </Row>
//
//                     {/* Alert if no active plan */}
//                     {profile.plan.status !== "Active" && (
//                         <Alert
//                             variant={darkMode ? "secondary" : "info"}
//                             className="mt-3 mb-0"
//                             style={{ borderRadius: 14 }}
//                         >
//                             You don’t have an active plan yet. Choose a plan to get started.
//                         </Alert>
//                     )}
//
//                     {/* Latest Invoice Card: full invoice displayed inline */}
//                     {!invoiceLoading && latestInvoice && (
//                         <Card className={`${darkMode ? "bg-dark text-light mt-4" : "bg-white mt-4"}`} style={{ borderRadius: 18 }}>
//                             <Card.Body>
//                                 <div className="d-flex align-items-center gap-2 mb-2">
//                                     <FileText size={18} />
//                                     <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>Latest Invoice</div>
//                                 </div>
//
//                                 {/* Invoice Header Info */}
//                                 <div>Status: {latestInvoice.status}</div>
//                                 <div>Invoice #: {latestInvoice.invoiceNumber}</div>
//                                 <div>Issue Date: {latestInvoice.issueDate}</div>
//                                 <div>Due Date: {latestInvoice.dueDate}</div>
//
//                                 {/* Invoice Items Table */}
//                                 <Table striped bordered hover responsive className={darkMode ? "table-dark mt-2" : "mt-2"}>
//                                     <thead>
//                                     <tr>
//                                         <th>Description</th>
//                                         <th>Qty</th>
//                                         <th>Unit Price</th>
//                                         <th>Discount</th>
//                                         <th>Line Total</th>
//                                     </tr>
//                                     </thead>
//                                     <tbody>
//                                     {latestInvoice.items?.map((item, idx) => (
//                                         <tr key={idx}>
//                                             <td>{item.description}</td>
//                                             <td>{item.quantity}</td>
//                                             <td>{formatMoney(item.unitPrice)}</td>
//                                             <td>{formatMoney(item.discountAmount)}</td>
//                                             <td>{formatMoney(item.lineTotal)}</td>
//                                         </tr>
//                                     ))}
//                                     </tbody>
//                                 </Table>
//
//                                 {/* Totals and Payment Info */}
//                                 <div className="mt-2"><strong>Subtotal:</strong> {formatMoney(latestInvoice.subtotal)}</div>
//                                 <div><strong>Tax:</strong> {formatMoney(latestInvoice.taxTotal)}</div>
//                                 <div><strong>Total:</strong> {formatMoney(latestInvoice.total)}</div>
//                                 <div className="mt-2">
//                                     <strong>Paid With:</strong>{" "}
//                                     {latestInvoice.paidByAccount
//                                         ? `${latestInvoice.paidByAccount.method} ••••${latestInvoice.paidByAccount.last4}`
//                                         : "Temporary Card"}
//                                 </div>
//                             </Card.Body>
//                         </Card>
//                     )}
//                 </Card.Body>
//             </Card>
//         </Container>
//     );
// }

import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button } from "react-bootstrap";
import { Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";

// Utility function: format a number as CAD currency
const formatMoney = (n) =>
    n == null || Number.isNaN(Number(n))
        ? "—"
        : Number(n).toLocaleString(undefined, { style: "currency", currency: "CAD" });

export default function SubscriptionPage({ darkMode = false }) {
    const [loading, setLoading] = useState(true); // Loading state for subscription data
    const [latestInvoice, setLatestInvoice] = useState(null); // Latest invoice data
    const navigate = useNavigate();

    // CSS classes for dark/light modes
    const cardBase = darkMode ? "bg-dark border-secondary" : "bg-white";
    const mutedClass = darkMode ? "text-light-50 text-secondary" : "text-muted";

    // Fetch latest invoice on mount
    useEffect(() => {
        let isMounted = true;

        async function loadLatestInvoice() {
            try {
                const res = await apiFetch("/api/invoices/latest");
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) setLatestInvoice(data);
                }
            } catch {
                // silently ignore errors
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadLatestInvoice();
        return () => { isMounted = false; };
    }, []);

    // Loading UI
    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" />
                <div className={`mt-2 ${mutedClass}`}>Loading subscription data…</div>
            </Container>
        );
    }

    const hasInvoice = latestInvoice?.items?.length > 0;

    return (
        <Container className="py-4 py-md-5 px-4">
            <Card className={cardBase} style={{ borderRadius: 22 }}>
                <Card.Body className="p-4">
                    {/* Header: Plan overview */}
                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
                        <div>
                            <div
                                className={`${darkMode ? "text-light" : "text-dark"}`}
                                style={{ fontWeight: 900, fontSize: "1.25rem" }}
                            >
                                Your current plan
                            </div>
                            <div className={mutedClass}>Plan and add-ons overview.</div>
                        </div>

                        <Badge
                            bg={hasInvoice ? "success" : "secondary"}
                            style={{ borderRadius: 999, padding: "0.45rem 0.75rem", width: "fit-content" }}
                        >
                            {hasInvoice ? "Active" : "No Plan"}
                        </Badge>
                    </div>

                    {/* Plan + Add-ons */}
                    <Row className="g-3 mt-3">
                        <Col>
                            <div
                                className={`p-3 ${darkMode ? "tc-card-dark" : "bg-light"}`}
                                style={{ borderRadius: 18 }}
                            >
                                <div className="d-flex align-items-center gap-2">
                                    <Package size={18} />
                                    <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>
                                        Plan & Add-ons
                                    </div>
                                </div>

                                {hasInvoice ? (
                                    <div className="mt-2">
                                        {/* Display main plan */}
                                        <div
                                            className={`${darkMode ? "text-light" : "text-dark"}`}
                                            style={{ fontWeight: 900, fontSize: "1.2rem", marginBottom: 4 }}
                                        >
                                            {latestInvoice.items[0].description} (
                                            {formatMoney(latestInvoice.items[0].lineTotal)})
                                        </div>

                                        {/* Display add-ons */}
                                        {latestInvoice.items.length > 1 &&
                                            latestInvoice.items.slice(1).map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`${darkMode ? "text-light" : "text-dark"}`}
                                                    style={{ fontSize: "0.95rem", marginBottom: 2 }}
                                                >
                                                    • {item.description} ({formatMoney(item.lineTotal)})
                                                </div>
                                            ))}

                                        {/* Button: Navigate to full invoice page */}
                                        <Button
                                            variant={darkMode ? "outline-light" : "outline-secondary"}
                                            className="mt-3 fw-bold"
                                            style={{ borderRadius: 14 }}
                                            onClick={() => navigate("/customer/billing")}
                                        >
                                            Check Invoice
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="mt-3">
                                        <Alert variant={darkMode ? "secondary" : "info"}>
                                            You have no invoice yet. Subscribe to a plan to get started.
                                        </Alert>
                                        <Button
                                            variant="primary"
                                            onClick={() => navigate("/plans")}
                                        >
                                            Subscribe Now
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Container>
    );
}