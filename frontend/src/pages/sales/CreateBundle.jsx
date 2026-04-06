import React, { useEffect, useState } from "react";
import { Container, Card, Form, Button, Row, Col, Alert } from "react-bootstrap";
import { apiFetch } from "../../services/api";

export default function CreateBundle() {

    // =========================
    // STATE
    // =========================
    const [customers, setCustomers] = useState([]);

    const [plans, setPlans] = useState([]);
    const [addons, setAddons] = useState([]);

    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);

    const [total, setTotal] = useState(0);

    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    // =========================
    // LOAD DATA ON MOUNT
    // =========================
    useEffect(() => {
        load();
    }, []);

    async function load() {
        try {
            setError("");

            const [cRes, planRes, addonRes] = await Promise.all([
                apiFetch("/api/customers/all"),
                apiFetch("/api/plans"),
                apiFetch("/api/manager/addons")
            ]);

            const customersData = cRes.ok ? await cRes.json() : [];
            const plansData = planRes.ok ? await planRes.json() : [];
            const addonsData = addonRes.ok ? await addonRes.json() : [];

            // Ensure arrays (defensive coding)
            setCustomers(Array.isArray(customersData) ? customersData : []);

            // =========================
            // MAP PLANS
            // Add unique "key" field to avoid React key conflicts
            // =========================
            const mappedPlans = (Array.isArray(plansData) ? plansData : []).map(p => ({
                key: `plan-${p.planId}`,
                id: p.planId,
                name: p.planName,
                price: Number(p.monthlyPrice || 0),
                type: "plan"
            }));

            // =========================
            // MAP ADDONS
            // =========================
            const mappedAddons = (Array.isArray(addonsData) ? addonsData : []).map(a => ({
                key: `addon-${a.addOnId}`,
                id: a.addOnId,
                name: a.addOnName,
                price: Number(a.monthlyPrice || 0),
                type: "addon"
            }));

            setPlans(mappedPlans);
            setAddons(mappedAddons);

        } catch (err) {
            console.error("Load bundle failed:", err);
            setError("Failed to load data");
        }
    }

    // =========================
    // TOGGLE ITEM SELECTION
    // Use unique key instead of id
    // =========================
    function toggleItem(item) {

        let updated;

        if (selectedItems.find(x => x.key === item.key)) {
            updated = selectedItems.filter(x => x.key !== item.key);
        } else {
            updated = [...selectedItems, item];
        }

        setSelectedItems(updated);

        // Recalculate total
        const newTotal = updated.reduce(
            (sum, x) => sum + Number(x.price || 0),
            0
        );

        setTotal(newTotal);
    }

    // =========================
    // CREATE BUNDLE → CREATE INVOICE
    // =========================
    async function createBundle() {

        try {
            setError("");
            setSuccess("");

            const payload = {
                customerId: Number(selectedCustomer),
                items: selectedItems.map(x => ({
                    id: x.id,
                    type: x.type,
                    name: x.name,
                    price: x.price,
                    quantity: 1
                })),
                total,
                status: "PENDING"
            };

            const res = await apiFetch("/api/invoices/admin", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                throw new Error("Create invoice failed");
            }

            setSuccess("Bundle created （ sent to customer）");
            setSelectedItems([]);
            setTotal(0);

        } catch (err) {
            console.error(err);
            setError("Failed to create bundle");
        }
    }

    // =========================
    // HELPER: CHECK IF SELECTED
    // =========================
    function isSelected(item) {
        return selectedItems.some(x => x.key === item.key);
    }

    // =========================
    // RENDER
    // =========================
    return (
        <Container className="py-4">

            <h3 className="mb-3">Create Custom Bundle</h3>

            {success && <Alert variant="success">{success}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            {/* =========================
                CUSTOMER SELECT
            ========================= */}
            <Card className="p-3 mb-3">
                <Form.Select
                    value={selectedCustomer}
                    onChange={e => setSelectedCustomer(e.target.value)}
                >
                    <option value="">Select Customer</option>

                    {customers.map(c => (
                        <option key={c.customerId} value={c.customerId}>
                            {c.firstName} {c.lastName} ({c.email})
                        </option>
                    ))}
                </Form.Select>
            </Card>

            {/* =========================
                PLANS SECTION
            ========================= */}
            <Card className="p-3 mb-3">
                <h5>Plans</h5>

                <Row>
                    {plans.map(p => (
                        <Col md={4} key={p.key} className="mb-2">
                            <Form.Check
                                type="checkbox"
                                label={`${p.name} - $${p.price}`}
                                checked={isSelected(p)}
                                onChange={() => toggleItem(p)}
                            />
                        </Col>
                    ))}
                </Row>
            </Card>

            {/* =========================
                ADD-ONS SECTION
            ========================= */}
            <Card className="p-3 mb-3">
                <h5>Add-ons</h5>

                <Row>
                    {addons.map(a => (
                        <Col md={4} key={a.key} className="mb-2">
                            <Form.Check
                                type="checkbox"
                                label={`${a.name} - $${a.price}`}
                                checked={isSelected(a)}
                                onChange={() => toggleItem(a)}
                            />
                        </Col>
                    ))}
                </Row>
            </Card>

            {/* =========================
                SUMMARY
            ========================= */}
            <Card className="p-3 mb-3">
                <h5>Bundle Summary</h5>

                {selectedItems.length === 0 && (
                    <div className="text-muted">No items selected</div>
                )}

                {selectedItems.map(i => (
                    <div key={i.key}>
                        {i.name} - ${i.price}
                    </div>
                ))}

                <hr />
                <h5>Total: ${total}</h5>
            </Card>

            {/* =========================
                SUBMIT BUTTON
            ========================= */}
            <Button
                disabled={!selectedCustomer || selectedItems.length === 0}
                onClick={createBundle}
            >
                Send to Customer (Create Invoice)
            </Button>

        </Container>
    );
}