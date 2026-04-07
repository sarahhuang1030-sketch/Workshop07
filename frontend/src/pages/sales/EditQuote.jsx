import { useEffect, useState } from "react";
import { Container, Form, Button } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";

/**
 * EditQuote Page (PREMIUM UI VERSION)
 *
 * UI UPGRADES:
 * - Stripe-like pricing cards
 * - Smooth hover animation
 * - Better visual hierarchy
 * - Strong selected state
 * - Cleaner layout
 */
export default function EditQuote() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [plans, setPlans] = useState([]);
    const [addons, setAddons] = useState([]);

    const [quote, setQuote] = useState({
        customerId: "",
        planId: "",
        addons: [],
        amount: 0
    });

    useEffect(() => {
        loadPlans();
        loadAddons();
        loadQuote();
    }, []);

    useEffect(() => {
        calculateAmount();
    }, [quote.planId, quote.addons, plans, addons]);

    async function loadPlans() {
        const res = await apiFetch("/api/plans");
        setPlans(await res.json());
    }

    async function loadAddons() {
        const res = await apiFetch("/api/addons");
        setAddons(await res.json());
    }

    async function loadQuote() {
        const res = await apiFetch(`/api/quotes/${id}`);
        const data = await res.json();

        setQuote({
            customerId: data.customerId || "",
            planId: data.planId || "",
            addons: data.addonIds || [],
            amount: data.amount || 0
        });
    }

    async function save() {
        await apiFetch(`/api/quotes/${id}`, {
            method: "PUT",
            body: JSON.stringify({
                customerId: Number(quote.customerId),
                planId: Number(quote.planId),
                addonIds: quote.addons
            }),
        });

        alert("Saved!");
        navigate("/sales/quotes");
    }

    function toggleAddon(id) {
        let updated = [...quote.addons];

        if (updated.includes(id)) {
            updated = updated.filter(a => a !== id);
        } else {
            updated.push(id);
        }

        setQuote({ ...quote, addons: updated });
    }

    function calculateAmount() {
        let total = 0;

        const plan = plans.find(p => p.planId === Number(quote.planId));
        if (plan) total += Number(plan.monthlyPrice);

        quote.addons.forEach(id => {
            const addon = addons.find(a => a.addOnId === id);
            if (addon) total += Number(addon.monthlyPrice);
        });

        setQuote(prev => ({ ...prev, amount: total }));
    }

    // 🎨 Card base style (reusable)
    const cardBase = {
        borderRadius: "16px",
        padding: "18px",
        width: "280px",
        cursor: "pointer",
        transition: "all 0.25s ease",
        border: "1px solid #e5e7eb",
        background: "#fff",
        boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
    };

    const cardHover = {
        transform: "translateY(-4px)",
        boxShadow: "0 10px 25px rgba(0,0,0,0.08)"
    };

    const selectedBorder = {
        border: "2px solid #4f46e5",
        background: "linear-gradient(180deg, #f5f7ff, #ffffff)"
    };

    return (
        <Container className="py-4">
            <h2 style={{ fontWeight: 700, marginBottom: 20 }}>
                Edit Quote #{id}
            </h2>

            {/* ================= CUSTOMER ================= */}
            <Form.Group className="mb-4">
                <Form.Label style={{ fontWeight: 600 }}>
                    Customer ID
                </Form.Label>
                <Form.Control value={quote.customerId || ""} readOnly />
            </Form.Group>

            {/* ================= PLAN ================= */}
            <div style={{ marginBottom: 30 }}>
                <h5 style={{ fontWeight: 700, marginBottom: 12 }}>
                    Choose Your Plan
                </h5>

                <div className="d-flex flex-wrap gap-3">
                    {plans.map(plan => {
                        const selected = quote.planId === plan.planId;

                        return (
                            <div
                                key={plan.planId}
                                onClick={() =>
                                    setQuote({ ...quote, planId: plan.planId })
                                }
                                style={{
                                    ...cardBase,
                                    ...(selected ? selectedBorder : {})
                                }}
                                onMouseOver={e =>
                                    Object.assign(e.currentTarget.style, cardHover)
                                }
                                onMouseOut={e =>
                                    Object.assign(e.currentTarget.style, {
                                        transform: "none",
                                        boxShadow:
                                            "0 2px 10px rgba(0,0,0,0.04)"
                                    })
                                }
                            >
                                <div style={{ fontSize: 18, fontWeight: 700 }}>
                                    {plan.planName}
                                </div>

                                <div
                                    style={{
                                        fontSize: 26,
                                        fontWeight: 800,
                                        color: "#4f46e5",
                                        margin: "10px 0"
                                    }}
                                >
                                    ${plan.monthlyPrice}
                                    <span
                                        style={{
                                            fontSize: 12,
                                            color: "#666"
                                        }}
                                    >
                                        /mo
                                    </span>
                                </div>

                                <div style={{ fontSize: 13, color: "#666" }}>
                                    {plan.description}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ================= ADDONS ================= */}
            <div style={{ marginBottom: 30 }}>
                <h5 style={{ fontWeight: 700, marginBottom: 12 }}>
                    Optional Add-ons
                </h5>

                <div className="d-flex flex-wrap gap-3">
                    {addons.map(addon => {
                        const selected = quote.addons.includes(
                            addon.addOnId
                        );

                        return (
                            <div
                                key={addon.addOnId}
                                onClick={() =>
                                    toggleAddon(addon.addOnId)
                                }
                                style={{
                                    ...cardBase,
                                    ...(selected
                                        ? {
                                            border: "2px solid #16a34a",
                                            background:
                                                "linear-gradient(180deg,#ecfdf5,#fff)"
                                        }
                                        : {})
                                }}
                                onMouseOver={e =>
                                    Object.assign(e.currentTarget.style, cardHover)
                                }
                                onMouseOut={e =>
                                    Object.assign(e.currentTarget.style, {
                                        transform: "none",
                                        boxShadow:
                                            "0 2px 10px rgba(0,0,0,0.04)"
                                    })
                                }
                            >
                                <div style={{ fontWeight: 700 }}>
                                    {addon.addOnName}
                                </div>

                                <div
                                    style={{
                                        fontSize: 20,
                                        fontWeight: 800,
                                        color: "#16a34a",
                                        margin: "8px 0"
                                    }}
                                >
                                    ${addon.monthlyPrice}
                                    <span
                                        style={{
                                            fontSize: 12,
                                            color: "#666"
                                        }}
                                    >
                                        /mo
                                    </span>
                                </div>

                                <div style={{ fontSize: 13, color: "#666" }}>
                                    {addon.description}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ================= TOTAL ================= */}
            <div
                style={{
                    padding: 16,
                    borderRadius: 12,
                    background: "#111827",
                    color: "#fff",
                    marginBottom: 20
                }}
            >
                <h5>Total Monthly Cost</h5>
                <h2 style={{ margin: 0 }}>${quote.amount}</h2>
            </div>

            <Button size="lg" onClick={save}>
                Save Quote
            </Button>
        </Container>
    );
}