import { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup } from "react-bootstrap";
import { useTheme } from "../context/ThemeContext";
import { Signal, Eye, EyeOff } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

export default function RegisterPage() {
    const { darkMode } = useTheme();
    const navigate = useNavigate();
    const [showPw, setShowPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    const [form, setForm] = useState({
        customerType: "individual",
        firstName: "",
        lastName: "",
        homephone: "",
        businessName: "",

        email: "",

        // Billing address
        billingStreet1: "",
        billingStreet2: "",
        billingCity: "",
        billingProvince: "",
        billingPostalCode: "",
        billingCountry: "Canada",

        // Service address
        sameAsBilling: true,
        serviceStreet1: "",
        serviceStreet2: "",
        serviceCity: "",
        serviceProvince: "",
        servicePostalCode: "",
        serviceCountry: "Canada",

        //accountinfo
        username: "",
        password: "",
        confirmPassword: "",
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const mutedClass = darkMode ? "tc-muted-dark" : "tc-muted-light";
    const isBusiness = form.customerType === "business";

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm((prev) => {
            // checkbox support
            const newValue = type === "checkbox" ? checked : value;

            // if switching away from business clear businessName
            if (name === "customerType" && value !== "business") {
                return { ...prev, customerType: value, businessName: "" };
            }

            // if turning "sameAsBilling" ON, clear service fields
            if (name === "sameAsBilling" && checked === true) {
                return {
                    ...prev,
                    sameAsBilling: true,
                    serviceStreet1: "",
                    serviceStreet2: "",
                    serviceCity: "",
                    serviceProvince: "",
                    servicePostalCode: "",
                    serviceCountry: "Canada",
                };
            }

            return { ...prev, [name]: newValue };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("SUBMIT CLICKED", form);
        setError("");
        setSuccess("");

        // Basic validation (match backend DTO requirements)
        if (
            !form.firstName ||
            !form.lastName ||
            !form.email ||
            !form.homephone ||
            !form.billingStreet1 ||
            !form.billingCity ||
            !form.billingProvince ||
            !form.billingPostalCode ||
            !form.billingCountry
        ) {
            setError("Please fill in all required fields.");
            return;
        }

        if (isBusiness && !form.businessName) {
            setError("Business name is required for business accounts.");
            return;
        }

        if (!form.sameAsBilling) {
            if (
                !form.serviceStreet1 ||
                !form.serviceCity ||
                !form.serviceProvince ||
                !form.servicePostalCode ||
                !form.serviceCountry
            ) {
                setError("Please complete the service address or select 'Same as billing'.");
                return;
            }
        }

        if (!form.username || !form.password) { setError("Username and password required"); return; }
        if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }


        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerType: form.customerType,
                    firstName: form.firstName,
                    lastName: form.lastName,
                    businessName: form.businessName,
                    email: form.email,
                    homephone: form.homephone,

                    billingStreet1: form.billingStreet1,
                    billingStreet2: form.billingStreet2,
                    billingCity: form.billingCity,
                    billingProvince: form.billingProvince,
                    billingPostalCode: form.billingPostalCode,
                    billingCountry: form.billingCountry,

                    sameAsBilling: form.sameAsBilling,

                    serviceStreet1: form.serviceStreet1,
                    serviceStreet2: form.serviceStreet2,
                    serviceCity: form.serviceCity,
                    serviceProvince: form.serviceProvince,
                    servicePostalCode: form.servicePostalCode,
                    serviceCountry: form.serviceCountry,

                    username: form.username,
                    password: form.password,

                }),
            });

            const text = await res.text();

            if (!res.ok) {
                setError(text || "Registration failed.");
                return;
            }

            setSuccess(text || "Registered successfully!");

            // Optional redirect after a moment
            //setTimeout(() => navigate("/login"), 800);
            if (!res.ok) { setError(await res.text()); return; }

            const user = await res.json();
            localStorage.setItem("tc_user", JSON.stringify(user));
            setUser(user);
            navigate("/");
        } catch (err) {
            setError("Cannot reach backend. Make sure Spring Boot is running.");
        }
    };

    return (
        <div className="d-flex align-items-center" style={{ minHeight: "calc(100vh - 140px)", padding: "2rem 0" }}>
            <Container>
                <Row className="justify-content-center">
                    <Col md={7} lg={6}>
                        <div className="text-center mb-4">
                            <div
                                className="mx-auto mb-3 d-flex align-items-center justify-content-center shadow"
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 18,
                                    background: "linear-gradient(135deg, #7c3aed, #ec4899, #f97316)",
                                }}
                            >
                                <Signal color="white" size={26} />
                            </div>

                            <h1 className={`fw-black mb-1 ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900 }}>
                                Create your account
                            </h1>
                            <div className={mutedClass}>Join TeleConnect and manage your plans with ease</div>
                        </div>

                        <Card
                            className={`shadow-lg border ${darkMode ? "tc-card-dark" : "bg-white"}`}
                            style={{
                                borderRadius: 22,
                                borderColor: darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
                            }}
                        >
                            <Card.Body className="p-4 p-md-4">
                                {error && <Alert variant="danger">{error}</Alert>}
                                {success && <Alert variant="success">{success}</Alert>}

                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className={darkMode ? "text-light" : "text-dark"}>Account Type</Form.Label>
                                        <Form.Select name="customerType" value={form.customerType} onChange={handleChange}>
                                            <option value="individual">Individual</option>
                                            <option value="business">Business</option>
                                        </Form.Select>
                                    </Form.Group>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>First Name</Form.Label>
                                                <Form.Control name="firstName" value={form.firstName} onChange={handleChange} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>Last Name</Form.Label>
                                                <Form.Control name="lastName" value={form.lastName} onChange={handleChange} />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group className="mb-3">
                                        <Form.Label className={darkMode ? "text-light" : "text-dark"}>Phone</Form.Label>
                                        <Form.Control
                                            type="tel"
                                            name="homephone"
                                            placeholder="403-999-8888"
                                            value={form.homephone}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>

                                    {isBusiness && (
                                        <Form.Group className="mb-3">
                                            <Form.Label className={darkMode ? "text-light" : "text-dark"}>Business Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="businessName"
                                                placeholder="Your company name"
                                                value={form.businessName}
                                                onChange={handleChange}
                                            />
                                        </Form.Group>
                                    )}

                                    <Form.Group className="mb-3">
                                        <Form.Label className={darkMode ? "text-light" : "text-dark"}>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            placeholder="you@example.com"
                                            value={form.email}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label className={darkMode ? "text-light" : "text-dark"}>Username</Form.Label>
                                        <Form.Control
                                            name="username"
                                            placeholder="Choose a username"
                                            value={form.username}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label className={darkMode ? "text-light" : "text-dark"}>Password</Form.Label>

                                        <InputGroup>
                                            <Form.Control
                                                type={showPw ? "text" : "password"}
                                                name="password"
                                                value={form.password}
                                                onChange={handleChange}
                                            />
                                            <Button
                                                type="button"
                                                variant={darkMode ? "outline-light" : "outline-secondary"}
                                                onClick={() => setShowPw((v) => !v)}
                                                title={showPw ? "Hide password" : "Show password"}
                                            >
                                                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </Button>
                                        </InputGroup>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label className={darkMode ? "text-light" : "text-dark"}>Confirm Password</Form.Label>

                                        <InputGroup>
                                            <Form.Control
                                                type={showConfirmPw ? "text" : "password"}
                                                name="confirmPassword"
                                                value={form.confirmPassword}
                                                onChange={handleChange}
                                            />
                                            <Button
                                                type="button"
                                                variant={darkMode ? "outline-light" : "outline-secondary"}
                                                onClick={() => setShowConfirmPw((v) => !v)}
                                                title={showConfirmPw ? "Hide password" : "Show password"}
                                            >
                                                {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </Button>
                                        </InputGroup>
                                    </Form.Group>


                                    {/*<hr className={darkMode ? "border-light" : "border-secondary"} />*/}

                                    {/*<h5 className={darkMode ? "text-light" : "text-dark"}>Billing Address</h5>*/}

                                    <Form.Group className="mb-3">
                                        <Form.Label className={darkMode ? "text-light" : "text-dark"}>Street 1</Form.Label>
                                        <Form.Control name="billingStreet1" value={form.billingStreet1} onChange={handleChange} />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label className={darkMode ? "text-light" : "text-dark"}>Street 2 (optional)</Form.Label>
                                        <Form.Control name="billingStreet2" value={form.billingStreet2} onChange={handleChange} />
                                    </Form.Group>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>City</Form.Label>
                                                <Form.Control name="billingCity" value={form.billingCity} onChange={handleChange} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>Province</Form.Label>
                                                <Form.Control name="billingProvince" value={form.billingProvince} onChange={handleChange} />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>Postal Code</Form.Label>
                                                <Form.Control name="billingPostalCode" value={form.billingPostalCode} onChange={handleChange} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>Country</Form.Label>
                                                <Form.Control name="billingCountry" value={form.billingCountry} onChange={handleChange} />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group className="mb-3">
                                        <Form.Check
                                            type="checkbox"
                                            name="sameAsBilling"
                                            checked={form.sameAsBilling}
                                            onChange={handleChange}
                                            label="Service address is the same as billing"
                                            className={darkMode ? "text-light" : "text-dark"}
                                        />
                                    </Form.Group>

                                    {!form.sameAsBilling && (
                                        <>
                                            <h5 className={darkMode ? "text-light" : "text-dark"}>Service Address</h5>

                                            <Form.Group className="mb-3">
                                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>Street 1</Form.Label>
                                                <Form.Control name="serviceStreet1" value={form.serviceStreet1} onChange={handleChange} />
                                            </Form.Group>

                                            <Form.Group className="mb-3">
                                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>Street 2 (optional)</Form.Label>
                                                <Form.Control name="serviceStreet2" value={form.serviceStreet2} onChange={handleChange} />
                                            </Form.Group>

                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label className={darkMode ? "text-light" : "text-dark"}>City</Form.Label>
                                                        <Form.Control name="serviceCity" value={form.serviceCity} onChange={handleChange} />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label className={darkMode ? "text-light" : "text-dark"}>Province</Form.Label>
                                                        <Form.Control name="serviceProvince" value={form.serviceProvince} onChange={handleChange} />
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label className={darkMode ? "text-light" : "text-dark"}>Postal Code</Form.Label>
                                                        <Form.Control name="servicePostalCode" value={form.servicePostalCode} onChange={handleChange} />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label className={darkMode ? "text-light" : "text-dark"}>Country</Form.Label>
                                                        <Form.Control name="serviceCountry" value={form.serviceCountry} onChange={handleChange} />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        </>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-100 fw-bold border-0"
                                        style={{
                                            background: "linear-gradient(90deg, #7c3aed, #ec4899)",
                                            borderRadius: 999,
                                            padding: "0.85rem 1rem",
                                        }}
                                    >
                                        Create Account
                                    </Button>
                                </Form>

                                <div className={`text-center mt-3 ${mutedClass}`}>
                                    Already have an account?{" "}
                                    <NavLink to="/login" style={{ color: "#7c3aed", fontWeight: 700, textDecoration: "none" }}>
                                        Sign in
                                    </NavLink>
                                </div>
                            </Card.Body>
                        </Card>

                        <div className={`text-center mt-3 small ${mutedClass}`}>
                            By signing up, you agree to TeleConnect Terms & Privacy.
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
