import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Card, Button, Badge, Form, Alert, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { Smartphone, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { apiFetch } from "../services/api";

export default function PhoneDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { darkMode } = useTheme();
    const { mobilePlan, addDevice, devices } = useCart();

    const mutedClass = darkMode ? "tc-muted-dark" : "tc-muted-light";

    // NEW: backend state
    const [phone, setPhone] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");

    // pricing + UI state (UNCHANGED)
    const [pricingType, setPricingType] = useState("monthly");
    const [assignedLine, setAssignedLine] = useState(1);

    // FETCH PHONE FROM BACKEND
    useEffect(() => {
        let cancelled = false;

        async function fetchPhone() {
            try {
                setLoading(true);
                const res = await apiFetch(`/api/phones/${id}`);

                if (!res.ok) {
                    throw new Error("Phone not found");
                }

                const data = await res.json();

                if (!cancelled) {
                    setPhone(data);
                }
            } catch (err) {
                console.error(err);
                if (!cancelled) {
                    setPageError("Failed to load phone.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchPhone();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const requiresPlan = pricingType === "monthly";
    const mobileLineCount = Math.max(1, Number(mobilePlan?.lines ?? 1));

    const lineOptions = useMemo(() => {
        return Array.from({ length: mobileLineCount }, (_, index) => index + 1);
    }, [mobileLineCount]);

    const assignedSubscriberName =
        mobilePlan?.subscribers?.[assignedLine - 1]?.fullName || `Line ${assignedLine}`;

    const lineAlreadyHasDevice = useMemo(() => {
        if (!requiresPlan) return false;

        return devices.some(
            (device) =>
                Number(device.assignedLine) === Number(assignedLine) &&
                device.pricingType === "monthly"
        );
    }, [devices, assignedLine, requiresPlan]);

    // LOADING STATE
    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" />
                <div className={`mt-2 ${mutedClass}`}>Loading phone...</div>
            </Container>
        );
    }

    // NOT FOUND / ERROR
    if (!phone) {
        return (
            <Container className="py-5">
                <Alert variant="warning">Phone not found.</Alert>
                <Button onClick={() => navigate("/phones")}>Back to Phones</Button>
            </Container>
        );
    }

    const handleAddPhoneToCart = () => {
        setPageError("");

        if (!phone.inStock) {
            setPageError("This phone is currently out of stock.");
            return;
        }

        if (requiresPlan && !mobilePlan) {
            setPageError("Monthly financing requires a mobile plan.");
            return;
        }

        if (requiresPlan && lineAlreadyHasDevice) {
            setPageError(`Line ${assignedLine} already has a financed phone in the cart.`);
            return;
        }

        const totalPrice =
            pricingType === "monthly"
                ? Number(phone.monthlyPrice ?? 0)
                : Number(phone.fullPrice ?? 0);

        const deviceToAdd = {
            cartDeviceId: requiresPlan
                ? `phone-${phone.phoneId}-${assignedLine}-${Date.now()}`
                : `phone-${phone.phoneId}-full-${Date.now()}`,
            phoneId: phone.phoneId,
            brand: phone.brand,
            model: phone.model,
            storage: phone.storage,
            color: phone.color,
            imageUrl: phone.imageUrl,
            pricingType,
            monthlyPrice: Number(phone.monthlyPrice ?? 0),
            fullPrice: Number(phone.fullPrice ?? 0),
            totalPrice,
            assignedLine: requiresPlan ? assignedLine : null,
            assignedSubscriberName: requiresPlan ? assignedSubscriberName : "Device only purchase",
        };

        addDevice(deviceToAdd);
        navigate("/cart");
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: darkMode
                    ? "linear-gradient(135deg, #15151b, #1f1f2b)"
                    : "linear-gradient(135deg, #fdf2f8, #eef2ff)",
                padding: "2rem 0 4rem",
            }}
        >
            <Container>
                <div className="mx-auto" style={{ maxWidth: "1150px" }}>
                    <Button
                        variant="outline-secondary"
                        className="mb-4 d-inline-flex align-items-center gap-2"
                        onClick={() => navigate("/phones")}
                        style={{ borderRadius: "999px" }}
                    >
                        <ArrowLeft size={16} />
                        Back to Phones
                    </Button>

                    <Card
                        className="border-0 shadow-sm overflow-hidden"
                        style={{
                            borderRadius: "26px",
                            background: darkMode ? "#1f1f24" : "#ffffff",
                            color: darkMode ? "#f5f5f5" : "#1f2430",
                        }}
                    >
                        <Card.Body className="p-4 p-lg-5">
                            <Row className="g-5 align-items-center">
                                <Col lg={6}>
                                    <div
                                        style={{
                                            background: darkMode ? "#18181b" : "#f8f4ff",
                                            borderRadius: "24px",
                                            minHeight: "460px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            padding: "2rem",
                                        }}
                                    >
                                        <img
                                            src={phone.imageUrl}
                                            alt={`${phone.brand} ${phone.model}`}
                                            style={{
                                                maxWidth: "100%",
                                                maxHeight: "380px",
                                                objectFit: "contain",
                                            }}
                                        />
                                    </div>
                                </Col>

                                <Col lg={6}>
                                    <Badge bg="primary" pill className="mb-2">
                                        {phone.brand}
                                    </Badge>

                                    <h1 className="fw-black mb-2">{phone.model}</h1>

                                    <div className={mutedClass}>
                                        {phone.storage} • {phone.color}
                                    </div>

                                    <p className="mt-3">{phone.description}</p>

                                    {/* Pricing */}
                                    <Form.Check
                                        type="radio"
                                        label={`$${Number(phone.monthlyPrice).toFixed(2)}/mo`}
                                        checked={pricingType === "monthly"}
                                        onChange={() => setPricingType("monthly")}
                                    />
                                    <Form.Check
                                        type="radio"
                                        label={`$${Number(phone.fullPrice).toFixed(2)}`}
                                        checked={pricingType === "full"}
                                        onChange={() => setPricingType("full")}
                                    />

                                    {pageError && <Alert variant="danger" className="mt-3">{pageError}</Alert>}

                                    <Button className="mt-4" onClick={handleAddPhoneToCart}>
                                        Add to Cart
                                    </Button>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </div>
            </Container>
        </div>
    );
}