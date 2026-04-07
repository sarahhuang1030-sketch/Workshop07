import React, { useState } from "react";
import { Container, Row, Col, Card, Button, Badge, Form } from "react-bootstrap";
import {
    Smartphone,
    Tablet,
    Watch,
    Calculator,
} from "lucide-react";
import { useCart } from "../context/CartContext"; // ✅ ADD
import { useNavigate } from "react-router-dom";   // ✅ ADD

/**
 * Device Financing Page
 * Now connected to Shopping Cart
 */

const devices = [
    {
        id: 1,
        name: "iPhone 15 Pro",
        type: "Mobile",
        price: 1499,
        image: "/phone15.png",
        icon: <Smartphone size={18} />,
    },
    {
        id: 2,
        name: "Samsung Galaxy S24",
        type: "Mobile",
        price: 1299,
        image: "/Samsung.png",
        icon: <Smartphone size={18} />,
    },
    {
        id: 3,
        name: "iPad Air",
        type: "Tablet",
        price: 899,
        image: "/ipad.png",
        icon: <Tablet size={18} />,
    },
    {
        id: 4,
        name: "Apple Watch Series 9",
        type: "Wearable",
        price: 599,
        image: "/watch.png",
        icon: <Watch size={18} />,
    },
];

export default function DeviceFinancing() {
    const [months, setMonths] = useState(24);

    const { addPlan } = useCart();
    const navigate = useNavigate();

    /**
     * Monthly calculation
     */
    const calcMonthly = (price) => {
        return (price / months).toFixed(2);
    };

    /**
     * When user clicks "Select Plan"
     * → Add to cart
     * → Go to cart page
     */
    const handleSelect = (device) => {
        const planPayload = {
            name: device.name,
            serviceType: "Device",
            monthlyPrice: calcMonthly(device.price),
            totalPrice: calcMonthly(device.price),
            devicePrice: device.price,
            months,
        };

        addPlan(planPayload);

        // go to cart
        navigate("/cart");
    };

    return (
        <div>

            {/* HERO */}
            <div
                className="text-white py-5 mb-4"
                style={{
                    background: "linear-gradient(135deg, #0d6efd, #6610f2)",
                }}
            >
                <Container>
                    <Row className="align-items-center">
                        <Col md={6}>
                            <h1 className="fw-bold">Device Financing Made Simple</h1>
                            <p className="text-light">
                                0 down payment • Flexible monthly plans • Latest devices
                            </p>
                        </Col>

                        <Col md={6} className="text-center">
                            <img
                                src="/banner-phone.png"
                                alt="banner"
                                style={{ maxWidth: "80%" }}
                            />
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* CALCULATOR */}
            <Container className="mb-4">
                <Card className="shadow-sm p-3">
                    <Row className="align-items-center">
                        <Col md={6}>
                            <h5>
                                <Calculator className="me-2" />
                                Monthly Calculator
                            </h5>
                        </Col>

                        <Col md={6}>
                            <Form.Select
                                value={months}
                                onChange={(e) => setMonths(Number(e.target.value))}
                            >
                                <option value={12}>12 Months</option>
                                <option value={24}>24 Months</option>
                                <option value={36}>36 Months</option>
                            </Form.Select>
                        </Col>
                    </Row>
                </Card>
            </Container>

            {/* PRODUCT GRID */}
            <Container>
                <Row className="g-4">
                    {devices.map((device) => (
                        <Col md={3} key={device.id}>
                            <Card className="h-100 shadow-sm border-0">

                                {/* IMAGE */}
                                <div
                                    style={{
                                        height: "200px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: "#f8f9fa",
                                    }}
                                >
                                    <img
                                        src={device.image}
                                        alt={device.name}
                                        style={{
                                            maxHeight: "100%",
                                            maxWidth: "100%",
                                            objectFit: "contain",
                                        }}
                                    />
                                </div>

                                <Card.Body>
                                    <Badge bg="primary" className="mb-2">
                                        {device.icon} {device.type}
                                    </Badge>

                                    <h5>{device.name}</h5>

                                    <p>
                                        <strong>${device.price}</strong>
                                    </p>

                                    <p className="text-muted small">
                                        ${calcMonthly(device.price)}/month
                                    </p>

                                    {/* CONNECTED BUTTON */}
                                    <Button
                                        variant="primary"
                                        className="w-100"
                                        onClick={() => handleSelect(device)}
                                    >
                                        Select Plan
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Container>
        </div>
    );
}