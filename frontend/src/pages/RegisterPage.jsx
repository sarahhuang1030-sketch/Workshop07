import { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup } from "react-bootstrap";
import { useTheme } from "../context/ThemeContext";
import { Signal, Eye, EyeOff } from "lucide-react";


export default function RegisterPage() {
    const { darkMode } = useTheme();
    const [showPw, setShowPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const mutedClass = darkMode ? "tc-muted-dark" : "tc-muted-light";

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!form.firstName || !form.lastName || !form.email || !form.password) {
            setError("All fields are required.");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        // TODO: later connect to backend
        // POST /api/auth/register

        setSuccess("Account created successfully (backend hookup later).");
        setForm({
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            confirmPassword: "",
        });
    };

    return (
        <div
            className="d-flex align-items-center"
            style={{
                minHeight: "calc(100vh - 140px)",
                padding: "2rem 0"
            }}
        >
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

                            <h1
                                className={`fw-black mb-1 ${darkMode ? "text-light" : "text-dark"}`}
                                style={{ fontWeight: 900 }}
                            >
                                Create your account
                            </h1>
                            <div className={mutedClass}>
                                Join TeleConnect and manage your plans with ease
                            </div>
                        </div>

                        <Card
                            className={`shadow-lg border ${darkMode ? "tc-card-dark" : "bg-white"}`}
                            style={{
                                borderRadius: 22,
                                borderColor: darkMode
                                    ? "rgba(255,255,255,0.12)"
                                    : "rgba(0,0,0,0.08)",
                            }}
                        >
                            <Card.Body className="p-4 p-md-4">
                                {error && <Alert variant="danger">{error}</Alert>}
                                {success && <Alert variant="success">{success}</Alert>}

                                <Form onSubmit={handleSubmit}>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>
                                                    First Name
                                                </Form.Label>
                                                <Form.Control
                                                    name="firstName"
                                                    value={form.firstName}
                                                    onChange={handleChange}
                                                />
                                            </Form.Group>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>
                                                    Last Name
                                                </Form.Label>
                                                <Form.Control
                                                    name="lastName"
                                                    value={form.lastName}
                                                    onChange={handleChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group className="mb-3">
                                        <Form.Label className={darkMode ? "text-light" : "text-dark"}>
                                            Email
                                        </Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            placeholder="you@example.com"
                                            value={form.email}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label className={darkMode ? "text-light" : "text-dark"}>
                                            Password
                                        </Form.Label>

                                        <InputGroup>
                                            <Form.Control
                                                type={showPw ? "text" : "password"}
                                                name="password"
                                                placeholder="••••••••"
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

                                    <Form.Group className="mb-4">
                                        <Form.Label className={darkMode ? "text-light" : "text-dark"}>
                                            Confirm Password
                                        </Form.Label>

                                        <InputGroup>
                                            <Form.Control
                                                type={showConfirmPw ? "text" : "password"}
                                                name="confirmPassword"
                                                placeholder="••••••••"
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
                                    <span className="fw-bold" style={{ color: "#7c3aed" }}>
                    Sign in
                  </span>
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
